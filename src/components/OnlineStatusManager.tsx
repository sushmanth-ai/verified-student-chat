import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, onDisconnect } from 'firebase/firestore';

const OnlineStatusManager: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    // Set user as online when component mounts
    const setOnline = async () => {
      try {
        await updateDoc(userRef, {
          isOnline: true,
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error('Error setting online status:', error);
      }
    };

    // Set user as offline when they leave
    const setOffline = async () => {
      try {
        await updateDoc(userRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error('Error setting offline status:', error);
      }
    };

    setOnline();

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    // Handle beforeunload event
    const handleBeforeUnload = () => {
      setOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
    };
  }, [user]);

  return null;
};

export default OnlineStatusManager;