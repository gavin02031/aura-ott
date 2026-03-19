import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export default function WatchPartyInvitesLayer({ enabled = true }) {
  const navigate = useNavigate();

  const [activeInvites, setActiveInvites] = React.useState([]);
  const [bellOpen, setBellOpen] = React.useState(false);

  const loadPendingInvites = React.useCallback(async (userId) => {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('watch_party_invites')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data ?? [];
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    if (!supabase) return;

    let alive = true;
    let channel = null;

    const setup = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const pending = await loadPendingInvites(user.id);
      if (!alive) return;
      setActiveInvites(pending);

      // Postgres realtime: new invites inserted for this receiver.
      channel = supabase
        .channel(`watch-party-invites-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'watch_party_invites',
            filter: `receiver_id=eq.${user.id}`
          },
          (payload) => {
            const row = payload?.new;
            if (!row) return;
            setActiveInvites((prev) => {
              const exists = prev.some((p) => String(p.id) === String(row.id));
              if (exists) return prev;
              return [row, ...prev];
            });
          }
        );

      await channel.subscribe();
    };

    setup().catch(() => {});

    return () => {
      alive = false;
      if (channel) supabase.removeChannel(channel);
      channel = null;
    };
  }, [enabled, loadPendingInvites]);

  const acceptInvite = React.useCallback(
    async (invite) => {
      if (!supabase) return;
      if (!invite?.id) return;

      await supabase
        .from('watch_party_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      setActiveInvites((prev) =>
        prev.filter((p) => String(p.id) !== String(invite.id))
      );

      const roomId = invite.room_id ?? invite.roomId;
      if (!roomId) return;

      // Route to the actual Player pages in this repo.
      const contentType = invite.content_type;
      const contentId = Number(invite.content_id);
      const seasonNumber = Number(invite.season_number);
      const episodeNumber = Number(invite.episode_number);

      if (contentType === 'movie' && contentId) {
        window.location.href = `/movie/${contentId}?wp=${encodeURIComponent(roomId)}`;
        return;
      }

      if (
        contentType === 'tv' &&
        contentId &&
        Number.isFinite(seasonNumber) &&
        Number.isFinite(episodeNumber)
      ) {
        window.location.href = `/tv/${contentId}/season/${seasonNumber}/episode/${episodeNumber}?wp=${encodeURIComponent(
          roomId
        )}`;
        return;
      }

      // Fallback: just open the home page with the same room param.
      window.location.href = `/?wp=${encodeURIComponent(roomId)}`;
    },
    []
  );

  const declineInvite = React.useCallback(async (invite) => {
    if (!supabase) return;
    if (!invite?.id) return;

    await supabase
      .from('watch_party_invites')
      .update({ status: 'declined' })
      .eq('id', invite.id);

    setActiveInvites((prev) =>
      prev.filter((p) => String(p.id) !== String(invite.id))
    );
  }, []);

  if (!enabled || activeInvites.length === 0) {
    // Still show bell placeholder? Per protocol, bell only when invites exist.
    if (!enabled) return null;
  }

  return (
    <>
      {enabled && activeInvites.length > 0 && (
        <button
          type="button"
          onClick={() => setBellOpen((v) => !v)}
          className="fixed right-6 top-24 z-[85] inline-flex items-center justify-center rounded-xl bg-[#141A24]/80 border border-white/10 w-11 h-11 backdrop-blur-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]"
          aria-label="Watch party invites"
          title="Watch party invites"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E50914"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a3 3 0 0 0 6 0" />
          </svg>
        </button>
      )}

      {enabled && bellOpen && activeInvites.length > 0 && (
        <div className="fixed right-6 top-[180px] z-[86] w-80 rounded-2xl bg-[#141A24]/95 backdrop-blur-2xl border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-wide text-white/70">
              Pending Invites
            </p>
            <button
              type="button"
              onClick={() => setBellOpen(false)}
              className="text-xs text-white/60 hover:text-white transition"
            >
              Close
            </button>
          </div>

          <div className="space-y-3">
            {activeInvites.map((inv) => (
              <div key={inv.id} className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-xs font-semibold text-white/90">
                  Room: {inv.room_id ?? 'Unknown'}
                </p>
                <p className="mt-1 text-[0.65rem] text-white/40 break-all">
                  From: {inv.sender_id ?? 'Unknown'}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBellOpen(false);
                      acceptInvite(inv);
                    }}
                    className="flex-1 rounded-xl bg-[#E50914] hover:bg-[#F6121D] transition px-3 py-2 font-semibold text-white text-xs"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => declineInvite(inv)}
                    className="flex-1 rounded-xl bg-white/5 hover:bg-white/10 transition px-3 py-2 font-semibold text-white/70 border border-white/10 text-xs"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toasts */}
      {enabled && activeInvites.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[87] space-y-3 w-full max-w-sm pointer-events-none">
          {activeInvites.slice(0, 2).map((inv) => (
            <div
              key={inv.id}
              className="pointer-events-auto rounded-2xl bg-[#141A24]/95 backdrop-blur-2xl border border-white/10 p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]"
            >
              <p className="text-xs text-white/60">Watch Party Invite</p>
              <p className="text-sm font-bold tracking-wide text-white break-all">
                Room: {inv.room_id ?? 'Unknown'}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => acceptInvite(inv)}
                  className="flex-1 rounded-xl bg-[#E50914] hover:bg-[#F6121D] transition px-3 py-2 font-semibold text-white text-xs"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => declineInvite(inv)}
                  className="flex-1 rounded-xl bg-white/5 hover:bg-white/10 transition px-3 py-2 font-semibold text-white/70 border border-white/10 text-xs"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

