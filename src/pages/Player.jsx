import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetails, getTvDetails, getTvSeason, getImageUrl } from '../api/tmdb.js';
import { useProgress } from '../context/ProgressContext.jsx';
import { useMyList } from '../context/MyListContext.jsx';
import { useRatings } from '../context/RatingContext.jsx';
import { supabase } from '../lib/supabase.js';
import TrailerModal from '../components/TrailerModal.jsx';
import Cast from '../components/Cast.jsx';
import { useWatchPartyRoom } from '../hooks/useWatchPartyRoom.js';
import WatchPartyChatPanel from '../components/WatchPartyChatPanel.jsx';

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
  const [playerSrc, setPlayerSrc] = React.useState(null);
  const [showTrailer, setShowTrailer] = React.useState(false);
  const [selectedSeason, setSelectedSeason] = React.useState(
    Number(seasonNumber) || 1
  );

  // Watch party:
  // - If `wp` exists in the URL, join that room
  // - Otherwise, starting a party will create a room id and update the URL
  const [roomId, setRoomId] = React.useState(null);
  const [isRoomReady, setIsRoomReady] = React.useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const wp = params.get('wp');
      return !wp;
    } catch {
      return true;
    }
  });

  React.useEffect(() => {
    // Framework-agnostic URL parsing (required by protocol).
    try {
      const params = new URLSearchParams(window.location.search);
      const wp = params.get('wp');
      setRoomId(wp || null);
    } catch {
      setRoomId(null);
    }
  }, []);

  const currentTimeRef = React.useRef(0);
  const playbackStateRef = React.useRef('paused'); // 'playing' | 'paused'
  const lastLocalBroadcastAtRef = React.useRef(0);
  const lastRemoteAppliedAtRef = React.useRef(0);

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
  const ratingMediaKey = `${isMovie ? 'movie' : 'tv'}:${String(id)}`;

  const buildPlayerSrc = React.useCallback(
    (autoPlay, timestamp) => {
      const ts = Number(timestamp) || 0;
      const ap = autoPlay ? 'true' : 'false';

      if (isMovie) {
        return `https://www.vidking.net/embed/movie/${id}?color=e50914&autoPlay=${ap}&progress=${ts}`;
      }

      const tvSeason = selectedSeason || Number(seasonNumber) || 1;
      const tvEpisode = Number(episodeNumber) || 1;

      return `https://www.vidking.net/embed/tv/${id}/${tvSeason}/${tvEpisode}?color=e50914&autoPlay=${ap}&nextEpisode=true&episodeSelector=true&progress=${ts}`;
    },
    [id, isMovie, episodeNumber, seasonNumber, selectedSeason]
  );

  const handleRemoteVideoSync = React.useCallback(
    ({ state, timestamp }) => {
      const desiredState = state === 'playing' ? 'playing' : 'paused';
      const desiredTime = Number(timestamp) || 0;

      const now = Date.now();
      const last = lastRemoteAppliedAtRef.current;
      const current = currentTimeRef.current ?? 0;
      const diff = Math.abs(current - desiredTime);

      if (now - last < 1800 && diff < 0.9) return;
      if (desiredState === playbackStateRef.current && diff < 0.35) return;

      lastRemoteAppliedAtRef.current = now;

      setShowPlayer(true);
      setPlayerSrc(buildPlayerSrc(desiredState === 'playing', desiredTime));
      playbackStateRef.current = desiredState;
    },
    [buildPlayerSrc]
  );

  const {
    connected: wpConnected,
    members: wpMembers,
    messages: wpMessages,
    sendVideoSync,
    sendChatMessage,
    isProgrammaticEvent
  } = useWatchPartyRoom(roomId, { onRemoteVideoSync: handleRemoteVideoSync });

  React.useEffect(() => {
    if (!roomId) {
      setIsRoomReady(true);
      return;
    }
    setIsRoomReady(Boolean(wpConnected));
  }, [roomId, wpConnected]);

  const closeWatchParty = React.useCallback(() => {
    setRoomId(null);
    try {
      const params = new URLSearchParams(window.location.search);
      params.delete('wp');
      const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', next);
    } catch {
      // ignore
    }
  }, []);

  const startWatchParty = React.useCallback(() => {
    const newRoomId =
      (crypto?.randomUUID && crypto.randomUUID()) ||
      `room-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setRoomId(newRoomId);
    try {
      const params = new URLSearchParams(window.location.search);
      params.set('wp', newRoomId);
      const next = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
      window.history.replaceState({}, '', next);
    } catch {
      // ignore
    }
  }, []);

  const inviteToFriend = React.useCallback(
    async (targetUserId) => {
      if (!roomId) return;
      try {
        if (!supabase) return;
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) return;

        // Absolute Reliability Protocol: invites are written to Postgres.
        await supabase.from('watch_party_invites').insert({
          sender_id: user.id,
          receiver_id: targetUserId,
          room_id: roomId,
          status: 'pending'
        });
      } catch {
        // ignore invite errors
      }
    },
    [
      roomId,
      supabase
    ]
  );

  // Detect local playback events from the VidKing iframe and broadcast them to the room.
  React.useEffect(() => {
    if (!roomId) return;

    const onMessage = (event) => {
      if (event.origin !== 'https://www.vidking.net') return;

      const payload =
        typeof event.data === 'string'
          ? (() => {
              try {
                return JSON.parse(event.data);
              } catch {
                return null;
              }
            })()
          : event.data;

      if (!payload || payload.type !== 'PLAYER_EVENT' || !payload.data) return;

      const data = payload.data;
      if (String(data.id) !== String(id)) return;

      const expectedMediaType = isMovie ? 'movie' : 'tv';
      if (data.mediaType !== expectedMediaType) return;

      if (typeof data.currentTime !== 'number') return;

      const currentTime = data.currentTime;
      currentTimeRef.current = currentTime;

      const eventName = typeof data.event === 'string' ? data.event : null;

      // Absolute Reliability Protocol:
      // Ignore one local PLAYER_EVENT that was caused by a remote/programmatic sync.
      if (isProgrammaticEvent.current) {
        isProgrammaticEvent.current = false;
        return;
      }

      if (eventName === 'play') {
        playbackStateRef.current = 'playing';
        lastLocalBroadcastAtRef.current = Date.now();
        sendVideoSync('playing', currentTime);
        return;
      }

      if (eventName === 'pause') {
        playbackStateRef.current = 'paused';
        lastLocalBroadcastAtRef.current = Date.now();
        sendVideoSync('paused', currentTime);
        return;
      }

      if (eventName === 'seeked') {
        const desired =
          playbackStateRef.current === 'playing' ? 'playing' : 'paused';
        lastLocalBroadcastAtRef.current = Date.now();
        sendVideoSync(desired, currentTime);
        return;
      }

      // Fallback: periodic re-sync while playing.
      const now = Date.now();
      if (playbackStateRef.current === 'playing') {
        if (eventName === 'timeupdate' || !eventName) {
          if (now - lastLocalBroadcastAtRef.current >= 5000) {
            lastLocalBroadcastAtRef.current = now;
            sendVideoSync('playing', currentTime);
          }
        }
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [roomId, sendVideoSync, id, isMovie]);

  return (
    <div className="pb-12">
      <div className="bg-aura-bg">
        <div className="mx-auto max-w-7xl px-4 pt-16 md:px-10">
          <div className={roomId ? 'flex flex-col md:flex-row gap-6' : ''}>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-cinematic-lg ring-1 ring-white ring-opacity-10 md:flex-1 min-w-0">
              {showPlayer && isRoomReady ? (
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
                  {/* Poster backdrop */}
                </div>
              )}
            </div>

            {roomId && isRoomReady && (
              <div className="w-full md:w-96 md:shrink-0">
                <WatchPartyChatPanel
                  roomId={roomId}
                  members={wpMembers}
                  messages={wpMessages}
                  connected={wpConnected}
                  onClose={closeWatchParty}
                  onSendChatMessage={sendChatMessage}
                  onSendVideoSync={sendVideoSync}
                  onInviteToFriend={inviteToFriend}
                  contentLabel={title}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-7xl flex-col gap-6 px-4 md:mt-8 md:flex-row md:px-10">
        <div className="flex-1 space-y-4 md:space-y-5">
          <h1 className="text-3xl font-black tracking-[-0.03em] md:text-4xl aura-gradient-text">{title}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
            <span className="font-bold text-emerald-400">
              {matchPercent}% Match
            </span>
            {year && <span>{year}</span>}
            <span className="rounded-md border border-white/15 px-2 py-0.5 text-[0.65rem] font-bold text-white/60 tracking-wider">
              {maturityRating}
            </span>
            {durationLabel && <span>{durationLabel}</span>}
            {genres && (
              <span className="hidden text-white/40 md:inline-block">
                {genres}
              </span>
            )}
          </div>

          <p className="max-w-2xl text-sm text-white/60 leading-relaxed md:text-base">
            {synopsis}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setShowPlayer(true);
                const ts = currentTimeRef.current ?? 0;
                setPlayerSrc(buildPlayerSrc(true, ts));
                playbackStateRef.current = 'playing';
                if (roomId && isRoomReady) sendVideoSync('playing', ts);
              }}
              className="aura-btn-primary md:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
              Play
            </button>
            <button
              type="button"
              onClick={() => {
                if (roomId) return;
                startWatchParty();
              }}
              disabled={!!roomId}
              className={`inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold backdrop-blur-xl transition-all duration-300 md:px-6 md:py-3.5 ${
                roomId
                  ? 'text-white/40 bg-white/[0.04] cursor-not-allowed'
                  : 'text-white bg-white/[0.06] ring-1 ring-aura-red/40 hover:bg-white/[0.1] hover:ring-aura-red/60'
              }`}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-aura-red text-white shadow-glow-red">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.1 10.1 12 6 9.9 10.1 6 12l3.9 1.9L12 18l2.1-4.1L18 12z" />
                </svg>
              </span>
              Watch Party
            </button>
            <button
              type="button"
              onClick={openTrailer}
              className="aura-btn-secondary md:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
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
              className="aura-btn-secondary md:text-base"
            >
              {isInMyList(details?.id) ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.45-12.675a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
              My List
            </button>

            {/* Rating buttons */}
            <div className="ml-1 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1.5 ring-1 ring-white/[0.08] backdrop-blur-xl">
              <button
                type="button"
                onClick={() =>
                  setRating(ratingMediaKey, getRating(ratingMediaKey) === 'dislike' ? null : 'dislike')
                }
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                  getRating(ratingMediaKey) === 'dislike'
                    ? 'bg-red-500/80 text-white scale-110 shadow-lg'
                    : 'text-white/50 hover:bg-white/[0.08] hover:text-white/80 hover:scale-105'
                }`}
                aria-label="I don't like this"
              >
                👎
              </button>
              <button
                type="button"
                onClick={() =>
                  setRating(ratingMediaKey, getRating(ratingMediaKey) === 'like' ? null : 'like')
                }
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                  getRating(ratingMediaKey) === 'like'
                    ? 'bg-emerald-500/80 text-white scale-110 shadow-lg'
                    : 'text-white/50 hover:bg-white/[0.08] hover:text-white/80 hover:scale-105'
                }`}
                aria-label="I like this"
              >
                👍
              </button>
              <button
                type="button"
                onClick={() =>
                  setRating(ratingMediaKey, getRating(ratingMediaKey) === 'love' ? null : 'love')
                }
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                  getRating(ratingMediaKey) === 'love'
                    ? 'bg-aura-red text-white scale-110 shadow-glow-red'
                    : 'text-white/50 hover:bg-white/[0.08] hover:text-white/80 hover:scale-105'
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

      {roomId && !isRoomReady && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0A0E17]">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-md rounded-2xl bg-[#141A24]/90 backdrop-blur-2xl border border-white/10 p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full border-4 border-white/10 border-t-[#E50914] animate-spin" />
              <div>
                <p className="text-sm font-bold tracking-wide text-white">
                  Securing Secure Connection to Room...
                </p>
                <p className="mt-1 text-xs text-white/60">
                  Please wait while your session connects.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTrailer && (
        <TrailerModal item={details} onClose={closeTrailer} />
      )}

      {/* Watch party UI is rendered inline next to the player (no background blur overlay). */}

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

