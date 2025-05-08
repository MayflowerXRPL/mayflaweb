// hackathon_script.js (アニメーションとモバイルメニュー用)

document.addEventListener('DOMContentLoaded', () => {
    // ===== Smooth Scrolling (Not really needed on this simple page, but keep for consistency) =====
    const navLinks = document.querySelectorAll('.main-nav a[href^="#"]'); // Header nav links (if any)
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
            closeMobileMenu();
        });
    });

     // Also handle smooth scroll for mobile links if they exist
     const mobileNavLinks = document.querySelectorAll('.mobile-nav a[href^="#"]');
     mobileNavLinks.forEach(link => {
         link.addEventListener('click', function(e) {
             e.preventDefault();
             const targetId = this.getAttribute('href');
             const targetElement = document.querySelector(targetId);
             if (targetElement) {
                 const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
                 const elementPosition = targetElement.getBoundingClientRect().top;
                 const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;
                 window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
             }
             closeMobileMenu();
         });
     });


    // ===== Mobile Menu Toggle =====
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav-menu');
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
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // observer.unobserve(entry.target); // Uncomment to reveal only once
            }
        });
    }, { threshold: 0.1 }); // Start when 10% is visible

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

}); // End of DOMContentLoaded

function closeMobileMenu() {
     const menuToggle = document.getElementById('mobile-menu-toggle');
     document.body.classList.remove('mobile-menu-active');
     if (menuToggle) {
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
     }
     document.getElementById('mobile-nav-menu')?.setAttribute('aria-hidden', 'true');
}