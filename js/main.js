// Main JavaScript for The BuZZ Landing Page

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', () => {
  // Handle smooth scrolling for hash links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Check if user is already logged in
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  if (currentUser) {
    // Update nav buttons if user is logged in
    const navActions = document.querySelector('nav .flex.gap-3');
    if (navActions) {
      navActions.innerHTML = `
        <a href="${currentUser.role === 'staff' ? 'admin-dashboard.html' : 'student-dashboard.html'}" 
           class="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-300">
          Go to Dashboard
        </a>
      `;
    }
  }
  
  // Add animation on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Observe feature cards
  document.querySelectorAll('.bg-gradient-to-br').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
  });
  
  // Add hover effect to CTA buttons
  document.querySelectorAll('a[href*="signup.html"], a[href*="login.html"]').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
    });
    btn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
  
  // Parallax effect for gradient overlays
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;
        const gradients = document.querySelectorAll('.fixed.inset-0 > div');
        
        gradients.forEach((gradient, index) => {
          const speed = index === 0 ? 0.5 : 0.3;
          gradient.style.transform = `translateY(${scrolled * speed}px)`;
        });
        
        ticking = false;
      });
      
      ticking = true;
    }
  });
  
  // Add active state to navigation on scroll
  const sections = document.querySelectorAll('section[id]');
  
  window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      
      if (pageYOffset >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.classList.remove('text-violet-400');
      if (link.getAttribute('href').substring(1) === current) {
        link.classList.add('text-violet-400');
      }
    });
  });
  
  // Typing effect for hero title (optional enhancement)
  const heroTitle = document.querySelector('h2');
  if (heroTitle && window.innerWidth > 768) {
    const text = heroTitle.innerHTML;
    heroTitle.innerHTML = '';
    heroTitle.style.opacity = '1';
    
    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        heroTitle.innerHTML += text.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
      }
    };
    
    // Start typing effect after a short delay
    setTimeout(typeWriter, 300);
  }
  
  // Add counter animation for stats
  const animateCounter = (element, target) => {
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target + (element.textContent.includes('+') ? '+' : element.textContent.includes('%') ? '%' : '');
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current) + (element.textContent.includes('+') ? '+' : element.textContent.includes('%') ? '%' : '');
      }
    }, 16);
  };
  
  // Observe stats section
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const statElements = entry.target.querySelectorAll('.text-5xl');
        statElements.forEach(el => {
          const text = el.textContent;
          const value = parseInt(text.replace(/\D/g, ''));
          if (value) {
            animateCounter(el, value);
          }
        });
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  const statsSection = document.querySelector('.bg-gradient-to-br.from-violet-500\\/10');
  if (statsSection) {
    statsObserver.observe(statsSection);
  }
});

// Add loading state
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.3s ease-in';
  
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 100);
});

// Console message for developers
console.log('%c🎓 The BuZZ - College Events Portal', 'color: #8b5cf6; font-size: 20px; font-weight: bold;');
console.log('%cBuilt with ❤️ for seamless event management', 'color: #06b6d4; font-size: 14px;');
console.log('%cNeed help? Contact support@thebuzz.edu', 'color: #64748b; font-size: 12px;');