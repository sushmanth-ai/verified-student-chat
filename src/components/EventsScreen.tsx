
import React from 'react';
import { Calendar, User } from 'lucide-react';

const EventsScreen = () => {
  const events = [
    {
      id: 1,
      title: 'Spring Career Fair',
      date: 'Mar 15',
      time: '10:00 AM',
      location: 'Student Center',
      attendees: 234,
      category: 'Career',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      title: 'Psychology Club Meeting',
      date: 'Mar 12',
      time: '7:00 PM',
      location: 'Psychology Building',
      attendees: 28,
      category: 'Club',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 3,
      title: 'Campus Movie Night',
      date: 'Mar 14',
      time: '8:30 PM',
      location: 'Outdoor Amphitheater',
      attendees: 156,
      category: 'Entertainment',
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 4,
      title: 'Intramural Basketball Finals',
      date: 'Mar 16',
      time: '6:00 PM',
      location: 'Sports Complex',
      attendees: 89,
      category: 'Sports',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="h-full bg-gray-50">
      {/* Events Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Campus Events</h2>
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all">
            Create Event
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-blue-600">12</div>
            <div className="text-xs text-gray-500">This Week</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-600">3</div>
            <div className="text-xs text-gray-500">My RSVPs</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-600">847</div>
            <div className="text-xs text-gray-500">Total Attendees</div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
          >
            {/* Event Header */}
            <div className={`h-3 bg-gradient-to-r ${event.color}`}></div>
            
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
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${event.color} text-white`}>
                  {event.category}
                </span>
              </div>

              {/* Attendees and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{event.attendees} attending</span>
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    Interested
                  </button>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                    RSVP
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsScreen;
