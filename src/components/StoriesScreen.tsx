
import React, { useState, useEffect } from 'react';
import { Camera, User, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';
import CreateStory from './CreateStory';
import { Button } from './ui/button';

interface Story {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
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
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('Setting up stories listener...');
    const now = new Date();
    const q = query(
      collection(db, 'stories'),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'desc'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscriber = onSnapshot(q, 
      (snapshot) => {
        console.log('Stories snapshot received, docs count:', snapshot.docs.length);
        const storiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Story[];
        
        console.log('Stories data:', storiesData);
        setStories(storiesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching stories:', error);
        setLoading(false);
        toast({ title: "Error", description: "Failed to load stories", variant: "destructive" });
      }
    );

    return unsubscriber;
  }, [user, toast]);

  const handleViewStory = async (storyId: string) => {
    if (!user) return;

    try {
      const storyRef = doc(db, 'stories', storyId);
      await updateDoc(storyRef, {
        views: arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Error updating story view:', error);
    }
  };

  const getTimeRemaining = (expiresAt: any) => {
    if (!expiresAt) return 'Unknown';
    
    const now = new Date();
    const expiry = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 space-y-4">
        <CreateStory onStoryCreated={() => console.log('Story created')} />
        
        {stories.length === 0 ? (
          <div className="text-center py-8">
            <Camera size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No stories yet. Be the first to share your moment!</p>
            <p className="text-sm text-gray-400">Stories disappear after 24 hours</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewStory(story.id)}
              >
                {/* Story Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{story.authorName}</h3>
                      <p className="text-sm text-gray-500">
                        {getTimeRemaining(story.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Eye size={16} />
                    <span className="text-sm">{story.views.length}</span>
                  </div>
                </div>

                {/* Story Content */}
                <div className="px-4 pb-4">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{story.content}</p>
                </div>

                {/* Story Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Posted {story.createdAt?.toDate?.()?.toLocaleString() || 'just now'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesScreen;
