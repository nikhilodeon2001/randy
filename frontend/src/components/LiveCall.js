import React, { useEffect, useRef } from 'react';
import './LiveCall.css';

function LiveCall({ call, transcript }) {
  const transcriptEndRef = useRef(null);
  const transcriptContainerRef = useRef(null);

  useEffect(() => {
    // Only auto-scroll if user is already near the bottom (within 100px)
    const container = transcriptContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
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
        <div className="transcript" ref={transcriptContainerRef}>
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
    </div>
  );
}

export default LiveCall;
