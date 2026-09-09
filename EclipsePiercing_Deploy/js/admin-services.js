// Services Manager
(function() {
    'use strict';
    
    let services = [];
    let currentFilter = 'all';
    
    // Check auth on page load
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.AdminCore || !window.AdminCore.checkAuth()) return;
        
        init();
    });
    
    function init() {
        // Render sidebar with active page
        window.AdminCore.renderSidebar('services');
        
        // Load data
        loadServices();
        
        // Bind events
        bindEvents();
        
        // Initial render
        renderServices();
    }
    
    function loadServices() {
        services = window.AdminCore.getData('ep_services') || [];
    }
    
    function saveServices() {
        window.AdminCore.setData('ep_services', services);
    }
    
    function bindEvents() {
        // Filter tabs
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                filterBtns.forEach(b => {
                    b.classList.remove('text-gold', 'border-b-2', 'border-gold');
                    b.classList.add('text-grayLight', 'hover:text-white');
                });
                e.target.classList.remove('text-grayLight', 'hover:text-white');
                e.target.classList.add('text-gold', 'border-b-2', 'border-gold');
                
                currentFilter = e.target.dataset.filter;
                renderServices();
            });
        });
        
        // Modals
        document.getElementById('btn-add-service').addEventListener('click', () => openModal());
        document.getElementById('btn-empty-add').addEventListener('click', () => openModal());
        document.getElementById('btn-close-modal').addEventListener('click', closeModal);
        document.getElementById('btn-cancel').addEventListener('click', closeModal);
        
        // Form submit
        document.getElementById('service-form').addEventListener('submit', handleSaveService);
    }
    
    function renderServices() {
        const grid = document.getElementById('services-grid');
        const emptyState = document.getElementById('services-empty');
        
        // Filter
        let filteredServices = services;
        if (currentFilter !== 'all') {
            filteredServices = services.filter(s => s.category === currentFilter);
        }
        
        if (filteredServices.length === 0) {
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }
        
        grid.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
        grid.innerHTML = '';
        
        filteredServices.forEach((service, index) => {
            const card = document.createElement('div');
            card.className = 'bg-grayDark/30 border border-grayDark/50 backdrop-blur-sm rounded-2xl p-5 flex flex-col h-full';
            
            // Pain dots
            let painHtml = '';
            for(let i=0; i<5; i++) {
                if (i < Math.ceil(service.pain / 2)) {
                    painHtml += '<i class="fa-solid fa-circle text-gold text-[10px] mx-[2px]"></i>';
                } else {
                    painHtml += '<i class="fa-solid fa-circle text-grayMid text-[10px] mx-[2px]"></i>';
                }
            }
            
            const badgeHtml = service.badge ? `<span class="bg-gold/20 text-gold text-xs font-semibold px-2 py-1 rounded absolute top-5 right-5">${service.badge}</span>` : '';
            
            const isVisible = service.visible !== false;
            
            card.innerHTML = `
                <div class="relative flex-grow">
                    ${badgeHtml}
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-grayLight text-sm uppercase tracking-wider">${getCategoryName(service.category)}</span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2 ${!isVisible ? 'opacity-50' : ''}">${service.nameVn}</h3>
                    <p class="text-grayLight text-sm mb-4 line-clamp-2 ${!isVisible ? 'opacity-50' : ''}">${service.description}</p>
                    
                    <div class="flex flex-col gap-2 mb-4">
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-grayLight">Mức độ đau:</span>
                            <div class="flex">${painHtml}</div>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-grayLight">Thời gian lành:</span>
                            <span class="text-white">${service.healing}</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-grayMid">
                    <div class="flex items-center gap-2">
                        <button class="btn-toggle-vis text-xl ${isVisible ? 'text-gold' : 'text-grayMid'}" data-id="${service.id}" title="${isVisible ? 'Đang hiển thị' : 'Đã ẩn'}">
                            <i class="fa-solid ${isVisible ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                        </button>
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <button class="btn-move-up text-grayLight hover:text-white p-2" data-index="${index}" title="Lên" ${index === 0 ? 'disabled class="opacity-30"' : ''}>
                            <i class="fa-solid fa-arrow-up"></i>
                        </button>
                        <button class="btn-move-down text-grayLight hover:text-white p-2" data-index="${index}" title="Xuống" ${index === filteredServices.length - 1 ? 'disabled class="opacity-30"' : ''}>
                            <i class="fa-solid fa-arrow-down"></i>
                        </button>
                        <div class="w-px h-4 bg-grayMid mx-1"></div>
                        <button class="btn-edit text-grayLight hover:text-gold p-2 transition-colors" data-id="${service.id}">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-delete text-grayLight hover:text-red-500 p-2 transition-colors" data-id="${service.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
        
        // Bind dynamic buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => editService(e.currentTarget.dataset.id));
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => deleteService(e.currentTarget.dataset.id));
        });
        
        document.querySelectorAll('.btn-toggle-vis').forEach(btn => {
            btn.addEventListener('click', (e) => toggleVisibility(e.currentTarget.dataset.id));
        });
        
        document.querySelectorAll('.btn-move-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(e.currentTarget.disabled) return;
                const idx = parseInt(e.currentTarget.dataset.index);
                moveService(idx, -1);
            });
        });
        
        document.querySelectorAll('.btn-move-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(e.currentTarget.disabled) return;
                const idx = parseInt(e.currentTarget.dataset.index);
                moveService(idx, 1);
            });
        });
    }
    
    function getCategoryName(cat) {
        const names = {
            'ear': 'Xỏ Tai',
            'face': 'Xỏ Mặt',
            'body': 'Xỏ Cơ Thể'
        };
        return names[cat] || cat;
    }
    
    function openModal(service = null) {
        const modal = document.getElementById('service-modal');
        const form = document.getElementById('service-form');
        const title = document.getElementById('modal-title');
        
        form.reset();
        
        if (service) {
            title.textContent = 'Sửa dịch vụ';
            document.getElementById('service-id').value = service.id;
            document.getElementById('service-name-vn').value = service.nameVn;
            document.getElementById('service-name-en').value = service.nameEn || '';
            document.getElementById('service-description').value = service.description;
            document.getElementById('service-category').value = service.category;
            document.getElementById('service-badge').value = service.badge || '';
            document.getElementById('service-pain').value = service.pain;
            document.getElementById('service-healing').value = service.healing;
            document.getElementById('service-visibility').checked = service.visible !== false;
        } else {
            title.textContent = 'Thêm dịch vụ mới';
            document.getElementById('service-id').value = '';
            document.getElementById('service-visibility').checked = true;
        }
        
        modal.classList.remove('hidden');
    }
    
    function closeModal() {
        document.getElementById('service-modal').classList.add('hidden');
    }
    
    function handleSaveService(e) {
        e.preventDefault();
        
        const id = document.getElementById('service-id').value;
        const serviceData = {
            id: id || window.AdminCore.generateId(),
            nameVn: document.getElementById('service-name-vn').value.trim(),
            nameEn: document.getElementById('service-name-en').value.trim(),
            description: document.getElementById('service-description').value.trim(),
            category: document.getElementById('service-category').value,
            badge: document.getElementById('service-badge').value.trim(),
            pain: parseInt(document.getElementById('service-pain').value),
            healing: document.getElementById('service-healing').value.trim(),
            visible: document.getElementById('service-visibility').checked
        };
        
        if (id) {
            const index = services.findIndex(s => s.id === id);
            if (index !== -1) {
                services[index] = serviceData;
                window.AdminCore.logActivity('update', \`Cập nhật dịch vụ: \${serviceData.nameVn}\`);
                window.AdminCore.showToast('Đã cập nhật dịch vụ', 'success');
            }
        } else {
            services.push(serviceData);
            window.AdminCore.logActivity('create', \`Thêm dịch vụ mới: \${serviceData.nameVn}\`);
            window.AdminCore.showToast('Đã thêm dịch vụ', 'success');
        }
        
        saveServices();
        renderServices();
        closeModal();
    }
    
    function editService(id) {
        const service = services.find(s => s.id === id);
        if (service) {
            openModal(service);
        }
    }
    
    function deleteService(id) {
        const service = services.find(s => s.id === id);
        if (!service) return;
        
        window.AdminCore.showConfirm(\`Bạn có chắc chắn muốn xóa dịch vụ "\${service.nameVn}"?\`, () => {
            services = services.filter(s => s.id !== id);
            saveServices();
            window.AdminCore.logActivity('delete', \`Xóa dịch vụ: \${service.nameVn}\`);
            window.AdminCore.showToast('Đã xóa dịch vụ', 'success');
            renderServices();
        });
    }
    
    function toggleVisibility(id) {
        const service = services.find(s => s.id === id);
        if (service) {
            service.visible = service.visible === false ? true : false;
            saveServices();
            window.AdminCore.logActivity('update', \`Đổi trạng thái dịch vụ: \${service.nameVn}\`);
            renderServices();
        }
    }
    
    function moveService(index, direction) {
        // Find actual index in full array if filtered
        let actualIndex = index;
        if (currentFilter !== 'all') {
            const filteredServices = services.filter(s => s.category === currentFilter);
            const serviceId = filteredServices[index].id;
            actualIndex = services.findIndex(s => s.id === serviceId);
        }
        
        const newIndex = actualIndex + direction;
        
        if (newIndex >= 0 && newIndex < services.length) {
            // Swap
            const temp = services[actualIndex];
            services[actualIndex] = services[newIndex];
            services[newIndex] = temp;
            
            saveServices();
            renderServices();
        }
    }
})();
