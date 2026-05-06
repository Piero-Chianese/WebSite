document.addEventListener('DOMContentLoaded', () => {
    // Scroll Reveal Animation
    const observerOptions = {
        threshold: 0.05, 
        rootMargin: '0px 0px -20px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => {
        observer.observe(el);
    });

    // Instant check for elements already in viewport with smoother timing
    const triggerVisible = () => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                el.classList.add('active');
                observer.unobserve(el);
            }
        });
    };

    // Use requestAnimationFrame for the first check to ensure layout is ready
    requestAnimationFrame(triggerVisible);
    setTimeout(triggerVisible, 300); // Second check after layout stabilizes

    // Active Navigation Link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (currentPath.endsWith(linkPath)) {
            link.classList.add('active');
        } else if (currentPath === '/' && linkPath === 'index.html') {
            link.classList.add('active');
        }
    });

    // Smooth Scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinksContainer = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinksContainer.classList.toggle('active');
            
            // Hamburger Animation
            const spans = menuToggle.querySelectorAll('span');
            spans[0].style.transform = navLinksContainer.classList.contains('active') ? 'rotate(45deg) translate(5px, 5px)' : 'none';
            spans[1].style.opacity = navLinksContainer.classList.contains('active') ? '0' : '1';
            spans[2].style.transform = navLinksContainer.classList.contains('active') ? 'rotate(-45deg) translate(7px, -7px)' : 'none';
        });
    }

    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinksContainer.classList.remove('active');
            // Reset hamburger
            const spans = menuToggle.querySelectorAll('span');
            spans.forEach(s => s.style.transform = 'none');
            spans[1].style.opacity = '1';
        });
    });

    // Sakura Petals Logic
    const sakuraContainer = document.querySelector('.sakura-container');
    if (sakuraContainer) {
        function createPetal() {
            const petal = document.createElement('div');
            petal.classList.add('sakura');
            
            const size = Math.random() * 10 + 5;
            petal.style.width = `${size}px`;
            petal.style.height = `${size}px`;
            
            petal.style.left = `${Math.random() * 100}vw`;
            petal.style.animationDuration = `${Math.random() * 3 + 5}s`;
            
            sakuraContainer.appendChild(petal);
            
            setTimeout(() => {
                petal.remove();
            }, 8000);
        }
        
        setInterval(createPetal, 300);
    }

    // Easter Egg: Maze Game Trigger (5 clicks on logo)
    let logoClicks = 0;
    let lastClickTime = 0;
    let clickTimer = null;
    const logo = document.querySelector('.logo');
    const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
    
    if (logo && isHomePage) {
        logo.addEventListener('click', (e) => {
            const currentTime = Date.now();
            
            // Reset if more than 1 second between clicks
            if (currentTime - lastClickTime > 1000) {
                logoClicks = 0;
            }
            
            logoClicks++;
            lastClickTime = currentTime;
            
            // Visual feedback
            logo.style.transition = 'transform 0.1s';
            logo.style.transform = `scale(${1 + logoClicks * 0.05})`;
            setTimeout(() => { logo.style.transform = 'scale(1)'; }, 100);

            if (logoClicks >= 5) {
                e.preventDefault();
                clearTimeout(clickTimer);
                logoClicks = 0;
                if (window.showMazeGame) window.showMazeGame();
            } else {
                // If it's the start of a sequence, prevent navigation temporarily
                e.preventDefault();
                
                clearTimeout(clickTimer);
                clickTimer = setTimeout(() => {
                    // If no more clicks happened in 250ms and it was just one click, navigate
                    if (logoClicks === 1) {
                        window.location.href = logo.href;
                    }
                    logoClicks = 0;
                }, 250);
            }
        });
    }

});

// --- Protection against copying ---
document.addEventListener('contextmenu', event => event.preventDefault());

document.onkeydown = function(e) {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
    if (e.keyCode == 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) || 
        (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) ||
        (e.ctrlKey && e.keyCode == 'S'.charCodeAt(0))) {
        return false;
    }
};

document.addEventListener('dragstart', function(e) {
    if (e.target.nodeName === 'IMG') {
        e.preventDefault();
    }
});
