require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const { connectDB, Call, Transcript, Setting, Profile } = require('../db/mongodb');

// PostgreSQL connection
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL_POSTGRES || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateCalls() {
  console.log('\n📞 Migrating calls...');
  try {
    const result = await pgPool.query('SELECT * FROM calls ORDER BY start_time DESC');
    const calls = result.rows;

    if (calls.length === 0) {
      console.log('  No calls to migrate');
      return 0;
    }

    let migrated = 0;
    for (const call of calls) {
      try {
        await Call.create({
          callSid: call.call_sid,
          fromNumber: call.from_number,
          toNumber: call.to_number,
          startTime: call.start_time,
          endTime: call.end_time,
          duration: call.duration,
          status: call.status,
          messageCount: call.message_count,
          recordingUrl: call.recording_url,
          recordingSid: call.recording_sid,
          recordingDuration: call.recording_duration,
          currentVoiceModel: call.current_voice_model,
          createdAt: call.created_at
        });
        migrated++;
      } catch (error) {
        if (error.code === 11000) {
          console.log(`  ⏭️  Skipping duplicate call: ${call.call_sid}`);
        } else {
          console.error(`  ❌ Error migrating call ${call.call_sid}:`, error.message);
        }
      }
    }

    console.log(`  ✅ Migrated ${migrated} of ${calls.length} calls`);
    return migrated;
  } catch (error) {
    console.error('  ❌ Error migrating calls:', error.message);
    return 0;
  }
}

async function migrateTranscripts() {
  console.log('\n💬 Migrating transcripts...');
  try {
    const result = await pgPool.query('SELECT * FROM transcripts');
    const transcripts = result.rows;

    if (transcripts.length === 0) {
      console.log('  No transcripts to migrate');
      return 0;
    }

    let migrated = 0;
    for (const transcript of transcripts) {
      try {
        await Transcript.create({
          callSid: transcript.call_sid,
          messages: transcript.messages,
          updatedAt: transcript.updated_at
        });
        migrated++;
      } catch (error) {
        if (error.code === 11000) {
          console.log(`  ⏭️  Skipping duplicate transcript: ${transcript.call_sid}`);
        } else {
          console.error(`  ❌ Error migrating transcript ${transcript.call_sid}:`, error.message);
        }
      }
    }

    console.log(`  ✅ Migrated ${migrated} of ${transcripts.length} transcripts`);
    return migrated;
  } catch (error) {
    console.error('  ❌ Error migrating transcripts:', error.message);
    return 0;
  }
}

async function migrateSettings() {
  console.log('\n⚙️  Migrating settings...');
  try {
    const result = await pgPool.query('SELECT * FROM settings');
    const settings = result.rows;

    if (settings.length === 0) {
      console.log('  No settings to migrate');
      return 0;
    }

    let migrated = 0;
    for (const setting of settings) {
      try {
        await Setting.create({
          key: setting.key,
          value: setting.value,
          updatedAt: setting.updated_at
        });
        migrated++;
      } catch (error) {
        if (error.code === 11000) {
          console.log(`  ⏭️  Skipping duplicate setting: ${setting.key}`);
        } else {
          console.error(`  ❌ Error migrating setting ${setting.key}:`, error.message);
        }
      }
    }

    console.log(`  ✅ Migrated ${migrated} of ${settings.length} settings`);
    return migrated;
  } catch (error) {
    console.error('  ❌ Error migrating settings:', error.message);
    return 0;
  }
}

async function migrateProfiles() {
  console.log('\n👤 Migrating profiles from files...');
  try {
    const profilesDir = path.join(__dirname, '..', 'profiles');
    const files = await fs.readdir(profilesDir);
    const txtFiles = files.filter(file => file.endsWith('.txt') && file !== 'README.md');

    if (txtFiles.length === 0) {
      console.log('  No profile files to migrate');
      return 0;
    }

    let migrated = 0;
    for (const file of txtFiles) {
      try {
        const phoneNumber = file.replace('.txt', '');
        const filePath = path.join(profilesDir, file);
        const profileContent = await fs.readFile(filePath, 'utf-8');

        await Profile.create({
          phoneNumber,
          profileContent: profileContent.trim(),
          sourceType: 'manual',
          sourceData: null,
          metadata: {
            migratedFrom: 'file',
            originalFile: file
          }
        });

        migrated++;
        console.log(`  ✅ Migrated profile: ${phoneNumber}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`  ⏭️  Skipping duplicate profile: ${file}`);
        } else {
          console.error(`  ❌ Error migrating profile ${file}:`, error.message);
        }
      }
    }

    console.log(`  ✅ Migrated ${migrated} of ${txtFiles.length} profiles`);
    return migrated;
  } catch (error) {
    console.error('  ❌ Error migrating profiles:', error.message);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting migration from PostgreSQL to MongoDB\n');
  console.log('='.repeat(60));

  try {
    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('  ✅ Connected to MongoDB');

    // Test PostgreSQL connection
    console.log('\n🔌 Testing PostgreSQL connection...');
    await pgPool.query('SELECT NOW()');
    console.log('  ✅ Connected to PostgreSQL');

    // Run migrations
    const callsMigrated = await migrateCalls();
    const transcriptsMigrated = await migrateTranscripts();
    const settingsMigrated = await migrateSettings();
    const profilesMigrated = await migrateProfiles();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Migration Summary:');
    console.log(`  Calls: ${callsMigrated}`);
    console.log(`  Transcripts: ${transcriptsMigrated}`);
    console.log(`  Settings: ${settingsMigrated}`);
    console.log(`  Profiles: ${profilesMigrated}`);
    console.log(`  Total: ${callsMigrated + transcriptsMigrated + settingsMigrated + profilesMigrated} documents`);

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify data in MongoDB (use MongoDB Compass or mongosh)');
    console.log('2. Update .env to use MONGODB_URI instead of DATABASE_URL');
    console.log('3. Test your application');
    console.log('4. Once confirmed working, you can remove PostgreSQL dependency\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    await pgPool.end();
    process.exit(0);
  }
}

// Run migration
main();
