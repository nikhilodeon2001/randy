import React, { useState, useEffect } from 'react';
import './VoiceSelector.css';

// Voice selector for live voice switching - v2
function VoiceSelector({ callSid, onVoiceChange }) {
  const [voices, setVoices] = useState({});
  const [groupedVoices, setGroupedVoices] = useState({});
  const [currentVoice, setCurrentVoice] = useState(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState(38); // Default to Orion (ID 38)
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);
  const [randomPerCall, setRandomPerCall] = useState(true); // Default: random once per call
  const [isRandomVoice, setIsRandomVoice] = useState(false); // Track if selected voice is random

  // Fetch available voice models on mount
  useEffect(() => {
    async function init() {
      const voiceModels = await fetchVoiceModels();
      if (callSid) {
        fetchCurrentVoice();
      } else {
        fetchDefaultVoice(voiceModels);
      }
    }
    init();
  }, [callSid]);

  const fetchVoiceModels = async () => {
    try {
      const response = await fetch('/api/voice/models');
      const data = await response.json();
      setVoices(data.models);
      setGroupedVoices(data.grouped);
      setIsLoading(false);
      return data.models; // Return the models for use in init
    } catch (error) {
      console.error('Error fetching voice models:', error);
      setIsLoading(false);
      return {};
    }
  };

  const fetchCurrentVoice = async () => {
    try {
      const response = await fetch(`/api/voice/current/${callSid}`);
      const data = await response.json();
      setCurrentVoice(data);

      // Use the voiceId directly from the API response
      if (data.voiceId) {
        setSelectedVoiceId(data.voiceId);
      }
    } catch (error) {
      console.error('Error fetching current voice:', error);
    }
  };

  const fetchDefaultVoice = async (voiceModels) => {
    try {
      const response = await fetch('/api/voice/default');
      const data = await response.json();

      // Find the voice ID from the voice model name
      const voiceId = Object.keys(voiceModels).find(
        id => voiceModels[id]?.model === data.voiceModel
      );

      if (voiceId) {
        setSelectedVoiceId(parseInt(voiceId));
        setCurrentVoice({
          currentVoice: data.voiceModel,
          description: data.description
        });
      }
    } catch (error) {
      console.error('Error fetching default voice:', error);
    }
  };

  const handleVoiceChange = async () => {
    setIsChanging(true);
    try {
      const endpoint = callSid ? '/api/voice/change' : '/api/voice/default';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callSid,
          voiceId: selectedVoiceId,
          randomPerCall: randomPerCall // Include random mode preference
        })
      });

      const data = await response.json();

      if (data.success) {
        setCurrentVoice({
          currentVoice: data.voiceModel,
          description: data.description
        });

        if (onVoiceChange) {
          onVoiceChange(data);
        }
      }
    } catch (error) {
      console.error('Error changing voice:', error);
      alert('❌ Failed to change voice. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  // Update isRandomVoice when selected voice changes
  const handleVoiceSelection = (voiceId) => {
    const parsedId = parseInt(voiceId);
    setSelectedVoiceId(parsedId);
    // Check if this is a random voice (IDs 100-108)
    setIsRandomVoice(parsedId >= 100 && parsedId <= 108);
  };

  if (isLoading) {
    return <div className="voice-selector loading">Loading voices...</div>;
  }

  return (
    <div className="voice-selector">
      <div className="voice-selector-header">
        <h3>🎤 Voice Settings</h3>
      </div>

      {!callSid && (
        <div className="no-call-warning">
          ℹ️ No active call. Select a voice to set the default for future calls.
        </div>
      )}

      <div className="voice-selector-content">
        {currentVoice && (
          <div className="current-voice-display">
            <span className="label">Current Voice:</span>
            <span className="value">{currentVoice.description}</span>
          </div>
        )}

        <div className="voice-dropdown-container">
          <label htmlFor="voice-select" className="dropdown-label">
            Select Voice:
          </label>
          <select
            id="voice-select"
            value={selectedVoiceId}
            onChange={(e) => handleVoiceSelection(e.target.value)}
            disabled={isChanging}
            className="voice-dropdown"
          >
            {Object.entries(groupedVoices).map(([groupName, voiceIds]) => (
              <optgroup key={groupName} label={groupName}>
                {voiceIds.map(id => (
                  <option key={id} value={id}>
                    {id}. {voices[id]?.description || 'Unknown'}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {isRandomVoice && callSid && (
          <div className="random-mode-container">
            <label className="random-mode-label">
              <input
                type="checkbox"
                checked={randomPerCall}
                onChange={(e) => setRandomPerCall(e.target.checked)}
                disabled={isChanging}
              />
              <span>Lock random voice for entire call</span>
            </label>
            <p className="random-mode-hint">
              {randomPerCall
                ? '🔒 Voice will be randomly selected once and kept for the whole call'
                : '🎲 Voice will change randomly with each AI response'}
            </p>
          </div>
        )}

        <button
          className="apply-btn"
          onClick={handleVoiceChange}
          disabled={isChanging}
        >
          {isChanging ? '⏳ Changing...' : callSid ? '✅ Apply Voice' : '✅ Set Default Voice'}
        </button>

        <p className="hint">
          💡 {callSid ? 'Voice will be applied to the next AI response' : 'This voice will be used for all future calls'}
        </p>
      </div>
    </div>
  );
}

export default VoiceSelector;
