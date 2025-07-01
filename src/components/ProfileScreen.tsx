import React, { useState, useEffect } from 'react';
import { User, Calendar, MessageCircle, Heart, Settings, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  likes: string[];
}

const ProfileScreen = () => {
  const { user } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const userStats = [
    { label: 'Posts', value: userPosts.length.toString(), icon: MessageCircle },
    { label: 'Events', value: '12', icon: Calendar },
    { label: 'Likes', value: userPosts.reduce((total, post) => total + post.likes.length, 0).toString(), icon: Heart },
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

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
        <div className="text-center">
          {/* Profile Picture */}
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">{getUserInitials()}</span>
          </div>
          
          {/* User Info */}
          <h1 className="text-2xl font-bold">{getUserName()}</h1>
          <p className="text-blue-100 mb-2">@{getUserName().toLowerCase().replace(/\s+/g, '_')}</p>
          <p className="text-sm text-blue-100">{getUserEmail()}</p>
          
          {/* Bio */}
          <p className="text-sm text-blue-50 mt-3 leading-relaxed">
            Campus community member • Connecting with fellow students 🚀
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-4">
          {userStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Icon size={20} className="text-gray-600" />
                </div>
                <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-blue-500 text-white rounded-lg py-3 px-4 font-medium hover:bg-blue-600 transition-colors flex items-center justify-center">
            <Edit size={16} className="mr-2" />
            Edit Profile
          </button>
          <button className="bg-gray-100 text-gray-700 rounded-lg py-3 px-4 font-medium hover:bg-gray-200 transition-colors flex items-center justify-center">
            <Settings size={16} className="mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">My Recent Posts</h3>
        {userPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No posts yet. Share something with the community!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userPosts.slice(0, 5).map((post) => (
              <div key={post.id} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <p className="text-gray-800 mb-3 leading-relaxed">{post.content}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Heart size={14} />
                      <span>{post.likes.length}</span>
                    </div>
                  </div>
                  <span>{getTimeAgo(post.createdAt)}</span>
                </div>
              </div>
            ))}
            {userPosts.length > 5 && (
              <div className="text-center">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View all {userPosts.length} posts
                </button>
              </div>
            )}
          </div>
        )}

        {/* Campus Info */}
        <div className="mt-6 bg-white rounded-xl p-4 border border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-3">Campus Involvement</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CS Student Association</span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Member</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tech Entrepreneurship Club</span>
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">Officer</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Intramural Soccer</span>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Player</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;