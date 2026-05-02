import React, { useEffect, useRef } from 'react';
import './LiveCall.css';

function LiveCall({ call, transcript }) {
  const transcriptEndRef = useRef(null);
  const transcriptContainerRef = useRef(null);
  const wasAtBottomRef = useRef(true); // Track if user was at bottom

  useEffect(() => {
    const container = transcriptContainerRef.current;
    if (!container) return;

    // Check if user was at bottom BEFORE the update
    const scrollThreshold = 50; // pixels from bottom
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= scrollThreshold;

    // Update our tracking ref
    wasAtBottomRef.current = isAtBottom;

    // Only auto-scroll if user was at the bottom
    if (isAtBottom) {
      // Scroll the container itself, not the scrollIntoView which affects the whole page
      container.scrollTop = container.scrollHeight;
    }
  }, [transcript]);

  // Add scroll event listener to track user scroll behavior
  useEffect(() => {
    const container = transcriptContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollThreshold = 50;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= scrollThreshold;
      wasAtBottomRef.current = isAtBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

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
