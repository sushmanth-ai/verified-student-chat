import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Heart, User } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

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

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onStoryView?: (storyId: string) => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ 
  stories, 
  initialIndex, 
  onClose, 
  onStoryView 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (currentStory && onStoryView) {
      onStoryView(currentStory.id);
    }
  }, [currentStory, onStoryView]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2; // 5 seconds total (100/2 = 50 intervals * 100ms)
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ 
                width: index < currentIndex ? '100%' : 
                       index === currentIndex ? `${progress}%` : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10 mt-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/30">
            <User size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{currentStory.authorName}</p>
            <p className="text-white/80 text-xs">{formatTime(currentStory.createdAt)}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
        >
          <X size={20} />
        </Button>
      </div>

      {/* Story Content */}
      <div className="relative w-full h-full max-w-md mx-auto">
        {currentStory.hasImage && currentStory.imageData ? (
          <div className="relative w-full h-full">
            <img 
              src={currentStory.imageData} 
              alt={currentStory.imageName || 'Story'} 
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
            
            {/* Story text overlay */}
            {currentStory.content && (
              <div className="absolute bottom-20 left-4 right-4">
                <p className="text-white text-lg font-semibold leading-relaxed drop-shadow-lg">
                  {currentStory.content}
                </p>
                {currentStory.caption && (
                  <p className="text-white/90 text-sm mt-2 drop-shadow-lg">
                    {currentStory.caption}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center p-8 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute bottom-20 right-10 w-24 h-24 bg-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            
            <div className="text-center relative z-10">
              <p className="text-white text-xl font-bold leading-relaxed mb-4 drop-shadow-lg">
                {currentStory.content}
              </p>
              {currentStory.caption && (
                <p className="text-white/90 text-lg drop-shadow-lg">
                  {currentStory.caption}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation areas */}
        <div className="absolute inset-0 flex">
          <div 
            className="flex-1 cursor-pointer" 
            onClick={handlePrevious}
          />
          <div 
            className="flex-1 cursor-pointer" 
            onClick={handleNext}
          />
        </div>

        {/* Navigation buttons */}
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
          >
            <ChevronLeft size={20} />
          </Button>
        )}
        
        {currentIndex < stories.length - 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
          >
            <ChevronRight size={20} />
          </Button>
        )}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-2">
            <Eye size={16} className="text-white" />
            <span className="text-white text-sm font-medium">{currentStory.views.length}</span>
          </div>
        </div>
        
        <div className="text-white/80 text-xs bg-black/30 backdrop-blur-sm rounded-full px-3 py-2">
          {currentIndex + 1} of {stories.length}
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;