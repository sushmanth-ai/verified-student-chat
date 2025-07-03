import React, { useState, useEffect } from 'react';
import { X, Bell, Shield, Moon, Globe, Smartphone, Volume2, VolumeX } from 'lucide-react';
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
    const savedSettings = localStorage.getItem('campusMediaSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('campusMediaSettings', JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Handle specific setting changes
    switch (key) {
      case 'notifications':
        if (value && 'Notification' in window) {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('CampusMedia', {
                body: 'Notifications enabled successfully!',
                icon: '/favicon.ico'
              });
            }
          });
        }
        break;
      case 'darkMode':
        document.documentElement.classList.toggle('dark', value);
        break;
      case 'soundNotifications':
        if (value) {
          // Play a test sound
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
          audio.volume = 0.3;
          audio.play().catch(() => {});
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
        { key: 'notifications', label: 'Enable Notifications', description: 'Receive notifications for new messages and activities' },
        { key: 'emailNotifications', label: 'Email Notifications', description: 'Get notified via email for important updates' },
        { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications on your device' },
        { key: 'soundNotifications', label: 'Sound Notifications', description: 'Play sounds for new notifications' }
      ]
    },
    {
      title: "Privacy",
      icon: Shield,
      settings: [
        { key: 'publicProfile', label: 'Public Profile', description: 'Make your profile visible to other users' },
        { key: 'showOnlineStatus', label: 'Show Online Status', description: 'Let others see when you\'re online' },
        { key: 'allowDirectMessages', label: 'Allow Direct Messages', description: 'Allow other users to send you direct messages' },
        { key: 'showReadReceipts', label: 'Read Receipts', description: 'Show when you\'ve read messages' }
      ]
    },
    {
      title: "Appearance & Performance",
      icon: Moon,
      settings: [
        { key: 'darkMode', label: 'Dark Mode', description: 'Use dark theme for better viewing in low light' },
        { key: 'autoPlayVideos', label: 'Auto-play Videos', description: 'Automatically play videos in posts' },
        { key: 'dataCompression', label: 'Data Compression', description: 'Compress images and videos to save data' }
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
    toast({
      title: "Settings reset",
      description: "All settings have been reset to default values."
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account preferences and privacy settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {settingsGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.title} className="space-y-4">
                <div className="flex items-center space-x-3 pb-2 border-b border-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <Icon size={16} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{group.title}</h3>
                </div>
                
                <div className="space-y-4">
                  {group.settings.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 flex items-center">
                          {setting.label}
                          {setting.key === 'soundNotifications' && (
                            settings.soundNotifications ? 
                            <Volume2 size={16} className="ml-2 text-green-500" /> : 
                            <VolumeX size={16} className="ml-2 text-gray-400" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{setting.description}</div>
                      </div>
                      <Switch
                        checked={settings[setting.key as keyof typeof settings]}
                        onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="pt-4 border-t border-gray-100 space-y-3">
            <Button 
              variant="outline"
              onClick={resetSettings}
              className="w-full rounded-xl border-gray-300 hover:bg-gray-50"
            >
              Reset to Default
            </Button>
            <Button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
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