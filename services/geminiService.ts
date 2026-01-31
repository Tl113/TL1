import { NoteData } from '../types';
import { NOTE_FREQUENCIES, MAX_NOTES } from '../constants';

const GLM_API_KEY = process.env.GLM_API_KEY || '';
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || '';

const GLM_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
const DOUBAO_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

async function glmRequest(endpoint: string, body: object) {
  const response = await fetch(`${GLM_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GLM_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`GLM API error: ${response.status}`);
  }

  return response.json();
}

async function doubaoRequest(endpoint: string, body: object) {
  const response = await fetch(`${DOUBAO_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DOUBAO_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Doubao API error: ${response.status}`);
  }

  return response.json();
}

export async function generateSilhouetteImage(prompt: string): Promise<string | null> {
  try {
    const response = await doubaoRequest('/images/generations', {
      model: 'doubao-seedream-4-5-251128',
      prompt: `A simple, elegant silhouette of a ${prompt}. Pure black shape on pure white background. Clean smooth edges. Artistic and recognizable. Centered. No gradients, solid black and white only.`,
      size: '1920x1920'
    });

    if (response.data && response.data[0]?.url) {
      return response.data[0].url;
    }

    return null;
  } catch (error) {
    console.error('Error generating silhouette image:', error);
    return null;
  }
}

export async function generateRandomMelody(prompt: string): Promise<NoteData[]> {
  try {
    const response = await glmRequest('/chat/completions', {
      model: 'glm-4-flash',
      messages: [{
        role: 'user',
        content: `Create a simple melody inspired by "${prompt}".
Return ONLY a JSON array of notes, no explanation.
Each note should have:
- "value": a number from "1" to "7" (representing Do Re Mi Fa Sol La Ti)
- "duration": duration in seconds (0.2 to 0.8)

Generate 12-${MAX_NOTES} notes that form a pleasant melody.
Example format: [{"value":"1","duration":0.4},{"value":"3","duration":0.3}]

Return ONLY the JSON array, nothing else.`
      }]
    });

    const text = response.choices?.[0]?.message?.content || '';
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
