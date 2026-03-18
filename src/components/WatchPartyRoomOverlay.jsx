import React from 'react';
import { usePresence } from '../hooks/usePresence.js';

function Avatar({ src, alt }) {
  return (
    <img
      src={src ?? '/default-avatar.png'}
      alt={alt}
      className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
    />
  );
}

export default function WatchPartyRoomOverlay({
  roomId,
  members,
  messages,
  connected,
  onClose,
  onSendChatMessage,
  onSendVideoSync,
  onInviteToFriend,
  contentLabel
}) {
  const { onlineFriends } = usePresence();
  const [chatText, setChatText] = React.useState('');
  const [showInvite, setShowInvite] = React.useState(false);

  const listRef = React.useRef(null);

  React.useEffect(() => {
    // auto-scroll chat to bottom
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = () => {
    onSendChatMessage?.(chatText);
    setChatText('');
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowInvite(false)}
      />

      <div className="absolute right-6 top-6 w-full max-w-md rounded-2xl bg-[#0A0E17]/95 backdrop-blur-xl border-l border-white/5 p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-white/55">Watch Party</p>
            <p className="text-sm font-bold tracking-wide text-white break-all">
              Room: {roomId}
            </p>
            <p className="mt-1 text-xs text-white/45 truncate">
              {contentLabel}
            </p>
          </div>

          <div className="text-xs font-semibold text-[#E50914]">
            {connected ? 'Live' : 'Connecting…'}
          </div>
        </div>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white/65 hover:text-white hover:bg-white/5 transition"
          >
            Close
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold tracking-wide text-white/70">
              Connected Users
            </p>
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="rounded-xl border border-[#E50914]/60 px-3 py-1.5 text-xs font-semibold text-white/90 hover:border-[#E50914] hover:bg-[#E50914]/10 transition"
            >
              Invite
            </button>
          </div>

          <div className="mt-3 space-y-3 max-h-28 overflow-auto pr-1">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar src={m.avatar_url} alt={m.username} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-[#0A0E17]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{m.username}</p>
                  <p className="text-[0.65rem] text-white/40 truncate">
                    {m.user_id}
                  </p>
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <p className="text-xs text-white/40">Nobody is here yet.</p>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold tracking-wide text-white/70">Chat</p>
            {/* Optional: if you later want local "sync" button */}
            <button
              type="button"
              onClick={() => onSendVideoSync?.('playing', 0)}
              className="hidden"
              aria-hidden="true"
            />
          </div>

          <div
            ref={listRef}
            className="h-44 overflow-auto space-y-2 pr-1"
          >
            {messages.map((m) => (
              <div key={m.message_id} className="flex gap-3">
                <img
                  src={m.avatar_url ?? '/default-avatar.png'}
                  alt={m.username}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10 mt-0.5"
                />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="text-[0.7rem] font-semibold text-white/85 truncate">
                      {m.username}
                    </p>
                    <p className="text-[0.65rem] text-white/35">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <p className="text-xs text-white/70 break-words">
                    {m.message}
                  </p>
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <p className="text-xs text-white/40">Be the first to say something.</p>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Message…"
              className="flex-1 rounded-xl bg-transparent text-white placeholder:text-white/35 outline-none border-b border-white/10 pb-2 focus:border-[#E50914] transition"
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
            />
            <button
              type="button"
              onClick={send}
              className="rounded-xl bg-[#E50914] hover:bg-[#F6121D] transition px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={!chatText.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Invite Drawer/Modal */}
      {showInvite && (
        <div className="absolute right-6 top-6 w-full max-w-md">
          <div className="rounded-2xl bg-[#141A24]/95 backdrop-blur-xl border border-white/10 p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold tracking-wide text-white">
                Invite Friends
              </p>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="text-sm text-white/60 hover:text-white transition"
              >
                Close
              </button>
            </div>

            <div className="mt-3">
              <p className="text-xs font-bold tracking-wide text-white/70 mb-2">
                Online Friends
              </p>

              {onlineFriends.length === 0 ? (
                <p className="text-xs text-white/40">No friends online right now.</p>
              ) : (
                <div className="space-y-3">
                  {onlineFriends.map((f) => (
                    <div key={f.user_id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <Avatar src={f.avatar_url} alt={f.username} />
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-[#141A24]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{f.username}</p>
                          <p className="text-[0.65rem] text-white/40 truncate">Online</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onInviteToFriend?.(f.user_id)}
                        className="rounded-xl border border-[#E50914]/60 px-3 py-2 text-xs font-semibold text-white/90 hover:border-[#E50914] hover:bg-[#E50914]/10 transition"
                      >
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

