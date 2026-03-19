import React from 'react';
import { supabase } from '../lib/supabase.js';

const ProfileContext = React.createContext();

async function fetchCurrentProfile(user) {
  const { data: prof, error } = await supabase
    .from('profiles')
    .select('id,username,avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  // If the trigger didn't run for any reason, create a minimal profile row.
  if (!prof) {
    const fallbackUsername = user.email ? user.email.split('@')[0] : 'User';
    const { data: inserted, error: insErr } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: fallbackUsername,
        avatar_url: null
      })
      .select('id,username,avatar_url')
      .single();

    if (insErr) throw insErr;
    return {
      id: inserted.id,
      name: inserted.username ?? fallbackUsername,
      avatar: inserted.avatar_url ?? '/default-avatar.png'
    };
  }

  return {
    id: prof.id,
    name: prof.username ?? (user.email ? user.email.split('@')[0] : 'User'),
    avatar: prof.avatar_url ?? '/default-avatar.png'
  };
}

export function ProfileProvider({ children }) {
  const [profiles, setProfiles] = React.useState([]);
  const [currentProfile, setCurrentProfile] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  const selectProfile = (profile) => {
    // Local-only override used by the existing Profile avatar uploader.
    setCurrentProfile(profile);
    setProfiles(profile ? [{ id: profile.id, name: profile.name, avatar: profile.avatar }] : []);
  };

  React.useEffect(() => {
    let alive = true;

    const load = async () => {
      setAuthLoading(true);
      try {
        if (!supabase) {
          setCurrentProfile(null);
          setProfiles([]);
          return;
        }

        const { data: authData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        const user = authData?.user;
        if (!user) {
          if (!alive) return;
          setCurrentProfile(null);
          setProfiles([]);
          return;
        }

        const prof = await fetchCurrentProfile(user);
        if (!alive) return;
        setCurrentProfile(prof);
        setProfiles([{ id: prof.id, name: prof.name, avatar: prof.avatar }]);
      } catch (e) {
        if (!alive) return;
        // eslint-disable-next-line no-console
        console.error('Failed to load profile:', e);
        setCurrentProfile(null);
        setProfiles([]);
      } finally {
        if (alive) setAuthLoading(false);
      }
    };

    load();

    const { data: authSub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!alive) return;
      if (!session?.user) {
        setCurrentProfile(null);
        setProfiles([]);
        return;
      }
      try {
        const prof = await fetchCurrentProfile(session.user);
        setCurrentProfile(prof);
        setProfiles([{ id: prof.id, name: prof.name, avatar: prof.avatar }]);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to refresh profile:', e);
      }
    });

    return () => {
      alive = false;
      authSub?.subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        currentProfile,
        selectProfile,
        authLoading
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfiles = () => React.useContext(ProfileContext);
