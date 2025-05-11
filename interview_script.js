// interview_script.js

document.addEventListener('DOMContentLoaded', () => {
    // ===== Smooth Scrolling for Nav Links (Not really needed for internal links on this simple page) =====
    const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // This page is simple, so hash links might not be used for sections
            // If they are, the smooth scroll logic from the main portal can be copied here
            // For now, just prevent default if it's only a hash
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
            }
            closeMobileMenu(); // Close menu on any nav click
        });
    });

    // ===== Mobile Menu Toggle =====
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav-menu'); // Ensure this ID exists in hackathon.html's mobile nav
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            const isActive = document.body.classList.toggle('mobile-menu-active');
            menuToggle.classList.toggle('active', isActive);
            menuToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            mobileNav.setAttribute('aria-hidden', !isActive);
        });
    }

    // ===== Scroll Reveal Animation =====
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // observer.unobserve(entry.target); // Uncomment to reveal only once
                }
            });
        }, { threshold: 0.1 });
        revealElements.forEach(element => { revealObserver.observe(element); });
    } else { // Fallback for older browsers
        revealElements.forEach(element => element.classList.add('active'));
    }
});

function closeMobileMenu() {
     const menuToggle = document.getElementById('mobile-menu-toggle');
     document.body.classList.remove('mobile-menu-active');
     if (menuToggle) {
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
     }
     document.getElementById('mobile-nav-menu')?.setAttribute('aria-hidden', 'true');
}