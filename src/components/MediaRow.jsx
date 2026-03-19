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
<<<<<<< HEAD
    <section className="group/row relative">
      <div className="mx-auto w-full max-w-7xl px-4 pb-6 pt-5 md:px-10 md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="aura-section-title">{title}</h2>
          {!loading && items.length > 0 && (
            <span className="text-[0.65rem] font-medium text-white/30 tracking-widest uppercase">
              {items.length} titles
            </span>
          )}
        </div>

      {loading && (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-52 w-36 flex-shrink-0 aura-skeleton ring-1 ring-white/5 md:h-[17rem] md:w-[11.5rem]"
              style={{ animationDelay: `${idx * 0.1}s` }}
=======
    <section className="group relative">
      <div className="mx-auto w-full max-w-7xl px-4 pb-6 pt-5 md:px-10 md:pb-8">
        <h2 className="aura-section-title mb-3">{title}</h2>

      {loading && (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-40 w-28 flex-shrink-0 animate-pulse rounded-lg bg-zinc-800/70 ring-1 ring-white/5 md:h-52 md:w-36"
>>>>>>> 5ec29865a04809525563001a85cf81720ec3dff0
            />
          ))}
        </div>
      )}

      {error && !loading && (
<<<<<<< HEAD
        <p className="text-sm text-red-400/80">Unable to load: {error}</p>
=======
        <p className="text-sm text-red-400">Unable to load: {error}</p>
>>>>>>> 5ec29865a04809525563001a85cf81720ec3dff0
      )}

      {!loading && !error && items.length > 0 && (
        <div className="relative">
          <div
            ref={scrollRef}
<<<<<<< HEAD
            className="no-scrollbar flex gap-3 overflow-x-auto pb-2 scroll-smooth"
=======
            className="no-scrollbar flex gap-3 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory"
>>>>>>> 5ec29865a04809525563001a85cf81720ec3dff0
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

<<<<<<< HEAD
          {/* Edge fade gradients */}
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-20 bg-gradient-to-r from-aura-bg to-transparent opacity-0 transition-opacity duration-300 group-hover/row:opacity-100 md:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-20 bg-gradient-to-l from-aura-bg to-transparent opacity-0 transition-opacity duration-300 group-hover/row:opacity-100 md:block" />

          {/* Scroll buttons */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-1 opacity-100 transition-all duration-300 md:opacity-0 md:group-hover/row:opacity-100">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="aura-icon-button h-9 w-9"
              aria-label="Scroll left"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
=======
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-black/70 via-black/20 to-transparent opacity-0 transition group-hover:opacity-100 md:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-black/70 via-black/20 to-transparent opacity-0 transition group-hover:opacity-100 md:block" />

          <div className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
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
>>>>>>> 5ec29865a04809525563001a85cf81720ec3dff0
              </svg>
            </button>
          </div>

<<<<<<< HEAD
          <div className="absolute inset-y-0 right-0 flex items-center pr-1 opacity-100 transition-all duration-300 md:opacity-0 md:group-hover/row:opacity-100">
            <button
              type="button"
              onClick={() => scroll('right')}
              className="aura-icon-button h-9 w-9"
              aria-label="Scroll right"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
=======
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
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
>>>>>>> 5ec29865a04809525563001a85cf81720ec3dff0
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
<<<<<<< HEAD
=======

>>>>>>> 5ec29865a04809525563001a85cf81720ec3dff0
