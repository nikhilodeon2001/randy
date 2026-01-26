/**
 * Voice Preview Script
 * Generates audio samples for all Deepgram Aura voices
 */

const ttsService = require('./services/ttsService');
const fs = require('fs');
const path = require('path');

// Sample text for voice preview
const PREVIEW_TEXT = "Hi, this is Doug, Nikhil's AI assistant. How can I help you today?";

// All Deepgram Aura-2 English voices from official docs
const ALL_AURA_VOICES = [
  // Female voices
  { model: "aura-thalia-en", description: "Thalia - Default female" },
  { model: "aura-andromeda-en", description: "Andromeda - Female" },
  { model: "aura-helena-en", description: "Helena - Female" },
  { model: "aura-amalthea-en", description: "Amalthea - Female" },
  { model: "aura-asteria-en", description: "Asteria - Warm friendly female" },
  { model: "aura-athena-en", description: "Athena - Clear precise female" },
  { model: "aura-aurora-en", description: "Aurora - Female" },
  { model: "aura-callista-en", description: "Callista - Female" },
  { model: "aura-cora-en", description: "Cora - Female" },
  { model: "aura-cordelia-en", description: "Cordelia - Female" },
  { model: "aura-delia-en", description: "Delia - Female" },
  { model: "aura-electra-en", description: "Electra - Female" },
  { model: "aura-harmonia-en", description: "Harmonia - Female" },
  { model: "aura-hera-en", description: "Hera - Professional female" },
  { model: "aura-iris-en", description: "Iris - Female" },
  { model: "aura-juno-en", description: "Juno - Female" },
  { model: "aura-luna-en", description: "Luna - Expressive female" },
  { model: "aura-minerva-en", description: "Minerva - Female" },
  { model: "aura-ophelia-en", description: "Ophelia - Female" },
  { model: "aura-pandora-en", description: "Pandora - Female" },
  { model: "aura-phoebe-en", description: "Phoebe - Female" },
  { model: "aura-selene-en", description: "Selene - Female" },
  { model: "aura-stella-en", description: "Stella - Conversational female" },
  { model: "aura-theia-en", description: "Theia - Female" },
  { model: "aura-vesta-en", description: "Vesta - Female" },

  // Male voices
  { model: "aura-apollo-en", description: "Apollo - Male" },
  { model: "aura-arcas-en", description: "Arcas - Smooth male" },
  { model: "aura-aries-en", description: "Aries - Male" },
  { model: "aura-atlas-en", description: "Atlas - Male" },
  { model: "aura-draco-en", description: "Draco - Male" },
  { model: "aura-angus-en", description: "Angus - Gruff male" },
  { model: "aura-helios-en", description: "Helios - Energetic male" },
  { model: "aura-hermes-en", description: "Hermes - Male" },
  { model: "aura-hyperion-en", description: "Hyperion - Male" },
  { model: "aura-janus-en", description: "Janus - Male" },
  { model: "aura-jupiter-en", description: "Jupiter - Male" },
  { model: "aura-mars-en", description: "Mars - Male" },
  { model: "aura-neptune-en", description: "Neptune - Male" },
  { model: "aura-odysseus-en", description: "Odysseus - Male" },
  { model: "aura-orion-en", description: "Orion - Deep male" },
  { model: "aura-orpheus-en", description: "Orpheus - Narrative male" },
  { model: "aura-perseus-en", description: "Perseus - Authoritative male" },
  { model: "aura-pluto-en", description: "Pluto - Male" },
  { model: "aura-saturn-en", description: "Saturn - Male" },
  { model: "aura-zeus-en", description: "Zeus - Powerful male" }
];

async function generateVoicePreviews() {
  const previewDir = path.join(__dirname, 'voice-previews');

  // Create preview directory
  if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true });
  }

  console.log(`\n🎙️  Generating voice previews for ${ALL_AURA_VOICES.length} voices...\n`);

  const results = {
    successful: [],
    failed: []
  };

  for (const voice of ALL_AURA_VOICES) {
    try {
      console.log(`Generating: ${voice.description} (${voice.model})`);

      const result = await ttsService.generateSpeech(PREVIEW_TEXT, voice.model);

      // Move to preview directory with descriptive name
      const newFilename = `${voice.model}.mp3`;
      const newPath = path.join(previewDir, newFilename);
      fs.renameSync(result.filepath, newPath);

      results.successful.push(voice);
      console.log(`✅ ${voice.description}`);

    } catch (error) {
      results.failed.push({ voice, error: error.message });
      console.log(`❌ ${voice.description} - ${error.message}`);
    }
  }

  // Generate summary
  console.log(`\n\n📊 SUMMARY:`);
  console.log(`✅ Successful: ${results.successful.length}/${ALL_AURA_VOICES.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${ALL_AURA_VOICES.length}`);

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed voices:`);
    results.failed.forEach(({ voice, error }) => {
      console.log(`   - ${voice.model}: ${error}`);
    });
  }

  console.log(`\n🎧 Preview files saved to: ${previewDir}`);
  console.log(`\nTo listen to previews:`);
  console.log(`   open ${previewDir}`);

  // Create index.html for easy preview
  createPreviewHTML(previewDir, results.successful);
}

function createPreviewHTML(previewDir, voices) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Deepgram Voice Previews</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #fff; }
    h1 { color: #667eea; }
    .voice-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
    .voice-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 15px; }
    .voice-card h3 { margin: 0 0 10px 0; color: #667eea; }
    .voice-card p { margin: 0 0 10px 0; color: #888; font-size: 14px; }
    audio { width: 100%; margin-top: 10px; }
    .female { border-left: 3px solid #e91e63; }
    .male { border-left: 3px solid #2196f3; }
  </style>
</head>
<body>
  <h1>🎙️ Deepgram Aura Voice Previews</h1>
  <p>Sample text: "${PREVIEW_TEXT}"</p>

  <h2>Female Voices</h2>
  <div class="voice-grid">
    ${voices.filter(v => !['apollo', 'arcas', 'aries', 'atlas', 'draco', 'angus', 'helios', 'hermes', 'hyperion', 'janus', 'jupiter', 'mars', 'neptune', 'odysseus', 'orion', 'orpheus', 'perseus', 'pluto', 'saturn', 'zeus'].some(m => v.model.includes(m))).map(voice => `
    <div class="voice-card female">
      <h3>${voice.model}</h3>
      <p>${voice.description}</p>
      <audio controls>
        <source src="${voice.model}.mp3" type="audio/mpeg">
      </audio>
    </div>
    `).join('')}
  </div>

  <h2>Male Voices</h2>
  <div class="voice-grid">
    ${voices.filter(v => ['apollo', 'arcas', 'aries', 'atlas', 'draco', 'angus', 'helios', 'hermes', 'hyperion', 'janus', 'jupiter', 'mars', 'neptune', 'odysseus', 'orion', 'orpheus', 'perseus', 'pluto', 'saturn', 'zeus'].some(m => v.model.includes(m))).map(voice => `
    <div class="voice-card male">
      <h3>${voice.model}</h3>
      <p>${voice.description}</p>
      <audio controls>
        <source src="${voice.model}.mp3" type="audio/mpeg">
      </audio>
    </div>
    `).join('')}
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(previewDir, 'index.html'), html);
  console.log(`\n🌐 Created preview webpage: ${path.join(previewDir, 'index.html')}`);
}

// Run the preview generation
generateVoicePreviews().catch(console.error);
