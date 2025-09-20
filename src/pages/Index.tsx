import React, { useState } from 'react';
import { Home, Camera, MessageCircle, Calendar, User } from 'lucide-react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoginScreen from '../components/LoginScreen';
import HomeScreen from '../components/HomeScreen';
import StoriesScreen from '../components/StoriesScreen';
import GroupChatScreen from '../components/GroupChatScreen';
import EventsScreen from '../components/EventsScreen';
import ProfileScreen from '../components/ProfileScreen';
import { Button } from '../components/ui/button';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { user, loading, logout } = useAuth();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home, component: HomeScreen, color: 'from-blue-500 to-cyan-500' },
    { id: 'stories', label: 'Stories', icon: Camera, component: StoriesScreen, color: 'from-purple-500 to-pink-500' },
    { id: 'chat', label: 'Chat', icon: MessageCircle, component: GroupChatScreen, color: 'from-green-500 to-teal-500' },
    { id: 'events', label: 'Events', icon: Calendar, component: EventsScreen, color: 'from-orange-500 to-red-500' },
    { id: 'profile', label: 'Profile', icon: User, component: ProfileScreen, color: 'from-indigo-500 to-purple-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-purple-500 border-r-blue-500 mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || HomeScreen;
  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col max-w-md mx-auto border-x border-gray-200/50 shadow-2xl">
      {/* Header - Fixed at top */}
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-sm shadow-lg px-6 py-4 border-b border-gray-200/50 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-gray-800">campu</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-extrabold">S</span>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-extrabold">M</span>
              <span className="text-gray-800">edia</span>
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
              <span className="text-blue-600 font-bold text-sm">
                {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl px-4 py-2 font-medium"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden pt-20 pb-20">
        <ActiveComponent />
      </div>

      {/* Bottom Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-sm border-t border-gray-200/50 px-2 py-3 shadow-lg z-50">
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-3 px-4 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-br ${tab.color} text-white shadow-lg scale-110 transform` 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/80'
                }`}
              >
                <Icon size={22} className={`mb-1 ${isActive ? 'scale-110' : ''} transition-transform duration-200`} />
                <span className={`text-xs font-semibold ${isActive ? 'text-white' : ''}`}>{tab.label}</span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;