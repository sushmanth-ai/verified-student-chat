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
  arrayUnion,
  getDocs
} from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '../hooks/use-toast';
import StudyPartnersModal from './StudyPartnersModal';
import CampusGroupsModal from './CampusGroupsModal';

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

const ChatScreen: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [newGroupName, setNewGroupName] = useState('');
  const [joinGroupName, setJoinGroupName] = useState('');
  const [showStudyPartners, setShowStudyPartners] = useState(false);
  const [showCampusGroups, setShowCampusGroups] = useState(false);

  const [loading, setLoading] = useState(true);

  // Load user's chats
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );
    const unsub = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Chat) }));
      data.sort((a, b) => {
        const tA = a.lastMessageTime?.toDate?.().getTime() || 0;
        const tB = b.lastMessageTime?.toDate?.().getTime() || 0;
        return tB - tA;
      });
      setChats(data);
      setLoading(false);
    });
    return unsub;
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
    const unsub = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Message) }));
      data.sort((a, b) => {
        const tA = a.createdAt?.toDate?.().getTime() || 0;
        const tB = b.createdAt?.toDate?.().getTime() || 0;
        return tA - tB;
      });
      setMessages(data);
    });
    return unsub;
  }, [selectedChat]);

  // Send a new message
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

  // Create a new group chat
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
      toast({ title: 'Group Created', description: `"${newGroupName}" is ready!` });
      setNewGroupName('');
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to create group', variant: 'destructive' });
    }
  };

  // Join an existing group by name
  const joinGroup = async () => {
    if (!user || !joinGroupName.trim()) return;
    try {
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
      await updateDoc(docRef, {
        participants: arrayUnion(user.uid),
        participantNames: arrayUnion(user.displayName || user.email?.split('@')[0] || 'Anonymous')
      });
      toast({ title: 'Joined Group', description: `You joined "${joinGroupName}"` });
      setJoinGroupName('');
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to join group', variant: 'destructive' });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Chat view when a chat is selected
  if (selectedChat) {
    const chatInfo = chats.find(c => c.id === selectedChat);
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div className="p-4 bg-white border-b flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setSelectedChat(null)}>
            ← Back
          </Button>
          <h2 className="text-lg font-bold">{chatInfo?.name || 'Chat'}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(m => (
            <div
              key={m.id}
              className={`flex ${m.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs px-4 py-2 rounded-lg ${
                m.senderId === user?.uid ? 'bg-blue-500 text-white' : 'bg-white border'
              }`}>
                {m.senderId !== user?.uid && <p className="text-xs text-gray-500 mb-1">{m.senderName}</p>}
                <p className="text-sm">{m.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-white border-t flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message…"
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

  // Default view: list of chats and group actions
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <h2 className="text-lg font-bold">Messages & Groups</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowStudyPartners(true)}>
            <MessageCircle /> Find Partners
          </Button>
          <Button onClick={() => setShowCampusGroups(true)}>
            <UserPlus /> Join Groups
          </Button>
        </div>
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
              {chat.lastMessageTime?.toDate?.(() => new Date()).toLocaleTimeString() || 'Now'}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Actions Modal Triggers */}
      <StudyPartnersModal isOpen={showStudyPartners} onClose={() => setShowStudyPartners(false)} />
      <CampusGroupsModal isOpen={showCampusGroups} onClose={() => setShowCampusGroups(false)} />
    </div>
  );
};

export default ChatScreen;
