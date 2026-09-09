// admin-users.js
(function() {
    'use strict';
    
    let users = [];
    const currentUser = AdminCore.getCurrentUser();
    
    document.addEventListener('DOMContentLoaded', () => {
        if (!AdminCore.checkAuth()) return;
        if (!AdminCore.checkRole('superadmin')) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        AdminCore.renderSidebar('users');
        init();
    });
    
    function init() {
        loadUsers();
        bindEvents();
    }
    
    function loadUsers() {
        users = AdminCore.getData('ep_users') || [];
        renderUsersTable();
    }
    
    function getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    
    function getRoleBadge(role) {
        switch(role) {
            case 'superadmin': return '<span class="px-2 py-1 rounded text-xs font-medium bg-gold/20 text-gold border border-gold/30">Superadmin</span>';
            case 'editor': return '<span class="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Editor</span>';
            case 'viewer':
            default: return '<span class="px-2 py-1 rounded text-xs font-medium bg-gray-500/20 text-grayLight border border-gray-500/30">Viewer</span>';
        }
    }
    
    function getStatusBadge(isActive) {
        if (isActive) return '<span class="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">Hoạt động</span>';
        return '<span class="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">Đã khóa</span>';
    }
    
    function renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-grayLight">Không có người dùng nào.</td></tr>`;
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr class="border-b border-grayMid/30 hover:bg-grayMid/20 transition-colors">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-dark border border-grayMid flex items-center justify-center text-white font-bold">
                            ${getInitials(user.displayName || user.username)}
                        </div>
                        <span class="font-medium text-white">${user.displayName || ''}</span>
                    </div>
                </td>
                <td class="p-4">${user.username}</td>
                <td class="p-4">${getRoleBadge(user.role)}</td>
                <td class="p-4">${getStatusBadge(user.isActive)}</td>
                <td class="p-4 text-sm">${user.lastLogin ? AdminCore.formatDate(user.lastLogin) : 'Chưa đăng nhập'}</td>
                <td class="p-4 text-right space-x-2">
                    <button class="text-blue-400 hover:text-blue-300 p-2 btn-edit-role" data-id="${user.id}" title="Đổi vai trò">
                        <i class="fa-solid fa-user-shield"></i>
                    </button>
                    <button class="text-gold hover:text-gold-light p-2 btn-change-pw" data-id="${user.id}" title="Đổi mật khẩu">
                        <i class="fa-solid fa-key"></i>
                    </button>
                    <button class="${user.isActive ? 'text-orange-400 hover:text-orange-300' : 'text-green-400 hover:text-green-300'} p-2 btn-toggle-lock" data-id="${user.id}" title="${user.isActive ? 'Khóa' : 'Mở khóa'}">
                        <i class="fa-solid ${user.isActive ? 'fa-lock' : 'fa-lock-open'}"></i>
                    </button>
                    <button class="text-red-400 hover:text-red-300 p-2 btn-delete" data-id="${user.id}" title="Xóa" ${user.id === currentUser.userId ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    function bindEvents() {
        const createBtn = document.getElementById('btn-create-user');
        const createModal = document.getElementById('create-user-modal');
        const closeModals = document.querySelectorAll('.close-modal');
        const createForm = document.getElementById('create-user-form');
        
        // Create modal
        createBtn?.addEventListener('click', () => {
            createModal.classList.remove('hidden');
            setTimeout(() => {
                createModal.classList.remove('opacity-0');
                createModal.querySelector('div').classList.remove('scale-95');
            }, 10);
        });
        
        closeModals.forEach(btn => {
            btn.addEventListener('click', () => {
                createModal.classList.add('opacity-0');
                createModal.querySelector('div').classList.add('scale-95');
                setTimeout(() => {
                    createModal.classList.add('hidden');
                    createForm.reset();
                }, 300);
            });
        });
        
        createForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            createUser();
        });
        
        // Edit Role
        const editRoleModal = document.getElementById('edit-role-modal');
        const closeRoleModals = document.querySelectorAll('.close-role-modal');
        const editRoleForm = document.getElementById('edit-role-form');
        
        closeRoleModals.forEach(btn => {
            btn.addEventListener('click', () => {
                editRoleModal.classList.add('opacity-0');
                editRoleModal.querySelector('div').classList.add('scale-95');
                setTimeout(() => editRoleModal.classList.add('hidden'), 300);
            });
        });
        
        editRoleForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            updateRole();
        });
        
        // Change Password
        const pwModal = document.getElementById('change-password-modal');
        const closePwModals = document.querySelectorAll('.close-pw-modal');
        const pwForm = document.getElementById('change-password-form');
        
        closePwModals.forEach(btn => {
            btn.addEventListener('click', () => {
                pwModal.classList.add('opacity-0');
                pwModal.querySelector('div').classList.add('scale-95');
                setTimeout(() => {
                    pwModal.classList.add('hidden');
                    pwForm.reset();
                }, 300);
            });
        });
        
        pwForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            updatePassword();
        });
        
        // Table actions delegation
        document.getElementById('users-table-body')?.addEventListener('click', (e) => {
            const btnEditRole = e.target.closest('.btn-edit-role');
            if (btnEditRole) {
                const id = btnEditRole.dataset.id;
                openRoleModal(id);
                return;
            }
            
            const btnChangePw = e.target.closest('.btn-change-pw');
            if (btnChangePw) {
                const id = btnChangePw.dataset.id;
                openPasswordModal(id);
                return;
            }
            
            const btnToggleLock = e.target.closest('.btn-toggle-lock');
            if (btnToggleLock) {
                const id = btnToggleLock.dataset.id;
                toggleUserLock(id);
                return;
            }
            
            const btnDelete = e.target.closest('.btn-delete');
            if (btnDelete && !btnDelete.disabled) {
                const id = btnDelete.dataset.id;
                deleteUser(id);
                return;
            }
        });
    }
    
    function createUser() {
        const username = document.getElementById('new-username').value.trim();
        const displayName = document.getElementById('new-display-name').value.trim();
        const password = document.getElementById('new-password').value;
        const confirm = document.getElementById('confirm-password').value;
        const role = document.getElementById('new-role').value;
        
        if (password !== confirm) {
            AdminCore.showToast('Mật khẩu xác nhận không khớp', 'error');
            return;
        }
        
        if (users.find(u => u.username === username)) {
            AdminCore.showToast('Tên đăng nhập đã tồn tại', 'error');
            return;
        }
        
        const newUser = {
            id: AdminCore.generateId(),
            username,
            displayName,
            password: AdminCore.hashPassword ? AdminCore.hashPassword(password) : btoa(password), // Fallback if hashPassword doesn't exist
            role,
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        users.push(newUser);
        AdminCore.setData('ep_users', users);
        AdminCore.logActivity('Tạo tài khoản', `Tài khoản: ${username}`);
        AdminCore.showToast('Đã tạo tài khoản thành công', 'success');
        
        document.querySelector('.close-modal').click();
        renderUsersTable();
    }
    
    function openRoleModal(id) {
        const user = users.find(u => u.id === id);
        if (!user) return;
        
        if (user.id === currentUser.userId && user.role === 'superadmin') {
            AdminCore.showToast('Không thể tự thay đổi quyền superadmin của chính mình', 'warning');
            return;
        }
        
        document.getElementById('edit-role-user-id').value = id;
        document.getElementById('edit-role-select').value = user.role;
        
        const modal = document.getElementById('edit-role-modal');
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('div').classList.remove('scale-95');
        }, 10);
    }
    
    function updateRole() {
        const id = document.getElementById('edit-role-user-id').value;
        const role = document.getElementById('edit-role-select').value;
        
        const index = users.findIndex(u => u.id === id);
        if (index > -1) {
            users[index].role = role;
            AdminCore.setData('ep_users', users);
            AdminCore.logActivity('Đổi vai trò', `Người dùng: ${users[index].username} -> ${role}`);
            AdminCore.showToast('Cập nhật vai trò thành công', 'success');
            
            document.querySelector('.close-role-modal').click();
            renderUsersTable();
        }
    }
    
    function openPasswordModal(id) {
        document.getElementById('edit-pw-user-id').value = id;
        
        const modal = document.getElementById('change-password-modal');
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('div').classList.remove('scale-95');
        }, 10);
    }
    
    function updatePassword() {
        const id = document.getElementById('edit-pw-user-id').value;
        const newPw = document.getElementById('edit-new-password').value;
        const confirm = document.getElementById('edit-confirm-password').value;
        
        if (newPw !== confirm) {
            AdminCore.showToast('Mật khẩu xác nhận không khớp', 'error');
            return;
        }
        
        const index = users.findIndex(u => u.id === id);
        if (index > -1) {
            users[index].password = AdminCore.hashPassword ? AdminCore.hashPassword(newPw) : btoa(newPw);
            AdminCore.setData('ep_users', users);
            AdminCore.logActivity('Đổi mật khẩu', `Người dùng: ${users[index].username}`);
            AdminCore.showToast('Đã đổi mật khẩu', 'success');
            
            document.querySelector('.close-pw-modal').click();
        }
    }
    
    function toggleUserLock(id) {
        if (id === currentUser.userId) {
            AdminCore.showToast('Không thể khóa chính mình', 'warning');
            return;
        }
        
        const index = users.findIndex(u => u.id === id);
        if (index > -1) {
            users[index].isActive = !users[index].isActive;
            AdminCore.setData('ep_users', users);
            
            const action = users[index].isActive ? 'Mở khóa' : 'Khóa';
            AdminCore.logActivity(`${action} tài khoản`, `Người dùng: ${users[index].username}`);
            AdminCore.showToast(`Đã ${action.toLowerCase()} tài khoản`, 'success');
            
            renderUsersTable();
        }
    }
    
    function deleteUser(id) {
        if (id === currentUser.userId) {
            AdminCore.showToast('Không thể xóa chính mình', 'error');
            return;
        }
        
        AdminCore.showConfirm('Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không thể hoàn tác.', () => {
            const user = users.find(u => u.id === id);
            users = users.filter(u => u.id !== id);
            AdminCore.setData('ep_users', users);
            
            AdminCore.logActivity('Xóa tài khoản', `Người dùng: ${user.username}`);
            AdminCore.showToast('Đã xóa tài khoản', 'success');
            renderUsersTable();
        });
    }
})();
