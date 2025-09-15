// Main JavaScript for Urban Mechanic

document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const testimonialSlider = document.querySelector('.testimonial-slider');
    const dots = document.querySelectorAll('.dot');
    const navbar = document.querySelector('.navbar');
    
    // Mobile Menu Toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });
    
    // Enhanced Navbar Scroll Effect
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            }
        });
    }
    
    // Scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.service-card, .feature-card, .step, .testimonial, .office-card, .faq-item').forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
    
    // Enhanced Button Ripple Effect
    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add CSS for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    // Testimonial Slider
    if (testimonialSlider && dots.length > 0) {
        const testimonials = document.querySelectorAll('a.testimonial');
        let currentIndex = 0;
        
        // Function to show testimonial at index
        function showTestimonial(index) {
            // Calculate the scroll position
            const scrollPosition = testimonials[index].offsetLeft;
            
            // Scroll to the testimonial
            testimonialSlider.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
            
            // Update active dot
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
            
            currentIndex = index;
        }
        
        // Add click event to dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showTestimonial(index);
            });
        });
        
        // Prevent default link behavior for testimonials when clicking dots, not the testimonials themselves
        // Allow testimonials to be clickable links to testimonials.html
        
        // Auto-scroll testimonials every 5 seconds
        setInterval(() => {
            currentIndex = (currentIndex + 1) % testimonials.length;
            showTestimonial(currentIndex);
        }, 5000);
    }
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // Skip for empty hash or just '#'
            if (targetId === '#' || targetId === '') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                const navbarHeight = navbar.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Floating buttons hover effect
    const sosButton = document.querySelector('a.sos-button');
    const chatButton = document.querySelector('a.chat-button');
    
    if (sosButton) {
        sosButton.addEventListener('mouseenter', function() {
            this.querySelector('span').style.display = 'block';
        });
        
        sosButton.addEventListener('mouseleave', function() {
            if (window.innerWidth <= 768) {
                this.querySelector('span').style.display = 'none';
            }
        });
    }
    
    if (chatButton) {
        chatButton.addEventListener('mouseenter', function() {
            this.querySelector('span').style.display = 'block';
        });
        
        chatButton.addEventListener('mouseleave', function() {
            if (window.innerWidth <= 768) {
                this.querySelector('span').style.display = 'none';
            }
        });
    }
    
    // Service cards hover effect
    const serviceCards = document.querySelectorAll('a.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Step cards hover effect
    const stepCards = document.querySelectorAll('a.step');
    stepCards.forEach(step => {
        step.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        step.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});