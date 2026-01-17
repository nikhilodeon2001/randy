import React, { useState, useEffect } from 'react';
import './VoiceSelector.css';

// Voice selector for live voice switching - v2
function VoiceSelector({ callSid, onVoiceChange }) {
  const [voices, setVoices] = useState({});
  const [groupedVoices, setGroupedVoices] = useState({});
  const [currentVoice, setCurrentVoice] = useState(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState(1); // Default to Thalia
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  // Fetch available voice models on mount
  useEffect(() => {
    fetchVoiceModels();
    if (callSid) {
      fetchCurrentVoice();
    }
  }, [callSid]);

  const fetchVoiceModels = async () => {
    try {
      const response = await fetch('/api/voice/models');
      const data = await response.json();
      setVoices(data.models);
      setGroupedVoices(data.grouped);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching voice models:', error);
      setIsLoading(false);
    }
  };

  const fetchCurrentVoice = async () => {
    try {
      const response = await fetch(`/api/voice/current/${callSid}`);
      const data = await response.json();
      setCurrentVoice(data);

      // Find voice ID from model name
      const voiceId = Object.keys(voices).find(
        id => voices[id].model === data.currentVoice
      );
      if (voiceId) {
        setSelectedVoiceId(parseInt(voiceId));
      }
    } catch (error) {
      console.error('Error fetching current voice:', error);
    }
  };

  const handleVoiceChange = async () => {
    if (!callSid) return;

    setIsChanging(true);
    try {
      const response = await fetch('/api/voice/change', {
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

        // Show success feedback
        alert(`✅ Voice changed to: ${data.description}`);
      }
    } catch (error) {
      console.error('Error changing voice:', error);
      alert('❌ Failed to change voice. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  const renderVoiceGroup = (groupName, voiceIds) => {
    return (
      <div key={groupName} className="voice-group">
        <h4>{groupName}</h4>
        <div className="voice-options">
          {voiceIds.map(id => (
            <label key={id} className="voice-option">
              <input
                type="radio"
                name="voice"
                value={id}
                checked={selectedVoiceId === id}
                onChange={() => setSelectedVoiceId(id)}
                disabled={!callSid || isChanging}
              />
              <span className="voice-label">
                <strong>{id}.</strong> {voices[id]?.description || 'Unknown'}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="voice-selector loading">Loading voices...</div>;
  }

  return (
    <div className="voice-selector">
      <div className="voice-selector-header">
        <h3>🎤 Voice Settings</h3>
        {currentVoice && (
          <div className="current-voice">
            <span className="label">Current:</span>
            <span className="value">{currentVoice.description}</span>
          </div>
        )}
      </div>

      {!callSid && (
        <div className="no-call-warning">
          ⚠️ No active call. Voice can only be changed during a call.
        </div>
      )}

      <div className="voice-groups">
        {Object.entries(groupedVoices).map(([groupName, voiceIds]) =>
          renderVoiceGroup(groupName, voiceIds)
        )}
      </div>

      <div className="voice-selector-footer">
        <button
          className="apply-btn"
          onClick={handleVoiceChange}
          disabled={!callSid || isChanging}
        >
          {isChanging ? '⏳ Changing...' : '✅ Apply Voice'}
        </button>
        <p className="hint">
          💡 Voice will be applied to the next AI response
        </p>
      </div>
    </div>
  );
}

export default VoiceSelector;
