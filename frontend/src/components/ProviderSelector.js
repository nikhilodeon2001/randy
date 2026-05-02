import React, { useState, useEffect } from 'react';
import './ProviderSelector.css';

function ProviderSelector() {
  const [activeProvider, setActiveProvider] = useState(null);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    fetchProvider();
  }, []);

  const fetchProvider = async () => {
    try {
      const response = await fetch('/api/provider');
      const data = await response.json();
      setActiveProvider(data.provider);
    } catch (error) {
      console.error('Error fetching AI provider:', error);
    }
  };

  const switchProvider = async (provider) => {
    if (provider === activeProvider || isSwitching) return;
    setIsSwitching(true);
    try {
      const response = await fetch('/api/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      const data = await response.json();
      setActiveProvider(data.provider);
    } catch (error) {
      console.error('Error switching AI provider:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="provider-selector">
      <div className="provider-selector-header">
        <h3>🤖 AI Provider</h3>
      </div>

      <div className="provider-selector-content">
        <div className="provider-buttons">
          <button
            className={`provider-btn ${activeProvider === 'openai' ? 'active' : ''}`}
            onClick={() => switchProvider('openai')}
            disabled={isSwitching}
          >
            OpenAI
          </button>
          <button
            className={`provider-btn ${activeProvider === 'anthropic' ? 'active' : ''}`}
            onClick={() => switchProvider('anthropic')}
            disabled={isSwitching}
          >
            Anthropic
          </button>
        </div>

        {activeProvider && (
          <p className="provider-hint">
            {isSwitching
              ? '⏳ Switching...'
              : `Active: ${activeProvider === 'openai' ? 'OpenAI' : 'Anthropic'} — applies to the next incoming call`}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProviderSelector;
