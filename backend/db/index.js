const { connectDB, Call, Transcript, Setting, Profile } = require('./mongodb');

/**
 * Initialize database connection
 */
async function initDb() {
  try {
    await connectDB();
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Create a new call record
 */
async function createCall(callData) {
  const { callSid, fromNumber, toNumber, startTime, status } = callData;

  try {
    const call = await Call.create({
      callSid,
      fromNumber,
      toNumber,
      startTime,
      status
    });

    return call.toObject();
  } catch (error) {
    console.error('Error creating call:', error);
    throw error;
  }
}

/**
 * Update call record
 */
async function updateCall(callSid, updates) {
  const { endTime, duration, status, messageCount } = updates;

  try {
    const updateData = {};
    if (endTime !== undefined) updateData.endTime = endTime;
    if (duration !== undefined) updateData.duration = duration;
    if (status !== undefined) updateData.status = status;
    if (messageCount !== undefined) updateData.messageCount = messageCount;

    const call = await Call.findOneAndUpdate(
      { callSid },
      updateData,
      { new: true }
    );

    return call ? call.toObject() : null;
  } catch (error) {
    console.error('Error updating call:', error);
    throw error;
  }
}

/**
 * Get call by SID
 */
async function getCallBySid(callSid) {
  try {
    const call = await Call.findOne({ callSid });
    return call ? call.toObject() : null;
  } catch (error) {
    console.error('Error fetching call:', error);
    throw error;
  }
}

/**
 * Get all calls (most recent first)
 */
async function getAllCalls(limit = 100) {
  try {
    const calls = await Call.find()
      .sort({ startTime: -1 })
      .limit(limit);

    return calls.map(call => call.toObject());
  } catch (error) {
    console.error('Error fetching calls:', error);
    throw error;
  }
}

/**
 * Update transcript for a call
 */
async function updateTranscript(callSid, messages) {
  try {
    const transcript = await Transcript.findOneAndUpdate(
      { callSid },
      {
        messages,
        updatedAt: new Date()
      },
      {
        upsert: true,
        new: true
      }
    );

    return transcript ? transcript.toObject() : null;
  } catch (error) {
    console.error('Error updating transcript:', error);
    throw error;
  }
}

/**
 * Get transcript for a call
 */
async function getTranscript(callSid) {
  try {
    const transcript = await Transcript.findOne({ callSid });
    return transcript ? transcript.toObject() : null;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}

/**
 * Delete call and transcript
 */
async function deleteCall(callSid) {
  try {
    await Call.deleteOne({ callSid });
    await Transcript.deleteOne({ callSid });
  } catch (error) {
    console.error('Error deleting call:', error);
    throw error;
  }
}

/**
 * Get a setting value
 */
async function getSetting(key, defaultValue = null) {
  try {
    const setting = await Setting.findOne({ key });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Set a setting value
 */
async function setSetting(key, value) {
  try {
    await Setting.findOneAndUpdate(
      { key },
      {
        value,
        updatedAt: new Date()
      },
      {
        upsert: true
      }
    );
    return true;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    return false;
  }
}

/**
 * PROFILE FUNCTIONS (NEW)
 */

/**
 * Create a new profile
 */
async function createProfile(profileData) {
  const { phoneNumber, profileContent, sourceType, sourceData, metadata } = profileData;

  try {
    const profile = await Profile.create({
      phoneNumber,
      profileContent,
      sourceType,
      sourceData,
      metadata: metadata || {}
    });

    return profile.toObject();
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

/**
 * Get profile by phone number
 */
async function getProfileByPhone(phoneNumber) {
  try {
    const profile = await Profile.findOne({ phoneNumber });
    return profile ? profile.toObject() : null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

/**
 * Get all profiles
 */
async function getAllProfiles() {
  try {
    const profiles = await Profile.find()
      .sort({ createdAt: -1 });

    return profiles.map(profile => profile.toObject());
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }
}

/**
 * Update profile
 */
async function updateProfile(phoneNumber, updates) {
  try {
    const profile = await Profile.findOneAndUpdate(
      { phoneNumber },
      {
        ...updates,
        updatedAt: new Date()
      },
      { new: true }
    );

    return profile ? profile.toObject() : null;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Delete profile
 */
async function deleteProfile(phoneNumber) {
  try {
    await Profile.deleteOne({ phoneNumber });
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
}

// For backward compatibility with direct pool access (used in voice.js)
const pool = {
  query: async (sql, params) => {
    // This is a compatibility shim for the one place that uses pool.query directly
    // In voice.js line 97-100, it updates the voice model
    if (sql.includes('UPDATE calls SET current_voice_model')) {
      const [voiceModel, callSid] = params;
      await Call.findOneAndUpdate(
        { callSid },
        { currentVoiceModel: voiceModel }
      );
      return { rows: [] };
    }
    throw new Error('Direct pool.query not supported with MongoDB. Please use db functions.');
  }
};

module.exports = {
  initDb,
  createCall,
  updateCall,
  getCallBySid,
  getAllCalls,
  updateTranscript,
  getTranscript,
  deleteCall,
  getSetting,
  setSetting,
  createProfile,
  getProfileByPhone,
  getAllProfiles,
  updateProfile,
  deleteProfile,
  pool
};
