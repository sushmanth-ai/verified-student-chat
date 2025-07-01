import React, { useState, useEffect } from 'react';
import { MessageCircle, User, Send, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '../hooks/use-toast';
import StudyPartnersModal from './StudyPartnersModal';

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
  name: string;
  participants: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: any;
  isGroup: boolean;
}

const ChatScreen = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [newGroupName, setNewGroupName] = useState('');
  const [joinGroupName, setJoinGroupName] = useState('');

  const { user } = useAuth();
  const { toast } = useToast();

  // Load user's chats
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );
    return onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Chat) }));
      // sort by lastMessageTime descending
      data.sort((a, b) => {
        const tA = a.lastMessageTime?.toDate?.()?.getTime() || 0;
        const tB = b.lastMessageTime?.toDate?.()?.getTime() || 0;
        return tB - tA;
      });
      setChats(data);
      setLoading(false);
    });
  }, [user]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', selectedChat)
    );
    return onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Message) }));
      // sort ascending
      data.sort((a, b) => {
        const tA = a.createdAt?.toDate?.()?.getTime() || 0;
        const tB = b.createdAt?.toDate?.()?.getTime() || 0;
        return tA - tB;
      });
      setMessages(data);
    });
  }, [selectedChat]);

  const sendMessage = async () => {
    if (!user || !selectedChat || !newMessage.trim()) return;
    try {
      await addDoc(collection(db, 'messages'), {
        content: newMessage.trim(),
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        chatId: selectedChat,
        createdAt: serverTimestamp()
      });
      // update lastMessage on chat
      await updateDoc(doc(db, 'chats', selectedChat), {
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    }
  };

  const createGroup = async () => {
    if (!user || !newGroupName.trim()) return;
    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        name: newGroupName.trim(),
        participants: [user.uid],
        participantNames: [user.displayName || user.email?.split('@')[0] || 'Anonymous'],
        lastMessage: 'Group created',
        lastMessageTime: serverTimestamp(),
        isGroup: true
      });
      setSelectedChat(chatRef.id);
      setNewGroupName('');
      toast({ title: 'Group Created', description: `"${newGroupName}" is ready!` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to create group', variant: 'destructive' });
    }
  };

  const joinGroup = async () => {
    if (!user || !joinGroupName.trim()) return;
    try {
      // find group by name
      const q = query(
        collection(db, 'chats'),
        where('name', '==', joinGroupName.trim()),
        where('isGroup', '==', true)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ title: 'Not Found', description: `No group named "${joinGroupName}"`, variant: 'destructive' });
        return;
      }
      const docRef = snap.docs[0].ref;
      // add user if not already
      await updateDoc(docRef, {
        participants: arrayUnion(user.uid),
        participantNames: arrayUnion(user.displayName || user.email?.split('@')[0] || 'Anonymous')
      });
      setJoinGroupName('');
      toast({ title: 'Joined Group', description: `You joined "${joinGroupName}"` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to join group', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (selectedChat) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="p-4 bg-white border-b flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setSelectedChat(null)}>
            ← Back
          </Button>
          <h2 className="text-lg font-bold">
            {chats.find(c => c.id === selectedChat)?.name || 'Chat'}
          </h2>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(m => (
            <div
              key={m.id}
              className={`flex ${m.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs px-4 py-2 rounded-lg ${
                  m.senderId === user?.uid ? 'bg-blue-500 text-white' : 'bg-white border'
                }`}>
                {m.senderId !== user?.uid && (
                  <p className="text-xs text-gray-500 mb-1">{m.senderName}</p>
                )}
                <p className="text-sm">{m.content}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Input */}
        <div className="p-4 bg-white border-t flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={e => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <h2 className="text-lg font-bold">Messages & Groups</h2>
        <Button onClick={() => setNewGroupName('')}>
          <UserPlus />
        </Button>
      </div>

      {/* New Group & Join UI */}
      <div className="p-4 bg-white space-y-3">
        <div className="flex space-x-2">
          <Input
            placeholder="New group name"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
          />
          <Button onClick={createGroup} disabled={!newGroupName.trim()}>
            Create
          </Button>
        </div>
        <div className="flex space-x-2">
          <Input
            placeholder="Join group by name"
            value={joinGroupName}
            onChange={e => setJoinGroupName(e.target.value)}
          />
          <Button onClick={joinGroup} disabled={!joinGroupName.trim()}>
            Join
          </Button>
        </div>
      </div>

      {/* Chat / Group List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => setSelectedChat(chat.id)}
            className="p-4 bg-white border-b cursor-pointer hover:bg-gray-50 flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <User className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold truncate">{chat.name}</h3>
              <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
            </div>
            <span className="text-xs text-gray-400">
              {chat.lastMessageTime?.toDate?.()?.toLocaleTimeString() || 'Now'}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-white border-t">
        <Button variant="outline" className="w-full" onClick={() => setShowStudyPartners(true)}>
          Find Study Partners
        </Button>
      </div>

      {/* Modals */}
      <StudyPartnersModal isOpen={showStudyPartners} onClose={() => setShowStudyPartners(false)} />
    </div>
  );
};

export default ChatScreen;
