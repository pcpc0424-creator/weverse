/**
 * WEVERSE - Modern Design 2025-2026
 * Premium Animations & Interactions
 */

(function() {
    'use strict';

    // ========================================
    // Scroll Progress Bar
    // ========================================
    const scrollProgress = document.querySelector('.scroll-progress');

    if (scrollProgress) {
        window.addEventListener('scroll', () => {
            const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (window.scrollY / windowHeight) * 100;
            scrollProgress.style.width = scrolled + '%';
        }, { passive: true });
    }

    // ========================================
    // Loader with Smooth Exit
    // ========================================
    const loader = document.getElementById('loader');

    window.addEventListener('load', () => {
        setTimeout(() => {
            if (loader) {
                loader.classList.add('hidden');
                // Trigger entrance animations after loader
                setTimeout(() => {
                    document.body.classList.add('page-loaded');
                    triggerHeroAnimations();
                }, 300);
            }
        }, 1200);
    });

    function triggerHeroAnimations() {
        const heroElements = document.querySelectorAll('.hero [data-animate], .page-hero [data-animate], .product-hero [data-animate]');
        heroElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('animated');
            }, index * 100);
        });
    }

    // ========================================
    // Custom Cursor - Enhanced
    // ========================================
    const cursor = document.getElementById('cursor');
    const cursorDot = document.getElementById('cursorDot');

    if (cursor && cursorDot && window.innerWidth > 768) {
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let isHovering = false;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Instant dot follow
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';
        });

        // Smooth cursor follow with spring effect
        function animateCursor() {
            const ease = isHovering ? 0.15 : 0.1;
            cursorX += (mouseX - cursorX) * ease;
            cursorY += (mouseY - cursorY) * ease;

            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';

            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Different cursor states
        const hoverElements = document.querySelectorAll('a, button, .shop-card, .product-card, .feature-item');
        const viewElements = document.querySelectorAll('.product-card, .shop-card');

        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('hover');
                isHovering = true;
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('hover', 'view');
                isHovering = false;
            });
        });

        viewElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('view');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('view');
            });
        });

        // Hide cursor when leaving window
        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
            cursorDot.style.opacity = '0';
        });

        document.addEventListener('mouseenter', () => {
            cursor.style.opacity = '1';
            cursorDot.style.opacity = '1';
        });
    }

    // ========================================
    // Header Scroll Effect
    // ========================================
    const header = document.getElementById('header');

    if (header) {
        let lastScroll = 0;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScroll = window.pageYOffset;

                    if (currentScroll > 100) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }

                    lastScroll = currentScroll;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ========================================
    // Mobile Navigation
    // ========================================
    const navToggle = document.getElementById('navToggle');
    const nav = document.getElementById('nav');

    if (navToggle && nav) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            nav.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                nav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ========================================
    // Scroll Animations - Enhanced
    // ========================================
    const animatedElements = document.querySelectorAll('[data-animate]');

    const observerOptions = {
        root: null,
        rootMargin: '-50px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add slight delay based on data-delay attribute
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('animated');
                }, delay * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        // Don't observe hero elements (they animate after loader)
        if (!el.closest('.hero') && !el.closest('.page-hero') && !el.closest('.product-hero')) {
            observer.observe(el);
        }
    });

    // ========================================
    // Split Text Animation
    // ========================================
    function initSplitText() {
        const splitElements = document.querySelectorAll('.split-text');

        splitElements.forEach(element => {
            const text = element.textContent;
            element.innerHTML = '';

            text.split('').forEach((char, index) => {
                const span = document.createElement('span');
                span.className = 'char';
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.transitionDelay = `${index * 0.03}s`;
                element.appendChild(span);
            });
        });

        // Observe split text elements
        const splitObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    splitObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        splitElements.forEach(el => splitObserver.observe(el));
    }

    initSplitText();

    // ========================================
    // Smooth Scroll
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
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

    // ========================================
    // Parallax Effect - Smooth
    // ========================================
    const parallaxElements = document.querySelectorAll('.hero-content, .hero-float');
    let scrollY = 0;
    let ticking2 = false;

    if (parallaxElements.length > 0) {
        window.addEventListener('scroll', () => {
            scrollY = window.pageYOffset;

            if (!ticking2) {
                requestAnimationFrame(() => {
                    parallaxElements.forEach(el => {
                        const rate = el.classList.contains('hero-float') ? 0.15 : 0.3;
                        el.style.transform = `translateY(${scrollY * rate}px)`;
                    });
                    ticking2 = false;
                });
                ticking2 = true;
            }
        }, { passive: true });
    }

    // ========================================
    // Number Counter Animation
    // ========================================
    const counters = document.querySelectorAll('.stat-number');

    counters.forEach(counter => {
        const animate = () => {
            const target = counter.innerText;
            const isPercentage = target.includes('%');
            const hasPlus = target.includes('+');
            const hasK = target.includes('K');

            let num = parseFloat(target.replace(/[^0-9.]/g, ''));
            let suffix = '';

            if (isPercentage) suffix = '%';
            if (hasPlus) suffix = '+';
            if (hasK) { suffix = 'K+'; }

            let current = 0;
            const duration = 2000;
            const startTime = performance.now();

            function updateCounter(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function for smooth animation
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                current = num * easeOutQuart;

                if (progress < 1) {
                    counter.innerText = Math.floor(current) + suffix;
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = num + suffix;
                }
            }

            requestAnimationFrame(updateCounter);
        };

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animate();
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counterObserver.observe(counter);
    });

    // ========================================
    // Magnetic Button Effect - Enhanced
    // ========================================
    const magneticButtons = document.querySelectorAll('.btn, .hero-cta');

    magneticButtons.forEach(btn => {
        let rect;

        btn.addEventListener('mouseenter', () => {
            rect = btn.getBoundingClientRect();
        });

        btn.addEventListener('mousemove', (e) => {
            if (!rect) return;

            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Stronger effect at the edges
            const strength = 0.25;
            btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
            rect = null;
        });
    });

    // ========================================
    // Button Ripple Effect
    // ========================================
    const rippleButtons = document.querySelectorAll('.btn');

    rippleButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';

            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // ========================================
    // 3D Tilt Effect on Cards
    // ========================================
    const tiltCards = document.querySelectorAll('.product-card, .feature-item');

    tiltCards.forEach(card => {
        let rect;

        card.addEventListener('mouseenter', () => {
            rect = card.getBoundingClientRect();
            card.style.transition = 'transform 0.1s ease-out';
        });

        card.addEventListener('mousemove', (e) => {
            if (!rect) return;

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.5s ease-out';
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            rect = null;
        });
    });

    // ========================================
    // Image Reveal Animation
    // ========================================
    const revealImages = document.querySelectorAll('.reveal-image');

    const imageRevealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                imageRevealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    revealImages.forEach(img => imageRevealObserver.observe(img));

    // ========================================
    // Image Lazy Loading
    // ========================================
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    }, { rootMargin: '50px' });

    images.forEach(img => imageObserver.observe(img));

    // ========================================
    // Smooth Scroll Velocity Detection
    // ========================================
    let lastScrollTop = 0;
    let scrollVelocity = 0;

    window.addEventListener('scroll', () => {
        const st = window.pageYOffset;
        scrollVelocity = Math.abs(st - lastScrollTop);
        lastScrollTop = st;
    }, { passive: true });

    // ========================================
    // Marquee Pause on Hover
    // ========================================
    const marquee = document.querySelector('.marquee');
    const marqueeInner = document.querySelector('.marquee-inner');

    if (marquee && marqueeInner) {
        marquee.addEventListener('mouseenter', () => {
            marqueeInner.style.animationPlayState = 'paused';
        });
        marquee.addEventListener('mouseleave', () => {
            marqueeInner.style.animationPlayState = 'running';
        });
    }

    // ========================================
    // Timeline Hover Effects
    // ========================================
    const timelineItems = document.querySelectorAll('.timeline-item');

    timelineItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.paddingLeft = 'calc(var(--space-lg) + 10px)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.paddingLeft = 'var(--space-lg)';
        });
    });

    // ========================================
    // Footer Links Animation
    // ========================================
    const footerLinks = document.querySelectorAll('.footer-links a');

    footerLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.paddingLeft = '10px';
        });
        link.addEventListener('mouseleave', function() {
            this.style.paddingLeft = '0';
        });
    });

    // ========================================
    // Prefers Reduced Motion
    // ========================================
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (prefersReducedMotion.matches) {
        // Disable animations
        document.querySelectorAll('[data-animate]').forEach(el => {
            el.classList.add('animated');
        });
    }

    // ========================================
    // Page Load Complete
    // ========================================
    document.body.classList.add('loaded');

    // ========================================
    // Performance: Use will-change for animated elements
    // ========================================
    const animatingElements = document.querySelectorAll('.product-card, .feature-item, .shop-card, .btn');

    animatingElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            el.style.willChange = 'transform';
        });
        el.addEventListener('mouseleave', () => {
            el.style.willChange = 'auto';
        });
    });

})();

// ========================================
// Shopping Cart Functions
// ========================================

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem('weverseCart');
    return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('weverseCart', JSON.stringify(cart));
}

// Show toast notification
function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.cart-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);

    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================
// Dealer-Only Modal
// ========================================
function showDealerOnlyModal() {
    // Remove existing modal
    const existingModal = document.querySelector('.dealer-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'dealer-modal-overlay';
    modal.innerHTML = `
        <div class="dealer-modal">
            <div class="dealer-modal-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
            </div>
            <h3>대리점 전용</h3>
            <p>상품 주문은 대리점 회원만 가능합니다.</p>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">대리점 가입을 원하시면 관리자에게 문의해주세요.</p>
            <div class="dealer-modal-buttons">
                <button class="btn btn-primary" onclick="closeDealerModal()">확인</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Show modal with animation
    setTimeout(() => modal.classList.add('show'), 10);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeDealerModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeDealerModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function closeDealerModal() {
    const modal = document.querySelector('.dealer-modal-overlay');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function goToLogin() {
    closeDealerModal();
    const path = window.location.pathname;
    if (path.includes('/pages/products/')) {
        window.location.href = '../login.html';
    } else if (path.includes('/pages/')) {
        window.location.href = 'login.html';
    } else {
        window.location.href = 'pages/login.html';
    }
}

// Check if current user is a dealer
function isDealer() {
    let session = null;
    try {
        const localSession = JSON.parse(localStorage.getItem('weverseSession'));
        const storageSession = JSON.parse(sessionStorage.getItem('weverseSession'));
        session = (storageSession && storageSession.loggedIn) ? storageSession :
                  (localSession && localSession.loggedIn) ? localSession :
                  (storageSession || localSession);
    } catch (e) {}

    if (!session || (!session.loggedIn && !session.username)) {
        return false;
    }

    // Check memberType from session (stored during login)
    return session.memberType === 'dealer';
}

// Add to cart
function addToCart(productName, price) {
    const cart = getCart();

    // Check if product already exists
    const existingItem = cart.find(item => item.name === productName);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: productName,
            price: price,
            quantity: 1
        });
    }

    saveCart(cart);
    updateCartCount();
    showToast(`${productName} added to cart!`);
}

// Buy now - redirect to checkout with product
function buyNow(productName, price) {
    // Clear cart and add only this product
    const cart = [{
        name: productName,
        price: price,
        quantity: 1
    }];

    saveCart(cart);
    updateCartCount();

    // Redirect to checkout page
    showToast(`Proceeding to checkout with ${productName}...`);

    setTimeout(() => {
        // Determine the correct path to checkout based on current location
        const path = window.location.pathname;
        if (path.includes('/pages/products/')) {
            window.location.href = '../checkout.html';
        } else if (path.includes('/pages/')) {
            window.location.href = 'checkout.html';
        } else {
            window.location.href = 'pages/checkout.html';
        }
    }, 500);
}

// Update cart count badge
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count');

    cartCountElements.forEach(el => {
        el.textContent = totalItems;
        if (totalItems > 0) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', updateCartCount);

// Update auth navigation based on login state
function updateAuthNav() {
    let session = null;
    try {
        const localData = localStorage.getItem('weverseSession');
        const sessionData = sessionStorage.getItem('weverseSession');

        // Parse both and check which one has loggedIn: true
        const localSession = localData ? JSON.parse(localData) : null;
        const storageSession = sessionData ? JSON.parse(sessionData) : null;

        // Prefer the one with loggedIn: true, otherwise use whichever exists
        if (storageSession && storageSession.loggedIn) {
            session = storageSession;
        } else if (localSession && localSession.loggedIn) {
            session = localSession;
        } else if (localSession || storageSession) {
            // If neither has loggedIn but data exists, treat as logged in
            session = localSession || storageSession;
            if (session && (session.username || session.id)) {
                session.loggedIn = true;
            }
        }
    } catch (e) {
        console.error('updateAuthNav parse error:', e);
    }
    const isLoggedIn = session && (session.loggedIn || session.username);

    // Find auth link
    const authLink = document.querySelector('.nav-auth');
    if (authLink) {
        // Determine correct path based on current page location
        const path = window.location.pathname;
        let basePath = '';

        if (path.includes('/pages/products/')) {
            basePath = '../';
        } else if (path.includes('/pages/')) {
            basePath = '';
        } else {
            basePath = 'pages/';
        }

        if (isLoggedIn) {
            authLink.href = basePath + 'account.html';
            authLink.textContent = session.fullName || session.name || 'My Account';
            authLink.setAttribute('data-i18n', 'nav.account');
            authLink.classList.add('logged-in');
        } else {
            authLink.href = basePath + 'login.html';
            authLink.textContent = 'Login';
            authLink.setAttribute('data-i18n', 'nav.login');
            authLink.classList.remove('logged-in');
        }
    }
}

// Initialize auth nav on page load and after language change
document.addEventListener('DOMContentLoaded', function() {
    // Run after a short delay to ensure it runs after i18n
    setTimeout(updateAuthNav, 100);
});

// ========================================
// Floating Action Button (FAB)
// ========================================
function initFAB() {
    const fabContainer = document.getElementById('fabContainer');
    const fabToggle = document.getElementById('fabToggle');
    const fabCartCount = document.getElementById('fabCartCount');

    if (!fabContainer || !fabToggle) return;

    // Toggle FAB menu
    fabToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        fabContainer.classList.toggle('active');
    });

    // Close FAB when clicking outside
    document.addEventListener('click', (e) => {
        if (!fabContainer.contains(e.target)) {
            fabContainer.classList.remove('active');
        }
    });

    // Close FAB when pressing Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            fabContainer.classList.remove('active');
        }
    });

    // Update FAB cart count
    updateFabCartCount();
}

// Update FAB cart count badge
function updateFabCartCount() {
    const fabCartCount = document.getElementById('fabCartCount');
    if (!fabCartCount) return;

    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    fabCartCount.textContent = totalItems;
    if (totalItems > 0) {
        fabCartCount.style.display = 'flex';
    } else {
        fabCartCount.style.display = 'none';
    }
}

// Initialize FAB on page load
document.addEventListener('DOMContentLoaded', initFAB);

// Override updateCartCount to also update FAB
const originalUpdateCartCount = updateCartCount;
updateCartCount = function() {
    originalUpdateCartCount();
    updateFabCartCount();
};

// ========================================
// Language / i18n System
// ========================================
const translations = {
    en: {
        // Navigation
        'nav.main': 'Main',
        'nav.company': 'Company',
        'nav.product': 'Product',
        'nav.shop': 'Shop',
        'nav.login': 'Login',
        'nav.account': 'My Account',
        'nav.myaccount': 'My Account',

        // Hero Section
        'hero.subtitle': 'Premium Health Innovation',
        'hero.brand': 'WEVERSE,',
        'hero.title1': 'The Power That',
        'hero.title2': 'Changes The World',
        'hero.tagline': 'is the beginning.',
        'hero.cta': 'Discover More',

        // Marquee
        'marquee.premium': 'PREMIUM',
        'marquee.innovation': 'INNOVATION',
        'marquee.health': 'HEALTH',
        'marquee.wellness': 'WELLNESS',

        // About Section
        'about.title1': 'Weverse, The Power That',
        'about.title2': 'Changes The World',
        'about.p1': 'Weverse, the power that changes the world, is the beginning. Weverse makes a difference in our lives with a clear goal of improving the value of human life.',
        'about.p2': 'Premium ingredients, scientific validation, and innovative technology. When these three elements converge, Weverse\'s premium healthcare solutions are born.',
        'about.stat1.number': '15+',
        'about.stat1.label': 'Years',
        'about.stat2.number': '50K+',
        'about.stat2.label': 'Customers',
        'about.stat3.number': '99%',
        'about.stat3.label': 'Satisfaction',

        // Products Section
        'products.title1': 'Our',
        'products.title2': 'Products',
        'products.subtitle': 'Science-backed premium healthcare',
        'products.newbornaid': 'New-BornAid',
        'products.newbornaid.desc': 'Fermented enzyme with 20 minerals & vitamins',
        'products.alphagpc': 'Alpha GPC',
        'products.alphagpc.desc': 'Brain health & cognitive enhancement',
        'products.nanolutein': 'Nano Lutein',
        'products.nanolutein.desc': 'Advanced nano-technology for eye health',
        'products.viewdetails': 'View Details',

        // Features Section
        'features.quality.title': 'Premium Quality',
        'features.quality.desc': 'Only the finest grade ingredients carefully selected',
        'features.science.title': 'Science Based',
        'features.science.desc': 'Products backed by scientific research and clinical trials',
        'features.global.title': 'Global Standard',
        'features.global.desc': 'Manufacturing facilities meeting international quality standards',
        'features.customer.title': 'Customer First',
        'features.customer.desc': 'Your healthy life is our top priority',

        // CTA Section
        'cta.title1': 'Experience',
        'cta.title2': 'Premium',
        'cta.subtitle': 'Start your healthy transformation with Weverse today',
        'cta.button': 'Shop Now',

        // Footer
        'footer.desc': 'Premium healthcare that elevates the value of life. Where science meets innovation to create your healthier tomorrow.',
        'footer.menu': 'Menu',
        'footer.products': 'Products',
        'footer.contact': 'Contact',
        'footer.copyright': '© 2025 WEVERSE. All rights reserved.',

        // Common
        'common.addtocart': 'Add to Cart',
        'common.buynow': 'Buy Now',
        'common.scroll': 'Scroll',
        'common.learnmore': 'Learn More',
        'common.shopnow': 'Shop Now',
        'common.viewall': 'View All Products',
        'common.back': 'Back',

        // FAB
        'fab.cart': 'Cart',
        'fab.account': 'My Account',
        'fab.lang': 'Language',

        // Company Page
        'company.subtitle': 'About Us',
        'company.title1': 'Weverse, The Power That',
        'company.title2': 'Changes The World',
        'company.intro.title1': 'Weverse\'s',
        'company.intro.title2': 'Introduction',
        'company.intro.p1': 'Weverse, the power that changes the world, is the beginning. Weverse makes a difference in our lives with a clear goal of improving the value of human life.',
        'company.intro.p2': 'We are not just a company that sells products. We are a healthcare partner that continuously researches and innovates for the healthy lives of our customers.',
        'company.philosophy.title1': 'Our',
        'company.philosophy.title2': 'Philosophy',
        'company.philosophy.p1': 'Weverse, the power that changes the world, is the beginning. We read the flow of change, understand what the era truly demands, and create new standards.',
        'company.philosophy.p2': 'Success begins when diverse perspectives come together as one. We see individuals as key elements in creating a better future and believe in growing together.',
        'company.philosophy.p3': 'Weverse creates a better world through flexible thinking and action. You are the beginning.',
        'company.journey.title1': 'Our',
        'company.journey.title2': 'Journey',
        'company.timeline.2010': 'Foundation',
        'company.timeline.2010.desc': 'Weverse founded, taking the first step in health innovation',
        'company.timeline.2015': 'Global Expansion',
        'company.timeline.2015.desc': 'Expanded operations to Southeast Asia and established key partnerships',
        'company.timeline.2018': 'Innovation Award',
        'company.timeline.2018.desc': 'Received Healthcare Innovation Award for breakthrough formulations',
        'company.timeline.2020': 'Digital Transformation',
        'company.timeline.2020.desc': 'Launched e-commerce platform and expanded digital presence',
        'company.timeline.2023': 'Premium Line',
        'company.timeline.2023.desc': 'Introduced premium product line with advanced nano-technology',
        'company.values.title1': 'Our',
        'company.values.title2': 'Values',
        'company.values.innovation': 'Innovation',
        'company.values.innovation.desc': 'Continuously pushing boundaries in health science',
        'company.values.integrity': 'Integrity',
        'company.values.integrity.desc': 'Transparent and honest in all our business practices',
        'company.values.excellence': 'Excellence',
        'company.values.excellence.desc': 'Committed to the highest quality standards',
        'company.values.care': 'Care',
        'company.values.care.desc': 'Genuinely caring for our customers\' wellbeing',

        // Product Page
        'product.subtitle': 'Our Collection',
        'product.title': 'Products',
        'product.intro.title1': 'Science Meets',
        'product.intro.title2': 'Innovation',
        'product.intro.desc': 'Each Weverse product is the result of extensive research, premium ingredients, and cutting-edge technology working together to deliver exceptional health benefits.',

        // Shop Page
        'shop.subtitle': 'Premium Collection',
        'shop.title': 'Shop',
        'shop.badge.best': 'Best',
        'shop.badge.new': 'New',
        'shop.badge.sale': 'Sale',

        // Product Details
        'product.superprostaid': 'Super ProstaAid',
        'product.superprostaid.desc': 'Prostate health & inflammation support',
        'product.jointcare': 'Joint Care',
        'product.jointcare.desc': 'Joint health & mobility support',
        'product.premiumpackage': 'Premium Package',
        'product.premiumpackage.desc': 'Complete wellness bundle',
        'product.keyfeatures': 'Key Features',
        'product.packageincludes': 'Package Includes',

        // Cart Page
        'cart.subtitle': 'Your Selection',
        'cart.title': 'Cart',
        'cart.empty.title': 'Your cart is empty',
        'cart.empty.desc': 'Looks like you haven\'t added any products yet.',
        'cart.summary': 'Order Summary',
        'cart.subtotal': 'Subtotal',
        'cart.shipping': 'Shipping',
        'cart.total': 'Total',
        'cart.checkout': 'Proceed to Checkout',
        'cart.continue': 'Continue Shopping',
        'cart.remove': 'Remove',

        // Checkout Page
        'checkout.subtitle': 'Complete Your Order',
        'checkout.title': 'Checkout',
        'checkout.shipping.title': 'Shipping Information',
        'checkout.payment.title': 'Payment Method',
        'checkout.firstname': 'First Name',
        'checkout.lastname': 'Last Name',
        'checkout.email': 'Email',
        'checkout.phone': 'Phone',
        'checkout.address': 'Address',
        'checkout.city': 'City',
        'checkout.state': 'State/Province',
        'checkout.zip': 'ZIP Code',
        'checkout.country': 'Country',
        'checkout.placeorder': 'Place Order',

        // Login Page
        'login.title': 'Welcome Back',
        'login.subtitle': 'Sign in to your account to continue',
        'login.username': 'ID',
        'login.username.placeholder': 'Enter your ID',
        'login.email': 'Email Address',
        'login.email.placeholder': 'Enter your email',
        'login.password': 'Password',
        'login.password.placeholder': 'Enter your password',
        'login.remember': 'Remember me',
        'login.forgot': 'Forgot password?',
        'login.submit': 'Sign In',
        'login.or': 'or continue with',
        'login.noaccount': 'Don\'t have an account?',
        'login.signup': 'Sign Up',

        // Signup Page
        'signup.title': 'Create Account',
        'signup.subtitle': 'Join Weverse for a healthier tomorrow',
        'signup.username': 'ID',
        'signup.username.placeholder': 'Enter your ID',
        'signup.name': 'Full Name',
        'signup.name.placeholder': 'Enter your name',
        'signup.email': 'Email Address',
        'signup.email.placeholder': 'Enter your email',
        'signup.password': 'Password',
        'signup.password.placeholder': 'Create a password',
        'signup.confirm': 'Confirm Password',
        'signup.confirm.placeholder': 'Confirm your password',
        'signup.terms': 'I agree to the Terms of Service and Privacy Policy',
        'signup.submit': 'Create Account',
        'signup.or': 'or sign up with',
        'signup.hasaccount': 'Already have an account?',
        'signup.login': 'Sign In',

        // Account Page
        'account.subtitle': 'Welcome Back',
        'account.title': 'My Account',
        'account.orders': 'Order History',
        'account.orders.desc': 'View and track your orders',
        'account.profile': 'Profile Settings',
        'account.addresses': 'Saved Addresses',
        'account.wishlist': 'Wishlist',
        'account.logout': 'Logout',
        'account.empty.orders': 'No orders yet',
        'account.empty.orders.desc': 'Your order history will appear here',

        // CTA Section (additional)
        'cta.experience': 'Experience',
        'cta.premium': 'Premium Healthcare',
        'cta.discover': 'Discover more products from our collection'
    },
    zh: {
        // Navigation
        'nav.main': '首页',
        'nav.company': '公司介绍',
        'nav.product': '产品',
        'nav.shop': '商城',
        'nav.login': '登录',
        'nav.account': '我的账户',
        'nav.myaccount': '我的账户',

        // Hero Section
        'hero.subtitle': '优质健康创新',
        'hero.brand': 'WEVERSE，',
        'hero.title1': '改变世界的',
        'hero.title2': '力量',
        'hero.tagline': '从这里开始。',
        'hero.cta': '了解更多',

        // Marquee
        'marquee.premium': '优质',
        'marquee.innovation': '创新',
        'marquee.health': '健康',
        'marquee.wellness': '养生',

        // About Section
        'about.title1': 'Weverse，改变世界的',
        'about.title2': '力量',
        'about.p1': 'Weverse，改变世界的力量，是一切的开始。Weverse 以提升人类生活价值为明确目标，为我们的生活带来改变。',
        'about.p2': '优质原料、科学验证和创新技术。当这三大要素汇聚一堂，Weverse的优质健康解决方案由此诞生。',
        'about.stat1.number': '15+',
        'about.stat1.label': '年',
        'about.stat2.number': '50K+',
        'about.stat2.label': '客户',
        'about.stat3.number': '99%',
        'about.stat3.label': '满意度',

        // Products Section
        'products.title1': '我们的',
        'products.title2': '产品',
        'products.subtitle': '科学支持的优质健康产品',
        'products.newbornaid': 'New-BornAid',
        'products.newbornaid.desc': '含20种矿物质和维生素的发酵酶',
        'products.alphagpc': 'Alpha GPC',
        'products.alphagpc.desc': '大脑健康与认知增强',
        'products.nanolutein': 'Nano Lutein',
        'products.nanolutein.desc': '先进纳米技术护眼配方',
        'products.viewdetails': '查看详情',

        // Features Section
        'features.quality.title': '优质品质',
        'features.quality.desc': '精选最优质的原料成分',
        'features.science.title': '科学依据',
        'features.science.desc': '经科学研究和临床试验验证的产品',
        'features.global.title': '国际标准',
        'features.global.desc': '符合国际质量标准的生产设施',
        'features.customer.title': '客户至上',
        'features.customer.desc': '您的健康生活是我们的首要任务',

        // CTA Section
        'cta.title1': '体验',
        'cta.title2': '优质生活',
        'cta.subtitle': '今天就开始您与Weverse的健康蜕变之旅',
        'cta.button': '立即购买',

        // Footer
        'footer.desc': '提升生命价值的优质健康产品。科学与创新的结合，为您创造更健康的明天。',
        'footer.menu': '菜单',
        'footer.products': '产品',
        'footer.contact': '联系我们',
        'footer.copyright': '© 2025 WEVERSE. 保留所有权利。',

        // Common
        'common.addtocart': '加入购物车',
        'common.buynow': '立即购买',
        'common.scroll': '滚动',
        'common.learnmore': '了解更多',
        'common.shopnow': '立即购买',
        'common.viewall': '查看全部产品',
        'common.back': '返回',

        // FAB
        'fab.cart': '购物车',
        'fab.account': '我的账户',
        'fab.lang': '语言',

        // Company Page
        'company.subtitle': '关于我们',
        'company.title1': 'Weverse，改变世界的',
        'company.title2': '力量',
        'company.intro.title1': 'Weverse',
        'company.intro.title2': '简介',
        'company.intro.p1': 'Weverse，改变世界的力量，是一切的开始。Weverse 以提升人类生活价值为明确目标，为我们的生活带来改变。',
        'company.intro.p2': '我们不仅仅是一家销售产品的公司。我们是一个不断为客户健康生活进行研究和创新的健康合作伙伴。',
        'company.philosophy.title1': '我们的',
        'company.philosophy.title2': '理念',
        'company.philosophy.p1': 'Weverse，改变世界的力量，是一切的开始。我们洞察变化的趋势，理解时代的真正需求，创造新的标准。',
        'company.philosophy.p2': '当不同的视角汇聚为一，成功便开始了。我们将每个人视为创造更美好未来的关键要素，相信共同成长。',
        'company.philosophy.p3': 'Weverse 通过灵活的思维和行动创造更美好的世界。你就是开始。',
        'company.journey.title1': '我们的',
        'company.journey.title2': '历程',
        'company.timeline.2010': '成立',
        'company.timeline.2010.desc': 'Weverse成立，迈出健康创新的第一步',
        'company.timeline.2015': '全球扩张',
        'company.timeline.2015.desc': '业务扩展至东南亚，建立关键合作伙伴关系',
        'company.timeline.2018': '创新奖',
        'company.timeline.2018.desc': '凭借突破性配方获得健康创新奖',
        'company.timeline.2020': '数字化转型',
        'company.timeline.2020.desc': '推出电子商务平台，扩大数字化布局',
        'company.timeline.2023': '高端产品线',
        'company.timeline.2023.desc': '推出采用先进纳米技术的高端产品线',
        'company.values.title1': '我们的',
        'company.values.title2': '价值观',
        'company.values.innovation': '创新',
        'company.values.innovation.desc': '不断突破健康科学的边界',
        'company.values.integrity': '诚信',
        'company.values.integrity.desc': '在所有业务实践中透明诚实',
        'company.values.excellence': '卓越',
        'company.values.excellence.desc': '致力于最高质量标准',
        'company.values.care': '关怀',
        'company.values.care.desc': '真诚关心客户的健康',

        // Product Page
        'product.subtitle': '产品系列',
        'product.title': '产品',
        'product.intro.title1': '科学与',
        'product.intro.title2': '创新',
        'product.intro.desc': '每款Weverse产品都是广泛研究、优质原料和尖端技术共同作用的结果，为您带来卓越的健康益处。',

        // Shop Page
        'shop.subtitle': '优质系列',
        'shop.title': '商城',
        'shop.badge.best': '热销',
        'shop.badge.new': '新品',
        'shop.badge.sale': '特惠',

        // Product Details
        'product.superprostaid': 'Super ProstaAid',
        'product.superprostaid.desc': '前列腺健康与抗炎支持',
        'product.jointcare': 'Joint Care',
        'product.jointcare.desc': '关节健康与灵活性支持',
        'product.premiumpackage': '尊享套装',
        'product.premiumpackage.desc': '全方位健康套装',
        'product.keyfeatures': '主要特点',
        'product.packageincludes': '套装包含',

        // Cart Page
        'cart.subtitle': '您的选择',
        'cart.title': '购物车',
        'cart.empty.title': '购物车是空的',
        'cart.empty.desc': '您还没有添加任何产品。',
        'cart.summary': '订单摘要',
        'cart.subtotal': '小计',
        'cart.shipping': '运费',
        'cart.total': '总计',
        'cart.checkout': '去结算',
        'cart.continue': '继续购物',
        'cart.remove': '删除',

        // Checkout Page
        'checkout.subtitle': '完成您的订单',
        'checkout.title': '结算',
        'checkout.shipping.title': '收货信息',
        'checkout.payment.title': '支付方式',
        'checkout.firstname': '名',
        'checkout.lastname': '姓',
        'checkout.email': '邮箱',
        'checkout.phone': '电话',
        'checkout.address': '地址',
        'checkout.city': '城市',
        'checkout.state': '省份',
        'checkout.zip': '邮编',
        'checkout.country': '国家',
        'checkout.placeorder': '提交订单',

        // Login Page
        'login.title': '欢迎回来',
        'login.subtitle': '登录您的账户以继续',
        'login.username': 'ID',
        'login.username.placeholder': '请输入ID',
        'login.email': '邮箱地址',
        'login.email.placeholder': '请输入邮箱',
        'login.password': '密码',
        'login.password.placeholder': '请输入密码',
        'login.remember': '记住我',
        'login.forgot': '忘记密码？',
        'login.submit': '登录',
        'login.or': '或使用以下方式登录',
        'login.noaccount': '还没有账户？',
        'login.signup': '注册',

        // Signup Page
        'signup.title': '创建账户',
        'signup.subtitle': '加入Weverse，开启健康明天',
        'signup.username': 'ID',
        'signup.username.placeholder': '请输入ID',
        'signup.name': '姓名',
        'signup.name.placeholder': '请输入姓名',
        'signup.email': '邮箱地址',
        'signup.email.placeholder': '请输入邮箱',
        'signup.password': '密码',
        'signup.password.placeholder': '创建密码',
        'signup.confirm': '确认密码',
        'signup.confirm.placeholder': '再次输入密码',
        'signup.terms': '我同意服务条款和隐私政策',
        'signup.submit': '创建账户',
        'signup.or': '或使用以下方式注册',
        'signup.hasaccount': '已有账户？',
        'signup.login': '登录',

        // Account Page
        'account.subtitle': '欢迎回来',
        'account.title': '我的账户',
        'account.orders': '订单历史',
        'account.orders.desc': '查看和追踪您的订单',
        'account.profile': '个人设置',
        'account.addresses': '收货地址',
        'account.wishlist': '心愿单',
        'account.logout': '退出登录',
        'account.empty.orders': '暂无订单',
        'account.empty.orders.desc': '您的订单历史将显示在这里',

        // CTA Section (additional)
        'cta.experience': '体验',
        'cta.premium': '优质健康产品',
        'cta.discover': '发现更多产品'
    }
};

// Get current language
function getCurrentLang() {
    return localStorage.getItem('weverseLang') || 'en';
}

// Set language
function setLang(lang) {
    localStorage.setItem('weverseLang', lang);
    applyTranslations(lang);
    updateLangButton(lang);
    // Re-apply auth nav after translations
    setTimeout(updateAuthNav, 50);
}

// Toggle language
function toggleLanguage() {
    const currentLang = getCurrentLang();
    const newLang = currentLang === 'en' ? 'zh' : 'en';
    setLang(newLang);
}

// Update language button text
function updateLangButton(lang) {
    const langBtn = document.getElementById('fabLang');
    if (langBtn) {
        // Show the language you can switch TO (opposite of current)
        langBtn.textContent = lang === 'en' ? '中' : 'EN';
        langBtn.title = lang === 'en' ? 'Switch to Chinese' : 'Switch to English';
    }
}

// Apply translations to page
function applyTranslations(lang) {
    const t = translations[lang];
    if (!t) return;

    // Find all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // Find all elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.placeholder = t[key];
        }
    });

    // Find all elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (t[key]) {
            el.title = t[key];
        }
    });
}

// Initialize language on page load
function initLanguage() {
    const lang = getCurrentLang();
    applyTranslations(lang);
    updateLangButton(lang);
}

// Initialize language when DOM is ready
document.addEventListener('DOMContentLoaded', initLanguage);

// ========================================
// Visitor Tracking
// ========================================
function trackVisitor() {
    const today = new Date().toISOString().split('T')[0];
    const sessionKey = 'weverseVisitorTracked_' + today;

    // Only track once per day per session
    if (sessionStorage.getItem(sessionKey)) return;

    const visitors = JSON.parse(localStorage.getItem('weverseVisitors')) || {};
    visitors[today] = (visitors[today] || 0) + 1;
    localStorage.setItem('weverseVisitors', JSON.stringify(visitors));
    sessionStorage.setItem(sessionKey, 'true');
}

// Track visitor on page load
document.addEventListener('DOMContentLoaded', trackVisitor);
