import React from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Presence strategy:
 * - We track current user as "online" in a global presence channel.
 * - We only return users that are accepted friends (from friendships table).
 * - We filter the presenceState payload to those friend IDs.
 */
export function usePresence() {
  const [onlineFriends, setOnlineFriends] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    let channel = null;

    const run = async () => {
      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        if (alive) {
          setOnlineFriends([]);
          setLoading(false);
        }
        return;
      }

      const meId = user.id;

      // Pull username/avatar so presence + UI can show avatars (instead of null).
      const { data: myProfile, error: myProfErr } = await supabase
        .from('profiles')
        .select('username,avatar_url')
        .eq('id', meId)
        .maybeSingle();

      if (myProfErr) throw myProfErr;

      // Find accepted friends so we can filter presence.
      const { data: friendships, error: fErr } = await supabase
        .from('friendships')
        .select('user_id_1,user_id_2')
        .eq('status', 'accepted')
        .or(`user_id_1.eq.${meId},user_id_2.eq.${meId}`);

      if (fErr) throw fErr;

      const friendIds = new Set();
      for (const fr of friendships ?? []) {
        if (fr.user_id_1 === meId) friendIds.add(String(fr.user_id_2));
        else if (fr.user_id_2 === meId) friendIds.add(String(fr.user_id_1));
      }

      // Presence channel
      channel = supabase.channel('global-presence', {
        config: { presence: { key: meId } }
      });

      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const merged = [];

        for (const [key, presences] of Object.entries(state ?? {})) {
          const userId = String(key);
          if (!friendIds.has(userId)) continue;
          if (userId === meId) continue;

          for (const p of presences) {
            merged.push({
              user_id: userId,
              username: p?.username ? String(p.username) : 'Unknown',
              avatar_url: p?.avatar_url ? String(p.avatar_url) : null
            });
          }
        }

        // De-dupe by user_id
        const byId = new Map();
        for (const u of merged) byId.set(u.user_id, u);

        if (alive) setOnlineFriends(Array.from(byId.values()));
      });

      await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user as online for friends to see
          channel.track({
            user_id: meId,
            username:
              myProfile?.username ??
              (user.email ? user.email : meId),
            avatar_url: myProfile?.avatar_url ?? null,
            status: 'online'
          });

          if (alive) setLoading(false);
        }
      });
    };

    run().catch(() => {
      if (alive) setLoading(false);
    });

    return () => {
      alive = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return { onlineFriends, loading };
}

