import React from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAll } from '../api/tmdb.js';
import MediaCard from '../components/MediaCard.jsx';

function formatTypeLabel(mediaType) {
  if (mediaType === 'tv') return 'TV Show';
  if (mediaType === 'movie') return 'Movie';
  return 'Title';
}

function Search({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!open || !query.trim()) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const searchResults = await searchAll(query.trim());
        if (!active) return;
        setResults(searchResults);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load search results');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [open, query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
  };

  const handleClear = () => {
    setQuery('');
  };

  const handleItemClick = (item) => {
    const isMovie = item.media_type === 'movie';
    if (isMovie) {
      navigate(`/movie/${item.id}`);
    } else {
      navigate(`/tv/${item.id}/season/1/episode/1`);
    }
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-aura-bg bg-opacity-90 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-4 pt-10 md:px-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-white">
            Search
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="aura-icon-button"
            aria-label="Close search"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="flex items-center gap-3 border-b border-white border-opacity-10 pb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-6 w-6 text-white text-opacity-70"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75 19.5 19.5" />
              <circle cx="11" cy="11" r="6" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Search movies, shows, genres…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-xl font-medium text-white placeholder:text-aura-muted outline-none md:text-3xl"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="text-sm font-medium text-white text-opacity-70 hover:text-opacity-100"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 flex-1 overflow-y-auto pb-10">
          {loading && (
            <div className="pt-6 text-sm text-aura-muted">Searching…</div>
          )}
          {error && !loading && (
            <div className="pt-6 text-sm text-aura-red">{error}</div>
          )}

          {!loading && !error && query.trim() && results.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {results
                .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
                .slice(0, 48)
                .map((item) => (
                  <div
                    key={`${item.media_type}-${item.id}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <MediaCard
                      item={item}
                      mediaType={item.media_type}
                      layoutType="portrait"
                    />
                  </div>
                ))}
            </div>
          )}

          {!loading && !error && query.trim() && results.length === 0 && (
            <div className="pt-6 text-sm text-aura-muted">
              No results found for “{query}”.
            </div>
          )}

          {!query.trim() && (
            <div className="pt-8 text-sm text-aura-muted">
              Start typing to search across movies and TV.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Search;
