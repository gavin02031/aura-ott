const KINOCHECK_BASE_URL = 'https://api.kinocheck.com/';

async function fetchFromKinoCheck(endpoint, params = {}) {
  const url = new URL(`${KINOCHECK_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    const error = await res.json();
    console.error('KinoCheck error', error);
    throw new Error(error.message || 'Failed to fetch from KinoCheck');
  }

  return res.json();
}

export async function getTrailer(tmdbId, mediaType) {
  const endpoint = mediaType === 'tv' ? 'shows' : 'movies';
  const data = await fetchFromKinoCheck(endpoint, { tmdb_id: tmdbId, language: 'en' });
  return data.trailer || null;
}
