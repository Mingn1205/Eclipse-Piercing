(function() {
    'use strict';
    
    let bookingsData = [];
    let currentBookingId = null;

    document.addEventListener('DOMContentLoaded', () => {
        if (!AdminCore.checkAuth()) return;
        AdminCore.renderSidebar('bookings');
        init();
    });
    
    function init() {
        loadData();
        setupEventListeners();
        renderTable();
        updateStats();
    }
    
    function loadData() {
        bookingsData = AdminCore.getData('ep_bookings') || [];
        // Sort newest date first by default
        bookingsData.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    function saveData() {
        AdminCore.setData('ep_bookings', bookingsData);
    }
    
    function setupEventListeners() {
        document.getElementById('btn-add-booking').addEventListener('click', () => {
            document.getElementById('form-add-booking').reset();
            document.getElementById('modal-booking-add').classList.remove('hidden');
        });
        
        document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
        
        document.getElementById('filter-status').addEventListener('change', renderTable);
        document.getElementById('filter-date').addEventListener('change', renderTable);
        
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.fixed').classList.add('hidden');
            });
        });
        
        document.getElementById('form-add-booking').addEventListener('submit', handleAddBooking);
        document.getElementById('btn-save-notes').addEventListener('click', handleSaveNotes);
    }
    
    function getStatusBadge(status) {
        const badges = {
            'new': '<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Mới</span>',
            'confirmed': '<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">Đã xác nhận</span>',
            'completed': '<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500 border border-green-500/30">Hoàn thành</span>',
            'cancelled': '<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">Đã hủy</span>'
        };
        return badges[status] || badges['new'];
    }
    
    function renderTable() {
        const tbody = document.getElementById('bookings-table-body');
        const emptyState = document.getElementById('empty-state');
        
        const filterStatus = document.getElementById('filter-status').value;
        const filterDate = document.getElementById('filter-date').value;
        
        let filtered = bookingsData;
        
        if (filterStatus) {
            filtered = filtered.filter(b => b.status === filterStatus);
        }
        if (filterDate) {
            filtered = filtered.filter(b => b.date === filterDate);
        }
        
        if (filtered.length === 0) {
            tbody.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        tbody.innerHTML = filtered.map(b => `
            <tr class="hover:bg-grayMid/30 transition-colors cursor-pointer" data-id="${b.id}">
                <td class="p-4">
                    <div class="font-medium text-white">${b.name}</div>
                </td>
                <td class="p-4">${b.phone}</td>
                <td class="p-4">${b.service}</td>
                <td class="p-4">${b.piercer || 'Bất kỳ'}</td>
                <td class="p-4">
                    <div>${AdminCore.formatDate(b.date)}</div>
                    <div class="text-sm text-grayLight">${b.time}</div>
                </td>
                <td class="p-4">${getStatusBadge(b.status)}</td>
                <td class="p-4">
                    <button class="text-gold hover:text-gold-light view-btn" data-id="${b.id}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.querySelectorAll('tr').forEach(tr => {
            tr.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    openDetailModal(tr.dataset.id);
                }
            });
        });
        
        tbody.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openDetailModal(btn.dataset.id);
            });
        });
    }
    
    function updateStats() {
        const total = bookingsData.length;
        const newB = bookingsData.filter(b => b.status === 'new').length;
        const confirmed = bookingsData.filter(b => b.status === 'confirmed').length;
        const completed = bookingsData.filter(b => b.status === 'completed').length;
        
        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-new').textContent = newB;
        document.getElementById('stat-confirmed').textContent = confirmed;
        document.getElementById('stat-completed').textContent = completed;
    }
    
    function openDetailModal(id) {
        const b = bookingsData.find(x => x.id === id);
        if (!b) return;
        
        currentBookingId = id;
        
        document.getElementById('detail-name').textContent = b.name;
        document.getElementById('detail-phone').textContent = b.phone;
        
        const socialLink = document.getElementById('detail-social');
        if (b.social) {
            socialLink.href = b.social;
            socialLink.textContent = b.social;
        } else {
            socialLink.removeAttribute('href');
            socialLink.textContent = 'Trống';
        }
        
        document.getElementById('detail-service').textContent = b.service;
        document.getElementById('detail-piercer').textContent = b.piercer || 'Bất kỳ';
        document.getElementById('detail-datetime').textContent = `${b.time} - ${AdminCore.formatDate(b.date)}`;
        
        document.getElementById('detail-customer-notes').textContent = b.notes || 'Không có ghi chú';
        document.getElementById('detail-internal-notes').value = b.internalNotes || '';
        
        renderStatusButtons(b.status);
        
        document.getElementById('modal-booking-detail').classList.remove('hidden');
    }
    
    function renderStatusButtons(currentStatus) {
        const container = document.getElementById('status-buttons');
        let buttonsHtml = '';
        
        if (currentStatus === 'new') {
            buttonsHtml += `<button onclick="updateBookingStatus('confirmed')" class="bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 px-4 py-2 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors">Xác nhận</button>`;
            buttonsHtml += `<button onclick="updateBookingStatus('cancelled')" class="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg text-sm hover:bg-red-500/30 transition-colors">Hủy</button>`;
        } else if (currentStatus === 'confirmed') {
            buttonsHtml += `<button onclick="updateBookingStatus('completed')" class="bg-green-500/20 text-green-500 border border-green-500/50 px-4 py-2 rounded-lg text-sm hover:bg-green-500/30 transition-colors">Đánh dấu Hoàn thành</button>`;
            buttonsHtml += `<button onclick="updateBookingStatus('cancelled')" class="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg text-sm hover:bg-red-500/30 transition-colors">Hủy</button>`;
        } else {
            buttonsHtml = `<p class="text-sm text-grayLight">Không thể thay đổi trạng thái khi đã ${currentStatus === 'completed' ? 'hoàn thành' : 'hủy'}.</p>`;
        }
        
        container.innerHTML = buttonsHtml;
    }
    
    window.updateBookingStatus = function(newStatus) {
        if (!currentBookingId) return;
        
        const idx = bookingsData.findIndex(b => b.id === currentBookingId);
        if (idx === -1) return;
        
        const oldStatus = bookingsData[idx].status;
        bookingsData[idx].status = newStatus;
        bookingsData[idx].updatedAt = new Date().toISOString();
        
        saveData();
        AdminCore.logActivity('update_booking_status', `Cập nhật trạng thái booking của ${bookingsData[idx].name} từ ${oldStatus} sang ${newStatus}`);
        AdminCore.showToast('Cập nhật trạng thái thành công', 'success');
        
        renderTable();
        updateStats();
        renderStatusButtons(newStatus);
    };
    
    function handleSaveNotes() {
        if (!currentBookingId) return;
        const notes = document.getElementById('detail-internal-notes').value;
        
        const idx = bookingsData.findIndex(b => b.id === currentBookingId);
        if (idx !== -1) {
            bookingsData[idx].internalNotes = notes;
            saveData();
            AdminCore.showToast('Đã lưu ghi chú nội bộ', 'success');
        }
    }
    
    function handleAddBooking(e) {
        e.preventDefault();
        
        const newBooking = {
            id: AdminCore.generateId(),
            name: document.getElementById('add-name').value,
            phone: document.getElementById('add-phone').value,
            social: document.getElementById('add-social').value,
            service: document.getElementById('add-service').value,
            piercer: document.getElementById('add-piercer').value,
            date: document.getElementById('add-date').value,
            time: document.getElementById('add-time').value,
            notes: document.getElementById('add-notes').value,
            status: 'new',
            createdAt: new Date().toISOString()
        };
        
        bookingsData.unshift(newBooking);
        saveData();
        
        AdminCore.logActivity('add_booking', `Thêm booking thủ công cho ${newBooking.name}`);
        AdminCore.showToast('Thêm lịch đặt thành công', 'success');
        
        document.getElementById('modal-booking-add').classList.add('hidden');
        renderTable();
        updateStats();
    }
    
    function exportCSV() {
        if (bookingsData.length === 0) {
            AdminCore.showToast('Không có dữ liệu để xuất', 'warning');
            return;
        }
        
        const headers = ['ID', 'Tên', 'SĐT', 'Social', 'Dịch vụ', 'Thợ xỏ', 'Ngày', 'Giờ', 'Trạng thái', 'Ghi chú', 'Ghi chú nội bộ'];
        
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += headers.join(',') + "\r\n";
        
        bookingsData.forEach(b => {
            const row = [
                b.id,
                `"${(b.name || '').replace(/"/g, '""')}"`,
                `"${(b.phone || '').replace(/"/g, '""')}"`,
                `"${(b.social || '').replace(/"/g, '""')}"`,
                `"${(b.service || '').replace(/"/g, '""')}"`,
                `"${(b.piercer || '').replace(/"/g, '""')}"`,
                b.date,
                b.time,
                b.status,
                `"${(b.notes || '').replace(/"/g, '""')}"`,
                `"${(b.internalNotes || '').replace(/"/g, '""')}"`
            ];
            csvContent += row.join(',') + "\r\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `bookings_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        AdminCore.logActivity('export_bookings', 'Xuất file CSV danh sách lịch đặt');
    }
})();
