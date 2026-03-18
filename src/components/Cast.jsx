import React from 'react';
import { getImageUrl } from '../api/tmdb.js';

function Cast({ cast }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cast.map((person) => {
        const photo = getImageUrl(person.profile_path, 'w185');
        return (
          <div
            key={person.id}
            className="aura-panel flex items-center gap-3 p-3"
          >
            {photo ? (
              <img
                src={photo}
                alt={person.name}
                className="h-12 w-12 flex-shrink-0 rounded-full object-cover ring-1 ring-white/10"
                loading="lazy"
              />
            ) : (
              <div className="h-12 w-12 flex-shrink-0 rounded-full bg-zinc-800 ring-1 ring-white/10" />
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-100">
                {person.name}
              </p>
              <p className="truncate text-xs text-gray-300">
                {person.character}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Cast;
