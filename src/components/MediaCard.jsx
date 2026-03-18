import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../api/tmdb.js';
import { useProgress } from '../context/ProgressContext.jsx';
import { useMyList } from '../context/MyListContext.jsx';

function getMediaType(item, mediaTypeOverride) {
  return (
    mediaTypeOverride ||
    item.media_type ||
    (item.title ? 'movie' : 'tv')
  );
}

function MediaCard({
  item,
  mediaType,
  layoutType = 'portrait', // 'portrait' | 'landscape'
  progressPercent
}) {
  const navigate = useNavigate();
  const { upsertMetadata, progressItems } = useProgress();
  const { isInMyList, toggleMyList } = useMyList();
  const [isHoverNone, setIsHoverNone] = React.useState(false);
  const [revealOnTouch, setRevealOnTouch] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia?.('(hover: none)');
    if (!mql) return;
    const update = () => setIsHoverNone(mql.matches);
    update();
    if (mql.addEventListener) mql.addEventListener('change', update);
    else mql.addListener(update);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', update);
      else mql.removeListener(update);
    };
  }, []);

  React.useEffect(() => {
    if (!isHoverNone) return;
    if (!revealOnTouch) return;

    const t = window.setTimeout(() => setRevealOnTouch(false), 6500);
    return () => window.clearTimeout(t);
  }, [isHoverNone, revealOnTouch]);

  if (!item) return null;

  const type = getMediaType(item, mediaType);
  const title = item.title || item.name || 'Untitled';

  const imagePath =
    layoutType === 'landscape'
      ? item.backdrop_path || item.poster_path
      : item.poster_path || item.backdrop_path;

  const image = getImageUrl(imagePath, layoutType === 'landscape' ? 'w780' : 'w342');

  const sizeClasses =
    layoutType === 'landscape'
      ? 'h-36 w-64 md:h-40 md:w-72'
      : 'h-40 w-28 md:h-52 md:w-36';

  const goToDetails = () => {
    upsertMetadata(String(item.id), {
      id: item.id,
      title,
      poster_path: item.poster_path,
      media_type: type
    });

    if (type === 'movie') {
      navigate(`/movie/${item.id}`);
      return;
    }

    const entry = progressItems?.find((p) => String(p.id) === String(item.id));
    const season = entry?.last_season_watched;
    const episode = entry?.last_episode_watched;

    if (typeof season === 'number' && typeof episode === 'number') {
      navigate(`/tv/${item.id}/season/${season}/episode/${episode}`);
    } else {
      navigate(`/tv/${item.id}/season/1/episode/1`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToDetails();
    }
  };

  const handleCardClick = (e) => {
    if (isHoverNone && !revealOnTouch) {
      e.preventDefault();
      e.stopPropagation();
      setRevealOnTouch(true);
      return;
    }
    goToDetails();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`group relative flex-shrink-0 overflow-hidden rounded-xl bg-aura-surface/30 ring-1 ring-white/10 transition-all duration-300 ease-max hover:scale-105 active:scale-105 hover:z-20 hover:shadow-cinematic-lg ${sizeClasses}`}
    >
      {image ? (
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-aura-surface2 text-xs text-aura-muted">
          {title}
        </div>
      )}

      {/* Clean default: no text. Hover reveal only */}
      <div
        className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-max group-hover:opacity-100 ${
          revealOnTouch ? 'opacity-100' : ''
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      <div
        className={`absolute inset-x-2 bottom-2 translate-y-2 opacity-0 transition-all duration-300 ease-max group-hover:translate-y-0 group-hover:opacity-100 ${
          revealOnTouch ? 'translate-y-0 opacity-100' : ''
        }`}
      >
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{title}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToDetails();
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-cinematic transition hover:bg-white/90"
              aria-label="Play"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMyList(item);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/15 backdrop-blur-xl transition hover:bg-black/70"
              aria-label={isInMyList(item.id) ? 'Remove from My List' : 'Add to My List'}
            >
              {isInMyList(item.id) ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.45-12.675a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {typeof progressPercent === 'number' && progressPercent > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
          <div
            className="h-full bg-aura-red"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default MediaCard;

