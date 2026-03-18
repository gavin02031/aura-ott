import React from 'react';

const ProfileContext = React.createContext();

export function ProfileProvider({ children }) {
  const [profiles, setProfiles] = React.useState([
    {
      id: 1,
      name: 'Gavin',
      avatar: '/gavin.png'
    },
    {
      id: 2,
      name: 'Guest',
      avatar: '/guest.jpg'
    }
  ]);

  const [currentProfile, setCurrentProfile] = React.useState(null);

  const selectProfile = (profile) => {
    setCurrentProfile(profile);
  };

  return (
    <ProfileContext.Provider value={{ profiles, currentProfile, selectProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfiles = () => React.useContext(ProfileContext);
