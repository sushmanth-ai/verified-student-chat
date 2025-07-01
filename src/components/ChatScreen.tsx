import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface StudyPartnersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PartnerUser {
  id: string;
  name: string;
}

const StudyPartnersModal: React.FC<StudyPartnersModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [usersList, setUsersList] = useState<PartnerUser[]>([]);

  // Fetch all users except current
  useEffect(() => {
    if (!isOpen || !user) return;
    const q = query(collection(db, 'users'), where('id', '!=', user.uid));
    const unsub = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        name: (doc.data() as any).name || 'Anonymous'
      }));
      setUsersList(list);
    });
    return unsub;
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Filter by search term
  const filtered = usersList.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Find Study Partners</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <div className="p-4">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No partners found.</p>
            </div>
          ) : (
            filtered.map(u => (
              <Card key={u.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{u.name}</h3>
                  </div>
                  <Button size="sm" onClick={() => alert(`Connect to ${u.name}`)}>
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPartnersModal;
