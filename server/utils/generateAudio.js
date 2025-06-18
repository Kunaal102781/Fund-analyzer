const fs = require('fs');
const util = require('util');
const path = require('path');
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

exports.generateAudio = async (text, userId) => {
  const request = {
    input: { text },
    voice: { languageCode: 'en-US', ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3' }
  };

  const [response] = await client.synthesizeSpeech(request);
  const filePath = path.join(__dirname, `../audios/${userId}_${Date.now()}.mp3`);
  await util.promisify(fs.writeFile)(filePath, response.audioContent, 'binary');

  return filePath; // You can also host it and return a public URL
};
