// hackathon_script.js (アニメーション等のみ)

document.addEventListener('DOMContentLoaded', () => {
    // ===== Smooth Scrolling for Nav Links (Internal page links - may not be needed much now) =====
    const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            // Check if it's an external link or just "#"
            if (!targetId || targetId === '#' || targetId.startsWith('http') || !document.querySelector(targetId)) {
                if (this.getAttribute('target') === '_blank') {
                    window.open(this.getAttribute('href'), '_blank');
                } else if (!targetId.startsWith('#')) {
                     window.location.href = this.getAttribute('href');
                }
                return;
            }

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
            closeMobileMenu();
        });
    });

    // ===== Mobile Menu Toggle (Basic Placeholder) =====
    const menuToggle = document.getElementById('mobile-menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.body.classList.toggle('mobile-menu-active');
            menuToggle.classList.toggle('active');
            console.log("Mobile menu toggled (implement menu structure and CSS)");
        });
    }

    function closeMobileMenu() {
         document.body.classList.remove('mobile-menu-active');
         document.getElementById('mobile-menu-toggle')?.classList.remove('active');
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
    }, { threshold: 0.1 });
    revealElements.forEach(element => { revealObserver.observe(element); });

    // ===== FAQ Accordion (If FAQ section exists, currently removed) =====
    // const faqItems = document.querySelectorAll('.faq-item summary');
    // faqItems.forEach(summary => { ... });

}); // End of DOMContentLoaded