import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, User, Trash2, Reply } from 'lucide-react';
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
}

const HomeScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
  const [showReplies, setShowReplies] = useState<{ [commentId: string]: boolean }>({});
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-blue-50 via-white to-gray-100">
      <div className="p-4 space-y-4">
        <CreatePost onPostCreated={() => console.log('Post created')} />

        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
            >
              <div className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-md flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{post.authorName}</h3>
                  <p className="text-sm text-gray-500">
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
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>

              <div className="px-4 pb-3">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>

              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 transition-colors ${
                        post.likes.includes(user?.uid || '')
                          ? 'text-rose-500'
                          : 'text-gray-500 hover:text-rose-500'
                      }`}
                    >
                      <Heart
                        size={18}
                        fill={post.likes.includes(user?.uid || '') ? 'currentColor' : 'none'}
                      />
                      <span className="text-sm font-medium">{post.likes.length}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center space-x-2 text-gray-500 hover:text-indigo-500 transition-colors"
                    >
                      <MessageCircle size={18} />
                      <span className="text-sm font-medium">{post.comments.length}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <Input
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    className="flex-1 focus:ring-2 ring-indigo-500 shadow-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleComment(post.id);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleComment(post.id)}
                    disabled={!commentInputs[post.id]?.trim()}
                  >
                    Post
                  </Button>
                </div>

                {showComments[post.id] && post.comments.length > 0 && (
                  <div className="space-y-3">
                    {post.comments.map((comment) => (
                      <Card key={comment.id} className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition">
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User size={12} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{comment.authorName}</p>
                              <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <button
                                  onClick={() => toggleReplies(comment.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                >
                                  <Reply size={12} />
                                  <span>Reply</span>
                                </button>
                              </div>

                              {showReplies[comment.id] && (
                                <div className="mt-2">
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      placeholder="Write a reply..."
                                      value={replyInputs[comment.id] || ''}
                                      onChange={(e) =>
                                        setReplyInputs((prev) => ({ ...prev, [comment.id]: e.target.value }))
                                      }
                                      className="flex-1 text-sm focus:ring-2 ring-blue-400"
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
