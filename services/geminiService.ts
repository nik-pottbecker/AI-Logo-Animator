import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from '../types';

// FIX: Removed duplicate global declaration for `window.aistudio` to resolve type conflicts.
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API_KEY environment variable not set.");
  }
  return key;
};

export const generateLogo = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: `A professional, modern, minimalist logo for a company. The logo should be based on the following description: "${prompt}". The logo should be on a clean, solid background.`,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: '1:1',
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    return response.generatedImages[0].image.imageBytes;
  }
  
  throw new Error("Image generation failed or returned no images.");
};

export const animateLogo = async (
  imageData: string,
  mimeType: string,
  aspectRatio: AspectRatio
): Promise<string> => {
  // Create a new instance right before the call to ensure the latest key is used.
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: 'Animate this logo with a subtle, professional, and engaging motion. The animation should be clean and elegant.',
    image: {
      imageBytes: imageData,
      mimeType: mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio,
    }
  });

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("Video generation did not return a valid download link.");
  }

  const videoResponse = await fetch(`${downloadLink}&key=${getApiKey()}`);
  if (!videoResponse.ok) {
    throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
  }
  const videoBlob = await videoResponse.blob();
  return URL.createObjectURL(videoBlob);
};