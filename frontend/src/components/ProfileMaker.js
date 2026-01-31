import React, { useState, useEffect } from 'react';
import './ProfileMaker.css';

function ProfileMaker() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sourceType, setSourceType] = useState('text');
  const [source, setSource] = useState('');

  // View profile modal
  const [viewingProfile, setViewingProfile] = useState(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profiles');
      const data = await response.json();
      setProfiles(data.profiles || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError('Failed to load profiles');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    if (!source.trim()) {
      setError(`Please enter ${sourceType === 'url' ? 'a URL' : 'some text'}`);
      return;
    }

    try {
      setCreating(true);

      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber,
          source,
          sourceType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create profile');
      }

      setSuccess(`Profile created successfully for ${data.profile.phoneNumber}!`);
      setPhoneNumber('');
      setSource('');
      setCreating(false);

      // Refresh profiles list
      fetchProfiles();

    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err.message);
      setCreating(false);
    }
  };

  const handleDelete = async (phoneNumber) => {
    if (!window.confirm(`Are you sure you want to delete the profile for ${phoneNumber}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${encodeURIComponent(phoneNumber)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete profile');
      }

      setSuccess(`Profile deleted for ${phoneNumber}`);
      fetchProfiles();
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError(err.message);
    }
  };

  const handleViewProfile = async (phoneNumber) => {
    try {
      const response = await fetch(`/api/profiles/${encodeURIComponent(phoneNumber)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load profile');
      }

      setViewingProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.message);
    }
  };

  const formatPhoneNumber = (phone) => {
    // Format +15103015242 as +1 (510) 301-5242
    if (phone.startsWith('+1') && phone.length === 12) {
      return `+1 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
    }
    return phone;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="profile-maker">
      {/* Header */}
      <div className="profile-maker-header">
        <h2>🔖 Profile Maker</h2>
        <p>Create personalized caller profiles from URLs or text</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="message error-message">
          ❌ {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      {success && (
        <div className="message success-message">
          ✅ {success}
          <button onClick={() => setSuccess(null)} className="close-btn">×</button>
        </div>
      )}

      {/* Create Profile Form */}
      <div className="create-profile-section">
        <h3>Create New Profile</h3>
        <form onSubmit={handleSubmit} className="profile-form">
          {/* Phone Number Input */}
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="text"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(510) 301-5242 or +15103015242"
              disabled={creating}
            />
          </div>

          {/* Source Type Radio */}
          <div className="form-group">
            <label>Source Type</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="url"
                  checked={sourceType === 'url'}
                  onChange={(e) => setSourceType(e.target.value)}
                  disabled={creating}
                />
                <span>📎 URL</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="text"
                  checked={sourceType === 'text'}
                  onChange={(e) => setSourceType(e.target.value)}
                  disabled={creating}
                />
                <span>📝 Text</span>
              </label>
            </div>
          </div>

          {/* Source Input */}
          <div className="form-group">
            <label htmlFor="source">
              {sourceType === 'url' ? 'URL (LinkedIn, website, etc.)' : 'Profile Information'}
            </label>
            {sourceType === 'url' ? (
              <input
                type="url"
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                disabled={creating}
              />
            ) : (
              <textarea
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Paste information about the caller here..."
                rows="8"
                disabled={creating}
              />
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={creating}>
            {creating ? (
              <>⏳ Generating Profile...</>
            ) : (
              <>✨ Generate Profile</>
            )}
          </button>
        </form>
      </div>

      {/* Profiles List */}
      <div className="profiles-list-section">
        <h3>Existing Profiles ({profiles.length})</h3>

        {loading ? (
          <div className="loading">Loading profiles...</div>
        ) : profiles.length === 0 ? (
          <div className="empty-state">
            <p>No profiles yet. Create one above!</p>
          </div>
        ) : (
          <div className="profiles-grid">
            {profiles.map((profile) => (
              <div key={profile.phoneNumber} className="profile-card">
                <div className="profile-card-header">
                  <div className="phone-number">{formatPhoneNumber(profile.phoneNumber)}</div>
                  <span className={`source-badge ${profile.sourceType}`}>
                    {profile.sourceType === 'url' ? '📎' : profile.sourceType === 'text' ? '📝' : '✍️'}
                  </span>
                </div>
                <div className="profile-preview">{profile.preview}</div>
                <div className="profile-card-footer">
                  <div className="profile-date">
                    Created {formatDate(profile.createdAt)}
                  </div>
                  <div className="profile-actions">
                    <button
                      onClick={() => handleViewProfile(profile.phoneNumber)}
                      className="action-btn view-btn"
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={() => handleDelete(profile.phoneNumber)}
                      className="action-btn delete-btn"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Profile Modal */}
      {viewingProfile && (
        <div className="modal-overlay" onClick={() => setViewingProfile(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{formatPhoneNumber(viewingProfile.phoneNumber)}</h3>
              <button onClick={() => setViewingProfile(null)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <pre className="profile-content">{viewingProfile.profileContent}</pre>
              <div className="profile-metadata">
                <div className="metadata-item">
                  <strong>Source:</strong> {viewingProfile.sourceType}
                </div>
                {viewingProfile.sourceData && (
                  <div className="metadata-item">
                    <strong>Original Source:</strong>
                    {viewingProfile.sourceType === 'url' ? (
                      <a href={viewingProfile.sourceData} target="_blank" rel="noopener noreferrer">
                        {viewingProfile.sourceData}
                      </a>
                    ) : (
                      <span className="truncate">{viewingProfile.sourceData.substring(0, 100)}...</span>
                    )}
                  </div>
                )}
                <div className="metadata-item">
                  <strong>Created:</strong> {new Date(viewingProfile.createdAt).toLocaleString()}
                </div>
                <div className="metadata-item">
                  <strong>Updated:</strong> {new Date(viewingProfile.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileMaker;
