import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Users, Smile, Paperclip, Trash2, Upload, Image, Heart, MoreVertical } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '../hooks/use-toast';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  hasFile?: boolean;
  fileName?: string;
  fileData?: string;
  fileType?: string;
}

interface ChatGroup {
  id: string;
  name: string;
  members: string[];
  createdAt: any;
  createdBy: string;
  createdByName: string;
}

interface GroupChatProps {
  group: ChatGroup;
  onBack: () => void;
  onGroupDeleted?: () => void;
}

const GroupChat: React.FC<GroupChatProps> = ({ group, onBack, onGroupDeleted }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced emojis with categories
  const emojiCategories = {
    'Smileys': ['😀', '😂', '🥰', '😍', '🤗', '😎', '🤔', '😴', '🤯', '🥳'],
    'Gestures': ['👍', '👎', '👏', '🙌', '👋', '✌️', '🤞', '💪', '🙏', '👌'],
    'Hearts': ['❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '💕', '💖'],
    'Objects': ['🔥', '💯', '⭐', '✨', '🎉', '🎊', '🏆', '🎯', '💎', '🌟']
  };

  // Load messages in real-time
  useEffect(() => {
    if (!group?.id) return;

    const messagesRef = collection(db, 'chatGroups', group.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      setMessages(messagesData);
      setLoading(false);
    });

    return unsubscribe;
  }, [group?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing indicator
  useEffect(() => {
    if (newMessage.trim()) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [newMessage]);

  const handleSendMessage = async () => {
    if (!user || !newMessage.trim() || !group?.id) return;

    try {
      const messagesRef = collection(db, 'chatGroups', group.id, 'messages');
      await addDoc(messagesRef, {
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        text: newMessage.trim(),
        timestamp: serverTimestamp()
      });

      setNewMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !group?.id) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const messagesRef = collection(db, 'chatGroups', group.id, 'messages');
        await addDoc(messagesRef, {
          senderId: user.uid,
          senderName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          text: `Shared ${file.type.startsWith('image/') ? 'an image' : 'a file'}: ${file.name}`,
          timestamp: serverTimestamp(),
          hasFile: true,
          fileName: file.name,
          fileData: reader.result as string,
          fileType: file.type
        });

        toast({
          title: "File shared!",
          description: `${file.name} has been shared in the chat.`
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Error",
          description: "Failed to upload file. Please try again.",
          variant: "destructive"
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleDeleteGroup = async () => {
    if (!user || !group || group.createdBy !== user.uid) {
      toast({
        title: "Error",
        description: "Only the group creator can delete this group.",
        variant: "destructive"
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'chatGroups', group.id));
        toast({
          title: "Group deleted",
          description: "The group has been successfully deleted."
        });
        onGroupDeleted?.();
        onBack();
      } catch (error) {
        console.error('Error deleting group:', error);
        toast({
          title: "Error",
          description: "Failed to delete group. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
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

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-500 border-r-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex flex-col">
      {/* Enhanced Header */}
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 p-2 transition-all duration-200"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/50 dark:ring-gray-700/50">
                  <Users size={24} className="text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse"></div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users size={12} />
                  <span className="font-medium">{group.members?.length || 0} members</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span className="text-green-600 dark:text-green-400 font-medium">Active now</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {group.createdBy === user?.uid && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteGroup}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full p-2"
              >
                <Trash2 size={16} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MoreVertical size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Start the conversation!</h3>
              <p className="text-gray-600 dark:text-gray-400">Be the first to send a message in this group.</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === user?.uid;
              const showDate = index === 0 || getMessageDate(message.timestamp) !== getMessageDate(messages[index - 1]?.timestamp);
              const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1]?.senderId !== message.senderId);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-6">
                      <span className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 shadow-md border border-white/30 dark:border-gray-700/30">
                        {getMessageDate(message.timestamp)}
                      </span>
                    </div>
                  )}
                  
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
                    <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!isOwnMessage && showAvatar && (
                        <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarColor(message.senderName)} rounded-full flex items-center justify-center shadow-md flex-shrink-0 ring-2 ring-white/50 dark:ring-gray-700/50`}>
                          <span className="text-white text-xs font-bold">
                            {message.senderName[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {!isOwnMessage && !showAvatar && (
                        <div className="w-8 h-8 flex-shrink-0"></div>
                      )}
                      
                      <div className={`relative px-4 py-3 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                          : 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-800 dark:text-gray-200 border border-white/30 dark:border-gray-700/30'
                      }`}>
                        {!isOwnMessage && showAvatar && (
                          <p className="text-xs font-semibold mb-1 opacity-70">
                            {message.senderName}
                          </p>
                        )}
                        
                        {/* Enhanced File display */}
                        {message.hasFile && message.fileData && (
                          <div className="mb-2">
                            {message.fileType?.startsWith('image/') ? (
                              <div className="relative group">
                                <img 
                                  src={message.fileData} 
                                  alt={message.fileName} 
                                  className="max-w-full h-auto rounded-lg shadow-md transition-transform duration-200 group-hover:scale-105"
                                  style={{ maxHeight: '200px' }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200"></div>
                              </div>
                            ) : (
                              <div className="bg-white/20 dark:bg-gray-700/20 p-3 rounded-lg flex items-center space-x-2 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-colors">
                                <Paperclip size={16} />
                                <span className="text-sm font-medium">{message.fileName}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <p className="text-sm break-words leading-relaxed">{message.text}</p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className={`text-xs ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                          
                          {isOwnMessage && (
                            <div className="flex items-center space-x-1">
                              <div className="w-1 h-1 bg-blue-200 rounded-full"></div>
                              <div className="w-1 h-1 bg-blue-200 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Enhanced Emoji Picker */}
      {showEmojiPicker && (
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 p-4 shadow-lg max-h-64 overflow-y-auto">
          {Object.entries(emojiCategories).map(([category, emojis]) => (
            <div key={category} className="mb-4">
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{category}</h4>
              <div className="grid grid-cols-10 gap-1">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 hover:scale-110 transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Message Input */}
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 p-2 transition-all duration-200 hover:scale-110"
          >
            <Paperclip size={20} className="text-gray-500 dark:text-gray-400" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-white/80 dark:bg-gray-700/80 border-gray-200/50 dark:border-gray-600/50 focus:ring-2 ring-blue-400/50 rounded-2xl pr-12 h-12 shadow-md transition-all duration-200 focus:shadow-lg"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 p-2 transition-all duration-200"
            >
              <Smile size={18} className="text-gray-500 dark:text-gray-400" />
            </Button>
          </div>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full w-12 h-12 p-0 shadow-lg disabled:opacity-50 focus:outline-none focus:ring-0 transition-all duration-200 hover:scale-110 disabled:hover:scale-100"
          >
            <Send size={20} />
          </Button>
        </div>
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>You are typing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChat;