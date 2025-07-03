import React, { useState, useEffect } from 'react';
import { Calendar, User, Plus, X, MapPin, Clock, Users, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
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

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;

    const event = events.find(e => e.id === eventId);
    if (!event || event.authorId !== user.uid) {
      toast({ title: "Error", description: "You can only delete your own events", variant: "destructive" });
      return;
    }

    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        toast({ title: "Event deleted", description: "Your event has been removed." });
      } catch (error) {
        console.error('Error deleting event:', error);
        toast({ title: "Error", description: "Failed to delete event", variant: "destructive" });
      }
    }
  };

  const handleRSVP = async (eventId: string) => {
    if (!user) return;
    
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const isAttending = event.attendees.includes(user.uid);
    const eventRef = doc(db, 'events', eventId);

    try {
      await updateDoc(eventRef, {
        attendees: isAttending ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });

      toast({ 
        title: isAttending ? "RSVP Cancelled" : "RSVP Confirmed!", 
        description: isAttending ? "You've been removed from the attendee list." : "You've been added to the attendee list." 
      });
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast({ title: "Error", description: "Failed to update RSVP", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-500 border-r-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Create Event</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} className="rounded-full hover:bg-red-50 hover:text-red-600">
              <X size={20} />
            </Button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto h-full">
          <Card className="bg-white/90 backdrop-blur-sm border border-white/30 shadow-xl rounded-3xl max-w-2xl mx-auto">
            <CardContent className="p-6">
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter event title"
                    className="bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-xl h-12"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date *
                    </label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-xl h-12"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Time *
                    </label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-xl h-12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location *
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Enter event location"
                    className="bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-xl h-12"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 border border-gray-200/50 rounded-xl bg-white/80 focus:ring-2 ring-blue-400/50 focus:outline-none h-12"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Event description (optional)"
                    rows={3}
                    className="bg-white/80 border-gray-200/50 focus:ring-2 ring-blue-400/50 rounded-xl"
                  />
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Create Event
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    className="sm:w-auto px-8 py-3 rounded-xl border-gray-300 hover:bg-gray-50"
                  >
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
    <div className="h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Events Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Campus Events</h2>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
          >
            <Plus size={16} className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Create Event</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4 shadow-lg">
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
              <Calendar size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{events.length}</div>
            <div className="text-xs text-gray-500 font-medium">Total Events</div>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
              <Users size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-green-600">{events.filter(e => e.attendees.includes(user?.uid || '')).length}</div>
            <div className="text-xs text-gray-500 font-medium">My RSVPs</div>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
              <User size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-purple-600">{events.filter(e => e.authorId === user?.uid).length}</div>
            <div className="text-xs text-gray-500 font-medium">Created by Me</div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No events yet</h3>
              <p className="text-gray-600 mb-6">Be the first to create one!</p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg"
              >
                Create Event
              </Button>
            </div>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Event Header */}
              <div className={`h-2 bg-gradient-to-r ${getEventColor(event.category)}`}></div>
              
              <div className="p-4 sm:p-6">
                {/* Event Info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
                  <div className="flex-1 mb-4 sm:mb-0">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-900 text-lg sm:text-xl">{event.title}</h3>
                      {event.authorId === user?.uid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full ml-2"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 text-gray-600">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock size={16} className="text-blue-600" />
                        </div>
                        <span className="font-medium text-sm sm:text-base bg-blue-50 px-3 py-1 rounded-full">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })} at {event.time}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin size={16} className="text-green-600" />
                        </div>
                        <span className="font-medium text-sm sm:text-base bg-green-50 px-3 py-1 rounded-full">{event.location}</span>
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-gray-700 mt-3 leading-relaxed bg-gray-50/80 p-3 rounded-xl text-sm sm:text-base">{event.description}</p>
                    )}
                  </div>
                  <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r ${getEventColor(event.category)} text-white shadow-lg flex-shrink-0 self-start`}>
                    {event.category}
                  </span>
                </div>

                {/* Attendees and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-gray-100 space-y-3 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 px-3 sm:px-4 py-2 rounded-full">
                      <Users size={16} className="text-purple-600" />
                      <span className="text-purple-700 font-semibold text-sm">{event.attendees.length} attending</span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      by {event.authorName}
                    </span>
                  </div>
                  <div className="flex space-x-2 sm:space-x-3">
                    <Button 
                      size="sm"
                      onClick={() => handleRSVP(event.id)}
                      className={`rounded-xl px-4 sm:px-6 py-2 font-semibold transition-all duration-200 text-sm flex-1 sm:flex-none ${
                        event.attendees.includes(user?.uid || '') 
                          ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white border-none shadow-lg' 
                          : 'border-gray-300 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:border-transparent bg-white text-gray-700'
                      }`}
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