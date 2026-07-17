/* 
================================================================
   PORTFOLIO WEBSITE - INTERACTIVE SCRIPTS
   Author: Muhammad Furqan (Senior Developer Refactor)
================================================================
*/

document.addEventListener('DOMContentLoaded', () => {
  
  // ----- 1. TYPING ANIMATION -----
  const typingElement = document.querySelector('.hero-role .typing');
  if (typingElement) {
    const words = [
      'Python Developer',
      'AI/ML Enthusiast',
      'Full-Stack Developer',
      'Problem Solver'
    ];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
      const currentWord = words[wordIndex];
      
      if (isDeleting) {
        typingElement.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typingElement.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      }
      
      let typeSpeed = isDeleting ? 40 : 80;
      
      if (!isDeleting && charIndex === currentWord.length) {
        // Pause at the end of the word
        typeSpeed = 1500;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 500;
      }
      
      setTimeout(type, typeSpeed);
    }
    
    // Start typing
    setTimeout(type, 500);
  }

  // ----- 2. MOBILE MENU NAVIGATION -----
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });
    
    // Close mobile menu on clicking any link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    });
  }

  // ----- 3. SCROLL PROGRESS INDICATOR & HEADER STYLE -----
  const header = document.getElementById('header');
  const scrollIndicator = document.getElementById('scroll-indicator');
  const backToTopBtn = document.getElementById('back-to-top');
  const sections = document.querySelectorAll('section');
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    // Scroll progress bar
    if (scrollIndicator) {
      scrollIndicator.style.width = `${scrollPercent}%`;
    }
    
    // Sticky Header
    if (header) {
      if (scrollTop > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
    
    // Back to top button
    if (backToTopBtn) {
      if (scrollTop > 400) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    }
    
    // Active navigation links highlighting on scroll
    let currentSectionId = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (scrollTop >= sectionTop && scrollTop < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  });

  // Back to top click event
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // ----- 4. CERTIFICATION SHIELD (SEARCH & FILTER SYSTEM) -----
  const certSearchInput = document.getElementById('cert-search');
  const filterButtons = document.querySelectorAll('.certs-filter-btn');
  const certCards = document.querySelectorAll('.cert-card');
  
  let activeCategory = 'all';
  let searchQuery = '';
  
  function applyCertFilters() {
    certCards.forEach(card => {
      const categoryMatch = activeCategory === 'all' || card.classList.contains(activeCategory);
      
      const cardTitle = card.querySelector('.cert-title')?.textContent.toLowerCase() || '';
      const cardIssuer = card.querySelector('.cert-issuer')?.textContent.toLowerCase() || '';
      const cardDetails = card.querySelector('.cert-details')?.textContent.toLowerCase() || '';
      const cardDescription = card.querySelector('.cert-expander-content')?.textContent.toLowerCase() || '';
      
      const searchString = `${cardTitle} ${cardIssuer} ${cardDetails} ${cardDescription}`;
      const searchMatch = searchString.includes(searchQuery.toLowerCase());
      
      if (categoryMatch && searchMatch) {
        card.style.display = 'flex';
        // Add fade-in entrance effect
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      } else {
        card.style.display = 'none';
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
      }
    });
  }
  
  // Tab filtering clicks
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-filter');
      applyCertFilters();
    });
  });
  
  // Real-time search query input
  if (certSearchInput) {
    certSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      applyCertFilters();
    });
  }

  // ----- 5. CERTIFICATION CARD EXPANSION FOR DETAILS -----
  certCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't expand if click was on a link inside description (if any)
      if (e.target.tagName === 'A') return;
      
      // Close all other expanded cards first (accordion style)
      certCards.forEach(otherCard => {
        if (otherCard !== card && otherCard.classList.contains('active-expanded')) {
          otherCard.classList.remove('active-expanded');
          const indicator = otherCard.querySelector('.cert-toggle-indicator span');
          if (indicator) indicator.textContent = 'Show Details';
        }
      });
      
      // Toggle current card
      card.classList.toggle('active-expanded');
      
      const indicator = card.querySelector('.cert-toggle-indicator span');
      if (indicator) {
        indicator.textContent = card.classList.contains('active-expanded') ? 'Hide Details' : 'Show Details';
      }
    });
  });

  // ----- 6. CONTACT FORM SUBMISSION HANDLING (MOCKUP) -----
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('.submit-btn');
      const originalText = submitBtn.innerHTML;
      
      // Show loading feedback
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending message...';
      
      setTimeout(() => {
        // Reset form and btn
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
        submitBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        submitBtn.style.color = '#ffffff';
        
        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.style.background = '';
          submitBtn.style.color = '';
        }, 3000);
      }, 1500);
    });
  }

  // Console greeting
  console.log('%c🚀 Refactored Portfolio Site Active!', 'font-size: 16px; font-weight: bold; color: #00f2fe;');
  console.log('%cMuhammad Furqan · Portfolio Refactor', 'font-size: 12px; color: #c084fc;');
});
