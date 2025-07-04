import React, { useState, useEffect } from 'react';
import { Check, X, Users, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  arrayUnion 
} from 'firebase/firestore';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../hooks/use-toast';

interface JoinRequest {
  id: string;
  groupId: string;
  groupName: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedAt: any;
  status: 'pending' | 'approved' | 'rejected';
}

interface GroupJoinRequestsProps {
  userGroups: Array<{ id: string; name: string; createdBy: string }>;
}

const GroupJoinRequests: React.FC<GroupJoinRequestsProps> = ({ userGroups }) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Get group IDs where current user is admin
  const adminGroupIds = userGroups
    .filter(group => group.createdBy === user?.uid)
    .map(group => group.id);

  useEffect(() => {
    if (!user || adminGroupIds.length === 0) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'groupJoinRequests'),
      where('groupId', 'in', adminGroupIds),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JoinRequest[];
      
      setRequests(requestsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, adminGroupIds.join(',')]);

  const handleApproveRequest = async (request: JoinRequest) => {
    try {
      // Add user to group members
      await updateDoc(doc(db, 'chatGroups', request.groupId), {
        members: arrayUnion(request.userId)
      });

      // Update request status
      await updateDoc(doc(db, 'groupJoinRequests', request.id), {
        status: 'approved'
      });

      toast({
        title: "Request approved!",
        description: `${request.userName} has been added to ${request.groupName}`
      });
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async (request: JoinRequest) => {
    try {
      await updateDoc(doc(db, 'groupJoinRequests', request.id), {
        status: 'rejected'
      });

      toast({
        title: "Request rejected",
        description: `${request.userName}'s request to join ${request.groupName} has been rejected`
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users size={24} className="text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No pending requests</h3>
        <p className="text-gray-500">All join requests have been handled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 flex items-center">
        <Clock size={20} className="mr-2 text-orange-500" />
        Pending Join Requests ({requests.length})
      </h3>
      
      {requests.map((request) => (
        <Card key={request.id} className="bg-white/90 backdrop-blur-sm border border-orange-200/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {request.userName[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{request.userName}</h4>
                  <p className="text-sm text-gray-600">wants to join {request.groupName}</p>
                  <p className="text-xs text-gray-500">
                    {request.requestedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleApproveRequest(request)}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-full"
                >
                  <Check size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRejectRequest(request)}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-full"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GroupJoinRequests;