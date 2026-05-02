import React from 'react';
import './TranscriptModal.css';

function TranscriptModal({ transcript, onClose }) {
  if (!transcript) return null;

  const formatTimestamp = (message, index) => {
    // If messages have timestamps, use them; otherwise show message number
    return `Message ${index + 1}`;
  };

  return (
    <div className="transcript-modal-overlay" onClick={onClose}>
      <div className="transcript-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="transcript-modal-header">
          <h3>💬 Call Transcript</h3>
          <button onClick={onClose} className="transcript-modal-close">×</button>
        </div>

        <div className="transcript-modal-body">
          {transcript.messages && transcript.messages.length > 0 ? (
            <div className="transcript-messages">
              {transcript.messages.map((message, index) => (
                <div
                  key={index}
                  className={`transcript-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className="message-header">
                    <span className="message-role">
                      {message.role === 'user' ? '👤 Caller' : '🤖 Randy'}
                    </span>
                    <span className="message-timestamp">{formatTimestamp(message, index)}</span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transcript">
              <p>No transcript available for this call.</p>
            </div>
          )}
        </div>

        <div className="transcript-modal-footer">
          <button onClick={onClose} className="close-button">Close</button>
        </div>
      </div>
    </div>
  );
}

export default TranscriptModal;
