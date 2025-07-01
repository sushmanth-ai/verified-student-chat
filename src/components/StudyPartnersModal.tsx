import React, { useState, useEffect } from 'react';
import { X, User, BookOpen, Clock, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

interface StudyPartnersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StudyPartner {
  id: string;
  name: string;
  subject: string;
  availability: string;
  location: string;
  level: string;
}

const StudyPartnersModal: React.FC<StudyPartnersModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [partners, setPartners] = useState<StudyPartner[]>([]);

  const subjects = ['All', 'Computer Science', 'Mathematics', 'Biology', 'Physics', 'Chemistry'];

  // Fetch real partners collection from Firestore
  useEffect(() => {
    if (!isOpen) return; 
    const q = query(collection(db, 'studyPartners'));
    const unsub = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<StudyPartner, 'id'>) }));
      setPartners(data);
    });
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter partners
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           partner.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || partner.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Find Study Partners</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <div className="p-4 space-y-3">
          <Input
            placeholder="Search by name or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
          {filteredPartners.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No study partners found matching your criteria.</p>
            </div>
          ) : (
            filteredPartners.map((partner) => (
              <Card key={partner.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{partner.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{partner.level}</p>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <BookOpen size={12} />
                          <span>{partner.subject}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={12} />
                          <span>{partner.availability}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin size={12} />
                          <span>{partner.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
