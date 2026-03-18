import React from 'react';
import MediaCard from './MediaCard.jsx';
import { useProgress } from '../context/ProgressContext.jsx';

function computeProgressPercent(item) {
  if (!item) return 0;

  if (item.media_type === 'movie') {
    const { watched, duration } = item.progress || {};
    if (watched && duration) {
      return (watched / duration) * 100;
    }
  } else if (item.media_type === 'tv') {
    const lastEpisode = `s${item.last_season_watched}e${item.last_episode_watched}`;
    const episodeProgress = item.show_progress?.[lastEpisode];
    if (episodeProgress) {
      const { watched, duration } = episodeProgress.progress || {};
      if (watched && duration) {
        return (watched / duration) * 100;
      }
    }
  }
  return 0;
}

function ContinueWatchingRow() {
  const { progressItems, metadataById } = useProgress();
  const scrollRef = React.useRef(null);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const amount =
        direction === 'left' ? -current.offsetWidth : current.offsetWidth;
      current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  if (!progressItems || progressItems.length === 0) return null;

  const merged = progressItems
    .map((p) => {
      const meta = metadataById?.[p.id] || {};
      const progressPercent = computeProgressPercent({
        ...p,
        ...meta,
      });

      if (progressPercent < 1 || progressPercent > 95) return null;

      return {
        id: p.id,
        progressPercent,
        item: {
          id: p.id,
          title: meta.title,
          name: meta.title,
          poster_path: meta.poster_path,
          backdrop_path: meta.backdrop_path,
          media_type: meta.media_type,
          last_season_watched: p.last_season_watched,
          last_episode_watched: p.last_episode_watched,
        }
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.last_updated || 0) - (a.last_updated || 0));

  if (!merged.length) return null;

  return (
    <section className="group relative">
      <div className="mx-auto w-full max-w-7xl px-4 pb-4 pt-7 md:px-10 md:pb-6">
        <h2 className="aura-section-title mb-3">Continue watching</h2>

        <div className="relative">
          <div
            ref={scrollRef}
            className="no-scrollbar flex gap-4 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory"
          >
            {merged.map((entry) => (
              <div key={entry.id} className="snap-start">
                <MediaCard
                  item={{
                    ...entry.item,
                    backdrop_path: entry.item.backdrop_path
                  }}
                  mediaType={entry.item.media_type}
                  layoutType="landscape"
                  progressPercent={entry.progressPercent ?? 5}
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
      </div>
    </section>
  );
}

export default ContinueWatchingRow;

