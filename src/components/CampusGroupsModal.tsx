import React, { useState } from 'react';
import { X, Users, Calendar, MapPin, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';

interface CampusGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CampusGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  members: number;
  meetingTime: string;
  location: string;
  isJoined: boolean;
}

const CampusGroupsModal: React.FC<CampusGroupsModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);

  // Mock data for campus groups
  const campusGroups: CampusGroup[] = [
    {
      id: '1',
      name: 'Computer Science Club',
      description: 'Weekly coding sessions and tech talks',
      category: 'Academic',
      members: 156,
      meetingTime: 'Fridays 6:00 PM',
      location: 'CS Building Room 101',
      isJoined: false
    },
    {
      id: '2',
      name: 'Photography Society',
      description: 'Capture campus life and learn photography techniques',
      category: 'Creative',
      members: 89,
      meetingTime: 'Saturdays 2:00 PM',
      location: 'Art Building',
      isJoined: false
    },
    {
      id: '3',
      name: 'Environmental Action Group',
      description: 'Making our campus more sustainable',
      category: 'Service',
      members: 234,
      meetingTime: 'Wednesdays 5:30 PM',
      location: 'Student Center',
      isJoined: false
    },
    {
      id: '4',
      name: 'Debate Team',
      description: 'Sharpen your argumentation and public speaking skills',
      category: 'Academic',
      members: 67,
      meetingTime: 'Tuesdays 7:00 PM',
      location: 'Liberal Arts Building',
      isJoined: false
    },
    {
      id: '5',
      name: 'Intramural Soccer',
      description: 'Casual soccer games and tournaments',
      category: 'Sports',
      members: 178,
      meetingTime: 'Sundays 10:00 AM',
      location: 'Sports Complex',
      isJoined: false
    },
    {
      id: '6',
      name: 'Gaming Club',
      description: 'Board games, video games, and tournaments',
      category: 'Recreation',
      members: 145,
      meetingTime: 'Thursdays 6:30 PM',
      location: 'Student Lounge',
      isJoined: false
    }
  ];

  const categories = ['All', 'Academic', 'Creative', 'Service', 'Sports', 'Recreation'];

  const filteredGroups = campusGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || group.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleJoinGroup = (groupId: string, groupName: string) => {
    if (joinedGroups.includes(groupId)) {
      setJoinedGroups(prev => prev.filter(id => id !== groupId));
      alert(`Left ${groupName}`);
    } else {
      setJoinedGroups(prev => [...prev, groupId]);
      alert(`Joined ${groupName}!`);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Academic': 'from-blue-500 to-indigo-500',
      'Creative': 'from-purple-500 to-pink-500',
      'Service': 'from-green-500 to-teal-500',
      'Sports': 'from-orange-500 to-red-500',
      'Recreation': 'from-yellow-500 to-orange-500'
    };
    return colors[category as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Campus Groups</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="p-4 space-y-3">
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No groups found matching your criteria.</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(group.category)} text-white`}>
                        {group.category}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users size={12} />
                        <span>{group.members} members</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>{group.meetingTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin size={12} />
                        <span>{group.location}</span>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      className="w-full"
                      variant={joinedGroups.includes(group.id) ? "outline" : "default"}
                      onClick={() => handleJoinGroup(group.id, group.name)}
                    >
                      {joinedGroups.includes(group.id) ? 'Leave Group' : 'Join Group'}
                    </Button>
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

export default CampusGroupsModal;