
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Camera, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';

interface CreatePostProps {
  onPostCreated?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
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
      await addDoc(collection(db, 'posts'), {
        content: content.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorEmail: user.email,
        createdAt: serverTimestamp(),
        likes: [],
        comments: []
      });

      setContent('');
      setIsExpanded(false);
      toast({ title: "Post created!", description: "Your post has been shared with the campus community." });
      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: "Error", description: "Failed to create post. Please try again.", variant: "destructive" });
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
            What's happening on campus?
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Create Post</CardTitle>
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
            placeholder="Share what's happening on campus..."
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button type="button" variant="ghost" size="sm">
                <Camera size={18} className="mr-1" />
                Photo
              </Button>
              <span className="text-xs text-gray-500">
                {content.length}/500
              </span>
            </div>
            <Button type="submit" disabled={!content.trim() || loading}>
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
