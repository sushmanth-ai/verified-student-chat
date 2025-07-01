
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Camera, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';

interface CreateStoryProps {
  onStoryCreated?: () => void;
}

const CreateStory: React.FC<CreateStoryProps> = ({ onStoryCreated }) => {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

      await addDoc(collection(db, 'stories'), {
        content: content.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorEmail: user.email,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt,
        views: []
      });

      setContent('');
      setIsExpanded(false);
      toast({ title: "Story created!", description: "Your story has been shared and will be visible for 24 hours." });
      onStoryCreated?.();
    } catch (error) {
      console.error('Error creating story:', error);
      toast({ title: "Error", description: "Failed to create story. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full text-left text-gray-500 hover:text-gray-700 transition-colors"
          >
            Share your story...
          </button>
        </CardContent>
      </Card>
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
            setIsExpanded(false);
            setContent('');
          }}
        >
          <X size={18} />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's your story today?"
            className="min-h-[100px] resize-none"
            maxLength={300}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button type="button" variant="ghost" size="sm">
                <Camera size={18} className="mr-1" />
                Photo
              </Button>
              <span className="text-xs text-gray-500">
                {content.length}/300 • Expires in 24h
              </span>
            </div>
            <Button type="submit" disabled={!content.trim() || loading}>
              {loading ? 'Creating...' : 'Share Story'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateStory;
