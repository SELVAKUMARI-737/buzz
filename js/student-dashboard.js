// Student Dashboard JavaScript for The BuZZ

const API_URL = 'http://localhost:5500/api'; // Update with your backend URL
const $ = (id) => document.getElementById(id);

let currentUser = null;
let events = [];
let registrations = [];
let announcements = [];
let discussions = [];

// Check authentication
function checkAuth() {
  currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  const token = sessionStorage.getItem('token');
  
  if (!currentUser || !token) {
    window.location.href = 'login.html';
    return false;
  }
  
  if (currentUser.role !== 'student') {
    window.location.href = 'admin-dashboard.html';
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
  $('welcome-name').textContent = currentUser.name.split(' ')[0];
}

// Setup event listeners
function setupEventListeners() {
  // Logout
  $('logout-btn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'login.html';
  });
  
  // Search
  $('search-input').addEventListener('input', (e) => {
    filterEvents(e.target.value);
  });
  
  // Filters
  $('filter-category').addEventListener('change', loadEvents);
  $('sort-by').addEventListener('change', loadEvents);
  
  // Post discussion
  $('post-discussion').addEventListener('click', postDiscussion);
  
  // Modal close buttons
  $('close-modal').addEventListener('click', closeQRModal);
  $('close-qr').addEventListener('click', closeQRModal);
}

// Load all data
async function loadData() {
  await Promise.all([
    loadEvents(),
    loadRegistrations(),
    loadAnnouncements(),
    loadDiscussions()
  ]);
  updateStats();
}

// Load events
async function loadEvents() {
  try {
    const category = $('filter-category').value;
    const sort = $('sort-by').value;
    
    const response = await fetch(`${API_URL}/events?category=${category}&sort=${sort}`, {
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
  const grid = $('events-grid');
  grid.innerHTML = '';
  
  if (events.length === 0) {
    grid.innerHTML = '<p class="text-slate-400 text-center col-span-2 py-8">No events found</p>';
    return;
  }
  
  events.forEach(event => {
    const isRegistered = registrations.some(r => r.eventId === event._id);
    const daysUntil = calculateDaysUntil(event.date);
    
    const card = document.createElement('div');
    card.className = 'bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:border-violet-500/30 transition-all hover:-translate-y-2 duration-300';
    card.innerHTML = `
      <div class="h-40 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 bg-cover bg-center" style="background-image: url('${event.image || ''}')"></div>
      <div class="p-4">
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-bold text-lg">${event.title}</h3>
          <span class="px-2 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-semibold">${event.category}</span>
        </div>
        <p class="text-sm text-slate-400 mb-2">${event.venue}</p>
        <p class="text-sm text-slate-400 mb-3">${formatDate(event.date)} • ${event.time}</p>
        <p class="text-sm text-slate-300 mb-4 line-clamp-2">${event.description}</p>
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-500">${daysUntil} days away</span>
          ${isRegistered 
            ? '<button class="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-semibold cursor-not-allowed">Registered ✓</button>'
            : `<button onclick="registerEvent('${event._id}')" class="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-300">Register</button>`
          }
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Filter events by search
function filterEvents(query) {
  const filtered = events.filter(e => 
    e.title.toLowerCase().includes(query.toLowerCase()) ||
    e.description.toLowerCase().includes(query.toLowerCase()) ||
    e.venue.toLowerCase().includes(query.toLowerCase())
  );
  
  const grid = $('events-grid');
  grid.innerHTML = '';
  
  filtered.forEach(event => {
    // Same rendering logic as renderEvents
    const isRegistered = registrations.some(r => r.eventId === event._id);
    const daysUntil = calculateDaysUntil(event.date);
    
    const card = document.createElement('div');
    card.className = 'bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:border-violet-500/30 transition-all hover:-translate-y-2 duration-300';
    card.innerHTML = `
      <div class="h-40 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 bg-cover bg-center" style="background-image: url('${event.image || ''}')"></div>
      <div class="p-4">
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-bold text-lg">${event.title}</h3>
          <span class="px-2 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-semibold">${event.category}</span>
        </div>
        <p class="text-sm text-slate-400 mb-2">${event.venue}</p>
        <p class="text-sm text-slate-400 mb-3">${formatDate(event.date)} • ${event.time}</p>
        <p class="text-sm text-slate-300 mb-4 line-clamp-2">${event.description}</p>
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-500">${daysUntil} days away</span>
          ${isRegistered 
            ? '<button class="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-semibold cursor-not-allowed">Registered ✓</button>'
            : `<button onclick="registerEvent('${event._id}')" class="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-300">Register</button>`
          }
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Register for event
window.registerEvent = async function(eventId) {
  try {
    const response = await fetch(`${API_URL}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      body: JSON.stringify({ eventId })
    });
    
    if (response.ok) {
      const registration = await response.json();
      alert('Registration successful!');
      await loadRegistrations();
      renderEvents();
      updateStats();
      
      // Show QR code
      showQRCode(registration);
    } else {
      const error = await response.json();
      alert(error.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('An error occurred. Please try again.');
  }
};

// Load registrations
async function loadRegistrations() {
  try {
    const response = await fetch(`${API_URL}/registrations/my`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      registrations = await response.json();
      renderRegistrations();
    }
  } catch (error) {
    console.error('Error loading registrations:', error);
  }
}

// Render registrations
function renderRegistrations() {
  const container = $('my-registrations');
  container.innerHTML = '';
  
  if (registrations.length === 0) {
    container.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">No registrations yet</p>';
    $('reg-badge').textContent = '0';
    return;
  }
  
  $('reg-badge').textContent = registrations.length;
  
  registrations.slice(0, 5).forEach(reg => {
    const event = events.find(e => e._id === reg.eventId);
    if (!event) return;
    
    const item = document.createElement('div');
    item.className = 'p-3 bg-slate-800/30 rounded-xl border border-white/5 hover:border-violet-500/30 transition-all duration-300 cursor-pointer';
    item.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <h4 class="font-semibold text-sm mb-1">${event.title}</h4>
          <p class="text-xs text-slate-400">${formatDate(event.date)} • ${event.time}</p>
        </div>
        <button onclick="showQRCode({eventId: '${event._id}', _id: '${reg._id}'})" class="px-3 py-1 rounded-lg bg-violet-500/20 text-violet-400 text-xs font-semibold hover:bg-violet-500/30 transition-all">
          QR
        </button>
      </div>
    `;
    container.appendChild(item);
  });
}

// Show QR Code Modal
window.showQRCode = function(registration) {
  const event = events.find(e => e._id === registration.eventId);
  if (!event) return;
  
  // Generate QR code
  const qrData = JSON.stringify({
    registrationId: registration._id,
    eventId: event._id,
    userId: currentUser._id,
    userName: currentUser.name,
    eventTitle: event.title,
    date: event.date,
    time: event.time
  });
  
  const canvas = $('qr-canvas');
  const qr = new QRious({
    element: canvas,
    value: qrData,
    size: 220,
    level: 'H'
  });
  
  $('modal-title').textContent = `${event.title} - QR Ticket`;
  $('qr-info').textContent = `${formatDate(event.date)} • ${event.time} • ${event.venue}`;
  
  // Download handler
  $('download-qr').onclick = () => {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '_')}_ticket.png`;
    a.click();
  };
  
  $('qr-modal').classList.remove('hidden');
  $('qr-modal').classList.add('flex');
};

// Close QR Modal
function closeQRModal() {
  $('qr-modal').classList.add('hidden');
  $('qr-modal').classList.remove('flex');
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
  const container = $('announcements');
  container.innerHTML = '';
  
  if (announcements.length === 0) {
    container.innerHTML = '<p class="text-sm text-slate-400">No announcements yet</p>';
    return;
  }
  
  announcements.slice(0, 3).forEach(ann => {
    const item = document.createElement('div');
    item.className = 'p-3 bg-slate-800/30 rounded-xl border border-white/5';
    item.innerHTML = `
      <div class="flex items-start justify-between mb-2">
        <h4 class="font-semibold text-sm">${ann.title}</h4>
        <span class="text-xs text-slate-500">${timeAgo(ann.createdAt)}</span>
      </div>
      <p class="text-xs text-slate-400">${ann.body}</p>
    `;
    container.appendChild(item);
  });
}

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
  const container = $('discussions');
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
      </div>
      <p class="text-sm text-slate-300">${disc.message}</p>
    `;
    container.appendChild(item);
  });
}

// Post discussion
async function postDiscussion() {
  const message = $('discussion-input').value.trim();
  
  if (!message) {
    alert('Please enter a message');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/discussions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      body: JSON.stringify({ message })
    });
    
    if (response.ok) {
      $('discussion-input').value = '';
      await loadDiscussions();
    }
  } catch (error) {
    console.error('Error posting discussion:', error);
  }
}

// Update stats
function updateStats() {
  $('registered-count').textContent = registrations.length;
  const upcoming = registrations.filter(r => {
    const event = events.find(e => e._id === r.eventId);
    return event && new Date(event.date) > new Date();
  });
  $('upcoming-count').textContent = upcoming.length;
}

// Helper functions
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function calculateDaysUntil(dateStr) {
  const today = new Date();
  const eventDate = new Date(dateStr);
  const diff = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}