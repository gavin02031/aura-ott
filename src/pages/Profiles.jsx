import React from 'react';
import { useProfiles } from '../context/ProfileContext.jsx';
import LoginModal from '../components/LoginModal.jsx';

function Profiles() {
  const { authLoading } = useProfiles();
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    // Keep the modal open until auth completes successfully.
    if (!authLoading) setOpen(true);
  }, [authLoading]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-aura-bg px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-[-0.02em] text-white">
          Aura
        </h1>
        <p className="mt-3 text-sm text-white/60">
          Sign in to enable friends, presence, and watch parties.
        </p>
        <div className="mt-6">
          {/*
            We keep the cinematic modal as the primary experience on this route.
            When the user authenticates, `ProfileContext` will populate `currentProfile`
            and App.jsx will render the main browsing UI.
          */}
          <LoginModal
            open={open}
            onClose={() => setOpen(true)}
            onAuthed={() => setOpen(true)}
          />
        </div>
      </div>
    </div>
  );
}

export default Profiles;
