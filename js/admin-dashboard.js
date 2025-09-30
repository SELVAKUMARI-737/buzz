// Admin Dashboard JavaScript for The BuZZ

const API_URL = 'http://localhost:5500/api'; // Update with your backend URL
const $ = (id) => document.getElementById(id);

let currentUser = null;
let events = [];
let registrations = [];
let announcements = [];
let discussions = [];
let students = [];

// Check authentication
function checkAuth() {
  currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  const token = sessionStorage.getItem('token');
  
  if (!currentUser || !token) {
    window.location.href = 'login.html';
    return false;
  }
  
  if (currentUser.role !== 'staff') {
    window.location.href = 'student-dashboard.html';
    return false;
  }
  
  return true;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;
  
  initUI();
  loadData();
  setupEventListeners();
});

// Initialize UI with user data
function initUI() {
  $('user-name').textContent = currentUser.name;
  $('user-email').textContent = currentUser.email;
}

// Setup event listeners
function setupEventListeners() {
  // Logout
  $('logout-btn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'login.html';
  });
  
  // Toggle form
  $('toggle-form').addEventListener('click', () => {
    const form = $('event-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });
  
  // Create event
  $('create-event-btn').addEventListener('click', createEvent);
  
  // Clear form
  $('clear-form-btn').addEventListener('click', clearEventForm);
  
  // Post announcement
  $('post-ann-btn').addEventListener('click', postAnnouncement);
  
  // Filter events
  $('filter-events').addEventListener('change', renderEvents);
}

// Load all data
async function loadData() {
  await Promise.all([
    loadEvents(),
    loadRegistrations(),
    loadAnnouncements(),
    loadDiscussions(),
    loadStudents()
  ]);
  updateStats();
}

// Load events
async function loadEvents() {
  try {
    const response = await fetch(`${API_URL}/events`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      events = await response.json();
      renderEvents();
    }
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

// Render events
function renderEvents() {
  const container = $('events-list');
  const filter = $('filter-events').value;
  
  let filteredEvents = events;
  const now = new Date();
  
  if (filter === 'upcoming') {
    filteredEvents = events.filter(e => new Date(e.date) >= now);
  } else if (filter === 'past') {
    filteredEvents = events.filter(e => new Date(e.date) < now);
  }
  
  container.innerHTML = '';
  
  if (filteredEvents.length === 0) {
    container.innerHTML = '<p class="text-slate-400 text-center py-8">No events found</p>';
    return;
  }
  
  filteredEvents.forEach(event => {
    const eventRegs = registrations.filter(r => r.eventId === event._id);
    
    const card = document.createElement('div');
    card.className = 'p-4 bg-slate-800/30 rounded-xl border border-white/10 hover:border-violet-500/30 transition-all duration-300';
    card.innerHTML = `
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-bold text-lg">${event.title}</h3>
            <span class="px-2 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-semibold">${event.category}</span>
          </div>
          <p class="text-sm text-slate-400">${event.venue} • ${formatDate(event.date)} • ${event.time}</p>
        </div>
        <div class="flex gap-2">
          <button onclick="editEvent('${event._id}')" class="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/30 transition-all">
            Edit
          </button>
          <button onclick="deleteEvent('${event._id}')" class="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-all">
            Delete
          </button>
        </div>
      </div>
      <p class="text-sm text-slate-300 mb-3">${event.description}</p>
      <div class="flex items-center justify-between text-sm">
        <span class="text-slate-400">
          <strong class="text-slate-200">${eventRegs.length}</strong> registrations
        </span>
        <button onclick="viewRegistrations('${event._id}')" class="px-3 py-1 rounded-lg bg-violet-500/20 text-violet-400 text-xs font-semibold hover:bg-violet-500/30 transition-all">
          View Participants
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Create event
async function createEvent() {
  const title = $('event-title').value.trim();
  const venue = $('event-venue').value.trim();
  const date = $('event-date').value;
  const time = $('event-time').value;
  const category = $('event-category').value;
  const image = $('event-image').value.trim();
  const description = $('event-description').value.trim();
  
  // Validation
  if (!title || !venue || !date || !time || !description) {
    alert('Please fill in all required fields');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      body: JSON.stringify({
        title,
        venue,
        date,
        time,
        category,
        image: image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
        description
      })
    });
    
    if (response.ok) {
      alert('Event created successfully!');
      clearEventForm();
      await loadEvents();
      updateStats();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to create event');
    }
  } catch (error) {
    console.error('Error creating event:', error);
    alert('An error occurred. Please try again.');
  }
}

// Clear event form
function clearEventForm() {
  $('event-title').value = '';
  $('event-venue').value = '';
  $('event-date').value = '';
  $('event-time').value = '';
  $('event-category').value = 'technical';
  $('event-image').value = '';
  $('event-description').value = '';
}

// Edit event
window.editEvent = async function(eventId) {
  const event = events.find(e => e._id === eventId);
  if (!event) return;
  
  // Populate form with event data
  $('event-title').value = event.title;
  $('event-venue').value = event.venue;
  $('event-date').value = event.date.split('T')[0];
  $('event-time').value = event.time;
  $('event-category').value = event.category;
  $('event-image').value = event.image;
  $('event-description').value = event.description;
  
  // Show form
  $('event-form').style.display = 'block';
  
  // Change create button to update
  const btn = $('create-event-btn');
  btn.textContent = 'Update Event';
  btn.onclick = async () => {
    try {
      const response = await fetch(`${API_URL}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: $('event-title').value.trim(),
          venue: $('event-venue').value.trim(),
          date: $('event-date').value,
          time: $('event-time').value,
          category: $('event-category').value,
          image: $('event-image').value.trim(),
          description: $('event-description').value.trim()
        })
      });
      
      if (response.ok) {
        alert('Event updated successfully!');
        clearEventForm();
        btn.textContent = 'Create Event';
        btn.onclick = createEvent;
        await loadEvents();
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
    }
  };
  
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Delete event
window.deleteEvent = async function(eventId) {
  if (!confirm('Are you sure you want to delete this event?')) return;
  
  try {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      alert('Event deleted successfully!');
      await loadEvents();
      updateStats();
    } else {
      alert('Failed to delete event');
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    alert('An error occurred. Please try again.');
  }
};

// View registrations
window.viewRegistrations = function(eventId) {
  const event = events.find(e => e._id === eventId);
  const eventRegs = registrations.filter(r => r.eventId === eventId);
  
  if (eventRegs.length === 0) {
    alert('No registrations for this event yet.');
    return;
  }
  
  let message = `Registrations for "${event.title}":\n\n`;
  eventRegs.forEach((reg, index) => {
    message += `${index + 1}. ${reg.userName} (${reg.userEmail})\n`;
  });
  
  alert(message);
};

// Load registrations
async function loadRegistrations() {
  try {
    const response = await fetch(`${API_URL}/registrations`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      registrations = await response.json();
    }
  } catch (error) {
    console.error('Error loading registrations:', error);
  }
}

// Load students
async function loadStudents() {
  try {
    const response = await fetch(`${API_URL}/users?role=student`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      students = await response.json();
    }
  } catch (error) {
    console.error('Error loading students:', error);
  }
}

// Post announcement
async function postAnnouncement() {
  const title = $('ann-title').value.trim();
  const body = $('ann-body').value.trim();
  
  if (!title || !body) {
    alert('Please fill in both title and message');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      body: JSON.stringify({ title, body })
    });
    
    if (response.ok) {
      alert('Announcement posted successfully!');
      $('ann-title').value = '';
      $('ann-body').value = '';
      await loadAnnouncements();
    } else {
      alert('Failed to post announcement');
    }
  } catch (error) {
    console.error('Error posting announcement:', error);
    alert('An error occurred. Please try again.');
  }
}

// Load announcements
async function loadAnnouncements() {
  try {
    const response = await fetch(`${API_URL}/announcements`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      announcements = await response.json();
      renderAnnouncements();
    }
  } catch (error) {
    console.error('Error loading announcements:', error);
  }
}

// Render announcements
function renderAnnouncements() {
  const container = $('announcements-list');
  container.innerHTML = '';
  
  if (announcements.length === 0) {
    container.innerHTML = '<p class="text-sm text-slate-400">No announcements yet</p>';
    return;
  }
  
  announcements.slice(0, 5).forEach(ann => {
    const item = document.createElement('div');
    item.className = 'p-3 bg-slate-800/30 rounded-xl border border-white/5';
    item.innerHTML = `
      <div class="flex items-start justify-between mb-2">
        <h4 class="font-semibold text-sm">${ann.title}</h4>
        <button onclick="deleteAnnouncement('${ann._id}')" class="text-red-400 hover:text-red-300 text-xs">Delete</button>
      </div>
      <p class="text-xs text-slate-400 mb-2">${ann.body}</p>
      <span class="text-xs text-slate-500">${timeAgo(ann.createdAt)}</span>
    `;
    container.appendChild(item);
  });
}

// Delete announcement
window.deleteAnnouncement = async function(annId) {
  if (!confirm('Delete this announcement?')) return;
  
  try {
    const response = await fetch(`${API_URL}/announcements/${annId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      await loadAnnouncements();
    }
  } catch (error) {
    console.error('Error deleting announcement:', error);
  }
};

// Load discussions
async function loadDiscussions() {
  try {
    const response = await fetch(`${API_URL}/discussions`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      discussions = await response.json();
      renderDiscussions();
    }
  } catch (error) {
    console.error('Error loading discussions:', error);
  }
}

// Render discussions
function renderDiscussions() {
  const container = $('discussions-list');
  container.innerHTML = '';
  
  if (discussions.length === 0) {
    container.innerHTML = '<p class="text-sm text-slate-400">No comments yet</p>';
    return;
  }
  
  discussions.forEach(disc => {
    const item = document.createElement('div');
    item.className = 'p-3 bg-slate-800/30 rounded-xl border border-white/5';
    item.innerHTML = `
      <div class="flex items-start justify-between mb-2">
        <div>
          <span class="font-semibold text-sm">${disc.userName}</span>
          <span class="text-xs text-slate-500 ml-2">${timeAgo(disc.createdAt)}</span>
        </div>
        <button onclick="deleteDiscussion('${disc._id}')" class="text-red-400 hover:text-red-300 text-xs">Delete</button>
      </div>
      <p class="text-sm text-slate-300">${disc.message}</p>
    `;
    container.appendChild(item);
  });
}

// Delete discussion
window.deleteDiscussion = async function(discId) {
  if (!confirm('Delete this comment?')) return;
  
  try {
    const response = await fetch(`${API_URL}/discussions/${discId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      await loadDiscussions();
    }
  } catch (error) {
    console.error('Error deleting discussion:', error);
  }
};

// Update stats
function updateStats() {
  $('total-events').textContent = events.length;
  $('total-registrations').textContent = registrations.length;
  $('total-students').textContent = students.length;
  
  // Calculate upcoming events (this week)
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = events.filter(e => {
    const eventDate = new Date(e.date);
    return eventDate >= now && eventDate <= nextWeek;
  });
  $('upcoming-events').textContent = upcoming.length;
}

// Helper functions
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}