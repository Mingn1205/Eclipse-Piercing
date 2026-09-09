// admin-settings.js
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', () => {
        if (!AdminCore.checkAuth()) return;
        if (!AdminCore.checkRole('superadmin')) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        AdminCore.renderSidebar('settings');
        init();
    });
    
    function init() {
        loadSettings();
        loadSystemInfo();
        loadActivityLog();
        bindEvents();
    }
    
    function loadSettings() {
        const settings = AdminCore.getData('ep_settings') || {};
        
        document.getElementById('setting-name').value = settings.studioName || 'Eclipse Piercing';
        document.getElementById('setting-phone').value = settings.phone || '0987.654.321';
        document.getElementById('setting-email').value = settings.email || 'hello@eclipsepiercing.vn';
        document.getElementById('setting-address').value = settings.address || '123 Đường ABC, Quận XYZ, Hà Nội';
        document.getElementById('setting-hours').value = settings.hours || '10:00 - 20:00 hàng ngày';
        document.getElementById('setting-fb').value = settings.facebook || '';
        document.getElementById('setting-ig').value = settings.instagram || '';
        document.getElementById('setting-tiktok').value = settings.tiktok || '';
        document.getElementById('setting-messenger').value = settings.messenger || '';
    }
    
    function saveSettings() {
        const settings = {
            studioName: document.getElementById('setting-name').value.trim(),
            phone: document.getElementById('setting-phone').value.trim(),
            email: document.getElementById('setting-email').value.trim(),
            address: document.getElementById('setting-address').value.trim(),
            hours: document.getElementById('setting-hours').value.trim(),
            facebook: document.getElementById('setting-fb').value.trim(),
            instagram: document.getElementById('setting-ig').value.trim(),
            tiktok: document.getElementById('setting-tiktok').value.trim(),
            messenger: document.getElementById('setting-messenger').value.trim()
        };
        
        AdminCore.setData('ep_settings', settings);
        AdminCore.logActivity('Cập nhật cài đặt', 'Cập nhật thông tin chung của Studio');
        AdminCore.showToast('Đã lưu thông tin cài đặt', 'success');
    }
    
    function loadActivityLog() {
        const logs = AdminCore.getData('ep_activity_log') || [];
        const tbody = document.getElementById('activity-log-table');
        if (!tbody) return;
        
        if (logs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-grayLight">Chưa có hoạt động nào.</td></tr>`;
            return;
        }
        
        // Show last 50
        const recentLogs = logs.slice(0, 50);
        
        tbody.innerHTML = recentLogs.map(log => `
            <tr class="border-b border-grayMid/30 hover:bg-grayMid/10 transition-colors">
                <td class="p-3 text-grayLight whitespace-nowrap">${AdminCore.formatDate(log.timestamp)}</td>
                <td class="p-3 text-gold">${log.username || 'Unknown'}</td>
                <td class="p-3 font-medium text-white">${log.action}</td>
                <td class="p-3 text-grayLight truncate max-w-xs" title="${log.details || ''}">${log.details || '-'}</td>
            </tr>
        `).join('');
    }
    
    function clearLog() {
        AdminCore.showConfirm('Bạn có chắc chắn muốn xóa toàn bộ nhật ký hoạt động?', () => {
            AdminCore.setData('ep_activity_log', []);
            AdminCore.logActivity('Xóa nhật ký', 'Người dùng đã xóa toàn bộ nhật ký hoạt động');
            loadActivityLog();
            AdminCore.showToast('Đã xóa nhật ký', 'success');
        });
    }
    
    function loadSystemInfo() {
        // Calculate storage
        let totalBytes = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('ep_')) {
                totalBytes += (localStorage.getItem(key).length * 2); // roughly 2 bytes per char
            }
        }
        const kb = (totalBytes / 1024).toFixed(2);
        document.getElementById('sys-storage').textContent = `${kb} KB / 5000 KB`;
        
        // Count records
        const getCount = (key) => (AdminCore.getData(key) || []).length;
        
        document.getElementById('sys-posts').textContent = getCount('ep_posts');
        document.getElementById('sys-services').textContent = getCount('ep_services');
        document.getElementById('sys-gallery').textContent = getCount('ep_gallery');
        document.getElementById('sys-bookings').textContent = getCount('ep_bookings');
        
        const lastBackup = AdminCore.getData('ep_last_backup');
        document.getElementById('sys-last-backup').textContent = lastBackup ? AdminCore.formatDate(lastBackup) : 'Chưa có';
    }
    
    function exportData() {
        if (typeof AdminCore.exportAllData === 'function') {
            AdminCore.exportAllData();
            AdminCore.setData('ep_last_backup', new Date().toISOString());
            loadSystemInfo();
        } else {
            // Fallback export if not in AdminCore
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('ep_')) {
                    data[key] = JSON.parse(localStorage.getItem(key));
                }
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `eclipse_piercing_backup_${new Date().getTime()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            AdminCore.setData('ep_last_backup', new Date().toISOString());
            AdminCore.logActivity('Sao lưu dữ liệu', 'Tải xuống file JSON');
            AdminCore.showToast('Đã xuất dữ liệu thành công', 'success');
            loadSystemInfo();
        }
    }
    
    function handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (typeof AdminCore.importData === 'function') {
            AdminCore.importData(file);
        } else {
            // Fallback import
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    AdminCore.showConfirm('Bạn có chắc chắn muốn ghi đè dữ liệu hiện tại bằng dữ liệu từ file này?', () => {
                        for (const key in data) {
                            if (key.startsWith('ep_')) {
                                localStorage.setItem(key, JSON.stringify(data[key]));
                            }
                        }
                        AdminCore.logActivity('Phục hồi dữ liệu', 'Nhập dữ liệu từ file JSON');
                        AdminCore.showToast('Phục hồi dữ liệu thành công. Đang tải lại...', 'success');
                        setTimeout(() => window.location.reload(), 1500);
                    });
                } catch (err) {
                    AdminCore.showToast('File không hợp lệ hoặc bị lỗi', 'error');
                }
            };
            reader.readAsText(file);
        }
        e.target.value = ''; // reset
    }
    
    function resetData() {
        AdminCore.showConfirm('CẢNH BÁO NGUY HIỂM: Hành động này sẽ xóa toàn bộ dữ liệu hiện tại (bài viết, dịch vụ, tài khoản) và không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?', () => {
            // Double confirmation
            const answer = prompt('Nhập chữ "RESET" để xác nhận việc xóa toàn bộ dữ liệu:');
            if (answer === 'RESET') {
                // Clear all ep_ keys except user to not log them out immediately if they are superadmin?
                // Actually reset everything and logout is safer
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith('ep_')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
                
                // Re-initialize default admin
                const users = [{
                    id: 'admin-1',
                    username: 'admin',
                    password: AdminCore.hashPassword ? AdminCore.hashPassword('admin123') : btoa('admin123'),
                    role: 'superadmin',
                    displayName: 'System Admin',
                    isActive: true,
                    createdAt: new Date().toISOString()
                }];
                localStorage.setItem('ep_users', JSON.stringify(users));
                
                alert('Đã khôi phục dữ liệu gốc. Hệ thống sẽ đăng xuất.');
                AdminCore.logout();
            } else if (answer !== null) {
                AdminCore.showToast('Xác nhận không đúng. Đã hủy thao tác.', 'error');
            }
        });
    }
    
    function bindEvents() {
        document.getElementById('studio-info-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            saveSettings();
        });
        
        document.getElementById('btn-clear-log')?.addEventListener('click', clearLog);
        
        document.getElementById('btn-export-data')?.addEventListener('click', exportData);
        
        document.getElementById('import-file')?.addEventListener('change', handleImport);
        
        document.getElementById('btn-reset-data')?.addEventListener('click', resetData);
    }
})();
