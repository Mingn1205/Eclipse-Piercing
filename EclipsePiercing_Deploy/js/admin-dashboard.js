// Admin Dashboard Module
(function() {
    'use strict';
    
    // Check auth on page load
    document.addEventListener('DOMContentLoaded', () => {
        if (!AdminCore.checkAuth()) return;
        
        AdminCore.renderSidebar('dashboard');
        init();
    });
    
    function init() {
        loadStats();
        initCharts();
        loadActivityLog();
    }
    
    function loadStats() {
        const posts = AdminCore.getData('ep_posts') || [];
        const gallery = AdminCore.getData('ep_gallery') || [];
        const bookings = AdminCore.getData('ep_bookings') || [];
        const users = AdminCore.getData('ep_users') || [];
        
        // Cound new/pending bookings
        const newBookings = bookings.filter(b => b.status === 'pending' || b.status === 'new').length;
        
        document.getElementById('stat-posts').textContent = posts.length;
        document.getElementById('stat-gallery').textContent = gallery.length;
        document.getElementById('stat-bookings').textContent = newBookings || bookings.length;
        document.getElementById('stat-users').textContent = users.length;
    }
    
    function initCharts() {
        // Common chart defaults for dark theme
        Chart.defaults.color = '#B3B3B3';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
        
        // Bar Chart - Bookings
        const ctxBookings = document.getElementById('bookingsChart');
        if (ctxBookings) {
            new Chart(ctxBookings, {
                type: 'bar',
                data: {
                    labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
                    datasets: [{
                        label: 'Số lượt booking',
                        data: [12, 19, 15, 25, 22, 30],
                        backgroundColor: '#D4AF37',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        // Doughnut Chart - Services
        const ctxServices = document.getElementById('servicesChart');
        if (ctxServices) {
            new Chart(ctxServices, {
                type: 'doughnut',
                data: {
                    labels: ['Ear Piercing', 'Face Piercing', 'Body Piercing'],
                    datasets: [{
                        data: [55, 30, 15],
                        backgroundColor: [
                            '#D4AF37', // Gold
                            '#1E1E1E', // GrayDark
                            '#2A2A2A'  // GrayMid
                        ],
                        borderColor: '#0A0A0A',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }
    
    function loadActivityLog() {
        const container = document.getElementById('activity-log-container');
        const logs = AdminCore.getData('ep_activity_log') || [];
        
        if (logs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 text-grayLight">
                    <i class="fa-solid fa-clock-rotate-left text-3xl mb-3 opacity-50"></i>
                    <p>Chưa có hoạt động nào</p>
                </div>
            `;
            return;
        }
        
        // Sort newest first and take top 10
        const recentLogs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
        
        let html = '';
        recentLogs.forEach(log => {
            const date = new Date(log.timestamp);
            const formattedDate = date.toLocaleString('vi-VN');
            
            let icon = 'fa-circle-info';
            let color = 'text-grayLight';
            
            if (log.action.toLowerCase().includes('create') || log.action.toLowerCase().includes('thêm')) {
                icon = 'fa-plus';
                color = 'text-green-500';
            } else if (log.action.toLowerCase().includes('update') || log.action.toLowerCase().includes('sửa') || log.action.toLowerCase().includes('cập nhật')) {
                icon = 'fa-pen';
                color = 'text-blue-500';
            } else if (log.action.toLowerCase().includes('delete') || log.action.toLowerCase().includes('xóa')) {
                icon = 'fa-trash';
                color = 'text-red-500';
            }
            
            html += `
                <div class="flex items-start gap-4 pb-4 border-b border-grayDark/50 last:border-0 last:pb-0">
                    <div class="w-8 h-8 rounded-full bg-grayMid flex items-center justify-center shrink-0">
                        <i class="fa-solid ${icon} ${color} text-sm"></i>
                    </div>
                    <div>
                        <p class="text-white text-sm font-medium">${log.action}</p>
                        <p class="text-grayLight text-sm mt-0.5">${log.details}</p>
                        <p class="text-xs text-grayLight mt-1 opacity-70">${formattedDate} • ${log.user || 'Hệ thống'}</p>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
})();
