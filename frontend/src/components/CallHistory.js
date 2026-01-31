import React, { useState } from 'react';
import './CallHistory.css';
import TranscriptModal from './TranscriptModal';

function CallHistory({ calls, onRefresh }) {
  const [viewingTranscript, setViewingTranscript] = useState(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
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

  return (
    <div className="call-history">
      <div className="history-header">
        <h3>Call History</h3>
        <button onClick={onRefresh} className="refresh-btn">🔄 Refresh</button>
      </div>

      {calls.length === 0 ? (
        <p className="empty">No calls yet</p>
      ) : (
        <div className="calls-list">
          {calls.map((call) => (
            <div key={call.call_sid} className="call-card">
              <div className="call-card-header">
                <span className="from-number">{call.from_number}</span>
                <span className={`status ${call.status}`}>{call.status}</span>
              </div>
              <div className="call-card-details">
                <span>📅 {formatDate(call.start_time)}</span>
                {call.duration && <span>⏱️ {formatDuration(call.duration)}</span>}
                <span>💬 {call.message_count} messages</span>
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
              {call.message_count > 0 && (
                <button
                  onClick={() => handleViewTranscript(call.call_sid)}
                  className="view-transcript-btn"
                  disabled={loadingTranscript}
                >
                  {loadingTranscript ? '⏳ Loading...' : '💬 View Transcript'}
                </button>
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
