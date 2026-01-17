import React from 'react';
import './CallHistory.css';

function CallHistory({ calls, onRefresh }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CallHistory;
