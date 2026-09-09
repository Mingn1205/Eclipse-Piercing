/**
 * Eclipse Piercing — Data Bridge
 * Reads data from localStorage (admin panel) and renders on the public website
 * Include this script in index.html BEFORE closing </body>
 */
(function() {
    'use strict';

    const KEYS = {
        services: 'ep_services',
        gallery: 'ep_gallery',
        seo: 'ep_seo',
        settings: 'ep_settings',
        bookings: 'ep_bookings',
        posts: 'ep_posts',
        initialized: 'ep_initialized'
    };

    // Only run if admin has been initialized
    if (!localStorage.getItem(KEYS.initialized)) return;

    document.addEventListener('DOMContentLoaded', () => {
        applySEO();
        applySettings();
        renderDynamicServices();
        renderDynamicGallery();
        interceptBookingForm();
        addBlogLink();
        addAdminLink();
    });

    // ============================================================
    // SEO — Update meta tags from admin settings
    // ============================================================
    function applySEO() {
        try {
            const seo = JSON.parse(localStorage.getItem(KEYS.seo));
            if (!seo) return;

            // Update title
            if (seo.metaTitle) {
                document.title = seo.metaTitle;
            }

            // Update or create meta tags
            setMeta('description', seo.metaDescription);
            setMeta('keywords', seo.metaKeywords);

            // Open Graph
            setMetaProperty('og:title', seo.ogTitle || seo.metaTitle);
            setMetaProperty('og:description', seo.ogDescription || seo.metaDescription);
            if (seo.ogImage) setMetaProperty('og:image', seo.ogImage);
            setMetaProperty('og:type', 'website');

            // Structured Data (JSON-LD)
            if (seo.structuredData && seo.structuredData.name) {
                const sd = seo.structuredData;
                const jsonLd = {
                    "@context": "https://schema.org",
                    "@type": "LocalBusiness",
                    "name": sd.name || "Eclipse Piercing",
                    "address": { "@type": "PostalAddress", "streetAddress": sd.address },
                    "telephone": sd.phone,
                    "email": sd.email,
                    "openingHours": sd.hours,
                    "image": seo.ogImage,
                    "url": window.location.origin
                };
                let scriptEl = document.getElementById('ep-structured-data');
                if (!scriptEl) {
                    scriptEl = document.createElement('script');
                    scriptEl.id = 'ep-structured-data';
                    scriptEl.type = 'application/ld+json';
                    document.head.appendChild(scriptEl);
                }
                scriptEl.textContent = JSON.stringify(jsonLd);
            }
        } catch (e) {
            console.warn('Data Bridge: SEO error', e);
        }
    }

    function setMeta(name, content) {
        if (!content) return;
        let el = document.querySelector(`meta[name="${name}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.name = name;
            document.head.appendChild(el);
        }
        el.content = content;
    }

    function setMetaProperty(property, content) {
        if (!content) return;
        let el = document.querySelector(`meta[property="${property}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute('property', property);
            document.head.appendChild(el);
        }
        el.content = content;
    }

    // ============================================================
    // Settings — Update contact info
    // ============================================================
    function applySettings() {
        try {
            const settings = JSON.parse(localStorage.getItem(KEYS.settings));
            if (!settings) return;

            // Update phone links
            if (settings.phone) {
                document.querySelectorAll('a[href^="tel:"]').forEach(el => {
                    el.href = `tel:${settings.phone}`;
                });
            }

            // Update email links
            if (settings.email) {
                document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
                    el.href = `mailto:${settings.email}`;
                    if (el.textContent.includes('@')) el.textContent = settings.email;
                });
            }
        } catch (e) {
            console.warn('Data Bridge: Settings error', e);
        }
    }

    // ============================================================
    // Services — Render dynamic service cards
    // ============================================================
    function renderDynamicServices() {
        try {
            const services = JSON.parse(localStorage.getItem(KEYS.services));
            if (!services || services.length === 0) return;

            const visibleServices = services.filter(s => s.visible).sort((a, b) => a.order - b.order);
            const categories = { ear: 'tab-ear', face: 'tab-face', body: 'tab-body' };

            Object.entries(categories).forEach(([cat, tabId]) => {
                const tabEl = document.getElementById(tabId);
                if (!tabEl) return;

                const catServices = visibleServices.filter(s => s.category === cat);
                if (catServices.length === 0) return;

                const gridEl = tabEl.querySelector('.grid');
                if (!gridEl) return;

                gridEl.innerHTML = catServices.map((service, index) => `
                    <div class="tab-card bg-[#121212] border border-grayDark rounded-2xl p-6 hover:border-gold transition-all hover:-translate-y-1 group" style="opacity: 0; transform: translateY(20px); animation: fadeInUp 0.5s ease-out forwards ${(index % 3) * 50}ms;">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <span class="text-xs font-bold text-gold bg-gold/10 px-2 py-1 rounded mb-2 inline-block uppercase tracking-wider">${service.badge || service.category}</span>
                                <h4 class="text-xl font-bold text-white group-hover:text-gold transition-colors">${service.nameVi || service.nameEn}</h4>
                            </div>
                        </div>
                        <p class="text-grayLight text-sm mb-6 min-h-[40px]">${service.description}</p>
                        <div class="grid grid-cols-2 gap-4 mb-6 text-sm border-t border-grayDark pt-4">
                            <div>
                                <p class="text-grayLight/70 mb-1">Độ đau</p>
                                <p class="font-medium text-white flex items-center gap-1"><i class="fa-solid fa-bolt text-gold/70 text-xs"></i> ${service.painLevel}/10</p>
                            </div>
                            <div>
                                <p class="text-grayLight/70 mb-1">Thời gian lành</p>
                                <p class="font-medium text-white flex items-center gap-1"><i class="fa-regular fa-clock text-gold/70 text-xs"></i> ${service.healingTime}</p>
                            </div>
                        </div>
                        <a href="#booking" class="block w-full text-center py-2.5 rounded-lg border border-grayDark text-white font-medium hover:bg-gold hover:text-dark hover:border-gold transition-colors">Đặt lịch</a>
                    </div>
                `).join('');
            });
        } catch (e) {
            console.warn('Data Bridge: Services error', e);
        }
    }

    // ============================================================
    // Gallery — Render dynamic gallery grid
    // ============================================================
    function renderDynamicGallery() {
        try {
            const gallery = JSON.parse(localStorage.getItem(KEYS.gallery));
            if (!gallery || gallery.length === 0) return;

            const visibleImages = gallery.filter(g => g.visible).sort((a, b) => a.order - b.order);
            const galleryGrid = document.querySelector('#gallery .grid');
            if (!galleryGrid) return;

            galleryGrid.innerHTML = visibleImages.map(img => `
                <div class="masonry-item rounded-xl overflow-hidden group relative fade-in-up">
                    <img src="${img.src}" alt="${img.alt || 'Eclipse Piercing'}" class="w-full h-auto transform group-hover:scale-105 transition-transform duration-500" loading="lazy">
                    <div class="absolute inset-0 bg-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <span class="text-white font-medium border border-white/30 px-4 py-2 rounded-full">${img.caption || 'Eclipse Piercing'}</span>
                    </div>
                </div>
            `).join('');

            // Re-observe for scroll animations
            if (typeof IntersectionObserver !== 'undefined') {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1 });
                galleryGrid.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
            }
        } catch (e) {
            console.warn('Data Bridge: Gallery error', e);
        }
    }

    // ============================================================
    // Booking Form — Save to localStorage alongside FormSubmit
    // ============================================================
    function interceptBookingForm() {
        try {
            // Override the showSuccessMessage function to also save booking locally
            const originalShowSuccess = window.showSuccessMessage;
            
            window.showSuccessMessage = function() {
                // Save booking to localStorage
                const booking = {
                    id: generateId(),
                    customerName: document.getElementById('booking-name')?.value || '',
                    phone: document.getElementById('booking-phone')?.value || '',
                    socialLink: '',
                    service: document.getElementById('booking-service')?.value || '',
                    piercer: document.getElementById('booking-piercer')?.value || '',
                    date: document.getElementById('booking-date')?.value || '',
                    time: document.getElementById('booking-time')?.value || 'Chưa chọn',
                    notes: document.getElementById('booking-notes')?.value || '',
                    status: 'new',
                    internalNotes: '',
                    source: 'website',
                    createdAt: new Date().toISOString()
                };

                const bookings = JSON.parse(localStorage.getItem(KEYS.bookings) || '[]');
                bookings.unshift(booking);
                localStorage.setItem(KEYS.bookings, JSON.stringify(bookings));

                // Call original function
                if (typeof originalShowSuccess === 'function') {
                    originalShowSuccess.call(this);
                }
            };
        } catch (e) {
            console.warn('Data Bridge: Booking intercept error', e);
        }
    }

    function generateId() {
        return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
            Math.floor(Math.random() * 16).toString(16)
        );
    }

    // ============================================================
    // Navigation — Add Blog link and Admin link
    // ============================================================
    function addBlogLink() {
        try {
            const posts = JSON.parse(localStorage.getItem(KEYS.posts) || '[]');
            const publishedPosts = posts.filter(p => p.status === 'published');
            if (publishedPosts.length === 0) return;

            // Add to desktop nav
            const desktopNav = document.querySelector('header nav.hidden.lg\\:flex');
            if (desktopNav && !desktopNav.querySelector('a[href="blog.html"]')) {
                const blogLink = document.createElement('a');
                blogLink.href = 'blog.html';
                blogLink.className = 'text-sm font-medium hover:text-gold transition-colors';
                blogLink.textContent = 'Blog';
                desktopNav.appendChild(blogLink);
            }

            // Add to mobile nav
            const mobileNav = document.querySelector('#mobile-menu nav');
            if (mobileNav && !mobileNav.querySelector('a[href="blog.html"]')) {
                const mobileBlogLink = document.createElement('a');
                mobileBlogLink.href = 'blog.html';
                mobileBlogLink.className = 'mobile-link text-xl text-white font-medium';
                mobileBlogLink.textContent = 'Blog';
                const bookingLink = mobileNav.querySelector('a[href="#booking"]');
                if (bookingLink) {
                    mobileNav.insertBefore(mobileBlogLink, bookingLink);
                } else {
                    mobileNav.appendChild(mobileBlogLink);
                }
            }
        } catch (e) {
            console.warn('Data Bridge: Blog link error', e);
        }
    }

    function addAdminLink() {
        try {
            // Add subtle admin link in footer
            const footerBottom = document.querySelector('footer .border-t.border-grayDark');
            if (footerBottom && !footerBottom.querySelector('a[href="admin/"]')) {
                const adminLink = document.createElement('a');
                adminLink.href = 'admin/';
                adminLink.className = 'text-grayLight/20 hover:text-gold transition-colors text-xs';
                adminLink.textContent = '⚡ Admin';
                adminLink.title = 'Quản trị website';
                footerBottom.appendChild(adminLink);
            }
        } catch (e) {
            console.warn('Data Bridge: Admin link error', e);
        }
    }
})();
