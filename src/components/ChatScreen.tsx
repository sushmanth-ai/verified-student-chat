
import React, { useState, useEffect } from 'react';
import { MessageCircle, User, Send, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, updateDoc, doc } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '../hooks/use-toast';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: any;
  chatId: string;
}

interface Chat {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
  name?: string;
  isGroup?: boolean;
}

const ChatScreen = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load user's chats
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('Setting up chats listener for user:', user.uid);
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Chats snapshot received, docs count:', snapshot.docs.length);
        const chatsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Chat[];
        
        console.log('Chats data:', chatsData);
        setChats(chatsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching chats:', error);
        setLoading(false);
        toast({ title: "Error", description: "Failed to load chats", variant: "destructive" });
      }
    );

    return unsubscribe;
  }, [user, toast]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    console.log('Setting up messages listener for chat:', selectedChat);
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', selectedChat),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Messages snapshot received, docs count:', snapshot.docs.length);
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        
        console.log('Messages data:', messagesData);
        setMessages(messagesData);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
      }
    );

    return unsubscribe;
  }, [selectedChat, toast]);

  const sendMessage = async () => {
    if (!user || !selectedChat || !newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      // Add message to messages collection
      await addDoc(collection(db, 'messages'), {
        content: messageContent,
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        chatId: selectedChat,
        createdAt: serverTimestamp()
      });

      // Update chat's last message
      const chatRef = doc(db, 'chats', selectedChat);
      await updateDoc(chatRef, {
        lastMessage: messageContent,
        lastMessageTime: serverTimestamp()
      });

      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      setNewMessage(messageContent); // Restore message on error
    }
  };

  const createNewChat = async () => {
    if (!user) return;
    
    try {
      console.log('Creating new chat for user:', user.uid);
      const chatDoc = await addDoc(collection(db, 'chats'), {
        participants: [user.uid],
        participantNames: [user.displayName || user.email?.split('@')[0] || 'Anonymous'],
        lastMessage: 'Chat created',
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
        name: 'Campus General Chat',
        isGroup: true
      });

      console.log('Chat created with ID:', chatDoc.id);
      setSelectedChat(chatDoc.id);
      toast({ title: "Chat created!", description: "You can now start messaging." });
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({ title: "Error", description: "Failed to create chat", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (selectedChat) {
    const currentChat = chats.find(chat => chat.id === selectedChat);
    
    return (
      <div className="h-full bg-gray-50 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedChat(null)}
              className="text-blue-600 font-medium hover:text-blue-700"
            >
              ← Back to Chats
            </button>
            <h2 className="text-lg font-bold text-gray-900">
              {currentChat?.name || 'Chat'}
            </h2>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.senderId === user?.uid
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {message.senderId !== user?.uid && (
                    <p className="text-xs text-gray-500 mb-1">{message.senderName}</p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.createdAt?.toDate?.()?.toLocaleTimeString() || 'Sending...'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
            />
            <Button size="sm" onClick={sendMessage} disabled={!newMessage.trim()}>
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <button 
            onClick={createNewChat}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No chats yet. Start a conversation!</p>
            <Button onClick={createNewChat}>Create New Chat</Button>
          </div>
        ) : (
          chats.map((chat, index) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`bg-white hover:bg-gray-50 transition-colors cursor-pointer ${
                index !== chats.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="p-4 flex items-center space-x-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-500">
                    <User size={20} className="text-white" />
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                    </div>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {chat.name || chat.participantNames.filter(name => name !== (user?.displayName || user?.email?.split('@')[0])).join(', ') || 'Chat'}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {chat.lastMessageTime?.toDate?.()?.toLocaleTimeString() || 'Now'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">{chat.lastMessage}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-blue-50 text-blue-600 rounded-lg py-3 px-4 text-sm font-medium hover:bg-blue-100 transition-colors">
            Find Study Partners
          </button>
          <button className="bg-green-50 text-green-600 rounded-lg py-3 px-4 text-sm font-medium hover:bg-green-100 transition-colors">
            Join Campus Groups
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
