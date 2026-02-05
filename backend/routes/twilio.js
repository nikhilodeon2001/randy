const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const VoiceResponse = twilio.twiml.VoiceResponse;
const CallHandler = require('../services/callHandler');

// Store active call handlers
const activeCallHandlers = new Map();

/**
 * Incoming call webhook - Twilio calls this when someone calls your number
 */
router.post('/voice', async (req, res) => {
  const { CallSid, From, To } = req.body;

  console.log(`📞 Incoming call from ${From} to ${To}, CallSid: ${CallSid}`);

  const twiml = new VoiceResponse();

  try {
    // Create a new call handler for this call
    const callHandler = new CallHandler(CallSid, From, To, req.app.get('io'));
    activeCallHandlers.set(CallSid, callHandler);

    // Start the AI conversation
    await callHandler.start();

    // Initial greeting - the AI will speak first
    const greeting = await callHandler.getGreeting();

    // Generate Deepgram audio for greeting
    const audioResult = await callHandler.generateAudio(greeting);
    const audioUrl = `${req.protocol}://${req.get('host')}/audio/${audioResult.filename}`;

    // Use <Gather> to collect caller's speech
    // Play audio INSIDE gather so Twilio listens during and after the greeting
    const gather = twiml.gather({
      input: 'speech',
      action: '/twilio/gather',
      method: 'POST',
      speechTimeout: '1',  // 1 second silence after greeting
      speechModel: 'phone_call',
      enhanced: true
    });

    // Play Deepgram-generated audio inside the gather
    gather.play(audioUrl);

    // Redirect back to gather more input
    twiml.redirect('/twilio/gather');

  } catch (error) {
    console.error('Error handling incoming call:', error);
    twiml.say('Sorry, there was an error. Please try again later.');
    twiml.hangup();
  }

  res.type('text/xml');
  res.send(twiml.toString());

  // Start recording after a brief delay to ensure call is answered
  // Don't await - let it happen async
  setTimeout(async () => {
    const callHandler = activeCallHandlers.get(CallSid);
    if (callHandler) {
      await callHandler.startRecording();
    }
  }, 500); // 500ms delay to ensure call leg is established
});

/**
 * Gather webhook - Called when Twilio detects speech
 */
router.post('/gather', async (req, res) => {
  const { CallSid, SpeechResult } = req.body;

  console.log(`🎤 Speech detected from ${CallSid}: "${SpeechResult}"`);

  const twiml = new VoiceResponse();

  try {
    const callHandler = activeCallHandlers.get(CallSid);

    if (!callHandler) {
      throw new Error('No call handler found for this call');
    }

    // Check if we actually got speech
    if (!SpeechResult || SpeechResult === 'undefined' || SpeechResult.trim() === '') {
      console.log('No speech detected, prompting again');
      const noSpeechResult = await callHandler.generateAudio('Hello? I didn\'t hear you. Are you there?');
      const noSpeechUrl = `${req.protocol}://${req.get('host')}/audio/${noSpeechResult.filename}`;

      const gather = twiml.gather({
        input: 'speech',
        action: '/twilio/gather',
        method: 'POST',
        speechTimeout: '1',
        speechModel: 'phone_call',
        enhanced: true
      });
      gather.play(noSpeechUrl);

      twiml.redirect('/twilio/gather');
      res.type('text/xml');
      res.send(twiml.toString());
      return;
    }

    const overallStart = Date.now();

    // Process the caller's speech and get AI response
    const aiResponse = await callHandler.processUserSpeech(SpeechResult);

    // Generate Deepgram audio for AI response
    const responseResult = await callHandler.generateAudio(aiResponse);
    const responseUrl = `${req.protocol}://${req.get('host')}/audio/${responseResult.filename}`;

    const totalDuration = Date.now() - overallStart;
    console.log(`🎯 TOTAL response time: ${totalDuration}ms (speech → audio ready)`);

    // Continue gathering input
    const gather = twiml.gather({
      input: 'speech',
      action: '/twilio/gather',
      method: 'POST',
      speechTimeout: '1',
      speechModel: 'phone_call',
      enhanced: true
    });

    // Play the AI's response inside gather
    gather.play(responseUrl);

    // Just redirect back - no need to generate "still there" audio every time
    twiml.redirect('/twilio/gather');

  } catch (error) {
    console.error('Error processing speech:', error);
    twiml.say('Sorry, I didn\'t catch that. Could you repeat?');
    twiml.redirect('/twilio/gather');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

/**
 * Call status callback - Twilio calls this on call status changes
 */
router.post('/status', async (req, res) => {
  const { CallSid, CallStatus } = req.body;

  console.log(`📊 Call ${CallSid} status: ${CallStatus}`);

  if (CallStatus === 'completed' || CallStatus === 'failed' || CallStatus === 'no-answer') {
    // Clean up call handler
    const callHandler = activeCallHandlers.get(CallSid);
    if (callHandler) {
      await callHandler.end();
      activeCallHandlers.delete(CallSid);
    }
  }

  res.sendStatus(200);
});

/**
 * Fallback webhook - Called if there's an error
 */
router.post('/fallback', (req, res) => {
  console.error('Fallback webhook called:', req.body);

  const twiml = new VoiceResponse();
  twiml.say('Sorry, something went wrong. Goodbye.');
  twiml.hangup();

  res.type('text/xml');
  res.send(twiml.toString());
});

/**
 * Recording callback - Called when recording is available
 */
router.post('/recording', async (req, res) => {
  const { CallSid, RecordingUrl, RecordingSid, RecordingDuration } = req.body;

  console.log(`🎙️ Recording available for ${CallSid}: ${RecordingUrl}`);

  try {
    const { Call } = require('../db/mongodb');

    // Append .mp3 to recording URL for proper playback
    const recordingUrlWithExtension = `${RecordingUrl}.mp3`;

    // Update call with recording information using MongoDB
    await Call.findOneAndUpdate(
      { callSid: CallSid },
      {
        recordingUrl: recordingUrlWithExtension,
        recordingSid: RecordingSid,
        recordingDuration: RecordingDuration
      }
    );

    console.log(`✅ Recording saved for call ${CallSid}: ${recordingUrlWithExtension}`);
  } catch (error) {
    console.error('Error saving recording:', error);
  }

  res.sendStatus(200);
});

module.exports = router;
