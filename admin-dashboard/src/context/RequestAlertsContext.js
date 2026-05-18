import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchRequests } from '../api';
import { countUnread, markRequestSeen, markAllRequestsSeen } from '../utils/requestReadState';

const RequestAlertsContext = createContext(null);

export function RequestAlertsProvider({ children }) {
  const [requests, setRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);
  const knownIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  const refreshRequests = useCallback(async (showNewToast = false) => {
    try {
      const data = await fetchRequests();
      setRequests(data);

      const unread = countUnread(data);
      setUnreadCount(unread);

      if (showNewToast && !initialLoadRef.current) {
        const currentIds = new Set(data.map((r) => String(r.id)));
        const newOnes = data.filter((r) => !knownIdsRef.current.has(String(r.id)));
        if (newOnes.length > 0) {
          setToast({
            title: `${newOnes.length} new emergency request${newOnes.length > 1 ? 's' : ''}`,
            message: `${unread} unread total — open Requests to review`,
            count: newOnes.length,
          });
        }
        knownIdsRef.current = currentIds;
      } else {
        knownIdsRef.current = new Set(data.map((r) => String(r.id)));
        initialLoadRef.current = false;
      }

      return data;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    refreshRequests(false);
    const interval = setInterval(() => refreshRequests(true), 20000);
    return () => clearInterval(interval);
  }, [refreshRequests]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const markSeen = useCallback((id) => {
    markRequestSeen(id);
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllSeen = useCallback(() => {
    markAllRequestsSeen(requests);
    setUnreadCount(0);
  }, [requests]);

  const dismissToast = useCallback(() => setToast(null), []);

  return (
    <RequestAlertsContext.Provider
      value={{
        requests,
        unreadCount,
        refreshRequests,
        markSeen,
        markAllSeen,
        toast,
        dismissToast,
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
