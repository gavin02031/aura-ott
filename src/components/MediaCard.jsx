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
  const [imageLoaded, setImageLoaded] = React.useState(false);

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
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

  const imagePath =
    layoutType === 'landscape'
      ? item.backdrop_path || item.poster_path
      : item.poster_path || item.backdrop_path;

  const image = getImageUrl(imagePath, layoutType === 'landscape' ? 'w780' : 'w342');

  const sizeClasses =
    layoutType === 'landscape'
      ? 'h-40 w-72 md:h-48 md:w-80'
      : 'h-52 w-36 md:h-[17rem] md:w-[11.5rem]';

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

  const isRevealed = revealOnTouch;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`aura-card cursor-pointer ${sizeClasses}`}
    >
      {/* Shine sweep on hover */}
      <div className="aura-card-shine" />

      {/* Image */}
      {image ? (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 aura-skeleton" />
          )}
          <img
            src={image}
            alt={title}
            className={`h-full w-full object-cover transition-all duration-700 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-aura-surface2 text-xs text-aura-muted">
          {title}
        </div>
      )}

      {/* Rating badge */}
      {rating && (
        <div className={`absolute top-2 right-2 z-10 aura-rating-badge transition-all duration-300 ${
          isRevealed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <svg className="h-3 w-3 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-white/90">{rating}</span>
        </div>
      )}

      {/* Hover overlay gradient */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ease-max ${
          isRevealed ? 'opacity-100' : 'opacity-0'
        } group-hover:opacity-100`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      {/* Hover content */}
      <div
        className={`absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 transition-all duration-500 ease-max ${
          isRevealed ? 'translate-y-0 opacity-100' : ''
        } group-hover:translate-y-0 group-hover:opacity-100`}
      >
        <div className="space-y-2">
          {/* Title & year */}
          <div>
            <p className="truncate text-sm font-bold text-white leading-tight">{title}</p>
            {year && <p className="text-[0.65rem] text-white/50 mt-0.5">{year}</p>}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToDetails();
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-glow-white"
              aria-label="Play"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 ml-0.5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMyList(item);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.12] text-white ring-1 ring-white/[0.15] backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.22] hover:scale-110"
              aria-label={isInMyList(item.id) ? 'Remove from My List' : 'Add to My List'}
            >
              {isInMyList(item.id) ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.45-12.675a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {typeof progressPercent === 'number' && progressPercent > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(progressPercent, 100)}%`,
              background: 'linear-gradient(90deg, #E50914 0%, #FF6B6B 100%)'
            }}
          />
        </div>
      )}
    </div>
  );
}

export default MediaCard;
