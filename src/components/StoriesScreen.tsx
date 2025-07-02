import React, { useState, useEffect } from 'react';
import { User, Trash2, Eye, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, where, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';
import CreateStory from './CreateStory';
import { Button } from './ui/button';

interface Story {
  id: string;
  content: string;
  caption: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  expiresAt: any;
  views: string[];
}

const StoriesScreen = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Modified query to avoid composite index requirement
    // We'll filter by expiresAt and sort client-side by createdAt
    const now = new Date();
    const q = query(
      collection(db, 'stories'),
      where('expiresAt', '>', now)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];
      
      // Sort by createdAt on the client side
      const sortedStories = storiesData.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime; // Descending order (newest first)
      });
      
      setStories(sortedStories);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleDeleteStory = async (storyId: string) => {
    if (!user) return;

    const story = stories.find(s => s.id === storyId);
    if (!story || story.authorId !== user.uid) {
      toast({ title: "Error", description: "You can only delete your own stories", variant: "destructive" });
      return;
    }

    if (window.confirm('Are you sure you want to delete this story?')) {
      try {
        await deleteDoc(doc(db, 'stories', storyId));
        toast({ title: "Story deleted", description: "Your story has been removed." });
      } catch (error) {
        console.error('Error deleting story:', error);
        toast({ title: "Error", description: "Failed to delete story", variant: "destructive" });
      }
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-500 border-r-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Create Story Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-6 shadow-lg">
        <CreateStory onStoryCreated={() => {}} />
      </div>

      {/* Stories Grid */}
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Campus Stories
          </h2>
        </div>
        
        {stories.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No active stories</h3>
              <p className="text-gray-600">Be the first to create one!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 cursor-pointer group relative hover:scale-105"
              >
                {/* Delete button for own stories */}
                {story.authorId === user?.uid && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStory(story.id);
                    }}
                    className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-sm text-white hover:bg-red-500/80 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full w-8 h-8 p-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}

                {/* Story Preview */}
                <div className="h-40 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 relative flex items-center justify-center p-4 overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 -translate-y-10"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 bg-white rounded-full translate-x-8 translate-y-8"></div>
                    <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-white rounded-full -translate-x-6 -translate-y-6"></div>
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent group-hover:from-black/40 transition-all duration-200"></div>
                  
                  <p className="text-white font-semibold text-sm text-center relative z-10 line-clamp-4 leading-relaxed">
                    {story.content || story.caption}
                  </p>
                  
                  {/* User Avatar */}
                  <div className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                    <User size={16} className="text-gray-700" />
                  </div>

                  {/* Time indicator */}
                  <div className="absolute bottom-3 left-3 flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                    <Clock size={12} className="text-white" />
                    <span className="text-white text-xs font-medium">{getTimeAgo(story.createdAt)}</span>
                  </div>
                </div>

                {/* Story Info */}
                <div className="p-4 bg-gradient-to-r from-gray-50/80 to-blue-50/80">
                  <h3 className="font-bold text-gray-900 text-sm truncate mb-1">{story.authorName}</h3>
                  {story.caption && story.content && (
                    <p className="text-gray-600 text-xs truncate mb-2">{story.caption}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 bg-purple-100 px-2 py-1 rounded-full">
                      <Eye size={12} className="text-purple-600" />
                      <span className="text-purple-700 text-xs font-medium">{story.views.length}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{getTimeAgo(story.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Story Stats */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-xl">
          <h3 className="font-bold text-gray-900 mb-6 text-lg flex items-center">
            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center mr-2">
              <Sparkles size={16} className="text-white" />
            </div>
            Today's Activity
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                <Sparkles size={24} className="text-white" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{stories.length}</div>
              <div className="text-xs text-gray-500 font-medium">Active Stories</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                <User size={24} className="text-white" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{stories.filter(s => s.authorId === user?.uid).length}</div>
              <div className="text-xs text-gray-500 font-medium">Your Stories</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                <Eye size={24} className="text-white" />
              </div>
              <div className="text-2xl font-bold text-green-600">{stories.reduce((acc, story) => acc + story.views.length, 0)}</div>
              <div className="text-xs text-gray-500 font-medium">Total Views</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoriesScreen;