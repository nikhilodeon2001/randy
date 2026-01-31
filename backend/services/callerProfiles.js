const db = require('../db');

/**
 * Load caller profile by phone number
 * @param {string} phoneNumber - Phone number in E.164 format (e.g., +15551234567)
 * @returns {Promise<string|null>} - Profile content or null if not found
 */
async function loadCallerProfile(phoneNumber) {
  try {
    const profile = await db.getProfileByPhone(phoneNumber);

    if (!profile) {
      console.log(`No profile found for ${phoneNumber}`);
      return null;
    }

    console.log(`✅ Loaded profile for ${phoneNumber} (${profile.profileContent.length} characters)`);
    return profile.profileContent;

  } catch (error) {
    console.error(`Error loading profile for ${phoneNumber}:`, error);
    return null;
  }
}

/**
 * Check if a caller has a profile
 * @param {string} phoneNumber - Phone number in E.164 format
 * @returns {Promise<boolean>} - True if profile exists
 */
async function hasCallerProfile(phoneNumber) {
  try {
    const profile = await db.getProfileByPhone(phoneNumber);
    return profile !== null;
  } catch (error) {
    console.error(`Error checking profile for ${phoneNumber}:`, error);
    return false;
  }
}

/**
 * List all caller profiles
 * @returns {Promise<string[]>} - Array of phone numbers with profiles
 */
async function listCallerProfiles() {
  try {
    const profiles = await db.getAllProfiles();
    return profiles.map(profile => profile.phoneNumber);
  } catch (error) {
    console.error('Error listing caller profiles:', error);
    return [];
  }
}

module.exports = {
  loadCallerProfile,
  hasCallerProfile,
  listCallerProfiles
};
