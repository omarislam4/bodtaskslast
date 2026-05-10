import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

export interface UserDoc {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member';
  avatar: string;
  spaceIds: string[];
  phone: string;
  countryCode: string;
  shiftEnd: string;
  shiftReminderSent: boolean;
  createdAt: Date;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userDoc: UserDoc | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userDoc: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeDoc) { unsubscribeDoc(); unsubscribeDoc = null; }

      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);

        unsubscribeDoc = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserDoc({
              id: docSnap.id,
              email: data.email || firebaseUser.email || "",
              displayName: data.displayName || firebaseUser.displayName || "",
              role: data.role || "member",
              avatar: data.avatar || firebaseUser.photoURL || "",
              spaceIds: data.spaceIds || [],
              phone: data.phone || "",
              countryCode: data.countryCode || "+20",
              shiftEnd: data.shiftEnd || "",
              shiftReminderSent: data.shiftReminderSent || false,
              createdAt: data.createdAt?.toDate?.() || new Date(),
            });

            // Auto-sync to members/{uid} so n8n reply handler can find member by document ID
            const membersRef = doc(db, "members", firebaseUser.uid);
            getDoc(membersRef).then((memberSnap) => {
              const fullPhone = `${data.countryCode || "+20"}${data.phone || ""}`.replace(/\s/g, "");
              const syncData = {
                id: firebaseUser.uid,
                email: data.email || firebaseUser.email || "",
                displayName: data.displayName || firebaseUser.displayName || "",
                role: data.role || "member",
                phone: data.phone || "",
                countryCode: data.countryCode || "+20",
                shiftEnd: data.shiftEnd || "",
                shiftReminderSent: data.shiftReminderSent || false,
                fullPhone,
              };
              if (!memberSnap.exists()) {
                // First time: create the correctly-keyed members doc
                setDoc(membersRef, { ...syncData, createdAt: serverTimestamp() });
              } else {
                // Already exists but may be stale — update key profile fields
                const md = memberSnap.data();
                const needsUpdate =
                  md.phone !== syncData.phone ||
                  md.countryCode !== syncData.countryCode ||
                  md.shiftEnd !== syncData.shiftEnd ||
                  md.displayName !== syncData.displayName ||
                  md.fullPhone !== fullPhone;
                if (needsUpdate) {
                  setDoc(membersRef, syncData, { merge: true });
                }
              }
            }).catch(() => {});  // silently ignore — non-blocking
          } else {
            const isAdminEmail = firebaseUser.email === "admin.bod@gmail.com";
            const newUserData = {
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              role: isAdminEmail ? "admin" : "member",
              avatar: firebaseUser.photoURL || "",
              spaceIds: [],
              phone: "",
              countryCode: "+20",
              shiftEnd: "",
              shiftReminderSent: false,
              createdAt: serverTimestamp(),
            };
            // Write to users (primary) and members (for n8n)
            await setDoc(userRef, newUserData);
            const membersRef = doc(db, "members", firebaseUser.uid);
            await setDoc(membersRef, {
              ...newUserData,
              id: firebaseUser.uid,
              fullPhone: "",
            });
          }
          setLoading(false);
        });
      } else {
        setUserDoc(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const isAdmin = userDoc?.email === "admin.bod@gmail.com" || userDoc?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
