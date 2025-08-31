console.log("Headers:", {
  'Ocp-Apim-Subscription-Key': VISION_KEY,
  'Content-Type': 'application/octet-stream'
});

import axios from 'axios';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';


const VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT!;
const VISION_KEY = process.env.AZURE_VISION_KEY!;
const VISION_API_VERSION = process.env.AZURE_VISION_API_VERSION || '2024-02-01';


const SPEECH_KEY = process.env.AZURE_SPEECH_KEY!;
const SPEECH_REGION = process.env.AZURE_SPEECH_REGION!;
const SPEECH_VOICE = process.env.AZURE_SPEECH_VOICE || 'fr-FR-DeniseNeural';
const SPEECH_FORMAT = process.env.AZURE_SPEECH_FORMAT || 'audio-16khz-32kbitrate-mono-mp3';


export async function analyzeImage(buffer: Buffer, language = 'fr') {
  const VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT!;
  const VISION_KEY = process.env.AZURE_VISION_KEY!;
  const VISION_API_VERSION = '2024-02-01';

  if (!VISION_ENDPOINT) throw new Error("AZURE_VISION_ENDPOINT manquant !");
  if (!VISION_KEY) throw new Error("AZURE_VISION_KEY manquant !");

  const features = 'Objects,Tags,Caption';
  const url = `${VISION_ENDPOINT}/computervision/imageanalysis:analyze?api-version=${VISION_API_VERSION}&features=${features}&language=${language}`;

  console.log("URL:", url);
  console.log("Image size:", buffer.length);
  console.log(url);
  console.log(buffer.length);


  const response = await axios.post(url, buffer, {
    headers: {
      'Ocp-Apim-Subscription-Key': VISION_KEY,
      'Content-Type': 'application/octet-stream'
    }
  });

  return response.data;
}

export function extractVisionResult(data: any) {
const res: import('./types').VisionResult = { raw: data };


// Caption
const captionText = data?.captionResult?.text ?? data?.captionResult?.[0]?.text;
const captionConf = data?.captionResult?.confidence ?? data?.captionResult?.[0]?.confidence;
if (captionText) {
res.caption = { text: captionText, confidence: captionConf };
}


// Tags
const tags = data?.tagsResult?.values ?? data?.tagsResult?.[0]?.tags ?? data?.tags ?? [];
if (Array.isArray(tags)) {
res.tags = tags.map((t: any) => ({ name: t.name ?? t.tag, confidence: t.confidence }));
}


// Objects
const objects = data?.objectsResult?.values ?? data?.objects ?? [];
if (Array.isArray(objects)) {
res.objects = objects.map((o: any) => ({ name: o?.tags?.[0]?.name ?? o?.name ?? 'objet', confidence: o?.confidence }));
}


return res;
}


export async function synthesizeSpeech(text: string): Promise<Buffer> {
const speechConfig = sdk.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
speechConfig.speechSynthesisVoiceName = SPEECH_VOICE;
speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat[SPEECH_FORMAT as keyof typeof sdk.SpeechSynthesisOutputFormat] ?? sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;


return new Promise((resolve, reject) => {
const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
const synthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined /* no speaker in server */);


synthesizer.speakTextAsync(
text,
(result) => {
const audioData = Buffer.from(result.audioData);
synthesizer.close();
resolve(audioData);
},
(err) => {
synthesizer.close();
reject(err);
}
);
});
}