import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../api/tmdb.js';
import { useProgress } from '../context/ProgressContext.jsx';
import { useMyList } from '../context/MyListContext.jsx';
import HeroTrailer from './HeroTrailer.jsx';

function HeroBanner({ item, onWatchTrailer, onHoverChange }) {
  const navigate = useNavigate();
  const { upsertMetadata, progressItems } = useProgress();
  const { isInMyList, toggleMyList } = useMyList();
  const [isHovering, setIsHovering] = React.useState(false);
  const [isHoverNone, setIsHoverNone] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    setIsVisible(false);
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timeout);
  }, [item]);

  React.useEffect(() => {
    const mql = window.matchMedia?.('(hover: none)');
    if (!mql) return;

    const update = () => setIsHoverNone(mql.matches);
    update();

    // Safari uses addListener; others use addEventListener.
    if (mql.addEventListener) mql.addEventListener('change', update);
    else mql.addListener(update);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', update);
      else mql.removeListener(update);
    };
  }, []);

  // Keep rotation paused while trailer preview is active on touch devices.
  React.useEffect(() => {
    if (!isHoverNone) return;
    onHoverChange?.(previewOpen);
  }, [isHoverNone, previewOpen, onHoverChange]);

  React.useEffect(() => {
    if (!isHoverNone || !previewOpen) return;

    const t = window.setTimeout(() => setPreviewOpen(false), 8000);
    return () => window.clearTimeout(t);
  }, [isHoverNone, previewOpen]);

  if (!item) return null;

  const title = item.title || item.name || 'Untitled';
  const overview = item.overview || '';
  const isMovie = !!item.title;
  const year =
    (item.release_date || item.first_air_date || '').slice(0, 4) || '—';

  const backdrop = getImageUrl(
    item.backdrop_path || item.poster_path,
    'w1280'
  );

  const showPreview = isHoverNone ? previewOpen : isHovering;

  const handlePlay = () => {
    const id = item.id;
    const mediaType = isMovie ? 'movie' : 'tv';

    upsertMetadata(String(id), {
      id,
      title,
      poster_path: item.poster_path,
      media_type: mediaType
    });

    if (isMovie) {
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

  return (
    <section 
      className={`relative h-[85vh] min-h-[520px] w-full overflow-hidden bg-aura-bg text-white transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onMouseEnter={() => {
        if (isHoverNone) return;
        setIsHovering(true);
        onHoverChange?.(true);
      }}
      onMouseLeave={() => {
        if (isHoverNone) return;
        setIsHovering(false);
        onHoverChange?.(false);
      }}
      onPointerDown={(e) => {
        // On touch devices, "hover preview" should be driven by a tap.
        if (!isHoverNone) return;
        const target = e.target;
        if (target && typeof target.closest === 'function' && target.closest('button')) return;
        setPreviewOpen(true);
      }}
    >
      <div className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${showPreview ? 'opacity-0' : 'opacity-100'}`}>
        {backdrop ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backdrop})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-aura-surface via-black to-aura-bg" />
        )}
        {/* Max-style multi-stop mask */}
        <div className="absolute inset-0 bg-gradient-to-t from-aura-bg via-aura-bg/60 to-transparent" />
        {/* left vignette for legibility */}
        <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_20%_40%,rgba(10,14,23,0.92)_0%,rgba(10,14,23,0.55)_35%,rgba(10,14,23,0)_70%)]" />
      </div>

      {showPreview && (
        <HeroTrailer item={item} isMuted={isMuted} controls={isHoverNone} />
      )}

      <div className="relative z-10 flex h-full items-end">
        <div className="flex w-full max-w-4xl flex-col gap-5 px-6 pb-12 md:px-24 md:pb-16">
          <div className="max-w-2xl space-y-4">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/90 ring-1 ring-white/10 backdrop-blur-xl">
              AURA ORIGINAL
            </p>

            <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.02em] text-white drop-shadow md:text-7xl">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-aura-muted">
              {year && <span>{year}</span>}
              <span className="text-white/30">·</span>
              <span>{item.adult ? '18+' : '13+'}</span>
              {item.media_type && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="uppercase tracking-wide">{item.media_type}</span>
                </>
              )}
            </div>

            <p className="max-w-xl text-sm leading-relaxed text-white/75 md:text-base">
              {overview}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePlay}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black shadow-cinematic transition hover:bg-white/90 md:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
              Play
            </button>
            <button
              type="button"
              onClick={() => onWatchTrailer?.(item)}
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl ring-1 ring-white/15 transition hover:bg-white/15 md:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              More Info
            </button>
          </div>

          <div className="absolute bottom-10 right-10 hidden md:block">
            <button 
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="aura-icon-button h-12 w-12"
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.66 1.905H6.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06ZM18.584 12.828a.75.75 0 0 0 1.06-1.06l-1.5-1.5a.75.75 0 0 0-1.06 1.06l1.5 1.5ZM16.5 12a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008ZM19.646 15.354a.75.75 0 0 1-1.06-1.06l1.5-1.5a.75.75 0 0 1 1.06 1.06l-1.5 1.5Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.66 1.905H6.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06ZM17.72 9.22a.75.75 0 0 1 1.06 0l.97.97a.75.75 0 0 1 0 1.06l-.97.97a.75.75 0 0 1-1.06 0l-.97-.97a.75.75 0 0 1 0-1.06l.97-.97Z" />
                  <path d="M19.828 7.121a.75.75 0 0 1 1.06 0l.97.97a.75.75 0 0 1 0 1.06l-.97.97a.75.75 0 0 1-1.06-1.06l.97-.97a.75.75 0 0 1 0-1.06l-.97-.97a.75.75 0 0 1 0-1.06Zm1.06-1.06a.75.75 0 0 1 1.06 0l.97.97a.75.75 0 0 1 0 1.06l-.97.97a.75.75 0 0 1-1.06-1.06l.97-.97a.75.75 0 0 1 0-1.06l-.97-.97a.75.75 0 0 1 0-1.06Z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroBanner;

