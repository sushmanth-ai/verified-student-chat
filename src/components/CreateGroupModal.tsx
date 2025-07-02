import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (groupId: string) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim()) return;

    setLoading(true);
    try {
      const groupDoc = await addDoc(collection(db, 'chatGroups'), {
        name: groupName.trim(),
        members: [user.uid],
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.displayName || user.email?.split('@')[0] || 'Anonymous'
      });

      toast({ 
        title: "Group created!", 
        description: `${groupName} has been created successfully.` 
      });

      onGroupCreated?.(groupDoc.id);
      setGroupName('');
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({ 
        title: "Error", 
        description: "Failed to create group. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && groupName.trim()) {
      handleCreateGroup();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl max-w-md w-full p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Create New Group</h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X size={18} />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Group Name
            </label>
            <Input
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {groupName.length}/50 characters
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || loading}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;