import React, { useEffect, useRef, useState } from 'react';
import './LiveCall.css';
import VoiceSelector from './VoiceSelector';

function LiveCall({ call, transcript }) {
  const [currentVoice, setCurrentVoice] = useState(null);
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when transcript updates
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getDuration = () => {
    const start = new Date(call.startTime);
    const now = new Date();
    const seconds = Math.floor((now - start) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="live-call">
      <div className="call-header">
        <div className="call-info">
          <span className="status-indicator live"></span>
          <div>
            <h2>Live Call</h2>
            <p className="caller-number">{call.from}</p>
          </div>
        </div>
        <div className="call-stats">
          <span className="duration">{getDuration()}</span>
          <span className="message-count">{transcript.length} messages</span>
        </div>
      </div>

      <div className="transcript-container">
        <h3>Live Transcript</h3>
        <div className="transcript">
          {transcript.length === 0 ? (
            <p className="empty">Waiting for conversation to start...</p>
          ) : (
            transcript.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === 'assistant' ? 'ai' : 'user'}`}
              >
                <div className="message-header">
                  <span className="role">
                    {message.role === 'assistant' ? '🤖 Randy' : '📞 Caller'}
                  </span>
                  <span className="time">{formatTime(message.timestamp)}</span>
                </div>
                <div className="message-content">{message.content}</div>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>

      <VoiceSelector
        callSid={call.callSid}
        onVoiceChange={(voiceData) => {
          console.log('Voice changed:', voiceData);
          setCurrentVoice(voiceData.description);
        }}
      />
    </div>
  );
}

export default LiveCall;
