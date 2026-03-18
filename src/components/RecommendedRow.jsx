import React from 'react';
import MediaCard from './MediaCard.jsx';
import { useProgress } from '../context/ProgressContext.jsx';
import { useRatings } from '../context/RatingContext.jsx';
import {
  getMovieDetails,
  getTvDetails,
  getMovieKeywords,
  getTvKeywords,
  getSimilarMovies,
  getSimilarTv,
  discoverAdvanced
} from '../api/tmdb.js';

function RowSection({ title, items }) {
  const scrollRef = React.useRef(null);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const amount =
        direction === 'left' ? -current.offsetWidth : current.offsetWidth;
      current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section className="group relative">
      <div className="mx-auto w-full max-w-7xl px-4 pb-4 pt-4 md:px-10 md:pb-6">
        <h2 className="aura-section-title mb-3">{title}</h2>
        <div className="relative">
          <div
            ref={scrollRef}
            className="no-scrollbar flex gap-3 overflow-x-auto pb-1 scroll-smooth"
          >
            {items.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                mediaType={item.media_type}
                layoutType="portrait"
              />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-black/70 via-black/20 to-transparent opacity-0 transition group-hover:opacity-100 md:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-black/70 via-black/20 to-transparent opacity-0 transition group-hover:opacity-100 md:block" />

          <div className="absolute inset-y-0 left-0 hidden items-center pl-2 opacity-0 transition group-hover:opacity-100 md:flex">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="aura-icon-button"
              aria-label="Scroll left"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          <div className="absolute inset-y-0 right-0 hidden items-center pr-2 opacity-0 transition group-hover:opacity-100 md:flex">
            <button
              type="button"
              onClick={() => scroll('right')}
              className="aura-icon-button"
              aria-label="Scroll right"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function RecommendedRow() {
  const { metadataById } = useProgress();
  const { ratings } = useRatings();

  const [similarRow, setSimilarRow] = React.useState(null);
  const [keywordRow, setKeywordRow] = React.useState(null);
  const [genreRow, setGenreRow] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const ratedItems = React.useMemo(() => {
    return Object.entries(ratings).map(([id, entry]) => {
      const value = typeof entry === 'string' ? entry : entry.value;
      const ts = typeof entry === 'string' ? 0 : entry.ts || 0;
      const meta = metadataById?.[id];
      return {
        id,
        value,
        ts,
        meta
      };
    });
  }, [metadataById, ratings]);

  const likedMetas = React.useMemo(
    () =>
      ratedItems
        .filter((r) => (r.value === 'like' || r.value === 'love') && r.meta)
        .map((r) => ({
          id: r.id,
          title: r.meta.title,
          mediaType: r.meta.media_type
        })),
    [ratedItems]
  );

  React.useEffect(() => {
    if (!likedMetas.length) return;

    let cancelled = false;

    async function buildRecommendations() {
      setLoading(true);
      try {
        const genreScores = {};
        const keywordScores = {};
        const dislikedGenres = new Set();

        const recentCutoff = [...ratedItems]
          .filter((r) => r.value === 'like' || r.value === 'love')
          .sort((a, b) => b.ts - a.ts)
          .slice(0, 5)
          .map((r) => r.id);

        const getWeight = (id, value) => {
          let base = 0;
          if (value === 'love') base = 10;
          else if (value === 'like') base = 3;
          else if (value === 'dislike') base = -20;

          if (recentCutoff.includes(id) && base > 0) {
            base *= 2; // recency bias
          }
          return base;
        };

        // Collect detailed info
        const detailCache = {};

        const topRated = [...ratedItems]
          .filter((r) => r.meta)
          .sort((a, b) => b.ts - a.ts)
          .slice(0, 10);

        for (const r of topRated) {
          const { id, value, meta } = r;
          const weight = getWeight(id, value);
          if (!weight) continue;

          try {
            const details =
              meta.media_type === 'movie'
                ? await getMovieDetails(meta.id)
                : await getTvDetails(meta.id);

            detailCache[id] = details;

            (details.genres || []).forEach((g) => {
              if (!g || !g.id) return;
              const key = String(g.id);
              genreScores[key] = (genreScores[key] || 0) + weight;
              if (value === 'dislike') {
                dislikedGenres.add(key);
              }
            });

            if (value === 'like' || value === 'love') {
              const keywords =
                meta.media_type === 'movie'
                  ? await getMovieKeywords(meta.id)
                  : await getTvKeywords(meta.id);

              (keywords || []).forEach((kw) => {
                if (!kw || !kw.id) return;
                const k = String(kw.id);
                keywordScores[k] = (keywordScores[k] || 0) + weight;
              });
            }
          } catch {
            // ignore failed detail
          }
        }

        const likedIdSet = new Set(
          ratedItems
            .filter((r) => r.value === 'like' || r.value === 'love')
            .map((r) => Number(r.id))
        );

        // 1) Because you loved [last loved]
        const lastLoved = [...ratedItems]
          .filter((r) => r.value === 'love' && r.meta)
          .sort((a, b) => b.ts - a.ts)[0];

        if (lastLoved) {
          const meta = lastLoved.meta;
          const similar =
            meta.media_type === 'movie'
              ? await getSimilarMovies(meta.id)
              : await getSimilarTv(meta.id);

          const normalized = (similar || [])
            .filter((i) => i && i.id && !likedIdSet.has(Number(i.id)))
            .slice(0, 20)
            .map((item) => ({
              id: item.id,
              title: item.title || item.name,
              name: item.title || item.name,
              poster_path: item.poster_path,
              media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie')
            }));

          if (normalized.length) {
            setSimilarRow({
              title: `Because you loved ${meta.title}`,
              items: normalized
            });
          }
        }

        // 2) Deep into [keyword]
        const topKeyword = Object.entries(keywordScores)
          .sort((a, b) => b[1] - a[1])[0];

        if (topKeyword) {
          const [keywordId] = topKeyword;
          const keywordResults = await discoverAdvanced({
            mediaType: 'movie',
            with_keywords: keywordId,
            without_genres: Array.from(dislikedGenres).join(',')
          });

          const normalized = (keywordResults || [])
            .filter((i) => i && i.id && !likedIdSet.has(Number(i.id)))
            .slice(0, 20)
            .map((item) => ({
              id: item.id,
              title: item.title || item.name,
              name: item.title || item.name,
              poster_path: item.poster_path,
              media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie')
            }));

          if (normalized.length) {
            setKeywordRow({
              title: 'Deep into what you love',
              items: normalized
            });
          }
        }

        // 3) Hidden gems in [genre]
        const topGenre = Object.entries(genreScores)
          .sort((a, b) => b[1] - a[1])[0];

        if (topGenre) {
          const [genreId] = topGenre;

          const hiddenGems = await discoverAdvanced({
            mediaType: 'movie',
            with_genres: genreId,
            without_genres: Array.from(dislikedGenres).join(','),
            vote_count_gte: 100,
            vote_average_gte: 7
          });

          const normalized = (hiddenGems || [])
            .filter((i) => i && i.id && !likedIdSet.has(Number(i.id)))
            .slice(0, 20)
            .map((item) => ({
              id: item.id,
              title: item.title || item.name,
              name: item.title || item.name,
              poster_path: item.poster_path,
              media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie')
            }));

          if (normalized.length) {
            setGenreRow({
              title: 'Hidden gems in your favorite genres',
              items: normalized
            });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    buildRecommendations();

    return () => {
      cancelled = true;
    };
  }, [likedMetas]);

  if (!ratedItems.length) return null;

  const rows = [similarRow, keywordRow, genreRow].filter(Boolean);
  if (!rows.length) return null;

  return (
    <>
      {rows.map((row) => (
        <RowSection key={row.title} title={row.title} items={row.items} />
      ))}
    </>
  );
}

export default RecommendedRow;

