import React from 'react';

const ProgressContext = React.createContext(null);

const PROGRESS_KEY = 'vidRockProgress';
const METADATA_KEY = 'vidRockMetadata';

function readLocalArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readLocalObject(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function ProgressProvider({ children }) {
  const [progressItems, setProgressItems] = React.useState(() =>
    typeof window === 'undefined' ? [] : readLocalArray(PROGRESS_KEY)
  );

  const [metadataById, setMetadataById] = React.useState(() =>
    typeof window === 'undefined' ? {} : readLocalObject(METADATA_KEY)
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event) => {
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
      const id = data.id;
      const mediaType = data.mediaType;
      const currentTime = data.currentTime;
      const duration = data.duration;

      if (!id || !mediaType) return;
      if (typeof currentTime !== 'number' || typeof duration !== 'number') return;

      setProgressItems((prev) => {
        const newItems = Array.isArray(prev) ? [...prev] : [];
        const itemIndex = newItems.findIndex((i) => String(i.id) === String(id));

        let item = itemIndex > -1 ? { ...newItems[itemIndex] } : { id: String(id) };
        item.last_updated = Date.now();

        if (mediaType === 'movie') {
          item.progress = { watched: currentTime, duration };
        } else if (mediaType === 'tv') {
          const season = data.season;
          const episode = data.episode;
          if (typeof season === 'number' && typeof episode === 'number') {
            item.last_season_watched = season;
            item.last_episode_watched = episode;
            item.show_progress = {
              ...item.show_progress,
              [`s${season}e${episode}`]: {
                season,
                episode,
                progress: { watched: currentTime, duration },
                last_updated: Date.now()
              }
            };
          }
        }

        if (itemIndex > -1) newItems[itemIndex] = item;
        else newItems.unshift(item);

        try {
          localStorage.setItem(PROGRESS_KEY, JSON.stringify(newItems));
        } catch {
          // ignore
        }

        return newItems;
      });
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const upsertMetadata = React.useCallback((id, meta) => {
    if (!id || !meta) return;
    setMetadataById((prev) => {
      const next = {
        ...prev,
        [id]: {
          ...prev[id],
          ...meta
        }
      };
      try {
        localStorage.setItem(METADATA_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const updateProgress = React.useCallback((id, data) => {
    if (!id || !data) return;

    setProgressItems(prev => {
      const newItems = [...prev];
      const itemIndex = newItems.findIndex(i => String(i.id) === String(id));

      let item = itemIndex > -1 ? { ...newItems[itemIndex] } : { id: id };

      item.last_updated = Date.now();

      if (data.media_type === 'movie') {
        item.progress = data.progress;
      } else if (data.media_type === 'tv') {
        item.last_season_watched = data.season;
        item.last_episode_watched = data.episode;
        item.show_progress = {
          ...item.show_progress,
          [`s${data.season}e${data.episode}`]: {
            season: data.season,
            episode: data.episode,
            progress: data.progress,
            last_updated: Date.now(),
          }
        };
      }

      if (itemIndex > -1) {
        newItems[itemIndex] = item;
      } else {
        newItems.unshift(item);
      }
      
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(newItems));
      } catch {}

      return newItems;
    });
  }, []);

  const value = React.useMemo(
    () => ({
      progressItems,
      metadataById,
      upsertMetadata,
      updateProgress
    }),
    [progressItems, metadataById, upsertMetadata, updateProgress]
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = React.useContext(ProgressContext);
  if (!ctx) {
    throw new Error('useProgress must be used within ProgressProvider');
  }
  return ctx;
}

