
import React from 'react';
import { Heart, MessageCircle, User } from 'lucide-react';

const HomeScreen = () => {
  const posts = [
    {
      id: 1,
      user: 'Sarah Chen',
      username: '@sarahc_cs',
      avatar: 'SC',
      time: '2h ago',
      content: 'Just finished my machine learning project! The campus coding lab is the best place to focus 🤓',
      image: null,
      likes: 24,
      comments: 8,
      department: 'Computer Science'
    },
    {
      id: 2,
      user: 'Mike Rodriguez',
      username: '@mike_bio',
      avatar: 'MR',
      time: '4h ago',
      content: 'Beautiful sunset from the campus quad! Love this place ✨',
      image: '/placeholder.svg',
      likes: 89,
      comments: 15,
      department: 'Biology'
    },
    {
      id: 3,
      user: 'Emma Thompson',
      username: '@emma_art',
      avatar: 'ET',
      time: '6h ago',
      content: 'Art exhibition opening tomorrow at the student center! Come check out some amazing work from our fellow students 🎨',
      image: null,
      likes: 56,
      comments: 12,
      department: 'Fine Arts'
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Post Header */}
            <div className="p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{post.avatar}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{post.user}</h3>
                  <span className="text-blue-600 text-sm">{post.username}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{post.department}</span>
                  <span>•</span>
                  <span>{post.time}</span>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="px-4 pb-3">
              <p className="text-gray-800 leading-relaxed">{post.content}</p>
            </div>

            {/* Post Image */}
            {post.image && (
              <div className="px-4 pb-3">
                <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">📸 Campus Photo</span>
                </div>
              </div>
            )}

            {/* Post Actions */}
            <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors">
                  <Heart size={18} />
                  <span className="text-sm font-medium">{post.likes}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
                  <MessageCircle size={18} />
                  <span className="text-sm font-medium">{post.comments}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeScreen;
