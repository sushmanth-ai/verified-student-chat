import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    // Load initial profile data
    const savedProfile = localStorage.getItem('campusMediaProfile');
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }

    // Listen for profile updates
    const handleProfileUpdate = (event: any) => {
      const updatedProfile = event.detail;
      setProfileData(updatedProfile);
      localStorage.setItem('campusMediaProfile', JSON.stringify(updatedProfile));
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  const updateProfile = (data: ProfileData) => {
    setProfileData(data);
    localStorage.setItem('campusMediaProfile', JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: data }));
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