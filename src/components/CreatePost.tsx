import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Camera, X, Sparkles } from 'lucide-react';
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
      <Card className="mb-6 bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-200 border border-blue-100/50 group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="text-gray-600 group-hover:text-gray-800 transition-colors font-medium">
                What's happening on campus?
              </span>
            </div>
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-white/30 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-b border-white/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Post
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsExpanded(false);
              setContent('');
            }}
            className="rounded-full hover:bg-red-50 hover:text-red-600"
          >
            <X size={20} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share what's happening on campus..."
            className="min-h-[120px] resize-none bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-2xl text-lg leading-relaxed"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 text-green-700 rounded-full px-4 py-2 border border-green-200/50"
              >
                <Camera size={18} className="mr-2" />
                Photo
              </Button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 font-medium">
                  {content.length}/500
                </span>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-200"
                    style={{ width: `${(content.length / 500) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={!content.trim() || loading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Posting...</span>
                </div>
              ) : (
                'Post'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePost;