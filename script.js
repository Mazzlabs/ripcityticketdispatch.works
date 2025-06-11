// Enhanced Portfolio Site with GitHub Integration
class Portfolio {
    constructor() {
        this.mouseTrails = [];
        this.isLoaded = false;
        this.init();
        this.setupEventListeners();
        this.loadGitHubProjects();
        this.setupDramaticEffects();
    }

    init() {
        // Initialize smooth scrolling
        this.setupSmoothScrolling();
        
        // Initialize mobile navigation
        this.setupMobileNav();
        
        // Initialize form handling
        this.setupContactForm();
        
        // Initialize animations
        this.setupScrollAnimations();
        
        // Initialize abstract animations
        this.setupAbstractAnimations();
        
        // Initialize dramatic page load
        this.initPageLoad();
    }

    initPageLoad() {
        // Add page load animation
        document.body.style.opacity = '0';
        document.body.style.transform = 'scale(1.02)';
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.body.style.transition = 'all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                document.body.style.opacity = '1';
                document.body.style.transform = 'scale(1)';
                this.isLoaded = true;
            }, 100);
        });
    }

    setupDramaticEffects() {
        // Create custom cursor
        this.createCustomCursor();
        
        // Setup mouse trail effect
        this.setupMouseTrail();
        
        // Add dramatic keyboard interactions
        this.setupKeyboardEffects();
        
        // Initialize viewport-based animations
        this.setupViewportAnimations();
    }

    createCustomCursor() {
        if (window.innerWidth <= 768) return; // Skip on mobile
        
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);
        
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
        
        document.addEventListener('mousedown', () => {
            cursor.classList.add('clicking');
        });
        
        document.addEventListener('mouseup', () => {
            cursor.classList.remove('clicking');
        });
    }

    setupMouseTrail() {
        if (window.innerWidth <= 768) return; // Skip on mobile
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isLoaded) return;
            
            const trail = document.createElement('div');
            trail.className = 'mouse-trail';
            trail.style.left = e.clientX + 'px';
            trail.style.top = e.clientY + 'px';
            document.body.appendChild(trail);
            
            this.mouseTrails.push(trail);
            
            setTimeout(() => {
                trail.style.opacity = '0';
                trail.style.transform = 'translate(-50%, -50%) scale(2)';
                setTimeout(() => {
                    if (trail.parentNode) {
                        trail.parentNode.removeChild(trail);
                    }
                    this.mouseTrails = this.mouseTrails.filter(t => t !== trail);
                }, 300);
            }, 100);
            
            // Limit number of trails
            if (this.mouseTrails.length > 10) {
                const oldTrail = this.mouseTrails.shift();
                if (oldTrail.parentNode) {
                    oldTrail.parentNode.removeChild(oldTrail);
                }
            }
        });
    }

    setupKeyboardEffects() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.createRippleEffect(window.innerWidth / 2, window.innerHeight / 2);
            }
        });
    }

    createRippleEffect(x, y) {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent);
            pointer-events: none;
            z-index: 9998;
            transform: translate(-50%, -50%);
            animation: rippleExpand 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        `;
        
        document.body.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 1000);
    }

    setupEventListeners() {
        // Navigation scroll effect
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Mouse movement for interactive shapes
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupMobileNav() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }
    }

    setupContactForm() {
        const form = document.getElementById('contact-form');
        if (form) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Simulate form submission
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<span>Sending...</span><div class="loading-shape"></div>';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            submitBtn.innerHTML = '<span>Message Sent!</span><div class="btn-arrow"></div>';
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                e.target.reset();
            }, 2000);
        }, 1500);
    }

    handleScroll() {
        const navbar = document.querySelector('.navbar');
        const scrolled = window.pageYOffset > 100;
        
        // Enhanced navbar effects
        if (navbar) {
            if (scrolled) {
                navbar.style.background = 'rgba(10, 10, 11, 0.95)';
                navbar.style.backdropFilter = 'blur(30px)';
                navbar.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                navbar.classList.add('scrolled');
            } else {
                navbar.style.background = 'rgba(10, 10, 11, 0.8)';
                navbar.style.backdropFilter = 'blur(20px)';
                navbar.style.boxShadow = 'none';
                navbar.classList.remove('scrolled');
            }
        }
        
        // Dynamic scroll-based transformations
        const scrollPercent = window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight);
        
        // Transform floating shapes based on scroll
        const shapes = document.querySelectorAll('.floating-shape');
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.1;
            const yPos = -(window.pageYOffset * speed);
            const rotation = window.pageYOffset * (0.05 + speed * 0.1);
            const scale = 1 + (scrollPercent * 0.2);
            
            shape.style.transform = `translate3d(0, ${yPos}px, 0) rotate(${rotation}deg) scale(${scale})`;
            shape.style.opacity = 0.03 + (scrollPercent * 0.02);
        });
        
        // Dynamic color shifting
        const hue = 250 + (scrollPercent * 60);
        document.documentElement.style.setProperty('--accent-dynamic', `hsl(${hue}, 70%, 60%)`);
        
        // Update active navigation
        this.updateActiveNav();
        
        // Trigger viewport animations
        this.triggerViewportEffects();
    }

    triggerViewportEffects() {
        const scrollPercent = window.pageYOffset / window.innerHeight;
        
        // Hero parallax
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.transform = `translateY(${scrollPercent * 50}px)`;
            hero.style.opacity = Math.max(0.3, 1 - scrollPercent * 0.5);
        }
        
        // Section entrance effects
        const sections = document.querySelectorAll('section:not(.hero)');
        sections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight * 0.8;
            
            if (isVisible && !section.classList.contains('animate-in')) {
                setTimeout(() => {
                    section.classList.add('animate-in');
                }, index * 100);
            }
        });
    }

    updateActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    handleResize() {
        // Responsive adjustments
        this.setupAbstractAnimations();
    }

    handleMouseMove(e) {
        if (!this.isLoaded) return;
        
        const shapes = document.querySelectorAll('.floating-shape, .hero-shape');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        // Enhanced shape interactions
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.8;
            const x = (mouseX - 0.5) * speed * 30;
            const y = (mouseY - 0.5) * speed * 30;
            const rotation = (mouseX + mouseY) * speed * 5;
            const scale = 1 + (mouseX + mouseY) * 0.1;
            
            shape.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;
            shape.style.filter = `blur(${Math.abs(mouseX - mouseY) * 2}px) brightness(${1 + mouseX * 0.2})`;
        });
        
        // Interactive elements response
        const interactiveElements = document.querySelectorAll('.project-card, .skill-category, .btn');
        interactiveElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const elementCenterX = rect.left + rect.width / 2;
            const elementCenterY = rect.top + rect.height / 2;
            const distance = Math.sqrt(
                Math.pow(e.clientX - elementCenterX, 2) + 
                Math.pow(e.clientY - elementCenterY, 2)
            );
            
            if (distance < 200) {
                const intensity = (200 - distance) / 200;
                const moveX = (e.clientX - elementCenterX) * intensity * 0.1;
                const moveY = (e.clientY - elementCenterY) * intensity * 0.1;
                
                element.style.transform = `translate(${moveX}px, ${moveY}px) scale(${1 + intensity * 0.05})`;
                element.style.filter = `brightness(${1 + intensity * 0.1})`;
            } else {
                element.style.transform = '';
                element.style.filter = '';
            }
        });
        
        // Hero title parallax effect
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            const parallaxX = (mouseX - 0.5) * 10;
            const parallaxY = (mouseY - 0.5) * 10;
            heroTitle.style.transform = `translate(${parallaxX}px, ${parallaxY}px)`;
        }
    }

    setupViewportAnimations() {
        // Viewport-based color shifting
        window.addEventListener('scroll', () => {
            const scrollPercent = window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight);
            const hue = 250 + (scrollPercent * 60); // Shift from purple to cyan
            
            document.documentElement.style.setProperty('--accent-dynamic', `hsl(${hue}, 70%, 60%)`);
            
            // Dynamic background intensity
            const bgIntensity = 0.05 + (scrollPercent * 0.02);
            document.querySelector('.hero').style.background = 
                `radial-gradient(ellipse at center, rgba(139, 92, 246, ${bgIntensity}) 0%, transparent 70%)`;
        });
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        // Enhanced dramatic scroll animations
        const dramaticObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Add staggered animations for child elements
                    const children = entry.target.querySelectorAll('.skill-category, .project-card, .contact-item');
                    children.forEach((child, index) => {
                        setTimeout(() => {
                            child.style.transform = 'translateY(0) scale(1)';
                            child.style.opacity = '1';
                        }, index * 150);
                    });
                }
            });
        }, observerOptions);

        // Section header animations
        const headerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, { threshold: 0.3 });

        // Observe sections for dramatic entrances
        document.querySelectorAll('section').forEach(section => {
            dramaticObserver.observe(section);
        });

        // Observe section headers
        document.querySelectorAll('.section-header').forEach(header => {
            headerObserver.observe(header);
        });

        // Initialize elements with hidden state
        document.querySelectorAll('.skill-category, .project-card, .contact-item').forEach(el => {
            el.style.transform = 'translateY(60px) scale(0.9)';
            el.style.opacity = '0';
            el.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });

        // Parallax scroll effects for background shapes
        this.setupParallaxEffects();
    }

    setupParallaxEffects() {
        const shapes = document.querySelectorAll('.floating-shape, .hero-shape');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            shapes.forEach((shape, index) => {
                const speed = (index + 1) * 0.1;
                const yPos = -(scrolled * speed);
                const rotation = scrolled * (0.05 + speed * 0.1);
                
                shape.style.transform = `translate3d(0, ${yPos}px, 0) rotate(${rotation}deg)`;
            });
        });
    }

    setupAbstractAnimations() {
        // Create dynamic floating particles
        this.createFloatingParticles();
        
        // Animate hero shapes
        this.animateHeroShapes();
        
        // Setup interactive skill icons
        this.setupInteractiveSkills();
    }

    createFloatingParticles() {
        const particleCount = window.innerWidth > 768 ? 15 : 8;
        const existingParticles = document.querySelectorAll('.floating-particle');
        existingParticles.forEach(p => p.remove());
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            particle.style.cssText = `
                position: fixed;
                width: ${Math.random() * 6 + 2}px;
                height: ${Math.random() * 6 + 2}px;
                background: linear-gradient(45deg, #8b5cf6, #06b6d4);
                border-radius: 50%;
                top: ${Math.random() * 100}vh;
                left: ${Math.random() * 100}vw;
                opacity: ${Math.random() * 0.5 + 0.1};
                animation: particleFloat ${Math.random() * 20 + 15}s infinite linear;
                z-index: -1;
                pointer-events: none;
            `;
            document.body.appendChild(particle);
        }
    }

    animateHeroShapes() {
        const heroShapes = document.querySelectorAll('.hero-shape');
        heroShapes.forEach((shape, index) => {
            setInterval(() => {
                const rotation = Math.random() * 360;
                const scale = 0.8 + Math.random() * 0.4;
                shape.style.transform = `rotate(${rotation}deg) scale(${scale})`;
            }, 3000 + index * 1000);
        });
    }

    setupInteractiveSkills() {
        const skillIcons = document.querySelectorAll('.skill-icon');
        skillIcons.forEach(icon => {
            icon.addEventListener('mouseenter', () => {
                icon.style.transform = 'scale(1.2) rotate(15deg)';
                icon.style.filter = 'brightness(1.2)';
            });
            
            icon.addEventListener('mouseleave', () => {
                icon.style.transform = 'scale(1) rotate(0deg)';
                icon.style.filter = 'brightness(1)';
            });
        });
    }

    async loadGitHubProjects() {
        const projectsGrid = document.getElementById('projects-grid');
        if (!projectsGrid) return;

        try {
            // Replace 'j-mazz' with your actual GitHub username
            const response = await fetch('https://api.github.com/users/j-mazz/repos?sort=updated&per_page=6');
            
            if (!response.ok) {
                throw new Error('Failed to fetch repositories');
            }
            
            const repos = await response.json();
            const filteredRepos = repos.filter(repo => !repo.fork && repo.stargazers_count >= 0);
            
            projectsGrid.innerHTML = '';
            
            if (filteredRepos.length === 0) {
                projectsGrid.innerHTML = this.createEmptyState();
                return;
            }
            
            filteredRepos.slice(0, 6).forEach(repo => {
                const projectCard = this.createProjectCard(repo);
                projectsGrid.appendChild(projectCard);
            });
            
        } catch (error) {
            console.error('Error loading GitHub projects:', error);
            projectsGrid.innerHTML = this.createErrorState();
        }
    }

    createProjectCard(repo) {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        const languages = repo.language ? [repo.language] : ['JavaScript'];
        const description = repo.description || 'No description available.';
        
        card.innerHTML = `
            <div class="project-header">
                <h3 class="project-title">${repo.name}</h3>
                <div class="project-links">
                    <a href="${repo.html_url}" target="_blank" rel="noopener" class="project-link" title="View on GitHub">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                    </a>
                    ${repo.homepage ? `
                        <a href="${repo.homepage}" target="_blank" rel="noopener" class="project-link" title="Live Demo">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </a>
                    ` : ''}
                </div>
            </div>
            <p class="project-description">${description}</p>
            <div class="project-tech">
                ${languages.map(lang => `<span class="tech-tag">${lang}</span>`).join('')}
            </div>
            <div class="project-stats">
                <span>⭐ ${repo.stargazers_count}</span>
                <span>🍴 ${repo.forks_count}</span>
                <span>📅 ${new Date(repo.updated_at).toLocaleDateString()}</span>
            </div>
        `;
        
        return card;
    }

    createEmptyState() {
        return `
            <div class="project-card">
                <div class="empty-state">
                    <div class="empty-shape"></div>
                    <h3>Projects Coming Soon</h3>
                    <p>I'm working on some exciting projects. Check back soon!</p>
                </div>
            </div>
        `;
    }

    createErrorState() {
        return `
            <div class="project-card">
                <div class="error-state">
                    <div class="error-shape"></div>
                    <h3>Unable to Load Projects</h3>
                    <p>Please check back later or visit my <a href="https://github.com/j-mazz" target="_blank">GitHub profile</a> directly.</p>
                </div>
            </div>
        `;
    }
}

// Add CSS for additional animations
const additionalStyles = `
    .animate-in {
        animation: slideInUp 0.6s ease-out forwards;
    }

    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes particleFloat {
        0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
        }
    }

    .nav-link.active {
        color: var(--accent-primary);
    }

    .nav-menu.active {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: rgba(10, 10, 11, 0.95);
        backdrop-filter: blur(20px);
        padding: 1rem 0;
        border-top: 1px solid var(--border-color);
    }

    .hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }

    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }

    .hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }

    .empty-state, .error-state {
        text-align: center;
        padding: 2rem;
    }

    .empty-shape, .error-shape {
        width: 60px;
        height: 60px;
        margin: 0 auto 1rem;
        background: var(--gradient-1);
        clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        animation: shapeRotate 3s linear infinite;
    }

    .error-shape {
        background: var(--gradient-3);
    }

    @keyframes shapeRotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .empty-state h3, .error-state h3 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }

    .empty-state p, .error-state p {
        color: var(--text-secondary);
        margin: 0;
    }

    .error-state a {
        color: var(--accent-primary);
        text-decoration: none;
    }

    .error-state a:hover {
        text-decoration: underline;
    }

    @media (max-width: 768px) {
        .nav-menu {
            display: none;
        }
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the portfolio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Portfolio();
});

// Add some utility functions for enhanced interactivity
class InteractiveShapes {
    static createMouseTrail() {
        let mouseTrail = [];
        const maxTrailLength = 10;
        
        document.addEventListener('mousemove', (e) => {
            mouseTrail.push({ x: e.clientX, y: e.clientY, timestamp: Date.now() });
            
            if (mouseTrail.length > maxTrailLength) {
                mouseTrail.shift();
            }
            
            this.updateTrail(mouseTrail);
        });
    }
    
    static updateTrail(trail) {
        // Remove old trail elements
        document.querySelectorAll('.mouse-trail').forEach(el => el.remove());
        
        trail.forEach((point, index) => {
            const trailElement = document.createElement('div');
            trailElement.className = 'mouse-trail';
            trailElement.style.cssText = `
                position: fixed;
                width: ${6 - index * 0.5}px;
                height: ${6 - index * 0.5}px;
                background: rgba(139, 92, 246, ${0.5 - index * 0.05});
                border-radius: 50%;
                left: ${point.x}px;
                top: ${point.y}px;
                pointer-events: none;
                z-index: 9999;
                transform: translate(-50%, -50%);
            `;
            document.body.appendChild(trailElement);
            
            // Remove trail element after animation
            setTimeout(() => {
                if (trailElement.parentNode) {
                    trailElement.remove();
                }
            }, 500);
        });
    }
}

// Initialize mouse trail effect
InteractiveShapes.createMouseTrail();
