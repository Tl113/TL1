import { GoogleGenAI, Modality } from '@google/genai';
import { NoteData } from '../types';
import { NOTE_FREQUENCIES, MAX_NOTES } from '../constants';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateSilhouetteImage(prompt: string): Promise<string | null> {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate a simple, elegant silhouette image of a ${prompt}.
                 The silhouette should be:
                 - Pure black shape on pure white background
                 - Clean, smooth edges
                 - Artistic and recognizable
                 - Centered in the image
                 - No gradients, just solid black and white`
        }]
      }],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      }
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          const base64Data = part.inlineData.data;
          return `data:${part.inlineData.mimeType};base64,${base64Data}`;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error generating silhouette image:', error);
    return null;
  }
}

export async function generateRandomMelody(prompt: string): Promise<NoteData[]> {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{
        role: 'user',
        parts: [{
          text: `Create a simple melody inspired by "${prompt}".
                 Return ONLY a JSON array of notes, no explanation.
                 Each note should have:
                 - "value": a number from "1" to "7" (representing Do Re Mi Fa Sol La Ti)
                 - "duration": duration in seconds (0.2 to 0.8)

                 Generate 12-${MAX_NOTES} notes that form a pleasant melody.
                 Example format: [{"value":"1","duration":0.4},{"value":"3","duration":0.3}]

                 Return ONLY the JSON array, nothing else.`
        }]
      }]
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((note: { value: string; duration: number }) => ({
        value: String(note.value),
        frequency: NOTE_FREQUENCIES[note.value] || NOTE_FREQUENCIES["1"],
        duration: note.duration || 0.4
      }));
    }

    return generateDefaultMelody();
  } catch (error) {
    console.error('Error generating melody:', error);
    return generateDefaultMelody();
  }
}

function generateDefaultMelody(): NoteData[] {
  const notes = ["1", "3", "5", "6", "5", "3", "1", "2", "4", "6", "5", "3"];
  return notes.map(value => ({
    value,
    frequency: NOTE_FREQUENCIES[value],
    duration: 0.3 + Math.random() * 0.3
  }));
}
