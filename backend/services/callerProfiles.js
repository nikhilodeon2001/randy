const fs = require('fs').promises;
const path = require('path');

// Directory where caller profiles are stored
const PROFILES_DIR = path.join(__dirname, '..', 'profiles');

/**
 * Load caller profile by phone number
 * @param {string} phoneNumber - Phone number in E.164 format (e.g., +15551234567)
 * @returns {Promise<string|null>} - Profile content or null if not found
 */
async function loadCallerProfile(phoneNumber) {
  try {
    // Construct profile file path
    const profilePath = path.join(PROFILES_DIR, `${phoneNumber}.txt`);

    // Check if profile exists
    try {
      await fs.access(profilePath);
    } catch {
      // Profile doesn't exist - this is normal for unknown callers
      console.log(`No profile found for ${phoneNumber}`);
      return null;
    }

    // Read profile content
    const profileContent = await fs.readFile(profilePath, 'utf-8');
    console.log(`✅ Loaded profile for ${phoneNumber} (${profileContent.length} characters)`);

    return profileContent.trim();
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
    const profilePath = path.join(PROFILES_DIR, `${phoneNumber}.txt`);
    await fs.access(profilePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all caller profiles
 * @returns {Promise<string[]>} - Array of phone numbers with profiles
 */
async function listCallerProfiles() {
  try {
    const files = await fs.readdir(PROFILES_DIR);
    const profileNumbers = files
      .filter(file => file.endsWith('.txt'))
      .map(file => file.replace('.txt', ''));

    return profileNumbers;
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
