import React from 'react';
import HeroBanner from '../components/HeroBanner.jsx';
import MediaRow from '../components/MediaRow.jsx';
import ContinueWatchingRow from '../components/ContinueWatchingRow.jsx';
import RecommendedRow from '../components/RecommendedRow.jsx';
import { getTrendingHero } from '../api/tmdb.js';

function Home({ onWatchTrailer }) {
  const [heroItem, setHeroItem] = React.useState(null);
  const [loadingHero, setLoadingHero] = React.useState(true);
  const [isHeroHovered, setIsHeroHovered] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoadingHero(true);
        const item = await getTrendingHero();
        if (!active) return;
        setHeroItem(item);
      } finally {
        if (active) setLoadingHero(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (isHeroHovered) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const item = await getTrendingHero();
        if (!cancelled && item) {
          setHeroItem(item);
        }
      } catch {
        // ignore rotation errors
      }
    };

    const intervalId = setInterval(tick, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [isHeroHovered]);

  return (
    <div className="space-y-4 pb-10">
      {loadingHero ? (
        <div className="h-[85vh] min-h-[520px] bg-gradient-to-b from-aura-surface2 to-aura-bg" />
      ) : (
        <HeroBanner
          item={heroItem}
          onWatchTrailer={onWatchTrailer}
          onHoverChange={setIsHeroHovered}
        />
      )}

      <ContinueWatchingRow />
      <RecommendedRow />

      <MediaRow title="Popular on Aura" providerId={8} mediaType="movie" />
      <MediaRow title="Trending on Hulu" providerId={15} mediaType="tv" />
      <MediaRow
        title="Disney+ Family & Adventure"
        providerId={337}
        mediaType="movie"
      />
      <MediaRow
        title="Amazon Prime Must‑Watch"
        providerId={9}
        mediaType="movie"
      />
      <MediaRow title="New on Aura" providerId={8} mediaType="tv" />
      <MediaRow title="Action & Adventure" providerId={null} mediaType="movie" with_genres="28,12" />
      <MediaRow title="Comedies" providerId={null} mediaType="movie" with_genres="35" />
      <MediaRow title="Sci-Fi" providerId={null} mediaType="movie" with_genres="878" />
      <MediaRow title="Horror" mediaType="movie" with_genres="27" />
      <MediaRow title="Thrillers" mediaType="movie" with_genres="53" />
      <MediaRow title="Romance" mediaType="movie" with_genres="10749" />
      <MediaRow title="Animation" mediaType="movie" with_genres="16" />
      <MediaRow title="Crime" mediaType="tv" with_genres="80" />
      <MediaRow title="Mystery" mediaType="tv" with_genres="9648" />
      <MediaRow title="Kids" mediaType="tv" with_genres="10762" />
      <MediaRow title="Reality" mediaType="tv" with_genres="10764" />
    </div>
  );
}

export default Home;

