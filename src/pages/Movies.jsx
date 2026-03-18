import React from 'react';
import MediaRow from '../components/MediaRow';
import ContinueWatchingRow from '../components/ContinueWatchingRow';

function Movies() {
  return (
    <div className="space-y-4 pb-10">
        <h1 className="px-4 pt-24 text-3xl font-extrabold tracking-[-0.02em] md:px-10">Movies</h1>
        <ContinueWatchingRow />
        <MediaRow title="Popular on Aura" providerId={8} mediaType="movie" />
        <MediaRow title="Action & Adventure" mediaType="movie" with_genres="28,12" />
        <MediaRow title="Comedies" mediaType="movie" with_genres="35" />
        <MediaRow title="Sci-Fi" mediaType="movie" with_genres="878" />
    </div>
  );
}

export default Movies;