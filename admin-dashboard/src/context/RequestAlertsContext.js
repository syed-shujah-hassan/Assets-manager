import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchRequests } from '../api';
import { countUnread, markRequestSeen, markAllRequestsSeen } from '../utils/requestReadState';

const RequestAlertsContext = createContext(null);

/** @param {boolean | { announceNew?: boolean; persistBanner?: boolean }} opts */
function parseRefreshOptions(opts) {
  if (opts === true) return { announceNew: true, persistBanner: false };
  if (!opts || opts === false) return { announceNew: false, persistBanner: false };
  return {
    announceNew: !!opts.announceNew,
    persistBanner: !!opts.persistBanner,
  };
}

export function RequestAlertsProvider({ children }) {
  const [requests, setRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popup, setPopup] = useState(null);
  const knownIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);
  const resumeDebounceRef = useRef(null);

  const dismissNewRequestPopup = useCallback(() => setPopup(null), []);

  /** @param {boolean | { announceNew?: boolean; persistBanner?: boolean }} options */
  const refreshRequests = useCallback(async (options = false) => {
    try {
      const { announceNew, persistBanner } = parseRefreshOptions(options);
      const data = await fetchRequests();
      setRequests(data);

      const unread = countUnread(data);
      setUnreadCount(unread);

      const currentIds = new Set(data.map((r) => String(r.id)));

      if (announceNew && !initialLoadRef.current) {
        const newOnes = data.filter((r) => !knownIdsRef.current.has(String(r.id)));
        if (newOnes.length > 0) {
          const first = newOnes[0];
          setPopup({
            count: newOnes.length,
            unreadTotal: unread,
            persist: persistBanner,
            subtitle: first?.location ? `Latest: ${first.location}` : '',
          });
        }
      }

      knownIdsRef.current = currentIds;
      if (initialLoadRef.current) initialLoadRef.current = false;

      return data;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    refreshRequests(false);
    const intervalMs = 12000;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      refreshRequests(true);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [refreshRequests]);

  // Tab / window was in background (minimize, alt-tab, other tab) — refresh as soon as user returns.
  useEffect(() => {
    let wasBackgrounded = typeof document !== 'undefined' && document.visibilityState === 'hidden';

    const onVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'hidden') {
        wasBackgrounded = true;
        return;
      }
      if (wasBackgrounded) {
        wasBackgrounded = false;
        window.clearTimeout(resumeDebounceRef.current);
        resumeDebounceRef.current = window.setTimeout(() => {
          refreshRequests({ announceNew: true, persistBanner: true });
        }, 250);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearTimeout(resumeDebounceRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refreshRequests]);

  // Inline alerts auto-dismiss; popups after leaving the tab stay until dismissed.
  useEffect(() => {
    if (!popup || popup.persist) return undefined;
    const t = window.setTimeout(() => dismissNewRequestPopup(), 15000);
    return () => window.clearTimeout(t);
  }, [popup, dismissNewRequestPopup]);

  const markSeen = useCallback((id) => {
    markRequestSeen(id);
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllSeen = useCallback(() => {
    markAllRequestsSeen(requests);
    setUnreadCount(0);
  }, [requests]);

  return (
    <RequestAlertsContext.Provider
      value={{
        requests,
        unreadCount,
        refreshRequests,
        markSeen,
        markAllSeen,
        newRequestPopup: popup,
        dismissNewRequestPopup,
      }}
    >
      {children}
    </RequestAlertsContext.Provider>
  );
}

export function useRequestAlerts() {
  const ctx = useContext(RequestAlertsContext);
  if (!ctx) {
    throw new Error('useRequestAlerts must be used within RequestAlertsProvider');
  }
  return ctx;
}
