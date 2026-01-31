import React, { useState } from 'react';
import './CallHistory.css';
import TranscriptModal from './TranscriptModal';

function CallHistory({ calls, onRefresh }) {
  const [viewingTranscript, setViewingTranscript] = useState(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [phoneFilter, setPhoneFilter] = useState('');
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleViewTranscript = async (callSid) => {
    setLoadingTranscript(true);
    try {
      const response = await fetch(`/api/calls/${callSid}/transcript`);

      if (!response.ok) {
        throw new Error('Failed to load transcript');
      }

      const data = await response.json();
      setViewingTranscript(data);
    } catch (error) {
      console.error('Error loading transcript:', error);
      alert('Failed to load transcript. It may not be available for this call.');
    } finally {
      setLoadingTranscript(false);
    }
  };

  // Filter calls based on phone number
  const filteredCalls = calls.filter(call =>
    call.from_number.includes(phoneFilter)
  );

  return (
    <div className="call-history">
      <div className="history-header">
        <h3>Call History</h3>
        <button onClick={onRefresh} className="refresh-btn">🔄 Refresh</button>
      </div>

      <div className="filter-container">
        <input
          type="text"
          placeholder="Filter by phone number..."
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
          className="phone-filter-input"
        />
        {phoneFilter && (
          <button
            onClick={() => setPhoneFilter('')}
            className="clear-filter-btn"
            title="Clear filter"
          >
            ✕
          </button>
        )}
      </div>

      {filteredCalls.length === 0 ? (
        <p className="empty">{phoneFilter ? 'No matching calls' : 'No calls yet'}</p>
      ) : (
        <div className="calls-list">
          {filteredCalls.map((call) => (
            <div key={call.call_sid} className="call-card">
              <div className="call-card-header">
                <span className="from-number">{call.from_number}</span>
                <span className={`status ${call.status}`}>{call.status}</span>
              </div>
              <div className="call-card-details">
                <span>📅 {formatDate(call.start_time)}</span>
                {call.duration && <span>⏱️ {formatDuration(call.duration)}</span>}
                <span>💬 {call.message_count} messages</span>
                {call.message_count > 0 && (
                  <button
                    onClick={() => handleViewTranscript(call.call_sid)}
                    className="view-transcript-icon-btn"
                    disabled={loadingTranscript}
                    title="View transcript"
                  >
                    📄
                  </button>
                )}
              </div>
              {call.recording_url && (
                <div className="recording-player">
                  <audio controls src={call.recording_url}>
                    Your browser does not support the audio element.
                  </audio>
                  <a href={call.recording_url} download className="download-btn">
                    ⬇️ Download
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {viewingTranscript && (
        <TranscriptModal
          transcript={viewingTranscript}
          onClose={() => setViewingTranscript(null)}
        />
      )}
    </div>
  );
}

export default CallHistory;
