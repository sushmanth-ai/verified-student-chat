import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  Timestamp
} from 'firebase/firestore';
import CreateStory from './CreateStory';

interface Story {
  id: string;
  content: string;
  caption: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  views: string[];
}

const StoriesScreen = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, 'stories'),
      where('expiresAt', '>', Timestamp.now()), // ✅ Use Firestore Timestamp
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storiesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date(data.createdAt)),
          expiresAt: data.expiresAt instanceof Timestamp ? data.expiresAt : Timestamp.fromDate(new Date(data.expiresAt))
        };
      }) as Story[];

      console.log("Loaded stories:", storiesData); // ✅ Debug log
      setStories(storiesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching stories:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const getTimeAgo = (timestamp: Timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Create Story Section */}
      <div className="bg-white border-b border-gray-200 p-4">
        <CreateStory onStoryCreated={() => {}} />
      </div>

      {/* Stories Grid */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Campus Stories</h2>

        {stories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No active stories. Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Story Preview */}
                <div className="h-32 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 relative flex items-center justify-center p-3">
                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all"></div>
                  <p className="text-white font-medium text-sm text-center relative z-10 line-clamp-3">
                    {story.content || story.caption}
                  </p>

                  {/* User Avatar */}
                  <div className="absolute top-3 left-3 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-white">
                    <User size={16} className="text-gray-700" />
                  </div>
                </div>

                {/* Story Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{story.authorName}</h3>
                  {story.caption && story.content && (
                    <p className="text-gray-600 text-xs truncate">{story.caption}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">{getTimeAgo(story.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Story Stats */}
        <div className="mt-6 bg-white rounded-xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Today's Activity</h3>
          <div className="flex justify-between text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stories.length}</div>
              <div className="text-xs text-gray-500">Active Stories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stories.filter(s => s.authorId === user?.uid).length}</div>
              <div className="text-xs text-gray-500">Your Stories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stories.reduce((acc, story) => acc + story.views.length, 0)}</div>
              <div className="text-xs text-gray-500">Total Views</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoriesScreen;
