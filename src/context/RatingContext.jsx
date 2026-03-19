import React from 'react';
import { supabase } from '../lib/supabase.js';

const STORAGE_KEY = 'aura.ratings.v1';

const RatingContext = React.createContext(null);

function readStoredRatings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeRatingsMap(base) {
  // Normalize legacy string values into { value, ts }
  const normalized = {};
  Object.entries(base ?? {}).forEach(([key, entry]) => {
    if (typeof entry === 'string') {
      normalized[key] = { value: entry, ts: 0 };
    } else if (entry && typeof entry === 'object') {
      normalized[key] = {
        value: entry.value,
        ts: entry.ts || 0
      };
    }
  });
  return normalized;
}

export function RatingProvider({ children }) {
  const [ratings, setRatings] = React.useState(() => {
    const base =
      typeof window === 'undefined' ? {} : normalizeRatingsMap(readStoredRatings());
    return base;
  });

  const [userId, setUserId] = React.useState(null);
  const [dbLoading, setDbLoading] = React.useState(false);

  const loadRatingsFromDb = React.useCallback(async (uid) => {
    if (!uid) return;
    if (!supabase) return;

    setDbLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('media_key,rating,updated_at')
        .eq('user_id', uid);

      if (error) throw error;

      const next = {};
      for (const row of data ?? []) {
        const ts = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
        next[String(row.media_key)] = { value: row.rating, ts };
      }

      setRatings(next);
    } catch (err) {
      // If DB isn't set up yet, don't brick the whole app.
      // eslint-disable-next-line no-console
      console.error('Failed to load ratings from DB', err);
    } finally {
      setDbLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!supabase) return;
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user ?? null;
      if (!alive) return;
      setUserId(user?.id ?? null);
      if (user?.id) await loadRatingsFromDb(user.id);
    };

    run().catch(() => {});

    if (!supabase) return () => {};

    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUid = session?.user?.id ?? null;
      setUserId(nextUid);
      if (nextUid) loadRatingsFromDb(nextUid);
      else setRatings(normalizeRatingsMap(readStoredRatings()));
    });

    return () => {
      alive = false;
      sub?.data?.subscription?.unsubscribe?.();
    };
  }, [loadRatingsFromDb]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
    } catch {
      // ignore
    }
  }, [ratings]);

  const setRating = React.useCallback(
    async (mediaKey, value) => {
      if (!mediaKey) return;

      // Update UI optimistically
      setRatings((prev) => {
        const next = { ...prev };
        if (!value) {
          delete next[mediaKey];
        } else {
          next[mediaKey] = { value, ts: Date.now() };
        }
        return next;
      });

      if (!supabase) return;
      if (!userId) return;

      try {
        if (!value) {
          await supabase.from('user_ratings').delete().eq('user_id', userId).eq('media_key', mediaKey);
        } else {
          await supabase
            .from('user_ratings')
            .upsert(
              { user_id: userId, media_key: mediaKey, rating: value },
              { onConflict: 'user_id,media_key' }
            );
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to persist rating', err);
      }
    },
    [userId]
  );

  const getRating = React.useCallback(
    (mediaKey) => {
      if (!mediaKey) return null;
      const entry = ratings[mediaKey];
      if (!entry) return null;
      return entry?.value ?? null;
    },
    [ratings]
  );

  const value = React.useMemo(
    () => ({
      ratings,
      getRating,
      setRating,
      dbLoading
    }),
    [ratings, getRating, setRating, dbLoading]
  );

  return <RatingContext.Provider value={value}>{children}</RatingContext.Provider>;
}

export function useRatings() {
  const ctx = React.useContext(RatingContext);
  if (!ctx) {
    throw new Error('useRatings must be used within RatingProvider');
  }
  return ctx;
}

