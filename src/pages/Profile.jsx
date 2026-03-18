import React from 'react';
import { useProfiles } from '../context/ProfileContext.jsx';

function Profile() {
  const { currentProfile, selectProfile } = useProfiles();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newProfile = { ...currentProfile, avatar: reader.result };
        selectProfile(newProfile);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!currentProfile) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 md:px-10">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="rounded-lg bg-zinc-900/40 p-5 ring-1 ring-white/10">
        <div className="flex items-center gap-4">
          <img
            src={currentProfile.avatar}
            alt={currentProfile.name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{currentProfile.name}</h2>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4" />
    </div>
  );
}

export default Profile;
