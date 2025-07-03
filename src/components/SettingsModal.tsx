import React, { useState } from 'react';
import { X, Bell, Shield, Moon, Globe, Smartphone } from 'lucide-react';
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
    darkMode: false,
    publicProfile: true,
    showOnlineStatus: true,
    allowDirectMessages: true,
    showReadReceipts: false
  });

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
        { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications on your device' }
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
      title: "Appearance",
      icon: Moon,
      settings: [
        { key: 'darkMode', label: 'Dark Mode', description: 'Use dark theme for better viewing in low light' }
      ]
    }
  ];

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
                    <div key={setting.key} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{setting.label}</div>
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

          <div className="pt-4 border-t border-gray-100">
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