import { GoogleGenAI, Type } from "@google/genai";
import { StoredImage } from '../types.ts';
import { getGalleryImages } from './imageStore.ts';

/**
 * Uses the Gemini API to find the most relevant image from the available galleries
 * based on a given textual context (e.g., a case study description).
 *
 * @param contextText The text to find a relevant image for.
 * @returns A promise that resolves to the most relevant StoredImage object or null if none is found.
 */
export const findRelevantImage = async (contextText: string): Promise<StoredImage | null> => {
  const allImages = await getGalleryImages();

  if (allImages.length === 0 || !contextText) {
    return null;
  }

  // Create a lightweight version of images for the prompt to save tokens
  const imageMetadata = allImages.map(({ id, title, description, tags, category }) => ({ id, title, description, tags: tags || [], category }));

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      You are an expert pathologist's assistant. Your task is to select the most relevant histology image for a given clinical case description from a provided list of images.
      The context is: "${contextText}"
      
      Here is a list of available images in JSON format:
      ${JSON.stringify(imageMetadata)}

      Based on the context, identify the single best image from the list that illustrates the key pathological findings described. The image title, description, and tags are your primary clues. Tags are especially important for matching specific pathologies.
      Respond with a single JSON object containing the ID of the best matching image. The format should be: {"imageId": "the_best_image_id"}. If no image is a good match, respond with {"imageId": null}.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    imageId: { 
                        type: Type.STRING,
                        nullable: true
                    },
                },
                required: ["imageId"],
            }
        }
    });
    
    const result = JSON.parse(response.text.trim()) as { imageId: string | null };

    if (result.imageId) {
      const foundImage = allImages.find(img => img.id === result.imageId);
      return foundImage || null;
    }

    return null;
  } catch (error) {
    console.error("AI Image Selector failed:", error);
    // Don't propagate the error to the UI, just fail gracefully by returning null.
    return null;
  }
};