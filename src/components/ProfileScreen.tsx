
import React from 'react';
import { User, Calendar, MessageCircle, Heart } from 'lucide-react';

const ProfileScreen = () => {
  const userStats = [
    { label: 'Posts', value: '42', icon: MessageCircle },
    { label: 'Events', value: '12', icon: Calendar },
    { label: 'Likes', value: '1.2k', icon: Heart },
  ];

  const recentPosts = [
    { id: 1, content: 'Great study session at the library today!', likes: 23, time: '2h ago' },
    { id: 2, content: 'Excited for the career fair tomorrow 🎉', likes: 45, time: '1d ago' },
    { id: 3, content: 'Coffee with friends between classes ☕', likes: 18, time: '2d ago' },
  ];

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
        <div className="text-center">
          {/* Profile Picture */}
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">JD</span>
          </div>
          
          {/* User Info */}
          <h1 className="text-2xl font-bold">John Doe</h1>
          <p className="text-blue-100 mb-2">@johndoe_cs</p>
          <p className="text-sm text-blue-100">Computer Science • Class of 2025</p>
          
          {/* Bio */}
          <p className="text-sm text-blue-50 mt-3 leading-relaxed">
            Passionate about AI and machine learning. Love connecting with fellow students and organizing tech events! 🚀
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
          <button className="bg-blue-500 text-white rounded-lg py-3 px-4 font-medium hover:bg-blue-600 transition-colors">
            Edit Profile
          </button>
          <button className="bg-gray-100 text-gray-700 rounded-lg py-3 px-4 font-medium hover:bg-gray-200 transition-colors">
            Settings
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Posts</h3>
        <div className="space-y-3">
          {recentPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <p className="text-gray-800 mb-3">{post.content}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Heart size={14} />
                    <span>{post.likes}</span>
                  </div>
                </div>
                <span>{post.time}</span>
              </div>
            </div>
          ))}
        </div>

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
