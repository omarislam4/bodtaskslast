import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Space } from "./useSpaces";

const STORAGE_KEY = (userId: string) => `spaceFilter_hidden_${userId}`;

export const useSpaceFilter = () => {
  const { userDoc, isAdmin } = useAuth();
  const [hiddenSpaceIds, setHiddenSpaceIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userDoc?.id || !isAdmin) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY(userDoc.id));
      if (stored) setHiddenSpaceIds(JSON.parse(stored));
    } catch { setHiddenSpaceIds([]); }
  }, [userDoc?.id, isAdmin]);

  const toggleSpaceVisibility = useCallback((spaceId: string) => {
    if (!userDoc?.id) return;
    setHiddenSpaceIds(prev => {
      const next = prev.includes(spaceId)
        ? prev.filter(id => id !== spaceId)
        : [...prev, spaceId];
      try { localStorage.setItem(STORAGE_KEY(userDoc.id), JSON.stringify(next)); } catch {}
      return next;
    });
  }, [userDoc?.id]);

  const isSpaceVisible = useCallback((spaceId: string) => {
    if (!isAdmin) return true;
    return !hiddenSpaceIds.includes(spaceId);
  }, [hiddenSpaceIds, isAdmin]);

  const filterSpaces = useCallback((spaces: Space[]) => {
    if (!isAdmin) return spaces;
    return spaces.filter(s => !hiddenSpaceIds.includes(s.id));
  }, [hiddenSpaceIds, isAdmin]);

  const showAll = useCallback(() => {
    if (!userDoc?.id) return;
    setHiddenSpaceIds([]);
    try { localStorage.removeItem(STORAGE_KEY(userDoc.id)); } catch {}
  }, [userDoc?.id]);

  return { hiddenSpaceIds, toggleSpaceVisibility, isSpaceVisible, filterSpaces, showAll };
};
