import React from 'react';

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

export function RatingProvider({ children }) {
  const [ratings, setRatings] = React.useState(() => {
    const base = typeof window === 'undefined' ? {} : readStoredRatings();
    // Normalize legacy string values into { value, ts }
    const normalized = {};
    Object.entries(base).forEach(([id, entry]) => {
      if (typeof entry === 'string') {
        normalized[id] = { value: entry, ts: 0 };
      } else if (entry && typeof entry === 'object') {
        normalized[id] = {
          value: entry.value,
          ts: entry.ts || 0
        };
      }
    });
    return normalized;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
    } catch {
      // ignore
    }
  }, [ratings]);

  const setRating = React.useCallback((id, value) => {
    if (!id) return;
    setRatings((prev) => {
      const next = { ...prev };
      if (!value) {
        delete next[id];
      } else {
        next[id] = { value, ts: Date.now() };
      }
      return next;
    });
  }, []);

  const getRating = React.useCallback(
    (id) => {
      if (!id) return null;
      const entry = ratings[id];
      if (!entry) return null;
      return typeof entry === 'string' ? entry : entry.value || null;
    },
    [ratings]
  );

  const value = React.useMemo(
    () => ({
      ratings,
      getRating,
      setRating
    }),
    [ratings, getRating, setRating]
  );

  return (
    <RatingContext.Provider value={value}>
      {children}
    </RatingContext.Provider>
  );
}

export function useRatings() {
  const ctx = React.useContext(RatingContext);
  if (!ctx) {
    throw new Error('useRatings must be used within RatingProvider');
  }
  return ctx;
}

