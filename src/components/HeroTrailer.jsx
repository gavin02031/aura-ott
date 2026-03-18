import React from 'react';
import { getTrailer } from '../api/kinocheck.js';
import { useNomadSettings } from '../context/NomadSettingsContext.jsx';

function HeroTrailer({ item, isMuted, controls = false }) {
  const { settings } = useNomadSettings();
  const [trailer, setTrailer] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!item) return;
    if (settings.dataSaverEnabled) return;
    let active = true;

    async function load() {
      try {
        setError(null);
        const trailerData = await getTrailer(item.id, item.media_type);
        if (!active) return;
        setTrailer(trailerData);
        if (!trailerData) {
          setError('No trailer found on KinoCheck.');
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load trailer.');
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [item, settings.dataSaverEnabled]);

  if (error || !trailer) {
    return null;
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <iframe
        title={`${item.title || item.name} trailer`}
        src={`https://www.youtube.com/embed/${trailer.youtube_video_id}?autoplay=1&rel=0&controls=${
          controls ? 1 : 0
        }&showinfo=0&mute=${isMuted ? 1 : 0}`}
        allow="autoplay; fullscreen"
        className={`w-full h-full border-none ${controls ? '' : 'pointer-events-none'}`}
      />
    </div>
  );
}

export default HeroTrailer;
