import React from 'react';
import { usePresence } from '../hooks/usePresence.js';
import { supabase } from '../lib/supabase.js';
import { useAcceptedFriends } from '../hooks/useAcceptedFriends.js';

export default function FriendsSidebar({
  open,
  onClose,
  onInvite
}) {
  const { onlineFriends } = usePresence();
  const { friends } = useAcceptedFriends();

  const onlineIds = React.useMemo(
    () => new Set((onlineFriends ?? []).map((f) => String(f.user_id))),
    [onlineFriends]
  );

  const [search, setSearch] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [pending, setPending] = React.useState([]);
  const [myUserId, setMyUserId] = React.useState(null);

  const [loading, setLoading] = React.useState(false);
  const [roomId, setRoomId] = React.useState(null);

  React.useEffect(() => {
    let alive = true;

    const syncRoomId = () => {
      try {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const wp = params.get('wp');
        if (alive) setRoomId(wp || null);
      } catch {
        // ignore
      }
    };

    syncRoomId();

    const loadMyIdAndPending = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      if (!alive) return;
      setMyUserId(user.id);

      // Pending where *I* am user_id_2 (incoming request)
      const { data: rows, error: pErr } = await supabase
        .from('friendships')
        .select('id,user_id_1')
        .eq('status', 'pending')
        .eq('user_id_2', user.id);

      if (pErr) throw pErr;

      const requesterIds = (rows ?? []).map((r) => r.user_id_1);

      if (requesterIds.length === 0) {
        if (alive) setPending([]);
        return;
      }

      const { data: profiles, error: prErr } = await supabase
        .from('profiles')
        .select('id,username,avatar_url')
        .in('id', requesterIds);

      if (prErr) throw prErr;

      const mapped = (profiles ?? []).map((p) => ({
        id: p.id,
        username: p.username,
        avatar_url: p.avatar_url ?? null
      }));

      if (alive) setPending(mapped);
    };

    if (open) {
      loadMyIdAndPending().catch(() => {});
    }

    return () => {
      alive = false;
    };
  }, [open]);

  const searchUsers = async () => {
    const q = search.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      const { data, error } = await supabase
        .from('profiles')
        .select('id,username,avatar_url')
        .ilike('username', `%${q}%`)
        .limit(8);

      if (error) throw error;

      const filtered = (data ?? []).filter((p) => p.id !== user?.id);
      setSearchResults(filtered);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (targetProfileId) => {
    if (!myUserId) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('friendships').insert({
        user_id_1: myUserId,
        user_id_2: targetProfileId,
        status: 'pending'
      });

      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (fromUserId) => {
    if (!myUserId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('user_id_1', fromUserId)
        .eq('user_id_2', myUserId)
        .eq('status', 'pending');

      if (error) throw error;

      setPending((prev) => prev.filter((p) => p.id !== fromUserId));
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (receiverProfileId) => {
    if (!roomId) return;
    if (!myUserId) return;
    if (!supabase) return;

    setLoading(true);
    try {
      await supabase.from('watch_party_invites').insert({
        sender_id: myUserId,
        receiver_id: receiverProfileId,
        room_id: roomId,
        status: 'pending'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 h-screen w-80 bg-[#0A0E17]/95 backdrop-blur-xl border-l border-white/5 z-50 transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-wide text-white/90">
            Friends
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-white/60 hover:text-white transition"
          >
            Close
          </button>
        </div>

        {/* Search Users */}
        <div className="px-4 mt-4">
          <div className="text-xs font-bold tracking-wide text-white/70 mb-2">
            Search Users
          </div>

          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') searchUsers();
              }}
              placeholder="Type a username..."
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#E50914]"
            />
            <button
              type="button"
              onClick={searchUsers}
              disabled={loading}
              className="rounded-xl bg-[#E50914] hover:bg-[#F6121D] transition px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Go
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-3 space-y-3">
              {searchResults.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <img
                        src={p.avatar_url ?? '/default-avatar.png'}
                        alt={p.username}
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {p.username}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => sendRequest(p.id)}
                    disabled={loading}
                    className="rounded-xl px-3 py-2 text-xs font-semibold border border-[#E50914]/60 text-white/90 hover:border-[#E50914] hover:bg-[#E50914]/10 transition disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        <div className="px-4 mt-7">
          <div className="text-xs font-bold tracking-wide text-white/70 mb-2">
            Pending Requests
          </div>

          {pending.length === 0 ? (
            <p className="text-xs text-white/40">No pending requests.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.avatar_url ?? '/default-avatar.png'}
                      alt={p.username}
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                    />
                    <p className="text-sm font-semibold truncate">
                      {p.username}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => acceptRequest(p.id)}
                    disabled={loading}
                    className="rounded-xl border border-[#E50914] px-3 py-2 text-xs font-semibold text-white hover:bg-[#E50914]/10 transition disabled:opacity-60"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friends */}
        <div className="px-4 mt-7">
          <div className="text-xs font-bold tracking-wide text-white/70 mb-2">
            My Friends
          </div>

          {friends.length === 0 ? (
            <p className="text-xs text-white/40">
              No friends yet. Add someone from “Search Users”.
            </p>
          ) : (
            <div className="space-y-3">
              {friends.map((f) => {
                const isOnline = onlineIds.has(String(f.id));
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <img
                          src={f.avatar_url ?? '/default-avatar.png'}
                          alt={f.username}
                          className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                        />
                        {isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-[#0A0E17]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {f.username}
                        </p>
                        <p className="text-xs text-white/45">
                          {isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => sendInvite(f.id)}
                      disabled={!roomId || loading}
                      aria-label="Invite to watch party"
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        !roomId
                          ? 'border-white/10 text-white/35 cursor-not-allowed'
                          : 'border-[#E50914]/60 text-white/90 hover:border-[#E50914] hover:bg-[#E50914]/10'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8" />
                        </svg>
                        Invite
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

