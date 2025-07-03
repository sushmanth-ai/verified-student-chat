import React, { useState, useEffect } from 'react';
import { User, Calendar, MessageCircle, Heart, Settings, Edit, Trophy, Star, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useToast } from '../hooks/use-toast';

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
    if (user?.displayName) {
      return user.displayName.split(' ').map(name => name[0]).join('').toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'Anonymous User';
  };

  const getUserEmail = () => {
    return user?.email || 'No email';
  };

  const handleEditProfile = () => {
    setShowEditProfile(!showEditProfile);
    if (!showEditProfile) {
      toast({ 
        title: "Edit Profile", 
        description: "Profile editing is now enabled!" 
      });
    }
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
    if (!showSettings) {
      toast({ 
        title: "Settings", 
        description: "Settings panel is now open!" 
      });
    }
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
      <div className="h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-500 border-r-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-y-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute top-20 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white rounded-full translate-y-20"></div>
        </div>
        
        <div className="text-center relative z-10">
          {/* Profile Picture */}
          <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-full mx-auto mb-6 flex items-center justify-center ring-4 ring-white/30 shadow-2xl">
            <span className="text-4xl font-bold text-white">{getUserInitials()}</span>
          </div>
          
          {/* User Info */}
          <h1 className="text-3xl font-bold mb-2">{getUserName()}</h1>
          <p className="text-blue-100 mb-2 text-lg">@{getUserName().toLowerCase().replace(/\s+/g, '_')}</p>
          <p className="text-sm text-blue-100/80">{getUserEmail()}</p>
          
          {/* Bio */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mt-6 border border-white/20">
            <p className="text-sm text-blue-50 leading-relaxed">
              🎓 Campus community member • Connecting with fellow students 🚀
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-6 -mt-4 relative z-20 mx-4 rounded-t-3xl shadow-xl">
        <div className="grid grid-cols-3 gap-6">
          {userStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-6 mx-4 shadow-lg">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Button 
            onClick={handleEditProfile}
            className={`rounded-2xl py-4 px-6 font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 ${
              showEditProfile 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
            }`}
          >
            <Edit size={20} className="mr-2" />
            {showEditProfile ? 'Profile Editing On' : 'Edit Profile'}
          </Button>
          <Button 
            onClick={handleSettings}
            className={`rounded-2xl py-4 px-6 font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 ${
              showSettings 
                ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:from-purple-600 hover:to-violet-700' 
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
            }`}
          >
            <Settings size={20} className="mr-2" />
            {showSettings ? 'Settings Active' : 'Settings'}
          </Button>
        </div>
        
        {/* Logout Button */}
        <Button 
          onClick={handleLogout}
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-2xl py-3 font-semibold transition-all duration-200"
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </Button>
      </div>

      {/* Recent Activity */}
      <div className="p-6 mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Trophy className="mr-2 text-yellow-500" size={24} />
          My Recent Posts
        </h3>
        {userPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">No posts yet</h4>
              <p className="text-gray-600">Share something with the community!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {userPosts.slice(0, 5).map((post) => (
              <Card key={post.id} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                <CardContent className="p-6">
                  <p className="text-gray-800 mb-4 leading-relaxed">{post.content}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-rose-100 px-3 py-1 rounded-full">
                        <Heart size={16} className="text-pink-500" />
                        <span className="text-pink-700 font-medium">{post.likes.length}</span>
                      </div>
                    </div>
                    <span className="text-gray-500 font-medium">{getTimeAgo(post.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {userPosts.length > 5 && (
              <div className="text-center">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold bg-blue-50 hover:bg-blue-100 px-6 py-3 rounded-full transition-colors">
                  View all {userPosts.length} posts
                </button>
              </div>
            )}
          </div>
        )}

        {/* Campus Info */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-xl">
          <h4 className="font-bold text-gray-900 mb-6 flex items-center text-lg">
            <Star className="mr-2 text-yellow-500" size={24} />
            Campus Involvement
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
              <span className="text-gray-700 font-medium">CS Student Association</span>
              <span className="text-xs text-blue-700 bg-blue-200 px-3 py-1 rounded-full font-semibold">Member</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
              <span className="text-gray-700 font-medium">Tech Entrepreneurship Club</span>
              <span className="text-xs text-purple-700 bg-purple-200 px-3 py-1 rounded-full font-semibold">Officer</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl border border-green-100">
              <span className="text-gray-700 font-medium">Intramural Soccer</span>
              <span className="text-xs text-green-700 bg-green-200 px-3 py-1 rounded-full font-semibold">Player</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;