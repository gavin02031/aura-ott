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
import { getGroqPersonalizedPicks } from '../api/groqRecommendations.js';

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

          <div className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
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

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
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
  const [aiRow, setAiRow] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const ratedItems = React.useMemo(() => {
    return Object.entries(ratings)
      .map(([mediaKey, entry]) => {
        // RatingContext stores:
        // - movie:<tmdbId>
        // - tv:<tmdbId>
        // Older localStorage could store raw ids; handle both.
        const parts = String(mediaKey).split(':');
        const isNamespaced = parts.length === 2 && (parts[0] === 'movie' || parts[0] === 'tv');
        const tmdbId = isNamespaced ? parts[1] : mediaKey;

        const value = typeof entry === 'string' ? entry : entry.value;
        const ts = typeof entry === 'string' ? 0 : entry.ts || 0;
        const meta = metadataById?.[tmdbId];

        return {
          id: tmdbId,
          value,
          ts,
          meta
        };
      })
      .filter((r) => r && r.id);
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
        if (cancelled) return;
        const genreScores = {};
        const keywordScores = {};
        const dislikedGenres = new Set();
        let similarItemsLocal = [];
        let keywordItemsLocal = [];
        let genreItemsLocal = [];

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
          const lovedDetails =
            meta.media_type === 'movie'
              ? await getMovieDetails(meta.id)
              : await getTvDetails(meta.id);
          const lovedLanguage = lovedDetails?.original_language || null;
          const lovedGenreSet = new Set(
            (lovedDetails?.genres || []).map((g) => Number(g.id)).filter(Boolean)
          );

          const scoreAgainstLoved = (item) => {
            // Keep recommendations close to seed vibe:
            // same media type > same language > genre overlap > popularity.
            let score = 0;
            if ((item.media_type || (item.first_air_date ? 'tv' : 'movie')) === meta.media_type) {
              score += 12;
            }
            if (lovedLanguage && item.original_language === lovedLanguage) {
              score += 10;
            } else if (lovedLanguage && item.original_language !== lovedLanguage) {
              score -= 8;
            }

            const itemGenreIds = Array.isArray(item.genre_ids) ? item.genre_ids : [];
            let overlap = 0;
            for (const gid of itemGenreIds) {
              if (lovedGenreSet.has(Number(gid))) overlap += 1;
            }
            score += overlap * 4;

            // Very soft popularity tie-break.
            score += Math.min(5, Math.floor((item.popularity || 0) / 150));
            return score;
          };

          const similar =
            meta.media_type === 'movie'
              ? await getSimilarMovies(meta.id)
              : await getSimilarTv(meta.id);

          const normalized = (similar || [])
            .filter((i) => i && i.id && !likedIdSet.has(Number(i.id)))
            .map((item) => ({ item, score: scoreAgainstLoved(item) }))
            .sort((a, b) => b.score - a.score)
            .map((s) => s.item)
            .slice(0, 20)
            .map((item) => ({
              id: item.id,
              title: item.title || item.name,
              name: item.title || item.name,
              poster_path: item.poster_path,
              media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
              original_language: item.original_language,
              genre_ids: item.genre_ids,
              overview: item.overview
            }));

          if (normalized.length) {
            similarItemsLocal = normalized;
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
            keywordItemsLocal = normalized;
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
            genreItemsLocal = normalized;
            setGenreRow({
              title: 'Hidden gems in your favorite genres',
              items: normalized
            });
          }
        }

        // AI two-stage personalization:
        // Stage 1 + 2 are both handled by the edge function using liked data + candidate pool.
        const likedForAi = topRated
          .filter((r) => r.meta && (r.value === 'like' || r.value === 'love'))
          .map((r) => {
            const details = detailCache[r.id];
            const genres = (details?.genres || []).map((g) => g?.name).filter(Boolean);
            return {
              id: Number(r.meta.id),
              title: r.meta.title,
              mediaType: r.meta.media_type,
              genres,
              overview: details?.overview || ''
            };
          })
          .slice(0, 20);

        const candidateMap = new Map();
        const pushCandidate = (item) => {
          if (!item?.id) return;
          const key = `${item.media_type || 'movie'}:${item.id}`;
          if (!candidateMap.has(key)) candidateMap.set(key, item);
        };
        similarItemsLocal.forEach(pushCandidate);
        keywordItemsLocal.forEach(pushCandidate);
        genreItemsLocal.forEach(pushCandidate);

        // If the rows above haven't committed state yet in this render,
        // also include normalized arrays directly by looking at current temp variables:
        // no-op fallback: we can rebuild from rating-based path if map is empty.
        if (candidateMap.size === 0) {
          // lightweight fallback pool from genre discover
          const fallbackGenre = Object.entries(genreScores)
            .sort((a, b) => b[1] - a[1])[0]?.[0];
          if (fallbackGenre) {
            const fallback = await discoverAdvanced({
              mediaType: 'movie',
              with_genres: fallbackGenre,
              without_genres: Array.from(dislikedGenres).join(',')
            });
            (fallback || [])
              .slice(0, 30)
              .forEach((item) =>
                pushCandidate({
                  id: item.id,
                  title: item.title || item.name,
                  name: item.title || item.name,
                  poster_path: item.poster_path,
                  media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
                  overview: item.overview,
                  genre_ids: item.genre_ids,
                  vote_average: item.vote_average,
                  popularity: item.popularity
                })
              );
          }
        }

        // Build a cleaner AI pool:
        // - favor candidates close to what was recently loved
        // - down-rank language outliers
        const lovedLanguages = new Set(
          topRated
            .filter((r) => (r.value === 'love' || r.value === 'like') && detailCache[r.id]?.original_language)
            .map((r) => detailCache[r.id].original_language)
        );
        const candidateArr = Array.from(candidateMap.values())
          .map((c) => {
            const lang = c.original_language;
            const langPenalty =
              lovedLanguages.size > 0 && lang && !lovedLanguages.has(lang) ? -6 : 0;
            const base = Number(c.popularity || 0) / 200;
            return { c, score: base + langPenalty };
          })
          .sort((a, b) => b.score - a.score)
          .map((x) => x.c)
          .slice(0, 140);
        if (likedForAi.length && candidateArr.length) {
          const ai = await getGroqPersonalizedPicks({
            likedItems: likedForAi,
            candidates: candidateArr,
            limitPerRow: 15,
            avoidStrength: 'strong'
          });

          if (!ai && !cancelled) {
            // eslint-disable-next-line no-console
            console.warn('AI personalization unavailable; using heuristic rows.');
          }

          if (!cancelled && ai?.picks?.length) {
            const byId = new Map(candidateArr.map((c) => [Number(c.id), c]));
            const ranked = ai.picks
              .map((id) => byId.get(Number(id)))
              .filter(Boolean)
              .slice(0, 15);

            if (ranked.length) {
              setAiRow({
                title: ai.rowTitle || 'Tailored for you',
                items: ranked
              });
            }
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

  const rows = [aiRow, similarRow, keywordRow, genreRow].filter(Boolean);
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

