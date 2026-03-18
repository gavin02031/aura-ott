const GEMINI_API_KEY = 'AIzaSyDolUrIH66i2j9vcXmXPLb-tVJ7u3V0j70';
const GEMINI_MODEL = 'models/gemini-1.5-flash';

export async function getPreferredGenresFromGemini(likedItems) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    'You are helping a streaming app choose genres for personalized recommendations.\n' +
                    'You will receive a JSON array of titles the user really likes, each with these fields: title, mediaType, genres (array of genre names), overview.\n' +
                    'From this, infer which broad genres the user seems to prefer.\n' +
                    'Only choose from this fixed list of genre names exactly as written:\n' +
                    '["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "TV Movie", "Thriller", "War", "Western"]\n' +
                    'Return a compact JSON object with this shape and nothing else:\n' +
                    '{ "preferredGenres": [<up to 5 names from the list>], "avoidGenres": [<optional names from the list>]}'
                },
                {
                  text: `Liked items JSON:\n${JSON.stringify(likedItems).slice(
                    0,
                    6000
                  )}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 256
          }
        })
      }
    );

    if (!res.ok) {
      console.error('Gemini error', res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!text) return null;

    const match = text.match(/\{[\s\S]*\}/);
    const jsonStr = match ? match[0] : text;
    try {
      return JSON.parse(jsonStr);
    } catch {
      console.warn('Failed to parse Gemini JSON, raw:', text);
      return null;
    }
  } catch (err) {
    console.error('Gemini request failed', err);
    return null;
  }
}

