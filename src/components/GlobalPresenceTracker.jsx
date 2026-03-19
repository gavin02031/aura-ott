import React from 'react';
import { usePresence } from '../hooks/usePresence.js';

/**
 * Mounts presence tracking for the current user globally.
 * Without this, online friend indicators only work while Friends UI is open.
 */
export default function GlobalPresenceTracker() {
  // We intentionally ignore the returned arrays; mounting the hook starts tracking.
  usePresence();
  return null;
}

