
import React from 'react';
import { Camera } from 'lucide-react';

const StoriesScreen = () => {
  const stories = [
    { id: 1, user: 'Alex Kim', avatar: 'AK', time: '12m ago', preview: 'at Library' },
    { id: 2, user: 'Jessica Wu', avatar: 'JW', time: '45m ago', preview: 'Campus Tour' },
    { id: 3, user: 'David Park', avatar: 'DP', time: '1h ago', preview: 'Study Group' },
    { id: 4, user: 'Lisa Zhang', avatar: 'LZ', time: '2h ago', preview: 'Coffee Break' },
    { id: 5, user: 'Tom Wilson', avatar: 'TW', time: '3h ago', preview: 'Lab Work' },
  ];

  return (
    <div className="h-full bg-gray-50">
      {/* Create Story Section */}
      <div className="bg-white border-b border-gray-200 p-4">
        <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl py-3 px-4 flex items-center justify-center space-x-2 hover:shadow-lg transition-all">
          <Camera size={20} />
          <span className="font-semibold">Create Your Story</span>
        </button>
      </div>

      {/* Stories Grid */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Campus Stories</h2>
        <div className="grid grid-cols-2 gap-4">
          {stories.map((story) => (
            <div
              key={story.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Story Preview */}
              <div className="h-32 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all"></div>
                <span className="text-white font-semibold text-lg relative z-10">📷</span>
                
                {/* User Avatar */}
                <div className="absolute top-3 left-3 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-xs font-semibold text-gray-700">{story.avatar}</span>
                </div>
              </div>

              {/* Story Info */}
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm">{story.user}</h3>
                <p className="text-gray-600 text-xs">{story.preview}</p>
                <p className="text-gray-400 text-xs mt-1">{story.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Story Stats */}
        <div className="mt-6 bg-white rounded-xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Today's Activity</h3>
          <div className="flex justify-between text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">127</div>
              <div className="text-xs text-gray-500">Stories Posted</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">89</div>
              <div className="text-xs text-gray-500">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">1.2k</div>
              <div className="text-xs text-gray-500">Story Views</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoriesScreen;
