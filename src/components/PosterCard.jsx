import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../api/tmdb.js';
import { useProgress } from '../context/ProgressContext.jsx';
import { useMyList } from '../context/MyListContext.jsx';

function PosterCard({ item, mediaType, size = 'md', progressPercent }) {
  const navigate = useNavigate();
  const { upsertMetadata, progressItems } = useProgress();
  const { isInMyList, toggleMyList } = useMyList();

  const title = item.title || item.name || 'Untitled';
  const poster = getImageUrl(item.poster_path, 'w342');
  const typeLabel = (mediaType || item.media_type || (item.title ? 'movie' : 'tv')) === 'movie' ? 'MOVIE' : 'TV SHOW';
  const rating = typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : null;

  const sizeClasses =
    size === 'lg'
      ? 'h-64 w-44 md:h-80 md:w-56'
      : size === 'sm'
        ? 'h-32 w-24 md:h-36 md:w-28'
        : 'h-40 w-28 md:h-52 md:w-36';

  const handleClick = () => {
    const id = item.id;
    const type = mediaType || item.media_type || (item.title ? 'movie' : 'tv');

    upsertMetadata(String(id), {
      id,
      title,
      poster_path: item.poster_path,
      media_type: type
    });

    if (type === 'movie') {
      navigate(`/movie/${id}`);
    } else {
      const entry = progressItems?.find((p) => String(p.id) === String(id));
      const season = entry?.last_season_watched;
      const episode = entry?.last_episode_watched;

      if (typeof season === 'number' && typeof episode === 'number') {
        navigate(`/tv/${id}/season/${season}/episode/${episode}`);
      } else {
        navigate(`/tv/${id}/season/1/episode/1`);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`group relative flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900/40 ring-1 ring-white/10 transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] ${sizeClasses}`}
    >
      {poster ? (
        <img
          src={poster}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-xs text-gray-300">
          {title}
        </div>
      )}

      {/* Clean default state – artwork only. Hover reveals metadata and controls. */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      </div>

      <div className="absolute inset-x-2 bottom-2 translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <span className="inline-flex rounded bg-black/70 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-gray-100 ring-1 ring-white/10 backdrop-blur">
              {typeLabel}
            </span>
            {rating && (
              <p className="text-[0.7rem] text-gray-200">{rating} rating</p>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMyList(item);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/90 ring-1 ring-white/10 backdrop-blur transition hover:bg-black/80"
            aria-label={isInMyList(item.id) ? 'Remove from My List' : 'Add to My List'}
          >
            {isInMyList(item.id) ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.45-12.675a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {typeof progressPercent === 'number' && progressPercent > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
          <div
            className="h-full bg-aura-red"
            style={{
              width: `${Math.min(progressPercent, 100)}%`
            }}
          />
        </div>
      )}
    </div>
  );
}

export default PosterCard;

