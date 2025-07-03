import React, { useState } from 'react';
import { X, User, Mail, Camera, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: '🎓 Campus community member • Connecting with fellow students 🚀',
    location: '',
    website: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setProfileImage(reader.result as string);
          toast({
            title: "Photo selected!",
            description: "Your new profile photo is ready to save."
          });
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive"
        });
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save profile data to localStorage for persistence
      const profileData = {
        ...formData,
        profileImage,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('campusMediaProfile', JSON.stringify(profileData));
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: profileData }));
      
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated."
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load saved profile data
  React.useEffect(() => {
    const savedProfile = localStorage.getItem('campusMediaProfile');
    if (savedProfile) {
      const profileData = JSON.parse(savedProfile);
      setFormData({
        displayName: profileData.displayName || user?.displayName || '',
        bio: profileData.bio || '🎓 Campus community member • Connecting with fellow students 🚀',
        location: profileData.location || '',
        website: profileData.website || ''
      });
      setProfileImage(profileData.profileImage || null);
    }
  }, [user, isOpen]);

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-red-400 to-pink-500',
      'from-blue-400 to-indigo-500',
      'from-green-400 to-teal-500',
      'from-yellow-400 to-orange-500',
      'from-purple-400 to-violet-500',
      'from-pink-400 to-rose-500',
      'from-indigo-400 to-blue-500',
      'from-teal-400 to-cyan-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-sm">
            Update your profile information and preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-lg ring-4 ring-white"
                />
              ) : (
                <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${getAvatarColor(formData.displayName || user?.email || 'User')} rounded-full flex items-center justify-center shadow-lg`}>
                  <span className="text-xl sm:text-2xl font-bold text-white">
                    {formData.displayName?.[0] || user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <Camera size={10} className="text-white sm:w-3 sm:h-3" />
              </div>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-blue-700 rounded-full px-3 py-2 sm:px-4 border border-blue-200/50 flex items-center space-x-2 transition-all duration-200 hover:shadow-md text-sm">
                <Upload size={14} />
                <span className="font-medium">Change Photo</span>
              </div>
            </label>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Display Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  placeholder="Enter your display name"
                  className="pl-10 bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-xl h-10 sm:h-12 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  value={user?.email || ''}
                  disabled
                  className="pl-10 bg-gray-50 border-gray-200/50 rounded-xl h-10 sm:h-12 text-gray-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Bio
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell us about yourself..."
                rows={3}
                className="bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-xl text-sm resize-none"
                maxLength={150}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/150 characters</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Location
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Your campus or city"
                className="bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-xl h-10 sm:h-12 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Website
              </label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                placeholder="https://your-website.com"
                className="bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-xl h-10 sm:h-12 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="flex-1 rounded-xl h-10 sm:h-12 text-sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl h-10 sm:h-12 text-sm"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;