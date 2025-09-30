// Authentication JavaScript for The BuZZ
// This file handles login and signup functionality

// API Configuration - Update this with your backend URL
const API_URL = 'http://localhost:5500/api'; // Change to your backend URL

// Helper Functions
const $ = (id) => document.getElementById(id);
const showMessage = (msg, type = 'info') => {
  alert(msg); // Replace with better toast/notification in production
};

// Check if user is already logged in
const checkAuth = () => {
  const user = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  if (user) {
    // Redirect to appropriate dashboard
    if (user.role === 'staff') {
      window.location.href = 'admin-dashboard.html';
    } else {
      window.location.href = 'student-dashboard.html';
    }
  }
};

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  if (path.includes('login.html')) {
    initLogin();
  } else if (path.includes('signup.html')) {
    initSignup();
  }
});

// ============ LOGIN PAGE ============
function initLogin() {
  let selectedRole = 'student';
  
  // Role toggle
  const roleStudent = $('role-student');
  const roleStaff = $('role-staff');
  
  const setRole = (role) => {
    selectedRole = role;
    if (role === 'student') {
      roleStudent.className = 'flex-1 py-3 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/30';
      roleStaff.className = 'flex-1 py-3 rounded-lg font-semibold transition-all duration-300 text-slate-400 hover:text-slate-200';
    } else {
      roleStaff.className = 'flex-1 py-3 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/30';
      roleStudent.className = 'flex-1 py-3 rounded-lg font-semibold transition-all duration-300 text-slate-400 hover:text-slate-200';
    }
  };
  
  roleStudent.addEventListener('click', () => setRole('student'));
  roleStaff.addEventListener('click', () => setRole('staff'));
  
  // Login button handler
  $('login-btn').addEventListener('click', async () => {
    const email = $('email').value.trim();
    const password = $('password').value.trim();
    
    if (!email || !password) {
      showMessage('Please enter both email and password', 'error');
      return;
    }
    
    try {
      // Call your backend API
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store user data
        sessionStorage.setItem('currentUser', JSON.stringify(data.user));
        sessionStorage.setItem('token', data.token);
        
        showMessage('Login successful!', 'success');
        
        // Redirect based on role
        setTimeout(() => {
          if (data.user.role === 'staff') {
            window.location.href = 'admin-dashboard.html';
          } else {
            window.location.href = 'student-dashboard.html';
          }
        }, 500);
      } else {
        showMessage(data.message || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('An error occurred. Please try again.', 'error');
    }
  });
  
  // Enter key support
  $('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      $('login-btn').click();
    }
  });
}

// ============ SIGNUP PAGE ============
function initSignup() {
  let selectedRole = 'student';
  
  // Role toggle
  const roleStudent = $('role-student');
  const roleStaff = $('role-staff');
  
  const setRole = (role) => {
    selectedRole = role;
    if (role === 'student') {
      roleStudent.className = 'flex-1 py-3 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/30';
      roleStaff.className = 'flex-1 py-3 rounded-lg font-semibold transition-all duration-300 text-slate-400 hover:text-slate-200';
    } else {
      roleStaff.className = 'flex-1 py-3 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/30';
      roleStudent.className = 'flex-1 py-3 rounded-lg font-semibold transition-all duration-300 text-slate-400 hover:text-slate-200';
    }
  };
  
  roleStudent.addEventListener('click', () => setRole('student'));
  roleStaff.addEventListener('click', () => setRole('staff'));
  
  // Signup button handler
  $('signup-btn').addEventListener('click', async () => {
    const fullname = $('fullname').value.trim();
    const email = $('email').value.trim();
    const password = $('password').value.trim();
    const confirmPassword = $('confirm-password').value.trim();
    const terms = $('terms').checked;
    
    // Validation
    if (!fullname || !email || !password || !confirmPassword) {
      showMessage('Please fill in all fields', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }
    
    if (password.length < 6) {
      showMessage('Password must be at least 6 characters', 'error');
      return;
    }
    
    if (!terms) {
      showMessage('Please accept the terms and conditions', 'error');
      return;
    }
    
    try {
      // Call your backend API
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullname,
          email,
          password,
          role: selectedRole,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('Account created successfully! Please login.', 'success');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } else {
        showMessage(data.message || 'Signup failed', 'error');
      }
    } catch (error) {
      console.error('Signup error:', error);
      showMessage('An error occurred. Please try again.', 'error');
    }
  });
}

// Export for use in other files
window.BuzzAuth = {
  checkAuth,
  logout: () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  },
  getCurrentUser: () => {
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  },
  getToken: () => {
    return sessionStorage.getItem('token');
  }
};