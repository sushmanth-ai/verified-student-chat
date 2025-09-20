import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useAuth } from './AuthContext';

interface ProfileData {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  profileImage: string | null;
  updatedAt: string;
}

interface ProfileContextType {
  profileData: ProfileData | null;
  updateProfile: (data: ProfileData) => void;
  getProfileImage: (userId: string) => string | null;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Load initial profile data
    const savedProfile = localStorage.getItem('campusMediaProfile');
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }

    // Listen for profile updates (local events)
    const handleProfileUpdate = (event: any) => {
      const updatedProfile = event.detail;
      setProfileData(updatedProfile);
      localStorage.setItem('campusMediaProfile', JSON.stringify(updatedProfile));
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    // Subscribe to Firestore profile for the current user
    let unsubscribe: (() => void) | undefined;
    if (user) {
      const profileRef = doc(db, 'profiles', user.uid);
      unsubscribe = onSnapshot(profileRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          const normalized = {
            displayName: data.displayName || '',
            bio: data.bio || '',
            location: data.location || '',
            website: data.website || '',
            profileImage: data.profileImage || null,
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
          setProfileData(normalized);
          localStorage.setItem('campusMediaProfile', JSON.stringify(normalized));
        }
      });
    }

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      unsubscribe?.();
    };
  }, [user]);

  const updateProfile = (data: ProfileData) => {
    const run = async () => {
      try {
        let imageUrl = data.profileImage;

        // If the image is a base64 data URL, upload it to Firebase Storage
        if (user && imageUrl && imageUrl.startsWith('data:')) {
          const avatarRef = ref(storage, `avatars/${user.uid}.jpg`);
          await uploadString(avatarRef, imageUrl, 'data_url');
          imageUrl = await getDownloadURL(avatarRef);
        }

        const newData = { ...data, profileImage: imageUrl, updatedAt: new Date().toISOString() };
        setProfileData(newData);
        localStorage.setItem('campusMediaProfile', JSON.stringify(newData));
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: newData }));

        if (user) {
          await setDoc(doc(db, 'profiles', user.uid), newData, { merge: true });
        }
      } catch (e) {
        // swallow for now; UI already updated optimistically
      }
    };

    run();
  };

  const getProfileImage = (userId: string) => {
    // For now, only return profile image for current user
    // In a real app, you'd fetch profile data for any user
    return profileData?.profileImage || null;
  };

  return (
    <ProfileContext.Provider value={{ profileData, updateProfile, getProfileImage }}>
      {children}
    </ProfileContext.Provider>
  );
};