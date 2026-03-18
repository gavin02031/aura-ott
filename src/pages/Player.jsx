import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetails, getTvDetails, getTvSeason, getImageUrl } from '../api/tmdb.js';
import { useProgress } from '../context/ProgressContext.jsx';
import { useMyList } from '../context/MyListContext.jsx';
import { useRatings } from '../context/RatingContext.jsx';
import TrailerModal from '../components/TrailerModal.jsx';
import Cast from '../components/Cast.jsx';

function Player({ type }) {
  const { id, seasonNumber, episodeNumber } = useParams();
  const navigate = useNavigate();
  const { upsertMetadata } = useProgress();
  const { isInMyList, toggleMyList } = useMyList();
  const { getRating, setRating } = useRatings();

  const [details, setDetails] = React.useState(null);
  const [season, setSeason] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showPlayer, setShowPlayer] = React.useState(false);
  const [showTrailer, setShowTrailer] = React.useState(false);
  const [selectedSeason, setSelectedSeason] = React.useState(
    Number(seasonNumber) || 1
  );

  const openTrailer = () => {
    if (details) {
      setShowTrailer(true);
    }
  };
  const closeTrailer = () => setShowTrailer(false);

  const isMovie = type === 'movie';

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        if (isMovie) {
          const data = await getMovieDetails(id);
          if (!active) return;
          setDetails(data);
          upsertMetadata(String(id), {
            id: data.id,
            title: data.title,
            poster_path: data.poster_path,
            media_type: 'movie'
          });
        } else {
          const show = await getTvDetails(id);
          if (!active) return;
          setDetails(show);
          upsertMetadata(String(id), {
            id: show.id,
            title: show.name,
            poster_path: show.poster_path,
            media_type: 'tv'
          });

          const seasonNum = Number(seasonNumber) || show.seasons?.[0]?.season_number || 1;
          setSelectedSeason(seasonNum);

          const seasonData = await getTvSeason(id, seasonNum);
          if (!active) return;
          setSeason(seasonData);
        }
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
  }, [id, isMovie, seasonNumber, upsertMetadata]);

  React.useEffect(() => {
    if (!isMovie && id && selectedSeason) {
      let active = true;

      async function loadSeason() {
        try {
          const seasonData = await getTvSeason(id, selectedSeason);
          if (!active) return;
          setSeason(seasonData);
        } catch (err) {
          if (!active) return;
          console.error(err);
        }
      }

      loadSeason();

      return () => {
        active = false;
      };
    }
  }, [id, isMovie, selectedSeason]);

  const handleSeasonChange = (event) => {
    const newSeason = Number(event.target.value);
    setSelectedSeason(newSeason);
    const firstEpisode =
      season?.episodes?.[0]?.episode_number || Number(episodeNumber) || 1;
    navigate(`/tv/${id}/season/${newSeason}/episode/${firstEpisode}`);
  };

  const handleEpisodeClick = (episode) => {
    navigate(`/tv/${id}/season/${selectedSeason}/episode/${episode.episode_number}`);
  };

  const matchPercent = React.useMemo(
    () => Math.floor(Math.random() * 20) + 80,
    []
  );

  const title = details
    ? details.title || details.name || 'Untitled'
    : 'Loading...';
  const year = details
    ? (details.release_date || details.first_air_date || '').slice(0, 4)
    : '';
  const runtimeMinutes = isMovie
    ? details?.runtime
    : season?.episodes?.find(
        (ep) => ep.episode_number === Number(episodeNumber)
      )?.runtime;

  const durationLabel = isMovie
    ? runtimeMinutes
      ? `${Math.floor(runtimeMinutes / 60)}h ${runtimeMinutes % 60}m`
      : ''
    : `${details?.number_of_seasons || ''} Season${
        (details?.number_of_seasons || 0) > 1 ? 's' : ''
      }`;

  const maturityRating = details?.adult ? '18+' : '13+';

  const genres =
    details?.genres?.map((g) => g.name).slice(0, 3).join(' • ') || '';

  const cast =
    details?.credits?.cast?.slice(0, 5).map((c) => c.name).join(', ') || '';

  const synopsis = details?.overview || '';

  const playerSrc = isMovie
    ? `https://www.vidking.net/embed/movie/${id}?color=e50914&autoPlay=true`
    : `https://www.vidking.net/embed/tv/${id}/${seasonNumber || selectedSeason}/${episodeNumber || 1}?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true&progress=0`;

  return (
    <div className="pb-12">
      <div className="bg-aura-bg">
        <div className="mx-auto max-w-7xl px-4 pt-16 md:px-10">
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-cinematic-lg ring-1 ring-white ring-opacity-10">
            {showPlayer ? (
              <iframe
                src={playerSrc}
                title={title}
                allowFullScreen
                className="h-full w-full border-none"
              />
            ) : (
              <div
                className="h-full w-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${getImageUrl(
                    details?.backdrop_path,
                    'w1280'
                  )})`
                }}
              >
                {/* Optional: Add a play icon overlay */}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-7xl flex-col gap-6 px-4 md:mt-6 md:flex-row md:px-10">
        <div className="flex-1 space-y-3 md:space-y-4">
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] md:text-3xl">{title}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white text-opacity-80">
            <span className="font-semibold text-green-400">
              {matchPercent}% Match
            </span>
            {year && <span>{year}</span>}
            <span className="rounded border border-white border-opacity-20 px-1.5 py-0.5 text-xs font-semibold text-white text-opacity-90">
              {maturityRating}
            </span>
            {durationLabel && <span>{durationLabel}</span>}
            {genres && (
              <span className="hidden text-aura-muted md:inline-block">
                {genres}
              </span>
            )}
          </div>

          <p className="max-w-2xl text-sm text-white text-opacity-75 md:text-base">
            {synopsis}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPlayer(true)}
              className="inline-flex items-center gap-2 rounded bg-white px-5 py-2 text-sm font-semibold text-black shadow-md shadow-black/40 transition hover:bg-gray-200 md:px-6 md:py-2.5 md:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
              Play
            </button>
            <button
              type="button"
              onClick={openTrailer}
              className="inline-flex items-center gap-2 rounded bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30 md:px-5 md:py-2.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              Watch Trailer
            </button>
            <button
              type="button"
              onClick={() =>
                toggleMyList({
                  id: details?.id,
                  title,
                  name: title,
                  poster_path: details?.poster_path,
                  media_type: isMovie ? 'movie' : 'tv'
                })
              }
              className="inline-flex items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 md:px-5 md:py-2.5"
            >
              {isInMyList(details?.id) ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.45-12.675a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
              My List
            </button>

            <div className="ml-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs font-medium text-gray-100 ring-1 ring-white/10">
              <button
                type="button"
                onClick={() =>
                  setRating(String(id), getRating(String(id)) === 'dislike' ? null : 'dislike')
                }
                className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                  getRating(String(id)) === 'dislike'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
                aria-label="I don't like this"
              >
                👎
              </button>
              <button
                type="button"
                onClick={() =>
                  setRating(String(id), getRating(String(id)) === 'like' ? null : 'like')
                }
                className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                  getRating(String(id)) === 'like'
                    ? 'bg-green-500 text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
                aria-label="I like this"
              >
                👍
              </button>
              <button
                type="button"
                onClick={() =>
                  setRating(String(id), getRating(String(id)) === 'love' ? null : 'love')
                }
                className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                  getRating(String(id)) === 'love'
                    ? 'bg-aura-red text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
                aria-label="I really like this"
              >
                ❤️
              </button>
            </div>
          </div>

          <div className="space-y-1 text-xs text-aura-muted md:text-sm" />

          {details?.credits?.cast?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4 tracking-[-0.01em]">Cast</h2>
              <Cast cast={details.credits.cast.slice(0, 12)} />
            </div>
          )}
        </div>

        {!isMovie && (
          <div className="w-full max-w-md space-y-3 md:w-[40%]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-gray-100 md:text-base">
                Episodes
              </h2>

              <select
                value={selectedSeason}
                onChange={handleSeasonChange}
                className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-gray-100 outline-none ring-1 ring-zinc-700/80 focus:ring-2 focus:ring-aura-red md:text-sm"
              >
                {details?.seasons
                  ?.filter((s) => s.season_number > 0)
                  .map((s) => (
                    <option key={s.id} value={s.season_number}>
                      Season {s.season_number}
                    </option>
                  ))}
              </select>
            </div>

            <div className="max-h-[420px] space-y-1 overflow-y-auto rounded-xl bg-aura-surface bg-opacity-40 p-1 ring-1 ring-white ring-opacity-5">
              {season?.episodes?.map((ep) => {
                const isActive =
                  Number(ep.episode_number) === Number(episodeNumber);
                const still = getImageUrl(ep.still_path, 'w300');

                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => handleEpisodeClick(ep)}
                    className={`flex w-full items-center gap-3 rounded-lg p-2 text-left text-xs transition md:text-sm ${
                      isActive
                        ? 'bg-white bg-opacity-10'
                        : 'bg-transparent hover:bg-white hover:bg-opacity-5'
                    }`}
                  >
                    <div className="h-16 w-28 flex-shrink-0 overflow-hidden rounded bg-zinc-800 md:h-20 md:w-32">
                      {still ? (
                        <img
                          src={still}
                          alt={ep.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[0.6rem] text-gray-300">
                          {`E${ep.episode_number}`}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-100">
                            {ep.episode_number}.
                          </span>
                          <span className="line-clamp-1 font-medium text-gray-100">
                            {ep.name}
                          </span>
                        </div>
                        {ep.runtime && (
                          <span className="text-[0.65rem] text-gray-300 md:text-[0.7rem]">
                            {ep.runtime}m
                          </span>
                        )}
                      </div>
                      {ep.overview && (
                        <p className="line-clamp-2 text-[0.65rem] text-gray-300 md:text-[0.7rem]">
                          {ep.overview}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showTrailer && (
        <TrailerModal item={details} onClose={closeTrailer} />
      )}

      {loading && !details && (
        <p className="mt-4 text-center text-sm text-gray-300">Loading…</p>
      )}
      {error && (
        <p className="mt-4 text-center text-sm text-red-400">
          Failed to load: {error}
        </p>
      )}
    </div>
  );
}

export default Player;

