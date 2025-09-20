import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, User, Trash2, Reply, TrendingUp, Siren as Fire } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';
import CreatePost from './CreatePost';
import UserProfileStories from './UserProfileStories';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  replies?: Reply[];
}

interface Reply {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  createdAt: any;
  likes: string[];
  comments: Comment[];
  hasImage?: boolean;
  imageName?: string;
  imageData?: string;
  imageUrl?: string;
}

const HomeScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
  const [showReplies, setShowReplies] = useState<{ [commentId: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'recent' | 'trending'>('recent');
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  const [showUserStories, setShowUserStories] = useState<{ [userId: string]: boolean }>({});
  const [profiles, setProfiles] = useState<Record<string, { profileImage?: string; displayName?: string }>>({});
  const { user } = useAuth();
  const { profileData } = useProfile();
  const { toast } = useToast();


  useEffect(() => {
    const q = query(collection(db, 'posts'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const postsData: Post[] = [];

        for (const docSnapshot of snapshot.docs) {
          const postData = docSnapshot.data();

          try {
            const commentsQuery = query(
              collection(db, 'posts', docSnapshot.id, 'comments')
            );
            const commentsSnapshot = await getDocs(commentsQuery);
            const comments = commentsSnapshot.docs.map((commentDoc) => ({
              id: commentDoc.id,
              ...commentDoc.data()
            })) as Comment[];

            postsData.push({
              id: docSnapshot.id,
              ...postData,
              comments
            } as Post);
          } catch (commentError) {
            console.error('Error fetching comments for post:', docSnapshot.id, commentError);
            postsData.push({
              id: docSnapshot.id,
              ...postData,
              comments: []
            } as Post);
          }
        }

        const sortedPosts = postsData.sort((a, b) => {
          const timeA = a.createdAt?.toDate?.() || new Date(0);
          const timeB = b.createdAt?.toDate?.() || new Date(0);
          return timeB.getTime() - timeA.getTime();
        });

        setPosts(sortedPosts);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts. Please try again.');
        setLoading(false);
        toast({ title: 'Error', description: 'Failed to load posts', variant: 'destructive' });
      }
    );

    return unsubscribe;
  }, [toast]);

  // Fetch author profiles for posts
  useEffect(() => {
    const ids = Array.from(new Set(posts.map(p => p.authorId)));
    if (ids.length === 0) return;
    Promise.all(
      ids.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, 'profiles', id));
          return [id, snap.exists() ? snap.data() : null] as const;
        } catch {
          return [id, null] as const;
        }
      })
    ).then(entries => {
      const map: Record<string, any> = {};
      entries.forEach(([id, data]) => { if (data) map[id] = data; });
      setProfiles(map);
    });
  }, [posts]);

  // Listen for new posts and show notifications
  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('campusMediaSettings') || '{}');
    
    if (settings.notifications && posts.length > 0) {
      const latestPost = posts[0];
      const postTime = latestPost.createdAt?.toDate?.() || new Date(0);
      const now = new Date();
      const timeDiff = now.getTime() - postTime.getTime();
      
      // If post is less than 10 seconds old and not by current user
      if (timeDiff < 10000 && latestPost.authorId !== user?.uid) {
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Post on CampusMedia', {
            body: `${latestPost.authorName} shared: ${latestPost.content.substring(0, 50)}...`,
            icon: '/favicon.ico'
          });
        }
        
        // Play sound if enabled
        if (settings.soundNotifications) {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        }
      }
    }
  }, [posts, user]);

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

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Calculate trending posts based on likes from today only
  const getTrendingPosts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysPosts = posts.filter(post => {
      const postDate = post.createdAt?.toDate?.() || new Date(0);
      return postDate >= today;
    });

    return todaysPosts
      .filter(post => post.likes.length > 0)
      .sort((a, b) => b.likes.length - a.likes.length)
      .slice(0, 1); // Only show #1 trending post
  };

  const handleLike = async (postId: string) => {
    if (!user || likingPosts.has(postId)) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.includes(user.uid);
    
    // Optimistic update
    setLikingPosts(prev => new Set(prev).add(postId));
    setPosts(prevPosts => 
      prevPosts.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              likes: isLiked 
                ? p.likes.filter(uid => uid !== user.uid)
                : [...p.likes, user.uid]
            }
          : p
      )
    );

    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                likes: isLiked 
                  ? [...p.likes, user.uid]
                  : p.likes.filter(uid => uid !== user.uid)
              }
            : p
        )
      );
      toast({ title: 'Error', description: 'Failed to update like', variant: 'destructive' });
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;

    const post = posts.find((p) => p.id === postId);
    if (!post || post.authorId !== user.uid) {
      toast({ title: 'Error', description: 'You can only delete your own posts', variant: 'destructive' });
      return;
    }

    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        toast({ title: 'Post deleted', description: 'Your post has been removed.' });
      } catch (error) {
        console.error('Error deleting post:', error);
        toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' });
      }
    }
  };

  const handleComment = async (postId: string) => {
    if (!user || !commentInputs[postId]?.trim()) return;

    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        content: commentInputs[postId].trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        createdAt: serverTimestamp(),
        replies: []
      });

      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      toast({ title: 'Comment added!', description: 'Your comment has been posted.' });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' });
    }
  };

  const handleReply = async (postId: string, commentId: string) => {
    if (!user || !replyInputs[commentId]?.trim()) return;

    try {
      await addDoc(collection(db, 'posts', postId, 'comments', commentId, 'replies'), {
        content: replyInputs[commentId].trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        createdAt: serverTimestamp()
      });

      setReplyInputs((prev) => ({ ...prev, [commentId]: '' }));
      toast({ title: 'Reply added!', description: 'Your reply has been posted.' });
    } catch (error) {
      console.error('Error adding reply:', error);
      toast({ title: 'Error', description: 'Failed to add reply', variant: 'destructive' });
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleUserProfileClick = (userId: string) => {
    setShowUserStories(prev => ({ ...prev, [userId]: true }));
  };

  const displayPosts = activeTab === 'trending' ? getTrendingPosts() : posts;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-500 border-r-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:via-red-900/20 dark:to-pink-900/20">
        <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <p className="text-red-600 dark:text-red-400 mb-4 font-medium">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="p-4 space-y-6">
        <CreatePost onPostCreated={() => console.log('Post created')} />

        {/* Tab Navigation */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/30 dark:border-gray-700/30">
          <div className="flex">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-0 ${
                activeTab === 'recent'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <MessageCircle size={18} />
                <span>Recent</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-0 ${
                activeTab === 'trending'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Fire size={18} />
                <span>Trending</span>
              </div>
            </button>
          </div>
        </div>

        {displayPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                {activeTab === 'trending' ? 'No trending posts today' : 'No posts yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === 'trending' 
                  ? 'Check back later for trending content!' 
                  : 'Be the first to share something with the campus community!'
                }
              </p>
            </div>
          </div>
        ) : (
          displayPosts.map((post, index) => (
            <div
              key={post.id}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
            >
              {/* Trending indicator */}
              {activeTab === 'trending' && (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 text-sm font-semibold flex items-center">
                  <TrendingUp size={16} className="mr-2" />
                  #1 Trending Today • {post.likes.length} likes
                </div>
              )}

              {/* Post Header */}
              <div className="p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <button
                      onClick={() => handleUserProfileClick(post.authorId)}
                      className="w-12 h-12 rounded-full shadow-lg ring-4 ring-white/50 dark:ring-gray-700/50 overflow-hidden hover:scale-110 transition-transform duration-200"
                    >
                      {(() => {
                        // Check if this post author has profile data
                        const authorProfile = profiles[post.authorId] || (post.authorId === user?.uid ? profileData : null);
                        
                        if (authorProfile?.profileImage) {
                          return (
                            <img 
                              src={authorProfile.profileImage} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          );
                        } else {
                          return (
                            <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(post.authorName)} flex items-center justify-center`}>
                              <span className="text-white font-bold text-lg">
                                {post.authorName[0]?.toUpperCase()}
                              </span>
                            </div>
                          );
                        }
                      })()}
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUserProfileClick(post.authorId)}
                        className="font-bold text-gray-900 dark:text-gray-100 text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {post.authorName}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full inline-block font-medium">
                      {formatTimestamp(post.createdAt)}
                    </p>
                  </div>
                  {post.authorId === user?.uid && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full focus:outline-none focus:ring-0"
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <div className="px-6 pb-4">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-lg">{post.content}</p>
                {/* Display image if available */}
                {post.hasImage && (post.imageUrl || post.imageData) && (
                  <div className="mt-4 rounded-2xl overflow-hidden shadow-lg">
                    <img 
                      src={post.imageUrl || post.imageData} 
                      alt={post.imageName || 'Post image'} 
                      className="w-full h-auto max-h-96 object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/50 border-t border-gray-100/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      disabled={likingPosts.has(post.id)}
                      className={`flex items-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                        post.likes.includes(user?.uid || '')
                          ? 'text-rose-500 scale-110'
                          : 'text-gray-600 dark:text-gray-400 hover:text-rose-500 hover:scale-105'
                      } ${likingPosts.has(post.id) ? 'opacity-50' : ''}`}
                    >
                      <Heart
                        size={24}
                        fill={post.likes.includes(user?.uid || '') ? 'currentColor' : 'none'}
                        className="transition-all duration-200"
                      />
                      <span className="font-semibold text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {post.likes.length}
                      </span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-0"
                    >
                      <MessageCircle size={20} />
                      <span className="font-semibold text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {post.comments.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Comment Input - Show when comments are toggled */}
                {showComments[post.id] && (
                  <div className="flex items-center space-x-3 mb-4">
                    <Input
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      className="flex-1 bg-white/80 dark:bg-gray-700/80 border-gray-200/50 dark:border-gray-600/50 focus:ring-2 ring-blue-400/50 rounded-full shadow-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleComment(post.id);
                        }
                      }}
                    />
                    <Button
                      onClick={() => handleComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full px-6 shadow-lg focus:outline-none focus:ring-0"
                    >
                      Post
                    </Button>
                  </div>
                )}

                {/* Comments - Show when toggled */}
                {showComments[post.id] && post.comments.length > 0 && (
                  <div className="space-y-3">
                    {post.comments.map((comment) => (
                      <Card key={comment.id} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarColor(comment.authorName)} rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}>
                              <span className="text-white text-sm font-bold">
                                {comment.authorName[0]?.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{comment.authorName}</p>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{comment.content}</p>
                              <div className="flex items-center space-x-3 mt-3">
                                <button
                                  onClick={() => toggleReplies(comment.id)}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors focus:outline-none focus:ring-0"
                                >
                                  <Reply size={12} />
                                  <span>Reply</span>
                                </button>
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                  {formatTimestamp(comment.createdAt)}
                                </span>
                              </div>

                              {showReplies[comment.id] && (
                                <div className="mt-3">
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      placeholder="Write a reply..."
                                      value={replyInputs[comment.id] || ''}
                                      onChange={(e) =>
                                        setReplyInputs((prev) => ({ ...prev, [comment.id]: e.target.value }))
                                      }
                                      className="flex-1 text-sm bg-white/80 dark:bg-gray-700/80 border-gray-200/50 dark:border-gray-600/50 focus:ring-2 ring-blue-400/50 rounded-full"
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleReply(post.id, comment.id);
                                        }
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleReply(post.id, comment.id)}
                                      disabled={!replyInputs[comment.id]?.trim()}
                                      className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-full shadow-md focus:outline-none focus:ring-0"
                                    >
                                      Reply
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Stories Modal */}
      {Object.entries(showUserStories).map(([userId, isOpen]) => 
        isOpen && (
          <div key={userId} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Stories</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserStories(prev => ({ ...prev, [userId]: false }))}
                    className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <MessageCircle size={20} />
                  </Button>
                </div>
                <UserProfileStories userId={userId} />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default HomeScreen;