
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, getDocs } from 'firebase/firestore';
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
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const postsData: Post[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const postData = docSnapshot.data();
        
        // Get comments for this post
        const commentsQuery = query(
          collection(db, 'posts', docSnapshot.id, 'comments'),
          orderBy('createdAt', 'asc')
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        const comments = commentsSnapshot.docs.map(commentDoc => ({
          id: commentDoc.id,
          ...commentDoc.data()
        })) as Comment[];

        postsData.push({
          id: docSnapshot.id,
          ...postData,
          comments
        } as Post);
      }
      
      setPosts(postsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.includes(user.uid);
    const postRef = doc(db, 'posts', postId);

    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast({ title: "Error", description: "Failed to update like", variant: "destructive" });
    }
  };

  const handleComment = async (postId: string) => {
    if (!user || !commentInputs[postId]?.trim()) return;

    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        content: commentInputs[postId].trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        createdAt: new Date()
      });

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
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

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 space-y-4">
        <CreatePost onPostCreated={() => {}} />
        
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Post Header */}
              <div className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{post.authorName}</h3>
                  <p className="text-sm text-gray-500">
                    {post.createdAt?.toDate?.()?.toLocaleString() || 'Just now'}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Post Actions */}
              <div className="px-4 py-3 border-t border-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 transition-colors ${
                        post.likes.includes(user?.uid || '') 
                          ? 'text-red-500' 
                          : 'text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart size={18} fill={post.likes.includes(user?.uid || '') ? 'currentColor' : 'none'} />
                      <span className="text-sm font-medium">{post.likes.length}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle size={18} />
                      <span className="text-sm font-medium">{post.comments.length}</span>
                    </button>
                  </div>
                </div>

                {/* Comment Input */}
                <div className="flex items-center space-x-2 mb-3">
                  <Input
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
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

                {/* Comments */}
                {showComments[post.id] && post.comments.length > 0 && (
                  <div className="space-y-2">
                    {post.comments.map((comment) => (
                      <Card key={comment.id} className="bg-gray-50 border-0">
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User size={12} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{comment.authorName}</p>
                              <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
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
