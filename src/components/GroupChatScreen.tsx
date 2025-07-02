import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, MessageCircle } from 'lucide-react';
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
      />
    );
  }

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Campus Groups</h1>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} className="mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-card border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab('myGroups')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'myGroups'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users size={16} />
              <span>My Groups</span>
              <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs">
                {myGroups.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'discover'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Search size={16} />
              <span>Discover Groups</span>
            </div>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-card border-b border-border">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'myGroups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">My Groups</h2>
              {myGroups.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {filteredMyGroups.length} of {myGroups.length} groups
                </span>
              )}
            </div>
            
            {filteredMyGroups.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? 'No groups found' : 'No groups yet'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Create your first group to start connecting with others'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus size={16} className="mr-2" />
                    Create Your First Group
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMyGroups.map((group) => (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Created by {group.createdByName}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Users size={14} />
                            <span>{group.members?.length || 0} members</span>
                          </div>
                          <span className="text-muted-foreground">
                            {group.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedGroup(group)}
                          >
                            Open Chat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLeaveGroup(group.id, group.name)}
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Discover Groups</h2>
              <span className="text-sm text-muted-foreground">
                {discoverGroups.length} groups available
              </span>
            </div>
            
            {discoverGroups.length === 0 ? (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? 'No groups found' : 'No new groups available'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Try different search terms or create a new group'
                    : 'You\'ve joined all available groups, or create a new one'
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {discoverGroups.map((group) => (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Created by {group.createdByName}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Users size={14} />
                            <span>{group.members?.length || 0} members</span>
                          </div>
                          <span className="text-muted-foreground">
                            {group.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                          </span>
                        </div>
                        
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleJoinGroup(group.id, group.name)}
                        >
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