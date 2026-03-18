import React from 'react';
import MediaCard from './MediaCard.jsx';
import { discoverByProvider, discoverByGenre } from '../api/tmdb.js';

function MediaRow({ title, providerId, mediaType, with_genres, with_networks, layoutType = 'portrait' }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const scrollRef = React.useRef(null);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        let results;
        if (with_genres) {
          results = await discoverByGenre({ mediaType, with_genres });
        } else {
          results = await discoverByProvider({ providerId, mediaType, with_networks });
        }
        if (!active) return;
        setItems(results.slice(0, 18));
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [providerId, mediaType, with_genres, with_networks]);

  return (
    <section className="group relative">
      <div className="mx-auto w-full max-w-7xl px-4 pb-6 pt-5 md:px-10 md:pb-8">
        <h2 className="aura-section-title mb-3">{title}</h2>

      {loading && (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-40 w-28 flex-shrink-0 animate-pulse rounded-lg bg-zinc-800/70 ring-1 ring-white/5 md:h-52 md:w-36"
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-red-400">Unable to load: {error}</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="relative">
          <div
            ref={scrollRef}
            className="no-scrollbar flex gap-3 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory"
          >
            {items.map((item) => (
              <div key={item.id} className="snap-start">
                <MediaCard
                  item={item}
                  mediaType={mediaType}
                  layoutType={layoutType}
                />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-black/70 via-black/20 to-transparent opacity-0 transition group-hover:opacity-100 md:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-black/70 via-black/20 to-transparent opacity-0 transition group-hover:opacity-100 md:block" />

          <div className="absolute inset-y-0 left-0 hidden items-center pl-2 opacity-0 transition group-hover:opacity-100 md:flex">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="aura-icon-button"
              aria-label="Scroll left"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <div className="absolute inset-y-0 right-0 hidden items-center pr-2 opacity-0 transition group-hover:opacity-100 md:flex">
            <button
              type="button"
              onClick={() => scroll('right')}
              className="aura-icon-button"
              aria-label="Scroll right"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}

export default MediaRow;

