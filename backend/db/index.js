const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Initialize database tables
 */
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calls (
        id SERIAL PRIMARY KEY,
        call_sid VARCHAR(255) UNIQUE NOT NULL,
        from_number VARCHAR(50) NOT NULL,
        to_number VARCHAR(50) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration INTEGER,
        status VARCHAR(50) NOT NULL,
        message_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transcripts (
        id SERIAL PRIMARY KEY,
        call_sid VARCHAR(255) NOT NULL REFERENCES calls(call_sid) ON DELETE CASCADE,
        messages JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_call_sid ON calls(call_sid);
      CREATE INDEX IF NOT EXISTS idx_calls_start_time ON calls(start_time DESC);
      CREATE INDEX IF NOT EXISTS idx_transcripts_call_sid ON transcripts(call_sid);
    `);

    console.log('✅ Database tables initialized');
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
    const result = await pool.query(
      `INSERT INTO calls (call_sid, from_number, to_number, start_time, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [callSid, fromNumber, toNumber, startTime, status]
    );

    return result.rows[0];
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
    const result = await pool.query(
      `UPDATE calls
       SET end_time = COALESCE($2, end_time),
           duration = COALESCE($3, duration),
           status = COALESCE($4, status),
           message_count = COALESCE($5, message_count)
       WHERE call_sid = $1
       RETURNING *`,
      [callSid, endTime, duration, status, messageCount]
    );

    return result.rows[0];
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
    const result = await pool.query(
      'SELECT * FROM calls WHERE call_sid = $1',
      [callSid]
    );

    return result.rows[0];
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
    const result = await pool.query(
      `SELECT * FROM calls
       ORDER BY start_time DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
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
    const result = await pool.query(
      `INSERT INTO transcripts (call_sid, messages)
       VALUES ($1, $2)
       ON CONFLICT (call_sid)
       DO UPDATE SET messages = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [callSid, JSON.stringify(messages)]
    );

    return result.rows[0];
  } catch (error) {
    // If foreign key constraint fails, create the call first
    if (error.code === '23503') {
      console.warn(`Call ${callSid} not found, will be created when call starts`);
      return null;
    }

    console.error('Error updating transcript:', error);
    throw error;
  }
}

/**
 * Get transcript for a call
 */
async function getTranscript(callSid) {
  try {
    const result = await pool.query(
      'SELECT * FROM transcripts WHERE call_sid = $1',
      [callSid]
    );

    return result.rows[0];
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
    await pool.query('DELETE FROM calls WHERE call_sid = $1', [callSid]);
  } catch (error) {
    console.error('Error deleting call:', error);
    throw error;
  }
}

module.exports = {
  initDb,
  createCall,
  updateCall,
  getCallBySid,
  getAllCalls,
  updateTranscript,
  getTranscript,
  deleteCall,
  pool
};
