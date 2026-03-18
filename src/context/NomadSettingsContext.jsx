import React from 'react';

const STORAGE_KEY = 'aura.nomadSettings.v1';

const defaultSettings = {
  nomadModeEnabled: false,
  dataSaverEnabled: false,
  downloadOnWifiOnly: true,
  downloadOnlyWhileCharging: false,
  overnightWindowEnabled: true,
  overnightStart: '01:00',
  overnightEnd: '05:00',
  maxOfflineStorageGB: 30
};

const NomadSettingsContext = React.createContext({
  settings: defaultSettings,
  setSettings: () => {}
});

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function NomadSettingsProvider({ children }) {
  const [settings, setSettings] = React.useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? safeParse(raw) : null;
    return parsed ? { ...defaultSettings, ...parsed } : defaultSettings;
  });

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const value = React.useMemo(
    () => ({
      settings,
      setSettings
    }),
    [settings]
  );

  return (
    <NomadSettingsContext.Provider value={value}>
      {children}
    </NomadSettingsContext.Provider>
  );
}

export function useNomadSettings() {
  const ctx = React.useContext(NomadSettingsContext);
  return ctx;
}

