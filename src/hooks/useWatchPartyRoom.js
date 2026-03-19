import React from 'react';
import { supabase } from '../lib/supabase.js';

function safeString(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

/**
 * Realtime watch-room foundation:
 * - Presence: connected users
 * - Broadcast: video-sync + chat-message
 */
export function useWatchPartyRoom(roomId, { onRemoteVideoSync } = {}) {
  const [members, setMembers] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const [connected, setConnected] = React.useState(false);

  // Prevent infinite loops:
  // Remote video-sync -> sets this ref -> Player's local postMessage listener ignores one event.
  const isProgrammaticEvent = React.useRef(false);

  const channelRef = React.useRef(null);
  const meRef = React.useRef(null);
  const seenMessageIdsRef = React.useRef(new Set());

  const sendVideoSync = React.useCallback((state, timestamp) => {
    const channel = channelRef.current;
    const me = meRef.current;
    if (!channel || !me) return;

    channel.send({
      type: 'broadcast',
      event: 'video-sync',
      payload: {
        state,
        timestamp,
        user_id: me.id
      }
    });
  }, []);

  const sendChatMessage = React.useCallback((text) => {
    const channel = channelRef.current;
    const me = meRef.current;
    if (!channel || !me) return;

    const trimmed = safeString(text).trim();
    if (!trimmed) return;

    const messageId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const created_at = new Date().toISOString();

    const payload = {
      message_id: messageId,
      user_id: me.id,
      username: me.username,
      avatar_url: me.avatar_url ?? null,
      message: trimmed,
      created_at
    };

    channel.send({
      type: 'broadcast',
      event: 'chat-message',
      payload
    });
  }, []);

  React.useEffect(() => {
    let alive = true;
    let channel = null;

    async function setup() {
      if (!roomId) return;
      if (!supabase) return;

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      // Best-effort profile fetch (RLS should allow own row).
      let username = user.email ?? user.id;
      let avatar_url = null;
      try {
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('username,avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        if (!error && prof) {
          username = prof.username ?? username;
          avatar_url = prof.avatar_url ?? null;
        }
      } catch {
        // ignore profile RLS issues; presence still works via username/email fallback
      }

      meRef.current = { id: user.id, username, avatar_url };

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

        const byId = new Map();
        for (const m of out) byId.set(m.user_id, m);

        if (alive) setMembers(Array.from(byId.values()));
      });

      channel.on('broadcast', { event: 'video-sync' }, ({ payload }) => {
        const me = meRef.current;
        if (!me) return;
        if (!payload) return;
        if (payload.user_id === me.id) return;
        if (typeof payload.timestamp !== 'number' && typeof payload.timestamp !== 'string') return;

        // Mark next local VidKing PLAYER_EVENT as programmatic so Player doesn't broadcast back.
        isProgrammaticEvent.current = true;

        onRemoteVideoSync?.({
          state: payload.state,
          timestamp: Number(payload.timestamp),
          user_id: payload.user_id
        });
      });

      channel.on('broadcast', { event: 'chat-message' }, ({ payload }) => {
        if (!payload) return;
        const messageId = payload.message_id;
        if (!messageId) return;

        if (seenMessageIdsRef.current.has(messageId)) return;
        seenMessageIdsRef.current.add(messageId);

        const msg = {
          message_id: messageId,
          user_id: payload.user_id,
          username: safeString(payload.username) || 'Unknown',
          avatar_url: payload.avatar_url ?? null,
          message: safeString(payload.message),
          created_at: payload.created_at ?? new Date().toISOString()
        };

        setMessages((prev) => [...prev, msg]);
      });

      await channel.subscribe((status) => {
        if (!alive) return;
        if (status === 'SUBSCRIBED') {
          setConnected(true);
          channel.track({
            user_id: user.id,
            username,
            avatar_url,
            status: 'online'
          });
        }
      });
    }

    setup().catch(() => {});

    return () => {
      alive = false;
      if (channel) supabase.removeChannel(channel);
      channelRef.current = null;
      meRef.current = null;
      setConnected(false);
    };
  }, [roomId, onRemoteVideoSync]);

  return {
    connected,
    members,
    messages,
    sendVideoSync,
    sendChatMessage,
    isProgrammaticEvent
  };
}

