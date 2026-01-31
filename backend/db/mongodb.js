const mongoose = require('mongoose');

// MongoDB connection
let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log('✅ Already connected to MongoDB');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Call Schema
const callSchema = new mongoose.Schema({
  callSid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fromNumber: {
    type: String,
    required: true
  },
  toNumber: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: Date,
  duration: Number,
  status: {
    type: String,
    required: true
  },
  messageCount: {
    type: Number,
    default: 0
  },
  recordingUrl: String,
  recordingSid: String,
  recordingDuration: Number,
  currentVoiceModel: {
    type: String,
    default: 'aura-2-thalia-en'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Transcript Schema
const transcriptSchema = new mongoose.Schema({
  callSid: {
    type: String,
    required: true,
    unique: true,
    index: true,
    ref: 'Call'
  },
  messages: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Setting Schema
const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  value: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Profile Schema (NEW)
const profileSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  profileContent: {
    type: String,
    required: true
  },
  sourceType: {
    type: String,
    enum: ['url', 'text', 'manual'],
    required: true
  },
  sourceData: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
profileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create models
const Call = mongoose.model('Call', callSchema);
const Transcript = mongoose.model('Transcript', transcriptSchema);
const Setting = mongoose.model('Setting', settingSchema);
const Profile = mongoose.model('Profile', profileSchema);

module.exports = {
  connectDB,
  Call,
  Transcript,
  Setting,
  Profile,
  mongoose
};
