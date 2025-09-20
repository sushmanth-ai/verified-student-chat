import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, where, addDoc, updateDoc, doc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../hooks/use-toast';
import CreateGroupModal from './CreateGroupModal';
import GroupChat from './GroupChat';

interface ChatGroup {
  id: string;
  name: string;
  members: string[];
  createdAt: any;
  createdBy: string;
  createdByName: string;
}

const GroupChatScreen = () => {
  const [activeTab, setActiveTab] = useState<'myGroups' | 'discover'>('myGroups');
  const [searchTerm, setSearchTerm] = useState('');
  const [allGroups, setAllGroups] = useState<ChatGroup[]>([]);
  const [myGroups, setMyGroups] = useState<ChatGroup[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load all groups from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'chatGroups'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatGroup[];
      
      setAllGroups(groupsData);
      
      // Filter user's groups
      const userGroups = groupsData.filter(group => 
        group.members?.includes(user.uid)
      );
      setMyGroups(userGroups);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Filter groups based on search term
  const discoverGroups = allGroups.filter(group => 
    !group.members?.includes(user?.uid || '') &&
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMyGroups = myGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleJoinGroup = async (groupId: string, groupName: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'chatGroups', groupId), {
        members: arrayUnion(user.uid)
      });

      toast({ 
        title: "Joined group!", 
        description: `You joined ${groupName}` 
      });

      // Auto-navigate to the group chat
      const joinedGroup = allGroups.find(g => g.id === groupId);
      if (joinedGroup) {
        setSelectedGroup({ ...joinedGroup, members: [...joinedGroup.members, user.uid] });
      }
      
      // Switch to myGroups tab after joining
      setActiveTab('myGroups');
    } catch (error) {
      console.error('Error joining group:', error);
      toast({ 
        title: "Error", 
        description: "Failed to join group", 
        variant: "destructive" 
      });
    }
  };

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'chatGroups', groupId), {
        members: arrayRemove(user.uid)
      });

      toast({ 
        title: "Left group", 
        description: `You left ${groupName}` 
      });
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({ 
        title: "Error", 
        description: "Failed to leave group", 
        variant: "destructive" 
      });
    }
  };

  // Show individual group chat if a group is selected
  if (selectedGroup) {
    return (
      <GroupChat 
        group={selectedGroup} 
        onBack={() => setSelectedGroup(null)}
        onGroupDeleted={() => {
          setSelectedGroup(null);
          setActiveTab('discover');
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-500 border-r-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageCircle size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Campus Groups
            </h1>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus size={18} className="mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-lg">
        <div className="flex">
          <button
            onClick={() => setActiveTab('myGroups')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'myGroups'
                ? 'text-white bg-gradient-to-r from-green-500 to-teal-500 shadow-lg'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/80'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users size={18} />
              <span>My Groups</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                activeTab === 'myGroups' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {myGroups.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'discover'
                ? 'text-white bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/80'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Search size={18} />
              <span>Discover Groups</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                activeTab === 'discover' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {discoverGroups.length}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-lg">
        <div className="relative max-w-md mx-auto">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 bg-white/90 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-2xl h-12 shadow-md"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'myGroups' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center mr-2">
                  <Users size={16} className="text-white" />
                </div>
                My Groups
              </h2>
              {myGroups.length > 0 && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                  {filteredMyGroups.length} of {myGroups.length} groups
                </span>
              )}
            </div>
            
            {filteredMyGroups.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {searchTerm ? 'No groups found' : 'No groups yet'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm 
                      ? 'Try adjusting your search terms'
                      : 'Create your first group to start connecting with others'
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl shadow-lg"
                    >
                      <Plus size={18} className="mr-2" />
                      Create Your First Group
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredMyGroups.map((group) => (
                  <Card key={group.id} className="bg-white/90 backdrop-blur-sm border border-white/30 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-green-500/10 via-teal-500/10 to-blue-500/10 pb-4">
                      <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                          <Users size={16} className="text-white" />
                        </div>
                        {group.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 font-medium">
                        Created by {group.createdByName}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0 p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-teal-100 px-3 py-1 rounded-full">
                            <Users size={14} className="text-green-600" />
                            <span className="text-green-700 font-semibold">{group.members?.length || 0} members</span>
                          </div>
                          <span className="text-gray-500 font-medium">
                            {group.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                          </span>
                        </div>
                        
                        <div className="flex space-x-3">
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl shadow-md"
                            onClick={() => setSelectedGroup(group)}
                          >
                            <MessageCircle size={16} className="mr-2" />
                            Open Chat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLeaveGroup(group.id, group.name)}
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            Leave
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-2">
                  <Search size={16} className="text-white" />
                </div>
                Discover Groups
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                {discoverGroups.length} groups available
              </span>
            </div>
            
            {discoverGroups.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {searchTerm ? 'No groups found' : 'No new groups available'}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? 'Try different search terms or create a new group'
                      : 'You\'ve joined all available groups, or create a new one'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {discoverGroups.map((group) => (
                  <Card key={group.id} className="bg-white/90 backdrop-blur-sm border border-white/30 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 pb-4">
                      <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                          <Sparkles size={16} className="text-white" />
                        </div>
                        {group.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 font-medium">
                        Created by {group.createdByName}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0 p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1 rounded-full">
                            <Users size={14} className="text-blue-600" />
                            <span className="text-blue-700 font-semibold">{group.members?.length || 0} members</span>
                          </div>
                          <span className="text-gray-500 font-medium">
                            {group.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                          </span>
                        </div>
                        
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-md"
                          onClick={() => handleJoinGroup(group.id, group.name)}
                        >
                          <Plus size={16} className="mr-2" />
                          Join Group
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGroupCreated={(groupId) => {
          setActiveTab('myGroups');
          // Auto-navigate to the newly created group
          const newGroup = allGroups.find(g => g.id === groupId);
          if (newGroup) {
            setSelectedGroup(newGroup);
          }
        }}
      />
    </div>
  );
};

export default GroupChatScreen;