import React, { useState } from 'react';
import { X, User, BookOpen, Clock, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';

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

  // Mock data for study partners
  const studyPartners: StudyPartner[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      subject: 'Computer Science',
      availability: 'Weekday evenings',
      location: 'Library Study Room 3',
      level: 'Junior'
    },
    {
      id: '2',
      name: 'Mike Johnson',
      subject: 'Mathematics',
      availability: 'Weekend mornings',
      location: 'Math Building',
      level: 'Senior'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      subject: 'Biology',
      availability: 'Afternoon sessions',
      location: 'Science Lab',
      level: 'Sophomore'
    },
    {
      id: '4',
      name: 'David Kim',
      subject: 'Physics',
      availability: 'Evening study groups',
      location: 'Physics Lab',
      level: 'Junior'
    },
    {
      id: '5',
      name: 'Lisa Wang',
      subject: 'Chemistry',
      availability: 'Morning sessions',
      location: 'Chemistry Building',
      level: 'Senior'
    }
  ];

  const subjects = ['All', 'Computer Science', 'Mathematics', 'Biology', 'Physics', 'Chemistry'];

  const filteredPartners = studyPartners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || partner.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleConnect = (partnerId: string, partnerName: string) => {
    // In a real app, this would send a connection request
    alert(`Connection request sent to ${partnerName}!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Find Study Partners</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* Search and Filter */}
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

        {/* Study Partners List */}
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
                      
                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => handleConnect(partner.id, partner.name)}
                      >
                        Connect
                      </Button>
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