import React from 'react';
import MediaRow from '../components/MediaRow';
import ContinueWatchingRow from '../components/ContinueWatchingRow';

function TVShows() {
  return (
    <div className="space-y-4 pb-10">
        <h1 className="px-4 pt-24 text-3xl font-extrabold tracking-[-0.02em] md:px-10">TV Shows</h1>
        <ContinueWatchingRow />
        <MediaRow title="Popular on Aura" providerId={8} mediaType="tv" />
        <MediaRow title="Trending on Hulu" providerId={15} mediaType="tv" />
        <MediaRow title="Documentaries" mediaType="tv" with_genres="99" />
        <MediaRow title="Animation" mediaType="tv" with_genres="16" />
    </div>
  );
}

export default TVShows;