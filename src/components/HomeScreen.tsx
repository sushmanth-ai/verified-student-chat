import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, User, Trash2, Reply, TrendingUp, Siren as Fire } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';
import CreatePost from './CreatePost';
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
  const { user } = useAuth();
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

  const handleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.includes(user.uid);
    const postRef = doc(db, 'posts', postId);

    try {
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Error updating like:', error);
      toast({ title: 'Error', description: 'Failed to update like', variant: 'destructive' });
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

  // Calculate trending posts based on likes only
  const getTrendingPosts = () => {
    return [...posts].sort((a, b) => {
      return b.likes.length - a.likes.length;
    });
  };

  const displayPosts = activeTab === 'trending' ? getTrendingPosts() : posts;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-500 border-r-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <p className="text-red-600 mb-4 font-medium">{error}</p>
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
    <div className="h-full overflow-y-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="p-4 space-y-6">
        <CreatePost onPostCreated={() => console.log('Post created')} />

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/30">
          <div className="flex">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'recent'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/80'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <MessageCircle size={18} />
                <span>Recent</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'trending'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/80'
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
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No posts yet</h3>
              <p className="text-gray-600">Be the first to share something with the campus community!</p>
            </div>
          </div>
        ) : (
          displayPosts.map((post, index) => (
            <div
              key={post.id}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
            >
              {/* Trending indicator */}
              {activeTab === 'trending' && index < 3 && (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 text-sm font-semibold flex items-center">
                  <TrendingUp size={16} className="mr-2" />
                  #{index + 1} Trending • {post.likes.length} likes
                </div>
              )}

              {/* Post Header */}
              <div className="p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center ring-4 ring-white/50">
                    <User size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{post.authorName}</h3>
                    <p className="text-sm text-gray-600">
                      {post.createdAt?.toDate
                        ? post.createdAt.toDate().toLocaleString()
                        : 'Just now'}
                    </p>
                  </div>
                  {post.authorId === user?.uid && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <div className="px-6 pb-4">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg">{post.content}</p>
                {/* Display image if available */}
                {post.hasImage && post.imageData && (
                  <div className="mt-4 rounded-2xl overflow-hidden shadow-lg">
                    <img 
                      src={post.imageData} 
                      alt={post.imageName || 'Post image'} 
                      className="w-full h-auto max-h-96 object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50/50 to-blue-50/50 border-t border-gray-100/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 px-4 py-2 transition-all duration-200 ${
                        post.likes.includes(user?.uid || '')
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg scale-105 rounded-lg'
                          : 'bg-white/70 text-gray-600 hover:bg-gradient-to-r hover:from-rose-100 hover:to-pink-100 hover:text-rose-600 shadow-md rounded-lg'
                      }`}
                    >
                      <Heart
                        size={20}
                        fill={post.likes.includes(user?.uid || '') ? 'currentColor' : 'none'}
                      />
                      <span className="font-semibold">{post.likes.length}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/70 text-gray-600 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 hover:text-blue-600 transition-all duration-200 shadow-md"
                    >
                      <MessageCircle size={20} />
                      <span className="font-semibold">{post.comments.length}</span>
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
                      className="flex-1 bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-full shadow-sm"
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
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full px-6 shadow-lg"
                    >
                      Post
                    </Button>
                  </div>
                )}

                {/* Comments - Show when toggled */}
                {showComments[post.id] && post.comments.length > 0 && (
                  <div className="space-y-3">
                    {post.comments.map((comment) => (
                      <Card key={comment.id} className="bg-white/90 backdrop-blur-sm border border-white/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                              <User size={16} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 mb-1">{comment.authorName}</p>
                              <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                              <div className="flex items-center space-x-3 mt-3">
                                <button
                                  onClick={() => toggleReplies(comment.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
                                >
                                  <Reply size={12} />
                                  <span>Reply</span>
                                </button>
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
                                      className="flex-1 text-sm bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-full"
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
                                      className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-full shadow-md"
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
    </div>
  );
};

export default HomeScreen;