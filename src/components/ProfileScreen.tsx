import React, { useState, useEffect } from 'react';
import { User, Calendar, MessageCircle, Heart, Settings, Edit, Trophy, Star, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useToast } from '../hooks/use-toast';
import EditProfileModal from './EditProfileModal';
import SettingsModal from './SettingsModal';
import CreateStory from './CreateStory';

interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  likes: string[];
}

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const { toast } = useToast();

  const userStats = [
    { label: 'Posts', value: userPosts.length.toString(), icon: MessageCircle, color: 'from-blue-500 to-cyan-500' },
    { label: 'Events', value: '12', icon: Calendar, color: 'from-green-500 to-teal-500' },
    { label: 'Likes', value: userPosts.reduce((total, post) => total + post.likes.length, 0).toString(), icon: Heart, color: 'from-pink-500 to-rose-500' },
  ];

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      // Sort by createdAt on client side (newest first)
      const sortedPosts = postsData.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.() || new Date(0);
        const timeB = b.createdAt?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });
      
      setUserPosts(sortedPosts);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Load profile data and settings from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('vitSMediaProfile');
    const savedSettings = localStorage.getItem('vitSMediaSettings');
    
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }
    
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    // Listen for profile updates
    const handleProfileUpdate = (event: any) => {
      setProfileData(event.detail);
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [showEditProfile]); // Reload when edit modal closes

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getUserInitials = () => {
    const displayName = profileData?.displayName || user?.displayName;
    if (displayName) {
      return displayName.split(' ').map((name: string) => name[0]).join('').toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserName = () => {
    return profileData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Anonymous User';
  };

  const getUserEmail = () => {
    return user?.email || 'No email';
  };

  const getUserBio = () => {
    return profileData?.bio || '🎓 Campus community member • Connecting with fellow students 🚀';
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-red-400 to-pink-500',
      'from-blue-400 to-indigo-500',
      'from-green-400 to-teal-500',
      'from-yellow-400 to-orange-500',
      'from-purple-400 to-violet-500',
      'from-pink-400 to-rose-500',
      'from-indigo-400 to-blue-500',
      'from-teal-400 to-cyan-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getProfileVisibility = () => {
    if (!settings.publicProfile) {
      return (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3 mt-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">🔒 Private Profile</p>
          <p className="text-yellow-700 dark:text-yellow-300 text-xs">Only you can see your profile</p>
        </div>
      );
    }
    return null;
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({ 
        title: "Logged out", 
        description: "You have been successfully logged out." 
      });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to logout. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-500 border-r-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 overflow-y-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 dark:from-blue-800 dark:via-purple-800 dark:to-pink-800 p-8 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute top-20 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white rounded-full translate-y-20"></div>
        </div>
        
        <div className="text-center relative z-10">
          {/* Profile Picture */}
          <div className="w-28 h-28 mx-auto mb-6 flex items-center justify-center ring-4 ring-white/30 shadow-2xl rounded-full overflow-hidden">
            {profileData?.profileImage ? (
              <img 
                src={profileData.profileImage} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(getUserName())} flex items-center justify-center`}>
                <span className="text-4xl font-bold text-white">{getUserInitials()}</span>
              </div>
            )}
          </div>
          
          {/* User Info */}
          <h1 className="text-3xl font-bold mb-2">{getUserName()}</h1>
          <p className="text-blue-100 mb-2 text-lg">@{getUserName().toLowerCase().replace(/\s+/g, '_')}</p>
          <p className="text-sm text-blue-100/80">{getUserEmail()}</p>
          
          {/* Bio */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mt-6 border border-white/20">
            <p className="text-sm text-blue-50 leading-relaxed">
              {getUserBio()}
            </p>
            {profileData?.location && (
              <p className="text-xs text-blue-100/80 mt-2">📍 {profileData.location}</p>
            )}
            {profileData?.website && (
              <p className="text-xs text-blue-100/80 mt-1">🌐 {profileData.website}</p>
            )}
          </div>
          
          {/* Profile Visibility Warning */}
          {getProfileVisibility()}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 p-6 -mt-4 relative z-20 mx-4 rounded-t-3xl shadow-xl">
        <div className="grid grid-cols-3 gap-6">
          {userStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 p-6 mx-4 shadow-lg">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Button 
            onClick={handleEditProfile}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 rounded-2xl py-4 px-6 font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-0"
          >
            <Edit size={20} className="mr-2" />
            Edit Profile
          </Button>
          <Button 
            onClick={handleSettings}
            className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 rounded-2xl py-4 px-6 font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-0"
          >
            <Settings size={20} className="mr-2" />
            Settings
          </Button>
        </div>
        
        {/* Enhanced Logout Button */}
        <Button 
          onClick={handleLogout}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl py-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-0 group"
        >
          <LogOut size={18} className="mr-2 group-hover:animate-pulse" />
          <span className="group-hover:tracking-wide transition-all duration-200">Logout</span>
        </Button>
      </div>

      {/* Recent Activity */}
      <div className="p-6 mx-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <Trophy className="mr-2 text-yellow-500" size={24} />
          My Recent Posts
        </h3>
        {userPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">No posts yet</h4>
              <p className="text-gray-600 dark:text-gray-400">Share something with the community!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {userPosts.slice(0, 5).map((post) => (
              <Card key={post.id} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                <CardContent className="p-6">
                  <p className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">{post.content}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 px-3 py-1 rounded-full">
                        <Heart size={16} className="text-pink-500" />
                        <span className="text-pink-700 dark:text-pink-300 font-medium">{post.likes.length}</span>
                      </div>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-xs">
                      {getTimeAgo(post.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {userPosts.length > 5 && (
              <div className="text-center">
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-semibold bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-6 py-3 rounded-full transition-colors focus:outline-none focus:ring-0">
                  View all {userPosts.length} posts
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <EditProfileModal 
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      
      {/* Create Story Modal */}
      {showCreateStory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CreateStory onStoryCreated={() => setShowCreateStory(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;