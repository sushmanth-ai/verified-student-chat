
import React from 'react';
import { MessageCircle, User } from 'lucide-react';

const ChatScreen = () => {
  const chats = [
    {
      id: 1,
      user: 'Study Group - CS320',
      avatar: 'SG',
      lastMessage: 'Hey everyone, meeting at 3pm in library room 204',
      time: '2m ago',
      unread: 3,
      isGroup: true
    },
    {
      id: 2,
      user: 'Maya Patel',
      avatar: 'MP',
      lastMessage: 'Thanks for the notes! See you in class tomorrow',
      time: '15m ago',
      unread: 0,
      isGroup: false
    },
    {
      id: 3,
      user: 'Campus Events Team',
      avatar: 'CE',
      lastMessage: 'Spring festival planning meeting this Friday',
      time: '1h ago',
      unread: 1,
      isGroup: true
    },
    {
      id: 4,
      user: 'Ryan Johnson',
      avatar: 'RJ',
      lastMessage: 'Did you finish the chemistry assignment?',
      time: '3h ago',
      unread: 0,
      isGroup: false
    },
    {
      id: 5,
      user: 'Dorm Floor 3',
      avatar: 'D3',
      lastMessage: 'Pizza party tonight at 8pm! 🍕',
      time: '5h ago',
      unread: 7,
      isGroup: true
    }
  ];

  return (
    <div className="h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <button className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors">
            <MessageCircle size={16} />
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat, index) => (
          <div
            key={chat.id}
            className={`bg-white hover:bg-gray-50 transition-colors cursor-pointer ${
              index !== chats.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="p-4 flex items-center space-x-3">
              {/* Avatar */}
              <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  chat.isGroup 
                    ? 'bg-gradient-to-br from-green-500 to-blue-500' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}>
                  <span className="text-white font-semibold">{chat.avatar}</span>
                </div>
                {chat.unread > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {chat.unread > 9 ? '9+' : chat.unread}
                  </div>
                )}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 truncate">{chat.user}</h3>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                <p className="text-sm text-gray-600 truncate mt-1">{chat.lastMessage}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-blue-50 text-blue-600 rounded-lg py-3 px-4 text-sm font-medium hover:bg-blue-100 transition-colors">
            Find Study Partners
          </button>
          <button className="bg-green-50 text-green-600 rounded-lg py-3 px-4 text-sm font-medium hover:bg-green-100 transition-colors">
            Join Campus Groups
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
