const TMDB_API_KEY =
  import.meta.env.VITE_TMDB_API_KEY || '9587255bc09a55af1b368eabf8e9e314';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function fetchFromTMDB(path, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${path}`);

  url.searchParams.set('api_key', TMDB_API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const res = await fetch(url.toString());

  if (!res.ok) {
    console.error('TMDB error', res.status, res.statusText);
    throw new Error('Failed to fetch from TMDB');
  }

  return res.json();
}

export async function getTrendingHero() {
  const data = await fetchFromTMDB('/trending/all/week', {
    include_adult: 'false',
    language: 'en-US'
  });

  if (!data.results?.length) return null;

  const idx = Math.floor(Math.random() * data.results.length);
  return data.results[idx];
}

export async function discoverByProvider({ providerId, mediaType, with_networks }) {
  const path = mediaType === 'tv' ? '/discover/tv' : '/discover/movie';

  const data = await fetchFromTMDB(path, {
    watch_region: 'US',
    with_watch_providers: String(providerId),
    with_networks,
    include_adult: 'false',
    sort_by: 'popularity.desc',
    language: 'en-US'
  });

  return data.results || [];
}

export async function searchAll(query) {
  const data = await fetchFromTMDB('/search/multi', {
    query: query,
    include_adult: 'false',
    language: 'en-US'
  });

  return data.results || [];
}

export async function discoverByGenre({ mediaType, with_genres }) {
  const path = mediaType === 'tv' ? '/discover/tv' : '/discover/movie';

  const data = await fetchFromTMDB(path, {
    with_genres,
    include_adult: 'false',
    sort_by: 'popularity.desc',
    language: 'en-US'
  });

  return data.results || [];
}

export async function getMovieDetails(id) {
  return fetchFromTMDB(`/movie/${id}`, {
    language: 'en-US',
    append_to_response: 'credits'
  });
}

export async function getTvDetails(id) {
  return fetchFromTMDB(`/tv/${id}`, {
    language: 'en-US',
    append_to_response: 'credits'
  });
}

export async function getTvSeason(id, seasonNumber) {
  return fetchFromTMDB(`/tv/${id}/season/${seasonNumber}`, {
    language: 'en-US'
  });
}

export async function getMovieKeywords(id) {
  const data = await fetchFromTMDB(`/movie/${id}/keywords`);
  // movie keywords shape: { id, keywords: [{ id, name }] }
  return data.keywords || [];
}

export async function getTvKeywords(id) {
  const data = await fetchFromTMDB(`/tv/${id}/keywords`);
  // tv keywords shape: { id, results: [{ id, name }] }
  return data.results || [];
}

export async function getSimilarMovies(id) {
  const data = await fetchFromTMDB(`/movie/${id}/similar`, {
    language: 'en-US'
  });
  return data.results || [];
}

export async function getSimilarTv(id) {
  const data = await fetchFromTMDB(`/tv/${id}/similar`, {
    language: 'en-US'
  });
  return data.results || [];
}

export async function discoverAdvanced({
  mediaType,
  with_genres,
  with_keywords,
  without_genres,
  vote_count_gte,
  vote_average_gte
}) {
  const path = mediaType === 'tv' ? '/discover/tv' : '/discover/movie';

  const params = {
    include_adult: 'false',
    sort_by: 'popularity.desc',
    language: 'en-US'
  };

  if (with_genres) params.with_genres = with_genres;
  if (with_keywords) params.with_keywords = with_keywords;
  if (without_genres) params.without_genres = without_genres;
  if (vote_count_gte) params['vote_count.gte'] = String(vote_count_gte);
  if (vote_average_gte) params['vote_average.gte'] = String(vote_average_gte);

  const data = await fetchFromTMDB(path, params);
  return data.results || [];
}

export const getImageUrl = (path, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

