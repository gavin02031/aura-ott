import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfiles } from '../context/ProfileContext.jsx';

function Profiles() {
  const { profiles, selectProfile } = useProfiles();
  const navigate = useNavigate();

  const handleProfileSelect = (profile) => {
    selectProfile(profile);
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-aura-bg">
      <h1 className="text-4xl font-bold mb-8">Who's watching?</h1>
      <div className="flex gap-8">
        {profiles.map(profile => (
          <div key={profile.id} onClick={() => handleProfileSelect(profile)} className="flex flex-col items-center gap-4 cursor-pointer">
            <img src={profile.avatar} alt={profile.name} className="w-32 h-32 rounded-full object-cover" />
            <p className="text-xl">{profile.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Profiles;
