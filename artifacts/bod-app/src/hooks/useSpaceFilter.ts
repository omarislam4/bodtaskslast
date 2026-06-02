import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Space } from "@/types";

const STORAGE_KEY = (userId: string) => `spaceFilter_hidden_${userId}`;
const CHANGE_EVENT = "bod:spaceFilterChange";

export const useSpaceFilter = () => {
  const { userDoc, isAdmin } = useAuth();
  const [hiddenSpaceIds, setHiddenSpaceIds] = useState<string[]>([]);

  // Read from localStorage on mount and when user changes
  useEffect(() => {
    if (!userDoc?.id || !isAdmin) { setHiddenSpaceIds([]); return; }
    try {
      const stored = localStorage.getItem(STORAGE_KEY(userDoc.id));
      setHiddenSpaceIds(stored ? JSON.parse(stored) : []);
    } catch { setHiddenSpaceIds([]); }
  }, [userDoc?.id, isAdmin]);

  // Listen for changes dispatched by other component instances in the same tab
  useEffect(() => {
    if (!userDoc?.id || !isAdmin) return;
    const handler = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY(userDoc.id));
        setHiddenSpaceIds(stored ? JSON.parse(stored) : []);
      } catch { setHiddenSpaceIds([]); }
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, [userDoc?.id, isAdmin]);

  const toggleSpaceVisibility = useCallback((spaceId: string) => {
    if (!userDoc?.id) return;
    // Read current state from localStorage (source of truth) to avoid stale closure
    let prev: string[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY(userDoc.id));
      prev = stored ? JSON.parse(stored) : [];
    } catch { prev = []; }
    const next = prev.includes(spaceId)
      ? prev.filter(id => id !== spaceId)
      : [...prev, spaceId];
    try { localStorage.setItem(STORAGE_KEY(userDoc.id), JSON.stringify(next)); } catch {}
    setHiddenSpaceIds(next);
    // Notify all other useSpaceFilter instances in this tab
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [userDoc?.id]);

  const isSpaceVisible = useCallback((spaceId: string) => {
    if (!isAdmin) return true;
    return !hiddenSpaceIds.includes(spaceId);
  }, [hiddenSpaceIds, isAdmin]);

  const filterSpaces = useCallback((spaces: Space[] = []) => {
    const safeSpaces = Array.isArray(spaces) ? spaces : [];
    if (!isAdmin) return safeSpaces;
    return safeSpaces.filter(s => !hiddenSpaceIds.includes(s.id));
  }, [hiddenSpaceIds, isAdmin]);

  const showAll = useCallback(() => {
    if (!userDoc?.id) return;
    setHiddenSpaceIds([]);
    try { localStorage.removeItem(STORAGE_KEY(userDoc.id)); } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [userDoc?.id]);

  return { hiddenSpaceIds, toggleSpaceVisibility, isSpaceVisible, filterSpaces, showAll };
};
