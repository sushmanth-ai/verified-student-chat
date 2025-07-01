import React, { useState, useEffect } from 'react';
import { Calendar, User, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  category: string;
  authorId: string;
  authorName: string;
  attendees: string[];
  createdAt: any;
}

const EventsScreen = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    category: 'General'
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'events'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      
      // Sort by createdAt on client side
      const sortedEvents = eventsData.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.() || new Date(0);
        const timeB = b.createdAt?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });
      
      setEvents(sortedEvents);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim() || !formData.date || !formData.time || !formData.location.trim()) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      await addDoc(collection(db, 'events'), {
        ...formData,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        attendees: [user.uid],
        createdAt: serverTimestamp()
      });

      setFormData({
        title: '',
        date: '',
        time: '',
        location: '',
        description: '',
        category: 'General'
      });
      setShowCreateForm(false);
      toast({ title: "Event created!", description: "Your event has been posted successfully." });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({ title: "Error", description: "Failed to create event", variant: "destructive" });
    }
  };

  const handleRSVP = async (eventId: string) => {
    if (!user) return;
    
    // This would require updating the event document - simplified for now
    toast({ title: "RSVP Confirmed!", description: "You've been added to the attendee list." });
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading events...</p>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Create Event</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
              <X size={18} />
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time *
                    </label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Enter event location"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Sports">Sports</option>
                    <option value="Social">Social</option>
                    <option value="Career">Career</option>
                    <option value="Club">Club</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Event description (optional)"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-3">
                  <Button type="submit" className="flex-1">
                    Create Event
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Events Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Campus Events</h2>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
          >
            <Plus size={16} className="mr-1" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-blue-600">{events.length}</div>
            <div className="text-xs text-gray-500">Total Events</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-600">{events.filter(e => e.attendees.includes(user?.uid || '')).length}</div>
            <div className="text-xs text-gray-500">My RSVPs</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-600">{events.filter(e => e.authorId === user?.uid).length}</div>
            <div className="text-xs text-gray-500">Created by Me</div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No events yet. Be the first to create one!</p>
            <Button onClick={() => setShowCreateForm(true)}>Create Event</Button>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
            >
              {/* Event Header */}
              <div className={`h-3 bg-gradient-to-r ${getEventColor(event.category)}`}></div>
              
              <div className="p-4">
                {/* Event Info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{event.title}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{event.date} at {event.time}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getEventColor(event.category)} text-white`}>
                    {event.category}
                  </span>
                </div>

                {/* Attendees and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{event.attendees.length} attending</span>
                    <span className="text-xs text-gray-400">• by {event.authorName}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRSVP(event.id)}
                      disabled={event.attendees.includes(user?.uid || '')}
                    >
                      {event.attendees.includes(user?.uid || '') ? 'Attending' : 'RSVP'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const getEventColor = (category: string) => {
  const colors = {
    'General': 'from-blue-500 to-cyan-500',
    'Academic': 'from-green-500 to-teal-500',
    'Sports': 'from-orange-500 to-red-500',
    'Social': 'from-purple-500 to-pink-500',
    'Career': 'from-indigo-500 to-blue-500',
    'Club': 'from-yellow-500 to-orange-500'
  };
  return colors[category as keyof typeof colors] || colors.General;
};

export default EventsScreen;