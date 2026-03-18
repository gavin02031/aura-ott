import React from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Watch party foundation:
 * - Connects to `watch-room-[roomId]` realtime channel
 * - Presence: connected users
 * - Broadcast: video-sync events (playing/paused/seek)
 *
 * NOTE: This component expects a video element ref from your video player.
 */
export default function WatchPartyLobby({ roomId, videoRef, onInviteUserIds }) {
  const [roomMembers, setRoomMembers] = React.useState([]);
  const [connected, setConnected] = React.useState(false);

  const meIdRef = React.useRef(null);
  const lastRemoteAppliedAtRef = React.useRef(0);
  const channelRef = React.useRef(null);
  const isApplyingRemoteRef = React.useRef(false);

  const sendVideoSync = React.useCallback((state, timestamp) => {
    const channel = channelRef.current;
    const meId = meIdRef.current;
    if (!channel || !meId) return;

    channel.send({
      type: 'broadcast',
      event: 'video-sync',
      payload: {
        state,
        timestamp,
        user_id: meId
      }
    });
  }, []);

  React.useEffect(() => {
    let alive = true;
    let channel = null;

    const setup = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      meIdRef.current = user.id;

      // Presence enabled channel for this room
      channel = supabase.channel(`watch-room-${roomId}`, {
        config: { presence: { key: user.id } }
      });
      channelRef.current = channel;

      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const out = [];

        for (const [key, presences] of Object.entries(state ?? {})) {
          for (const p of presences) {
            out.push({
              user_id: String(key),
              username: p?.username ? String(p.username) : 'Unknown',
              avatar_url: p?.avatar_url ? String(p.avatar_url) : null
            });
          }
        }

        // De-dupe by user_id
        const byId = new Map();
        for (const m of out) byId.set(m.user_id, m);

        if (alive) setRoomMembers(Array.from(byId.values()));
      });

      channel.on('broadcast', { event: 'video-sync' }, ({ payload }) => {
        const video = videoRef?.current;
        if (!video) return;

        const meId = meIdRef.current;
        if (!payload || payload.user_id === meId) return;

        const now = Date.now();
        if (now - lastRemoteAppliedAtRef.current < 250) return;
        lastRemoteAppliedAtRef.current = now;

        const driftTarget = Number(payload.timestamp) || 0;
        const state = payload.state;
        const diff = Math.abs(video.currentTime - driftTarget);

        // Apply time only if drift is noticeable (reduces jitter)
        if (diff > 0.35) {
          isApplyingRemoteRef.current = true;
          video.currentTime = driftTarget;
        }

        if (state === 'playing') {
          video.play().catch(() => {});
        } else if (state === 'paused') {
          video.pause();
        }

        // Clear the applying flag shortly after we set currentTime
        window.setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 400);
      });

      await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true);
        }
      });

      // Track presence entry
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      channel.track({
        user_id: user.id,
        username: myProfile?.username ?? user.email,
        avatar_url: myProfile?.avatar_url ?? null
      });
    };

    setup().catch(() => {});

    return () => {
      alive = false;
      if (channel) supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, videoRef]);

  // Broadcast local interactions to others
  React.useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    const onPlay = () => {
      if (isApplyingRemoteRef.current) return;
      sendVideoSync('playing', video.currentTime);
    };

    const onPause = () => {
      if (isApplyingRemoteRef.current) return;
      sendVideoSync('paused', video.currentTime);
    };

    const onSeeked = () => {
      if (isApplyingRemoteRef.current) return;
      const state = video.paused ? 'paused' : 'playing';
      sendVideoSync(state, video.currentTime);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('seeked', onSeeked);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [videoRef, sendVideoSync]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div className="absolute right-4 top-4 pointer-events-auto w-full max-w-sm rounded-2xl bg-[#0A0E17]/95 backdrop-blur-xl border border-white/5 p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/55">Watch Party</p>
            <p className="text-sm font-bold tracking-wide text-white break-all">
              Room: {roomId}
            </p>
          </div>
          <div className="text-xs font-semibold text-[#E50914]">
            {connected ? 'Live' : 'Connecting…'}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-white/55 mb-2">Connected Users</p>
          <div className="space-y-3">
            {roomMembers.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={m.avatar_url ?? '/default-avatar.png'}
                    alt={m.username}
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-[#0A0E17]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{m.username}</p>
                  <p className="text-xs text-white/45 truncate">{m.user_id}</p>
                </div>
              </div>
            ))}

            {roomMembers.length === 0 && (
              <p className="text-xs text-white/40">Nobody connected yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

