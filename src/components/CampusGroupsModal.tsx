import React, { useState, useEffect } from 'react';
import { X, Users, Search, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, where } from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';
import CreateGroupModal from './CreateGroupModal';

interface CampusGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatGroup {
  id: string;
  name: string;
  members: string[];
  createdAt: any;
  createdBy: string;
  createdByName: string;
}

const CampusGroupsModal: React.FC<CampusGroupsModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'myGroups' | 'discover'>('myGroups');
  const [allGroups, setAllGroups] = useState<ChatGroup[]>([]);
  const [myGroups, setMyGroups] = useState<ChatGroup[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load all groups from Firestore
  useEffect(() => {
    if (!isOpen || !user) return;

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
  }, [isOpen, user]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Campus Groups</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('myGroups')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'myGroups'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Groups ({myGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'discover'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Discover Groups
          </button>
        </div>

        {/* Search and Create */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {activeTab === 'myGroups' && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Create New Group
            </Button>
          )}
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading groups...</p>
            </div>
          ) : (
            <>
              {activeTab === 'myGroups' && (
                <>
                  {filteredMyGroups.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        {searchTerm ? 'No groups found matching your search.' : 'You haven\'t joined any groups yet.'}
                      </p>
                      {!searchTerm && (
                        <Button onClick={() => setShowCreateModal(true)}>
                          <Plus size={16} className="mr-2" />
                          Create Your First Group
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredMyGroups.map((group) => (
                      <Card key={group.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{group.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Created by {group.createdByName}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Users size={12} />
                                <span>{group.members?.length || 0} members</span>
                              </div>
                              <span>
                                {group.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                              </span>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleLeaveGroup(group.id, group.name)}
                            >
                              Leave Group
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </>
              )}

              {activeTab === 'discover' && (
                <>
                  {discoverGroups.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No groups found matching your search.' : 'No groups available to join.'}
                      </p>
                    </div>
                  ) : (
                    discoverGroups.map((group) => (
                      <Card key={group.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{group.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Created by {group.createdByName}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Users size={12} />
                                <span>{group.members?.length || 0} members</span>
                              </div>
                              <span>
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
                    ))
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Create Group Modal */}
        <CreateGroupModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={() => {
            // Group will be automatically added via real-time listener
            setActiveTab('myGroups');
          }}
        />
      </div>
    </div>
  );
};

export default CampusGroupsModal;