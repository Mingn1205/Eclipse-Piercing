/**
 * Eclipse Piercing — Admin Core Module
 * Handles: Authentication, Sidebar, Utilities, Data Management
 */
const AdminCore = (function() {
    'use strict';

    // ============================================================
    // Constants
    // ============================================================
    const STORAGE_KEYS = {
        users: 'ep_users',
        session: 'ep_session',
        posts: 'ep_posts',
        services: 'ep_services',
        gallery: 'ep_gallery',
        bookings: 'ep_bookings',
        seo: 'ep_seo',
        settings: 'ep_settings',
        activityLog: 'ep_activity_log',
        initialized: 'ep_initialized'
    };

    const ROLES = {
        superadmin: { level: 3, label: 'Super Admin' },
        editor:     { level: 2, label: 'Biên tập viên' },
        viewer:     { level: 1, label: 'Người xem' }
    };

    const LOGO_URL = 'https://res.cloudinary.com/dmqg578zx/image/upload/f_auto,q_auto/ChatGPT_Image_13_32_42_4_thg_6_2026_efamgb';

    const SIDEBAR_ITEMS = [
        { group: 'Tổng quan', items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high', href: 'dashboard.html', minRole: 'viewer' },
        ]},
        { group: 'Nội dung', items: [
            { id: 'posts', label: 'Bài viết', icon: 'fa-solid fa-pen-to-square', href: 'posts.html', minRole: 'editor' },
            { id: 'services', label: 'Dịch vụ', icon: 'fa-solid fa-list-check', href: 'services.html', minRole: 'editor' },
            { id: 'gallery', label: 'Thư viện ảnh', icon: 'fa-solid fa-images', href: 'gallery.html', minRole: 'editor' },
        ]},
        { group: 'Quản lý', items: [
            { id: 'bookings', label: 'Lịch đặt', icon: 'fa-solid fa-calendar-check', href: 'bookings.html', minRole: 'viewer', badgeKey: 'newBookings' },
            { id: 'seo', label: 'SEO Manager', icon: 'fa-solid fa-magnifying-glass-chart', href: 'seo.html', minRole: 'editor' },
        ]},
        { group: 'Hệ thống', items: [
            { id: 'users', label: 'Phân quyền', icon: 'fa-solid fa-user-shield', href: 'users.html', minRole: 'superadmin' },
            { id: 'settings', label: 'Cài đặt', icon: 'fa-solid fa-gear', href: 'settings.html', minRole: 'superadmin' },
        ]},
    ];

    // ============================================================
    // Initialization — Seed Default Data
    // ============================================================
    function initializeApp() {
        if (getData(STORAGE_KEYS.initialized)) return;

        // Create default admin user
        const defaultUsers = [{
            id: generateId(),
            username: 'admin',
            displayName: 'Admin Eclipse',
            passwordHash: hashPassword('eclipse2024'),
            role: 'superadmin',
            active: true,
            createdAt: new Date().toISOString(),
            lastLogin: null
        }];
        setData(STORAGE_KEYS.users, defaultUsers);

        // Seed default services from current website
        const defaultServices = [
            { id: generateId(), nameVi: 'Lobe', nameEn: 'Lobe', description: 'Vị trí dái tai cơ bản, ít đau và nhanh lành nhất.', category: 'ear', painLevel: 1, healingTime: '6-8 tuần', badge: 'Cơ bản', order: 1, visible: true },
            { id: generateId(), nameVi: 'Upper Lobe', nameEn: 'Upper Lobe', description: 'Vị trí dái tai cao, tạo điểm nhấn nhẹ nhàng.', category: 'ear', painLevel: 2, healingTime: '6-8 tuần', badge: 'Cơ bản', order: 2, visible: true },
            { id: generateId(), nameVi: 'Helix', nameEn: 'Helix', description: 'Xỏ sụn vành tai ngoài, phổ biến và thời trang.', category: 'ear', painLevel: 4, healingTime: '6-9 tháng', badge: 'Sụn ngoài', order: 3, visible: true },
            { id: generateId(), nameVi: 'Forward Helix', nameEn: 'Forward Helix', description: 'Vị trí sụn nhỏ phía trước vành tai.', category: 'ear', painLevel: 5, healingTime: '6-9 tháng', badge: 'Sụn trước', order: 4, visible: true },
            { id: generateId(), nameVi: 'Flat', nameEn: 'Flat', description: 'Khu vực sụn phẳng rộng phía trên tai.', category: 'ear', painLevel: 4, healingTime: '6-9 tháng', badge: 'Sụn phẳng', order: 5, visible: true },
            { id: generateId(), nameVi: 'Tragus', nameEn: 'Tragus', description: 'Xỏ qua phần sụn nhỏ che lấp lỗ tai.', category: 'ear', painLevel: 5, healingTime: '6-9 tháng', badge: 'Sụn nhĩ', order: 6, visible: true },
            { id: generateId(), nameVi: 'Conch', nameEn: 'Conch', description: 'Vị trí sụn lõm sâu bên trong tai, cực kỳ cá tính.', category: 'ear', painLevel: 5, healingTime: '6-9 tháng', badge: 'Sụn trong', order: 7, visible: true },
            { id: generateId(), nameVi: 'Daith', nameEn: 'Daith', description: 'Xỏ qua nếp gấp sụn sâu nhất, hỗ trợ giảm đau nửa đầu.', category: 'ear', painLevel: 6, healingTime: '6-12 tháng', badge: 'Sụn gấp', order: 8, visible: true },
            { id: generateId(), nameVi: 'Rook', nameEn: 'Rook', description: 'Vị trí sụn gấp nhỏ phía trên Daith.', category: 'ear', painLevel: 6, healingTime: '6-12 tháng', badge: 'Sụn gấp trên', order: 9, visible: true },
            { id: generateId(), nameVi: 'Nostril', nameEn: 'Nostril', description: 'Vị trí xỏ cánh mũi phổ biến và thanh lịch.', category: 'face', painLevel: 3, healingTime: '3-6 tháng', badge: 'Cánh mũi', order: 10, visible: true },
            { id: generateId(), nameVi: 'Septum', nameEn: 'Septum', description: 'Xỏ vách ngăn mũi, cá tính và nổi bật.', category: 'face', painLevel: 4, healingTime: '3-4 tháng', badge: 'Vách ngăn', order: 11, visible: true },
            { id: generateId(), nameVi: 'Eyebrow', nameEn: 'Eyebrow', description: 'Xỏ trên/dưới lông mày, mạnh mẽ và ấn tượng.', category: 'face', painLevel: 4, healingTime: '6-9 tháng', badge: 'Lông mày', order: 12, visible: true },
            { id: generateId(), nameVi: 'Labret', nameEn: 'Labret', description: 'Vùng dưới môi, dễ chăm sóc và phổ biến.', category: 'face', painLevel: 4, healingTime: '6-8 tuần', badge: 'Dưới môi', order: 13, visible: true },
            { id: generateId(), nameVi: 'Navel', nameEn: 'Navel', description: 'Xỏ rốn gợi cảm và nữ tính.', category: 'body', painLevel: 5, healingTime: '6-12 tháng', badge: 'Rốn', order: 14, visible: true },
            { id: generateId(), nameVi: 'Nipple', nameEn: 'Nipple', description: 'Táo bạo và gợi cảm, yêu cầu kỹ thuật cao.', category: 'body', painLevel: 7, healingTime: '6-12 tháng', badge: 'Ngực', order: 15, visible: true },
        ];
        setData(STORAGE_KEYS.services, defaultServices);

        // Seed default gallery from current website
        const defaultGallery = [];
        for (let i = 1; i <= 14; i++) {
            defaultGallery.push({
                id: generateId(),
                src: `ảnh sp ${i}.jpg`,
                alt: `Tác phẩm ${i} - Eclipse Piercing`,
                caption: 'Eclipse Piercing',
                category: 'ear',
                order: i,
                visible: true,
                addedAt: new Date().toISOString()
            });
        }
        setData(STORAGE_KEYS.gallery, defaultGallery);

        // Default SEO settings
        setData(STORAGE_KEYS.seo, {
            metaTitle: 'Eclipse Piercing | Studio Xỏ Khuyên Cao Cấp Hà Nội',
            metaDescription: 'Eclipse Piercing - Studio xỏ khuyên chuyên nghiệp, an toàn và chuẩn thẩm mỹ tại Hà Nội. Trải nghiệm dịch vụ xỏ khuyên cao cấp với quy trình vô trùng.',
            metaKeywords: 'Xỏ khuyên Hà Nội, Piercing Hà Nội, Studio Piercing, Xỏ khuyên chuyên nghiệp, Ear Piercing, Piercing Studio, Eclipse Piercing',
            ogTitle: 'Eclipse Piercing | Premium Piercing Studio',
            ogDescription: 'Studio xỏ khuyên chuyên nghiệp, an toàn và chuẩn thẩm mỹ tại Hà Nội.',
            ogImage: LOGO_URL,
            robotsTxt: 'User-agent: *\nAllow: /\nSitemap: /sitemap.xml',
            structuredData: {
                type: 'LocalBusiness',
                name: 'Eclipse Piercing',
                address: 'Thanh Xuân, Hà Nội',
                phone: '0565398437',
                email: 'nvminh3689@gmail.com',
                hours: '09:00-21:00'
            }
        });

        // Default settings
        setData(STORAGE_KEYS.settings, {
            studioName: 'Eclipse Piercing',
            address: 'Thanh Xuân, Hà Nội',
            phone: '0565398437',
            email: 'nvminh3689@gmail.com',
            hours: '9AM - 9PM (Tất cả các ngày)',
            facebook: 'https://www.facebook.com/xokhuyeneclipse',
            instagram: 'https://www.instagram.com/naivebinnmuseum/',
            tiktok: '',
            messenger: 'https://m.me/xokhuyeneclipse'
        });

        // Empty arrays
        setData(STORAGE_KEYS.posts, []);
        setData(STORAGE_KEYS.bookings, []);
        setData(STORAGE_KEYS.activityLog, []);

        setData(STORAGE_KEYS.initialized, true);
        console.log('✅ Eclipse Admin initialized with default data');
    }

    // ============================================================
    // Authentication
    // ============================================================
    function hashPassword(password) {
        // Simple hash using Web Crypto-like approach (SHA-256 simulation)
        // For production, use Web Crypto API. This is for demo/personal use.
        let hash = 0;
        const str = password + '_eclipse_salt_2024';
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return 'h_' + Math.abs(hash).toString(36) + '_' + str.length;
    }

    function login(username, password) {
        const users = getData(STORAGE_KEYS.users) || [];
        const user = users.find(u => u.username === username);

        if (!user) return { success: false, error: 'Tài khoản không tồn tại' };
        if (!user.active) return { success: false, error: 'Tài khoản đã bị khóa' };
        if (user.passwordHash !== hashPassword(password)) return { success: false, error: 'Mật khẩu không chính xác' };

        // Create session
        const session = {
            userId: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            token: generateId(),
            loginAt: new Date().toISOString()
        };
        sessionStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));

        // Update last login
        user.lastLogin = new Date().toISOString();
        setData(STORAGE_KEYS.users, users);

        logActivity('Đăng nhập', `${user.displayName} đã đăng nhập`);
        return { success: true, user: session };
    }

    function logout() {
        const user = getCurrentUser();
        if (user) {
            logActivity('Đăng xuất', `${user.displayName} đã đăng xuất`);
        }
        sessionStorage.removeItem(STORAGE_KEYS.session);
        window.location.href = 'index.html';
    }

    function checkAuth() {
        initializeApp();
        const session = sessionStorage.getItem(STORAGE_KEYS.session);
        if (!session) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    function getCurrentUser() {
        const session = sessionStorage.getItem(STORAGE_KEYS.session);
        return session ? JSON.parse(session) : null;
    }

    function checkRole(requiredRole) {
        const user = getCurrentUser();
        if (!user) return false;
        const userLevel = ROLES[user.role]?.level || 0;
        const requiredLevel = ROLES[requiredRole]?.level || 0;
        if (userLevel < requiredLevel) {
            showToast('Bạn không có quyền truy cập chức năng này', 'error');
            return false;
        }
        return true;
    }

    // ============================================================
    // Data Management
    // ============================================================
    function getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading data:', e);
            return null;
        }
    }

    function setData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error saving data:', e);
            showToast('Lỗi lưu dữ liệu. Bộ nhớ có thể đã đầy.', 'error');
            return false;
        }
    }

    function exportAllData() {
        const allData = {};
        Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
            if (key !== 'ep_session') {
                allData[key] = getData(key);
            }
        });
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eclipse-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Đã xuất dữ liệu thành công!', 'success');
        logActivity('Export data', 'Xuất toàn bộ dữ liệu backup');
    }

    function importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            Object.entries(data).forEach(([key, value]) => {
                if (key.startsWith('ep_')) {
                    localStorage.setItem(key, JSON.stringify(value));
                }
            });
            showToast('Nhập dữ liệu thành công! Đang tải lại...', 'success');
            logActivity('Import data', 'Nhập dữ liệu từ file backup');
            setTimeout(() => window.location.reload(), 1500);
            return true;
        } catch (e) {
            showToast('File không hợp lệ. Vui lòng kiểm tra lại.', 'error');
            return false;
        }
    }

    // ============================================================
    // Utilities
    // ============================================================
    function generateId() {
        return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
            Math.floor(Math.random() * 16).toString(16)
        );
    }

    function slugify(text) {
        // Vietnamese diacritics map
        const map = {
            'à':'a','á':'a','ả':'a','ã':'a','ạ':'a','ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a',
            'â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a','è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e',
            'ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e','ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
            'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o','ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o',
            'ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o','ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u',
            'ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u','ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y',
            'đ':'d','Đ':'d'
        };
        return text.toLowerCase()
            .replace(/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/g, c => map[c] || c)
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function formatDate(dateString, format = 'short') {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date)) return '—';
        
        if (format === 'short') {
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        }
        if (format === 'long') {
            return date.toLocaleDateString('vi-VN', {
                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
            });
        }
        if (format === 'datetime') {
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        }
        return date.toLocaleDateString('vi-VN');
    }

    function timeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Vừa xong';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
        return formatDate(dateString);
    }

    function truncate(text, maxLength = 80) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength) + '...';
    }

    function stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    function estimateReadTime(text) {
        const words = stripHtml(text).split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200));
    }

    // ============================================================
    // Activity Log
    // ============================================================
    function logActivity(action, details) {
        const log = getData(STORAGE_KEYS.activityLog) || [];
        const user = getCurrentUser();
        log.unshift({
            id: generateId(),
            action,
            details,
            user: user ? user.displayName : 'System',
            timestamp: new Date().toISOString()
        });
        // Keep last 200 entries
        if (log.length > 200) log.length = 200;
        setData(STORAGE_KEYS.activityLog, log);
    }

    // ============================================================
    // UI Components
    // ============================================================

    // Toast Notification
    function showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    // Confirm Dialog
    function showConfirm(message, onConfirm, title = 'Xác nhận') {
        // Remove existing
        const existing = document.getElementById('confirm-dialog');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'confirm-dialog';
        overlay.className = 'confirm-overlay active';
        overlay.innerHTML = `
            <div class="modal-backdrop" id="confirm-backdrop"></div>
            <div class="confirm-box">
                <div class="confirm-icon" style="background: rgba(234,179,8,0.1); color: var(--warning);">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="confirm-actions">
                    <button class="btn btn-secondary" id="confirm-cancel">Hủy bỏ</button>
                    <button class="btn btn-danger" id="confirm-ok">Xác nhận</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('confirm-cancel').addEventListener('click', () => overlay.remove());
        document.getElementById('confirm-backdrop').addEventListener('click', () => overlay.remove());
        document.getElementById('confirm-ok').addEventListener('click', () => {
            overlay.remove();
            if (typeof onConfirm === 'function') onConfirm();
        });
    }

    // ============================================================
    // Sidebar Rendering
    // ============================================================
    function renderSidebar(activePageId) {
        const user = getCurrentUser();
        if (!user) return;

        const sidebarEl = document.getElementById('admin-sidebar');
        if (!sidebarEl) return;

        const userLevel = ROLES[user.role]?.level || 0;

        // Count new bookings for badge
        const bookings = getData(STORAGE_KEYS.bookings) || [];
        const newBookingsCount = bookings.filter(b => b.status === 'new').length;
        const badgeCounts = { newBookings: newBookingsCount };

        let navHTML = '';
        SIDEBAR_ITEMS.forEach(group => {
            const visibleItems = group.items.filter(item => {
                const minLevel = ROLES[item.minRole]?.level || 0;
                return userLevel >= minLevel;
            });
            if (visibleItems.length === 0) return;

            navHTML += `<div class="sidebar-nav-group">
                <div class="sidebar-nav-group-title">${group.group}</div>`;
            
            visibleItems.forEach(item => {
                const isActive = item.id === activePageId;
                const badgeValue = item.badgeKey ? badgeCounts[item.badgeKey] : 0;
                navHTML += `
                    <a href="${item.href}" class="sidebar-nav-item ${isActive ? 'active' : ''}">
                        <i class="${item.icon}"></i>
                        <span>${item.label}</span>
                        ${badgeValue > 0 ? `<span class="badge">${badgeValue}</span>` : ''}
                    </a>`;
            });
            navHTML += `</div>`;
        });

        const initials = (user.displayName || 'A').charAt(0).toUpperCase();
        const roleLabel = ROLES[user.role]?.label || user.role;

        sidebarEl.innerHTML = `
            <aside class="admin-sidebar" id="sidebar">
                <div class="sidebar-logo">
                    <img src="${LOGO_URL}" alt="Eclipse Piercing" onerror="this.src='https://placehold.co/44x44/1E1E1E/D4AF37?text=EP'">
                    <div class="logo-text">
                        <span>Eclipse</span>
                        <span>Admin Panel</span>
                    </div>
                </div>
                <nav class="sidebar-nav">
                    ${navHTML}
                </nav>
                <div class="sidebar-footer">
                    <div class="sidebar-user-card">
                        <div class="sidebar-user-avatar">${initials}</div>
                        <div class="sidebar-user-info">
                            <div class="name">${user.displayName}</div>
                            <div class="role">${roleLabel}</div>
                        </div>
                        <button onclick="AdminCore.logout()" class="btn-ghost btn-icon btn-sm" title="Đăng xuất" style="color:var(--text-muted);">
                            <i class="fa-solid fa-right-from-bracket"></i>
                        </button>
                    </div>
                </div>
            </aside>
            <div class="sidebar-overlay" id="sidebar-overlay"></div>
        `;

        // Mobile sidebar toggle
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleBtn = document.getElementById('sidebar-toggle');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            });
        }
        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        }

        // Render user info in topbar
        const userInfoEl = document.getElementById('admin-user-info');
        if (userInfoEl) {
            userInfoEl.innerHTML = `
                <div class="flex items-center gap-3">
                    <a href="../index.html" target="_blank" class="btn btn-ghost btn-sm" title="Xem website">
                        <i class="fa-solid fa-external-link-alt"></i>
                        <span class="hidden sm:inline">Xem website</span>
                    </a>
                    <button onclick="AdminCore.logout()" class="btn btn-secondary btn-sm">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        <span class="hidden sm:inline">Đăng xuất</span>
                    </button>
                </div>
            `;
        }
    }

    // ============================================================
    // Public API
    // ============================================================
    return {
        // Constants
        STORAGE_KEYS,
        ROLES,
        LOGO_URL,

        // Auth
        login,
        logout,
        checkAuth,
        getCurrentUser,
        checkRole,
        hashPassword,

        // Data
        getData,
        setData,
        exportAllData,
        importData,

        // Utils
        generateId,
        slugify,
        formatDate,
        timeAgo,
        truncate,
        stripHtml,
        estimateReadTime,

        // Activity
        logActivity,

        // UI
        showToast,
        showConfirm,
        renderSidebar,

        // Init
        initializeApp
    };
})();
