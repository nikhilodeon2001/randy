import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';
import LiveCall from './components/LiveCall';
import CallHistory from './components/CallHistory';

const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000');

function App() {
  const [activeCall, setActiveCall] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [callHistory, setCallHistory] = useState([]);

  useEffect(() => {
    // Listen for incoming calls
    socket.on('call:started', (data) => {
      console.log('Call started:', data);
      setActiveCall(data);
      setTranscript([]);
    });

    // Listen for transcript updates
    socket.on('call:transcript', (data) => {
      console.log('Transcript update:', data);
      if (data.callSid === activeCall?.callSid) {
        setTranscript(data.messages);
      }
    });

    // Listen for call ended
    socket.on('call:ended', (data) => {
      console.log('Call ended:', data);
      if (data.callSid === activeCall?.callSid) {
        setActiveCall(null);
        loadCallHistory();
      }
    });

    // Listen for voice changes
    socket.on('voice:changed', (data) => {
      console.log('Voice changed:', data);
      // You can show a notification or update UI here if needed
    });

    // Load call history on mount
    loadCallHistory();

    return () => {
      socket.off('call:started');
      socket.off('call:transcript');
      socket.off('call:ended');
      socket.off('voice:changed');
    };
  }, [activeCall]);

  const loadCallHistory = async () => {
    try {
      const response = await fetch('/api/calls');
      const data = await response.json();
      setCallHistory(data);
    } catch (error) {
      console.error('Error loading call history:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖 Randy - AI Call Handler</h1>
        <p>Monitor AI conversations with spam callers in real-time</p>
      </header>

      <main>
        {activeCall ? (
          <LiveCall
            call={activeCall}
            transcript={transcript}
          />
        ) : (
          <div className="waiting">
            <h2>Waiting for incoming calls...</h2>
            <p>Calls to your Twilio number will appear here</p>
          </div>
        )}

        <CallHistory calls={callHistory} onRefresh={loadCallHistory} />
      </main>
    </div>
  );
}

export default App;
