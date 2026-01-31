const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Normalize phone number to E.164 format (+1XXXXXXXXXX)
 * Handles various input formats:
 * - "5103015242"
 * - "(510) 301-5242"
 * - "510-301-5242"
 * - "+15103015242"
 * - "15103015242"
 */
function normalizePhoneNumber(input) {
  if (!input) {
    throw new Error('Phone number is required');
  }

  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  // Handle different lengths
  if (digits.length === 10) {
    // Assume US/Canada number, add +1
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // Already has country code, just add +
    return `+${digits}`;
  } else if (digits.length === 11 && !digits.startsWith('1')) {
    // 11 digits but doesn't start with 1, assume it's wrong
    throw new Error('Invalid phone number format. US/Canada numbers should be 10 digits or start with 1.');
  } else if (digits.length === 12 && digits.startsWith('1')) {
    // Has +1 already parsed as digits
    return `+${digits}`;
  } else {
    throw new Error(`Invalid phone number length: ${digits.length} digits. Expected 10 or 11 digits.`);
  }
}

/**
 * Scrape content from a URL
 * @param {string} url - The URL to scrape
 * @returns {Promise<string>} - Extracted text content
 */
async function scrapeUrl(url) {
  try {
    console.log(`🌐 Scraping URL: ${url}`);

    // Fetch the page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000 // 15 second timeout
    });

    const html = response.data;

    // Parse HTML with cheerio
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style, nav, header, footer, aside, iframe, noscript').remove();

    // LinkedIn specific selectors (if it's a LinkedIn page)
    if (url.includes('linkedin.com')) {
      // Try to get main profile sections
      const name = $('h1.text-heading-xlarge').first().text().trim();
      const headline = $('div.text-body-medium').first().text().trim();
      const about = $('section[data-section="summary"] div.inline-show-more-text').text().trim();
      const experience = $('section[data-section="experience"]').text().trim();

      let linkedInContent = '';
      if (name) linkedInContent += `Name: ${name}\n\n`;
      if (headline) linkedInContent += `Headline: ${headline}\n\n`;
      if (about) linkedInContent += `About: ${about}\n\n`;
      if (experience) linkedInContent += `Experience: ${experience}\n\n`;

      if (linkedInContent) {
        console.log(`✅ Extracted LinkedIn profile content (${linkedInContent.length} characters)`);
        return linkedInContent;
      }
    }

    // Generic text extraction
    // Get text from main content areas
    const mainContent = $('main, article, .content, #content, .main, #main').text() || $('body').text();

    // Clean up whitespace
    const cleanedText = mainContent
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();

    if (!cleanedText || cleanedText.length < 50) {
      throw new Error('Not enough content extracted from URL. The page might be JavaScript-rendered or have restricted access.');
    }

    console.log(`✅ Extracted ${cleanedText.length} characters from URL`);
    return cleanedText;

  } catch (error) {
    if (error.response) {
      throw new Error(`Failed to fetch URL (HTTP ${error.response.status}): ${error.message}`);
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('URL not found. Please check the URL and try again.');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('Request timed out. The website took too long to respond.');
    } else {
      throw new Error(`Failed to scrape URL: ${error.message}`);
    }
  }
}

/**
 * Generate profile from content using OpenAI
 * @param {string} content - The text content to analyze
 * @param {string} sourceType - 'url' or 'text'
 * @returns {Promise<string>} - Generated profile text
 */
async function generateProfileFromContent(content, sourceType) {
  try {
    console.log(`🤖 Generating profile from ${sourceType} (${content.length} characters)`);

    const prompt = `You are creating a caller profile for an AI phone assistant named Doug. This profile will be used when someone calls, so Doug knows who they are and how to interact with them.

Based on the following ${sourceType === 'url' ? 'information scraped from a website' : 'information provided by the user'}, create a structured caller profile.

CONTENT TO ANALYZE:
${content}

Please create a profile in this format:

Caller: [Name and/or company if identifiable]

Context:
- [Key background information]
- [Professional role or position if mentioned]
- [Company or organization if mentioned]

Known Details:
- [Specific facts, achievements, or notable information]
- [Areas of expertise or interest]
- [Any other relevant details]

Strategy:
- [How Doug should greet them]
- [Tone to use (professional, friendly, casual, etc.)]
- [Key things to mention or reference]

Notes:
- [Any other relevant information for context]

Keep it concise but informative. Focus on information that would be useful for a personalized phone greeting and conversation.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates structured caller profiles for an AI phone assistant.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const generatedProfile = response.choices[0].message.content.trim();
    console.log(`✅ Generated profile (${generatedProfile.length} characters)`);

    return generatedProfile;

  } catch (error) {
    console.error('Error generating profile with OpenAI:', error);
    throw new Error(`Failed to generate profile: ${error.message}`);
  }
}

/**
 * Main function to create a profile
 * @param {string} phoneNumber - Phone number (any format)
 * @param {string} source - URL or text content
 * @param {string} sourceType - 'url' or 'text'
 * @returns {Promise<Object>} - Profile data ready for database
 */
async function createProfile(phoneNumber, source, sourceType) {
  try {
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    console.log(`📞 Normalized phone: ${phoneNumber} → ${normalizedPhone}`);

    // Get content
    let content;
    if (sourceType === 'url') {
      content = await scrapeUrl(source);
    } else {
      content = source;
      if (!content || content.trim().length < 20) {
        throw new Error('Content is too short. Please provide more information.');
      }
    }

    // Generate profile using OpenAI
    const profileContent = await generateProfileFromContent(content, sourceType);

    // Return profile data
    return {
      phoneNumber: normalizedPhone,
      profileContent,
      sourceType,
      sourceData: source
    };

  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

module.exports = {
  normalizePhoneNumber,
  scrapeUrl,
  generateProfileFromContent,
  createProfile
};
