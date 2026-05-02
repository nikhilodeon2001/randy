import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';
import LiveCall from './components/LiveCall';
import CallHistory from './components/CallHistory';
import VoiceSelector from './components/VoiceSelector';
import VoicePreview from './components/VoicePreview';
import ProfileMaker from './components/ProfileMaker';
import ProviderSelector from './components/ProviderSelector';

// In production, connect to same origin (Heroku serves both frontend and backend)
// In development, connect to localhost:3000
const socket = io(process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'));

function App() {
  const [activeCall, setActiveCall] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard' or 'voice-preview'

  useEffect(() => {
    // Request active call when socket connects/reconnects
    const handleConnect = () => {
      console.log('Socket connected, requesting active call...');
      socket.emit('get:active-call');
    };

    // Listen for active call response (for page refresh during active call)
    socket.on('active-call', (data) => {
      console.log('Active call response:', data);
      if (data) {
        setActiveCall(data.call);
        setTranscript(data.transcript || []);
      }
    });

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
        setTranscript([]);
        loadCallHistory();
      }
    });

    // Listen for voice changes
    socket.on('voice:changed', (data) => {
      console.log('Voice changed:', data);
      // You can show a notification or update UI here if needed
    });

    // Handle socket connection
    socket.on('connect', handleConnect);

    // If already connected, request active call immediately
    if (socket.connected) {
      handleConnect();
    }

    // Load call history on mount
    loadCallHistory();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('active-call');
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

        <nav className="tab-nav">
          <button
            className={`tab-button ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`tab-button ${currentTab === 'voice-preview' ? 'active' : ''}`}
            onClick={() => setCurrentTab('voice-preview')}
          >
            🎙️ Voice Preview
          </button>
          <button
            className={`tab-button ${currentTab === 'profile-maker' ? 'active' : ''}`}
            onClick={() => setCurrentTab('profile-maker')}
          >
            🔖 Profile Maker
          </button>
        </nav>
      </header>

      <main>
        {currentTab === 'dashboard' ? (
          <>
            {activeCall && (
              <LiveCall
                call={activeCall}
                transcript={transcript}
              />
            )}

            <ProviderSelector />

            <VoiceSelector
              callSid={activeCall?.callSid || null}
              onVoiceChange={(voiceData) => {
                console.log('Voice changed:', voiceData);
              }}
            />

            {!activeCall && (
              <div className="waiting">
                <h2>Waiting for incoming calls...</h2>
                <p>Calls to your Twilio number will appear here</p>
              </div>
            )}

            <CallHistory calls={callHistory} onRefresh={loadCallHistory} />
          </>
        ) : currentTab === 'voice-preview' ? (
          <VoicePreview />
        ) : (
          <ProfileMaker />
        )}
      </main>
    </div>
  );
}

export default App;
