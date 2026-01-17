const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixRecordings() {
  try {
    const result = await pool.query(
      `UPDATE calls 
       SET recording_url = recording_url || '.mp3'
       WHERE recording_url IS NOT NULL 
       AND recording_url NOT LIKE '%.mp3'
       RETURNING call_sid, recording_url`
    );
    
    console.log(`Updated ${result.rowCount} recordings`);
    result.rows.forEach(row => {
      console.log(`${row.call_sid}: ${row.recording_url}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixRecordings();
