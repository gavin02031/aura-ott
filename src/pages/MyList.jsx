import React from 'react';
import { useMyList } from '../context/MyListContext.jsx';
import MediaCard from '../components/MediaCard.jsx';
import ContinueWatchingRow from '../components/ContinueWatchingRow.jsx';

function MyList() {
  const { myList } = useMyList();

  return (
    <div className="space-y-4 pb-10">
        <h1 className="px-4 pt-24 text-3xl font-extrabold tracking-[-0.02em] md:px-10">My List</h1>
        <ContinueWatchingRow />

        <div className="px-4 md:px-10">
            <h2 className="aura-section-title mb-3">Saved for later</h2>
            {myList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {myList.map(item => (
                        <MediaCard key={item.id} item={item} layoutType="portrait" />
                    ))}
                </div>
            ) : (
                <div className="aura-panel p-6">
                  <p className="text-sm text-aura-muted">
                    Your list is empty.
                  </p>
                  <p className="mt-1 text-sm text-white text-opacity-80">
                    Add shows and movies to keep them here for later.
                  </p>
                </div>
            )}
        </div>
    </div>
  );
}

export default MyList;