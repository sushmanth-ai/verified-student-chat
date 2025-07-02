import React, { useState } from 'react';
import { Camera, X, Upload, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';

interface CreateStoryProps {
  onStoryCreated?: () => void;
}

const CreateStory: React.FC<CreateStoryProps> = ({ onStoryCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!content.trim() && !caption.trim())) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'stories'), {
        content: content.trim(),
        caption: caption.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorEmail: user.email,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        views: []
      });

      setContent('');
      setCaption('');
      setIsOpen(false);
      toast({ title: "Story created!", description: "Your story has been shared and will be visible for 24 hours." });
      onStoryCreated?.();
    } catch (error) {
      console.error('Error creating story:', error);
      toast({ title: "Error", description: "Failed to create story. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-2xl py-4 px-6 flex items-center justify-center space-x-3 hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
      >
        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <Camera size={20} className="text-white" />
        </div>
        <span className="font-bold text-lg">Create Your Story</span>
        <Sparkles size={20} className="text-white animate-pulse" />
      </button>
    );
  }

  return (
    <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-white/30 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border-b border-white/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
            <Sparkles size={24} className="mr-2 text-purple-500" />
            Create Story
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              setContent('');
              setCaption('');
            }}
            className="rounded-full hover:bg-red-50 hover:text-red-600"
          >
            <X size={20} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Story Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening on campus right now?"
              className="min-h-[100px] resize-none bg-white/80 border-gray-200/50 focus:ring-2 ring-purple-400/50 rounded-2xl text-lg leading-relaxed"
              maxLength={200}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="text-right">
                <span className="text-xs text-gray-500 font-medium">{content.length}/200</span>
              </div>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200"
                  style={{ width: `${(content.length / 200) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Caption (Optional)
            </label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              maxLength={100}
              className="bg-white/80 border-gray-200/50 focus:ring-2 ring-purple-400/50 rounded-xl h-12"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 text-green-700 rounded-full px-4 py-2 border border-green-200/50"
              >
                <Upload size={18} className="mr-2" />
                Upload Photo
              </Button>
            </div>
            <Button 
              type="submit" 
              disabled={(!content.trim() && !caption.trim()) || loading}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles size={16} />
                  <span>Share Story</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateStory;