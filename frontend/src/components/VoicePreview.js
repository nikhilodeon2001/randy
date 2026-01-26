import React, { useState, useEffect } from 'react';
import './VoicePreview.css';

function VoicePreview() {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [loadingVoice, setLoadingVoice] = useState(null);
  const [audioCache, setAudioCache] = useState({});

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/voice-preview/list');
      const data = await response.json();
      setVoices(data.voices);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching voices:', error);
      setLoading(false);
    }
  };

  const playVoice = async (voice) => {
    try {
      // Stop currently playing audio
      if (currentlyPlaying) {
        currentlyPlaying.pause();
        currentlyPlaying.currentTime = 0;
      }

      // Check if we have this voice cached
      if (audioCache[voice.id]) {
        const audio = audioCache[voice.id];
        audio.play();
        setCurrentlyPlaying(audio);
        return;
      }

      // Generate new preview
      setLoadingVoice(voice.id);
      const response = await fetch(`/api/voice-preview/${voice.id}`);
      const data = await response.json();

      // Create and play audio
      const audio = new Audio(data.audioUrl);
      audio.onended = () => setCurrentlyPlaying(null);

      // Cache it
      setAudioCache(prev => ({ ...prev, [voice.id]: audio }));

      audio.play();
      setCurrentlyPlaying(audio);
      setLoadingVoice(null);

    } catch (error) {
      console.error('Error playing voice:', error);
      setLoadingVoice(null);
    }
  };

  const femaleVoices = voices.filter(v => v.gender === 'female');
  const maleVoices = voices.filter(v => v.gender === 'male');

  if (loading) {
    return <div className="voice-preview-loading">Loading voices...</div>;
  }

  return (
    <div className="voice-preview">
      <div className="voice-preview-header">
        <h2>🎙️ Voice Preview</h2>
        <p className="preview-text">Click any voice to hear a sample</p>
      </div>

      <div className="voice-section">
        <h3>Female Voices ({femaleVoices.length})</h3>
        <div className="voice-grid">
          {femaleVoices.map(voice => (
            <button
              key={voice.id}
              className={`voice-card female ${currentlyPlaying && audioCache[voice.id] === currentlyPlaying ? 'playing' : ''}`}
              onClick={() => playVoice(voice)}
              disabled={loadingVoice === voice.id}
            >
              <div className="voice-name">{voice.model.replace('aura-', '').replace('-en', '')}</div>
              <div className="voice-description">{voice.description}</div>
              {loadingVoice === voice.id && <div className="loading-spinner">⏳</div>}
              {currentlyPlaying && audioCache[voice.id] === currentlyPlaying && <div className="playing-indicator">🔊</div>}
            </button>
          ))}
        </div>
      </div>

      <div className="voice-section">
        <h3>Male Voices ({maleVoices.length})</h3>
        <div className="voice-grid">
          {maleVoices.map(voice => (
            <button
              key={voice.id}
              className={`voice-card male ${currentlyPlaying && audioCache[voice.id] === currentlyPlaying ? 'playing' : ''}`}
              onClick={() => playVoice(voice)}
              disabled={loadingVoice === voice.id}
            >
              <div className="voice-name">{voice.model.replace('aura-', '').replace('-en', '')}</div>
              <div className="voice-description">{voice.description}</div>
              {loadingVoice === voice.id && <div className="loading-spinner">⏳</div>}
              {currentlyPlaying && audioCache[voice.id] === currentlyPlaying && <div className="playing-indicator">🔊</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VoicePreview;
