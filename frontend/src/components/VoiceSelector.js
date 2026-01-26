import React, { useState, useEffect } from 'react';
import './VoiceSelector.css';

// Voice selector for live voice switching - v2
function VoiceSelector({ callSid, onVoiceChange }) {
  const [voices, setVoices] = useState({});
  const [groupedVoices, setGroupedVoices] = useState({});
  const [currentVoice, setCurrentVoice] = useState(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState(40); // Default to Orion (ID 40)
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

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
          voiceId: selectedVoiceId
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
            onChange={(e) => setSelectedVoiceId(parseInt(e.target.value))}
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
