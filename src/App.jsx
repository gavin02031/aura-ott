import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Player from './pages/Player.jsx';
import Header from './components/Header.jsx';
import TrailerModal from './components/TrailerModal.jsx';
import { ProgressProvider } from './context/ProgressContext.jsx';
import { MyListProvider } from './context/MyListContext.jsx';
import { ProfileProvider, useProfiles } from './context/ProfileContext.jsx';
import { NomadSettingsProvider } from './context/NomadSettingsContext.jsx';
import { RatingProvider } from './context/RatingContext.jsx';
import TVShows from './pages/TVShows.jsx';
import Movies from './pages/Movies.jsx';
import MyList from './pages/MyList.jsx';
import Search from './pages/Search.jsx';
import Profile from './pages/Profile.jsx';
import Profiles from './pages/Profiles.jsx';
import Startup from './components/Startup.jsx';
import Sidebar from './components/Sidebar.jsx';
<<<<<<< HEAD
import FriendsSidebar from './components/FriendsSidebar.jsx';
import WatchPartyInvitesLayer from './components/WatchPartyInvitesLayer.jsx';
import GlobalPresenceTracker from './components/GlobalPresenceTracker.jsx';
=======
>>>>>>> 5ec29865a04809525563001a85cf81720ec3dff0

function App() {
  return (
    <ProfileProvider>
      <NomadSettingsProvider>
        <RatingProvider>
          <AppContent />
        </RatingProvider>
      </NomadSettingsProvider>
    </ProfileProvider>
  )
}

function AppContent() {
  const { currentProfile } = useProfiles();
  const [showStartup, setShowStartup] = React.useState(true);
  const [showSearch, setShowSearch] = React.useState(false);
<<<<<<< HEAD
  const [showFriends, setShowFriends] = React.useState(false);
=======
>>>>>>> 5ec29865a04809525563001a85cf81720ec3dff0
  const [trailerState, setTrailerState] = React.useState({
    open: false,
    item: null
  });

  const handleStartupFinish = () => {
    setShowStartup(false);
  };

  const openTrailer = (item) => {
    setTrailerState({
      open: true,
      item
    });
  };

  const closeTrailer = () => {
    setTrailerState((prev) => ({ ...prev, open: false }));
  };

<<<<<<< HEAD
  const invitesLayer = <WatchPartyInvitesLayer enabled />;

  if (showStartup) {
    return (
      <>
        {invitesLayer}
        <Startup onFinished={handleStartupFinish} />
      </>
    );
  }

  if (!currentProfile) {
    return (
      <>
        {invitesLayer}
        <Profiles />
      </>
    );
=======
  if (showStartup) {
    return <Startup onFinished={handleStartupFinish} />;
  }

  if (!currentProfile) {
    return <Profiles />;
>>>>>>> 5ec29865a04809525563001a85cf81720ec3dff0
  }

  return (
    <ProgressProvider>
      <MyListProvider>
<<<<<<< HEAD
        <GlobalPresenceTracker />
        {invitesLayer}
        <div className="min-h-screen bg-aura-bg text-white">
          <Sidebar
            onOpenSearch={() => setShowSearch(true)}
            onOpenFriends={() => setShowFriends(true)}
          />
          <div className="md:hidden">
            <Header
              onOpenSearch={() => setShowSearch(true)}
              onOpenFriends={() => setShowFriends(true)}
            />
=======
        <div className="min-h-screen bg-aura-bg text-white">
          <Sidebar onOpenSearch={() => setShowSearch(true)} />
          <div className="md:hidden">
            <Header onOpenSearch={() => setShowSearch(true)} />
>>>>>>> 5ec29865a04809525563001a85cf81720ec3dff0
          </div>
          <main className="pt-16 md:pt-0 md:pl-20">
            <Routes>
              <Route path="/" element={<Home onWatchTrailer={openTrailer} />} />
              <Route path="/tv-shows" element={<TVShows />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/my-list" element={<MyList />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/movie/:id" element={<Player type="movie" />} />
              <Route path="/tv/:id/season/:seasonNumber/episode/:episodeNumber" element={<Player type="tv" />} />
            </Routes>
          </main>

          {trailerState.open && (
            <TrailerModal item={trailerState.item} onClose={closeTrailer} />
          )}

          {showSearch && (
            <Search
              open={showSearch}
              onClose={() => setShowSearch(false)}
            />
          )}
<<<<<<< HEAD

          {showFriends && (
            <FriendsSidebar
              open={showFriends}
              onClose={() => setShowFriends(false)}
            />
          )}
=======
>>>>>>> 5ec29865a04809525563001a85cf81720ec3dff0
        </div>
      </MyListProvider>
    </ProgressProvider>
  );
}

export default App;

