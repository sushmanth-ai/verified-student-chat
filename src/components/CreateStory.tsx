
import React, { useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';
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
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl py-3 px-4 flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
      >
        <Camera size={20} />
        <span className="font-semibold">Create Your Story</span>
      </button>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Create Story</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setContent('');
            setCaption('');
          }}
        >
          <X size={18} />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Story Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening on campus right now?"
              className="min-h-[80px] resize-none"
              maxLength={200}
            />
            <div className="text-right">
              <span className="text-xs text-gray-500">{content.length}/200</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption (Optional)
            </label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              maxLength={100}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button type="button" variant="ghost" size="sm">
                <Upload size={18} className="mr-1" />
                Upload Photo
              </Button>
            </div>
            <Button type="submit" disabled={(!content.trim() && !caption.trim()) || loading}>
              {loading ? 'Creating...' : 'Share Story'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateStory;
