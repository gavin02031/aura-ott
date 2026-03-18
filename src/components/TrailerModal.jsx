import React from 'react';
import { getTrailer } from '../api/kinocheck.js';

function TrailerModal({ item, onClose }) {
  const [trailer, setTrailer] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const trailerData = await getTrailer(item.id, item.media_type);
        if (!active) return;
        setTrailer(trailerData);
        if (!trailerData) {
          setError('No trailer found on KinoCheck.');
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load trailer.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [item]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-aura-bg bg-opacity-85 px-2 py-4 backdrop-blur-xl">
      <div className="relative flex h-full w-full max-w-4xl flex-col rounded-xl bg-aura-surface bg-opacity-90 shadow-cinematic-lg ring-1 ring-white ring-opacity-10 md:h-[70vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black bg-opacity-50 p-2 text-sm text-white text-opacity-80 ring-1 ring-white ring-opacity-10 hover:bg-opacity-70 hover:text-opacity-100"
        >
          ✕
        </button>

        <div className="relative aspect-video w-full bg-black">
          {loading && (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-300">
              Loading trailer...
            </div>
          )}

          {!loading && error && (
            <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && trailer && (
            <iframe
              title={`${item.title || item.name} trailer`}
              src={`https://www.youtube.com/embed/${trailer.youtube_video_id}?autoplay=1&rel=0`}
              allow="autoplay; fullscreen"
              className="h-full w-full border-none"
            />
          )}
        </div>

        <div className="border-t border-white border-opacity-10 px-4 py-3 text-sm text-white text-opacity-80">
          <span className="font-semibold">{item.title || item.name}</span> — Official Trailer
        </div>
      </div>
    </div>
  );
}

export default TrailerModal;

