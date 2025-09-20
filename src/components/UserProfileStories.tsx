import React, { useState, useEffect } from 'react';
import { Plus, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import StoryViewer from './StoryViewer';

interface Story {
  id: string;
  content: string;
  caption: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  expiresAt: any;
  views: string[];
  hasImage?: boolean;
  imageName?: string;
  imageData?: string;
}

interface UserProfileStoriesProps {
  userId?: string;
  showCreateButton?: boolean;
  onCreateStory?: () => void;
}

const UserProfileStories: React.FC<UserProfileStoriesProps> = ({ 
  userId, 
  showCreateButton = false, 
  onCreateStory 
}) => {
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { user } = useAuth();

  const targetUserId = userId || user?.uid;

  useEffect(() => {
    if (!targetUserId) return;

    const now = new Date();
    const q = query(
      collection(db, 'stories'),
      where('authorId', '==', targetUserId),
      where('expiresAt', '>', now)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];
      
      // Sort by createdAt on client side
      const sortedStories = storiesData.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime; // Descending order (newest first)
      });
      
      setUserStories(sortedStories);
    });

    return unsubscribe;
  }, [targetUserId]);

  const handleStoryClick = (index: number) => {
    setSelectedIndex(index);
    setShowViewer(true);
  };

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

  if (userStories.length === 0 && !showCreateButton) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Play size={24} className="text-gray-500 dark:text-gray-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">No stories available</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center space-x-4 overflow-x-auto pb-2">
        {/* Create Story Button */}
        {showCreateButton && (
          <button
            onClick={onCreateStory}
            className="flex-shrink-0 flex flex-col items-center space-y-2 group"
          >
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center border-2 border-dashed border-gray-400 dark:border-gray-500 group-hover:border-blue-500 transition-all duration-200">
                <Plus size={24} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-500" />
              </div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Add Story</span>
          </button>
        )}

        {/* User Stories */}
        {userStories.map((story, index) => (
          <button
            key={story.id}
            onClick={() => handleStoryClick(index)}
            className="flex-shrink-0 flex flex-col items-center space-y-2 group"
          >
            <div className="relative">
              {/* Story Ring - removed green dots */}
              <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 rounded-full p-0.5 shadow-lg">
                <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full p-0.5">
                  {story.hasImage && story.imageData ? (
                    <img 
                      src={story.imageData} 
                      alt="Story preview" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(story.authorName)} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold text-lg">
                        {story.authorName[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Play Icon Overlay */}
              <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Play size={16} className="text-white" fill="white" />
              </div>
              
              {/* Unviewed Indicator - removed blue dots */}
            </div>
            
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium max-w-16 truncate">
              {story.authorId === user?.uid ? 'Your Story' : story.authorName}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer */}
      {showViewer && (
        <StoryViewer
          stories={userStories}
          initialIndex={selectedIndex}
          onClose={() => setShowViewer(false)}
          onStoryView={(storyId) => {
            // Handle story view tracking if needed
          }}
        />
      )}
    </>
  );
};

export default UserProfileStories;