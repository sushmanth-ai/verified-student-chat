import React, { useState, useEffect } from 'react';
import { X, Bell, Shield, Moon, Globe, Smartphone, Volume2, VolumeX, Eye, EyeOff, MessageSquare, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { useToast } from '../hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: false,
    pushNotifications: true,
    soundNotifications: true,
    darkMode: false,
    publicProfile: true,
    showOnlineStatus: true,
    allowDirectMessages: true,
    showReadReceipts: false,
    autoPlayVideos: true,
    dataCompression: false
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('vitSMediaSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      
      // Apply dark mode if enabled
      if (parsedSettings.darkMode) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('vitSMediaSettings', JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Handle specific setting changes
    switch (key) {
      case 'notifications':
        if (value && 'Notification' in window) {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('VitSMedia', {
                body: 'Notifications enabled successfully!',
                icon: '/favicon.ico'
              });
            }
          });
        }
        break;
      case 'darkMode':
        document.documentElement.classList.toggle('dark', value);
        // Apply dark mode styles to body
        if (value) {
          document.body.style.backgroundColor = '#1f2937';
          document.body.style.color = '#f9fafb';
        } else {
          document.body.style.backgroundColor = '';
          document.body.style.color = '';
        }
        break;
      case 'soundNotifications':
        if (value) {
          // Play a test sound
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        }
        break;
      case 'publicProfile':
        // Simulate profile visibility change
        if (!value) {
          toast({
            title: "Profile set to private",
            description: "Your profile is now only visible to you."
          });
        } else {
          toast({
            title: "Profile set to public",
            description: "Your profile is now visible to all users."
          });
        }
        break;
      case 'showOnlineStatus':
        // Simulate online status change
        if (!value) {
          toast({
            title: "Online status hidden",
            description: "Other users won't see when you're online."
          });
        } else {
          toast({
            title: "Online status visible",
            description: "Other users can see when you're online."
          });
        }
        break;
    }
    
    toast({
      title: "Setting updated",
      description: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} has been ${value ? 'enabled' : 'disabled'}.`
    });
  };

  const settingsGroups = [
    {
      title: "Notifications",
      icon: Bell,
      settings: [
        { key: 'notifications', label: 'Enable Notifications', description: 'Receive notifications for new messages and activities', icon: Bell },
        { key: 'emailNotifications', label: 'Email Notifications', description: 'Get notified via email for important updates', icon: Globe },
        { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications on your device', icon: Smartphone },
        { key: 'soundNotifications', label: 'Sound Notifications', description: 'Play sounds for new notifications', icon: Volume2 }
      ]
    },
    {
      title: "Privacy",
      icon: Shield,
      settings: [
        { key: 'publicProfile', label: 'Public Profile', description: 'Make your profile visible to other users', icon: Eye },
        { key: 'showOnlineStatus', label: 'Show Online Status', description: 'Let others see when you\'re online', icon: Eye },
        { key: 'allowDirectMessages', label: 'Allow Direct Messages', description: 'Allow other users to send you direct messages', icon: MessageSquare },
        { key: 'showReadReceipts', label: 'Read Receipts', description: 'Show when you\'ve read messages', icon: Eye }
      ]
    },
    {
      title: "Appearance & Performance",
      icon: Moon,
      settings: [
        { key: 'darkMode', label: 'Dark Mode', description: 'Use dark theme for better viewing in low light', icon: Moon },
        { key: 'autoPlayVideos', label: 'Auto-play Videos', description: 'Automatically play videos in posts', icon: Globe },
        { key: 'dataCompression', label: 'Data Compression', description: 'Compress images and videos to save data', icon: Smartphone }
      ]
    }
  ];

  const resetSettings = () => {
    const defaultSettings = {
      notifications: true,
      emailNotifications: false,
      pushNotifications: true,
      soundNotifications: true,
      darkMode: false,
      publicProfile: true,
      showOnlineStatus: true,
      allowDirectMessages: true,
      showReadReceipts: false,
      autoPlayVideos: true,
      dataCompression: false
    };
    setSettings(defaultSettings);
    document.documentElement.classList.remove('dark');
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
    toast({
      title: "Settings reset",
      description: "All settings have been reset to default values."
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </DialogTitle>
          <DialogDescription className="text-sm">
            Manage your account preferences and privacy settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          {settingsGroups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.title} className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-3 pb-2 border-b border-gray-100">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <GroupIcon size={14} className="text-blue-600 sm:w-4 sm:h-4" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{group.title}</h3>
                </div>
                
                <div className="space-y-3">
                  {group.settings.map((setting) => {
                    const SettingIcon = setting.icon;
                    return (
                      <div key={setting.key} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors">
                        <div className="flex-1 flex items-start space-x-3">
                          <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            {setting.key === 'soundNotifications' ? (
                              settings.soundNotifications ? 
                              <Volume2 size={12} className="text-green-600" /> : 
                              <VolumeX size={12} className="text-gray-400" />
                            ) : setting.key === 'darkMode' ? (
                              settings.darkMode ? 
                              <Moon size={12} className="text-blue-600" /> : 
                              <Sun size={12} className="text-yellow-600" />
                            ) : setting.key === 'publicProfile' || setting.key === 'showOnlineStatus' ? (
                              settings[setting.key as keyof typeof settings] ? 
                              <Eye size={12} className="text-green-600" /> : 
                              <EyeOff size={12} className="text-gray-400" />
                            ) : (
                              <SettingIcon size={12} className={
                                settings[setting.key as keyof typeof settings] ? 'text-green-600' : 'text-gray-400'
                              } />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{setting.label}</div>
                            <div className="text-xs text-gray-500 leading-relaxed">{setting.description}</div>
                          </div>
                        </div>
                        <Switch
                          checked={settings[setting.key as keyof typeof settings]}
                          onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="pt-4 border-t border-gray-100 space-y-3">
            <Button 
              variant="outline"
              onClick={resetSettings}
              className="w-full rounded-xl border-gray-300 hover:bg-gray-50 h-10 text-sm"
            >
              Reset to Default
            </Button>
            <Button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl h-10 text-sm"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;