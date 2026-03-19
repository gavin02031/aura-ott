import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

function joinRouteForPayload(payload, navigate) {
  if (!payload) return;

  const content = payload.content ?? {};
  const type = content.type;

  if (type === 'movie') {
    navigate(`/movie/${content.id}?wp=${encodeURIComponent(payload.roomId)}`);
    return;
  }

  if (type === 'tv') {
    navigate(
      `/tv/${content.id}/season/${content.seasonNumber}/episode/${content.episodeNumber}?wp=${encodeURIComponent(
        payload.roomId
      )}`
    );
  }
}

export default function WatchPartyInvitesLayer({ enabled = true }) {
  const [open, setOpen] = React.useState(false);
  const [invitePayload, setInvitePayload] = React.useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!enabled) return;

    let alive = true;
    let channel = null;
    let myId = null;

    const setup = async () => {
      if (!supabase) return;
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      myId = user.id;
      channel = supabase.channel(`invites-${myId}`);

      channel.on('broadcast', { event: 'watch-party-invite' }, ({ payload }) => {
        if (!alive) return;
        if (!payload?.roomId) return;

        setInvitePayload(payload);
        setOpen(true);
      });

      await channel.subscribe();
    };

    setup().catch(() => {});

    return () => {
      alive = false;
      if (channel) supabase.removeChannel(channel);
      channel = null;
    };
  }, [enabled]);

  if (!enabled || !open || !invitePayload) return null;

  const inviter = invitePayload.inviter ?? {};

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-[#141A24]/90 backdrop-blur-2xl border border-white/10 p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]">
        <h2 className="text-sm md:text-base font-bold tracking-wide">
          {inviter.username ? `${inviter.username} invited you` : 'Watch party invite'}
        </h2>
        <p className="mt-3 text-sm text-white/60">
          Join room <span className="text-white/80 font-semibold">{invitePayload.roomId}</span>?
        </p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              joinRouteForPayload(invitePayload, navigate);
              // keep current route state from interfering with navigation
              // eslint-disable-next-line no-console
              console.log('Joining watch party…', location.pathname);
            }}
            className="flex-1 rounded-xl bg-[#E50914] hover:bg-[#F6121D] transition px-4 py-3 font-semibold text-white"
          >
            Join
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-xl bg-white/5 hover:bg-white/10 transition px-4 py-3 font-semibold text-white/70 border border-white/10"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

