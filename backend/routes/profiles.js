const express = require('express');
const router = express.Router();
const db = require('../db');
const profileGenerator = require('../services/profileGenerator');

/**
 * GET /api/profiles
 * Get all profiles
 */
router.get('/', async (req, res) => {
  try {
    const profiles = await db.getAllProfiles();

    // Return profiles with preview
    const profilesWithPreview = profiles.map(profile => ({
      phoneNumber: profile.phoneNumber,
      preview: profile.profileContent.substring(0, 150) + (profile.profileContent.length > 150 ? '...' : ''),
      sourceType: profile.sourceType,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    }));

    res.json({
      profiles: profilesWithPreview,
      total: profiles.length
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

/**
 * GET /api/profiles/:phoneNumber
 * Get a specific profile by phone number
 */
router.get('/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    // Normalize the phone number for lookup
    const normalizedPhone = profileGenerator.normalizePhoneNumber(phoneNumber);

    const profile = await db.getProfileByPhone(normalizedPhone);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/profiles
 * Create a new profile
 * Body: { phoneNumber, source, sourceType: 'url' | 'text' }
 */
router.post('/', async (req, res) => {
  try {
    const { phoneNumber, source, sourceType } = req.body;

    // Validate input
    if (!phoneNumber || !source || !sourceType) {
      return res.status(400).json({
        error: 'Missing required fields: phoneNumber, source, sourceType'
      });
    }

    if (!['url', 'text'].includes(sourceType)) {
      return res.status(400).json({
        error: 'sourceType must be either "url" or "text"'
      });
    }

    // Generate profile
    console.log(`Creating profile for ${phoneNumber} from ${sourceType}`);
    const profileData = await profileGenerator.createProfile(phoneNumber, source, sourceType);

    // Check if profile already exists
    const existingProfile = await db.getProfileByPhone(profileData.phoneNumber);
    if (existingProfile) {
      return res.status(409).json({
        error: `Profile already exists for ${profileData.phoneNumber}. Use PUT to update it.`
      });
    }

    // Save to database
    const savedProfile = await db.createProfile(profileData);

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      profile: savedProfile
    });

  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({
      error: error.message || 'Failed to create profile'
    });
  }
});

/**
 * PUT /api/profiles/:phoneNumber
 * Update an existing profile
 * Body: { source, sourceType: 'url' | 'text' } (optional: profileContent to update directly)
 */
router.put('/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { source, sourceType, profileContent } = req.body;

    // Normalize the phone number
    const normalizedPhone = profileGenerator.normalizePhoneNumber(phoneNumber);

    // Check if profile exists
    const existingProfile = await db.getProfileByPhone(normalizedPhone);
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    let updates = {};

    // If profileContent is provided directly, use it
    if (profileContent) {
      updates.profileContent = profileContent;
      if (sourceType) updates.sourceType = sourceType;
      if (source) updates.sourceData = source;
    }
    // Otherwise, regenerate from source
    else if (source && sourceType) {
      if (!['url', 'text'].includes(sourceType)) {
        return res.status(400).json({
          error: 'sourceType must be either "url" or "text"'
        });
      }

      console.log(`Regenerating profile for ${normalizedPhone} from ${sourceType}`);
      const profileData = await profileGenerator.createProfile(normalizedPhone, source, sourceType);

      updates = {
        profileContent: profileData.profileContent,
        sourceType: profileData.sourceType,
        sourceData: profileData.sourceData
      };
    } else {
      return res.status(400).json({
        error: 'Provide either profileContent or both source and sourceType'
      });
    }

    // Update in database
    const updatedProfile = await db.updateProfile(normalizedPhone, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      error: error.message || 'Failed to update profile'
    });
  }
});

/**
 * DELETE /api/profiles/:phoneNumber
 * Delete a profile
 */
router.delete('/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    // Normalize the phone number
    const normalizedPhone = profileGenerator.normalizePhoneNumber(phoneNumber);

    // Check if profile exists
    const existingProfile = await db.getProfileByPhone(normalizedPhone);
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Delete from database
    await db.deleteProfile(normalizedPhone);

    res.json({
      success: true,
      message: 'Profile deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete profile'
    });
  }
});

module.exports = router;
