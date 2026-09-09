// Gallery Manager
(function() {
    'use strict';
    
    let gallery = [];
    let selectedIds = new Set();
    
    // Check auth on page load
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.AdminCore || !window.AdminCore.checkAuth()) return;
        
        init();
    });
    
    function init() {
        // Render sidebar
        window.AdminCore.renderSidebar('gallery');
        
        // Load data
        loadGallery();
        
        // Bind events
        bindEvents();
        
        // Initial render
        renderGallery();
        updateStats();
    }
    
    function loadGallery() {
        gallery = window.AdminCore.getData('ep_gallery') || [];
    }
    
    function saveGallery() {
        window.AdminCore.setData('ep_gallery', gallery);
    }
    
    function bindEvents() {
        // Modal
        document.getElementById('btn-add-image').addEventListener('click', () => openModal());
        document.getElementById('btn-empty-add').addEventListener('click', () => openModal());
        document.getElementById('btn-close-modal').addEventListener('click', closeModal);
        document.getElementById('btn-cancel').addEventListener('click', closeModal);
        document.getElementById('image-form').addEventListener('submit', handleSaveImage);
        
        // URL preview
        document.getElementById('image-url').addEventListener('input', (e) => {
            const url = e.target.value.trim();
            const previewContainer = document.getElementById('image-preview-container');
            const previewImg = document.getElementById('image-preview');
            
            if (url) {
                previewImg.src = url;
                previewContainer.classList.remove('hidden');
                // Auto-fill alt if empty
                const altInput = document.getElementById('image-alt');
                if (!altInput.value) {
                    altInput.value = url.split('/').pop().split('.')[0].replace(/[-_]/g, ' ');
                }
            } else {
                previewContainer.classList.add('hidden');
            }
        });
        
        // Filters & Search
        document.getElementById('filter-category').addEventListener('change', renderGallery);
        document.getElementById('search-input').addEventListener('input', renderGallery);
        
        // Bulk actions
        document.getElementById('btn-cancel-selection').addEventListener('click', () => {
            selectedIds.clear();
            updateBulkActions();
            renderGallery();
        });
        
        document.getElementById('btn-bulk-delete').addEventListener('click', handleBulkDelete);
        
        // Lightbox
        document.getElementById('btn-close-lightbox').addEventListener('click', () => {
            document.getElementById('lightbox').classList.add('hidden');
        });
        document.getElementById('lightbox').addEventListener('click', (e) => {
            if(e.target.id === 'lightbox') {
                e.target.classList.add('hidden');
            }
        });
    }
    
    function renderGallery() {
        const grid = document.getElementById('gallery-grid');
        const emptyState = document.getElementById('gallery-empty');
        const categoryFilter = document.getElementById('filter-category').value;
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        
        // Filter
        let filtered = gallery;
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(img => img.category === categoryFilter);
        }
        if (searchTerm) {
            filtered = filtered.filter(img => img.alt.toLowerCase().includes(searchTerm) || (img.caption && img.caption.toLowerCase().includes(searchTerm)));
        }
        
        if (filtered.length === 0) {
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            // Update empty message based on filter
            if (gallery.length > 0) {
                emptyState.querySelector('h3').textContent = 'Không tìm thấy ảnh nào';
                emptyState.querySelector('p').textContent = 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm';
                emptyState.querySelector('button').classList.add('hidden');
            } else {
                emptyState.querySelector('h3').textContent = 'Chưa có ảnh nào';
                emptyState.querySelector('p').textContent = 'Thêm ảnh vào thư viện để khách hàng có thể tham khảo';
                emptyState.querySelector('button').classList.remove('hidden');
            }
            return;
        }
        
        grid.classList.remove('hidden');
        emptyState.classList.add('hidden');
        grid.innerHTML = '';
        
        filtered.forEach(img => {
            const isSelected = selectedIds.has(img.id);
            const isVisible = img.visible !== false;
            
            const card = document.createElement('div');
            card.className = \`gallery-item relative aspect-square rounded-xl overflow-hidden border-2 transition-all \${isSelected ? 'border-gold' : 'border-grayMid'} \${!isVisible ? 'opacity-50' : ''}\`;
            
            card.innerHTML = \`
                <img src="\${img.url}" alt="\${img.alt}" class="w-full h-full object-cover">
                
                <!-- Checkbox -->
                <div class="absolute top-2 left-2 z-10">
                    <input type="checkbox" class="w-5 h-5 accent-gold cursor-pointer image-checkbox" data-id="\${img.id}" \${isSelected ? 'checked' : ''}>
                </div>
                
                <!-- Visibility indicator if hidden -->
                \${!isVisible ? \`<div class="absolute top-2 right-2 bg-black/60 text-white p-1 rounded z-10"><i class="fa-solid fa-eye-slash"></i></div>\` : ''}
                
                <!-- Hover Overlay -->
                <div class="gallery-overlay absolute inset-0 bg-black/70 opacity-0 transition-opacity flex flex-col justify-between p-3">
                    <div class="text-white text-sm font-medium line-clamp-2 mt-6">
                        \${img.alt}
                    </div>
                    
                    <div class="flex justify-between items-center mt-auto">
                        <button class="btn-preview text-white hover:text-gold p-1" data-id="\${img.id}" title="Xem lớn">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                        <div class="flex gap-2">
                            <button class="btn-edit text-white hover:text-gold p-1" data-id="\${img.id}" title="Sửa">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn-delete text-white hover:text-red-500 p-1" data-id="\${img.id}" title="Xóa">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            \`;
            
            grid.appendChild(card);
        });
        
        // Bind dynamic events
        document.querySelectorAll('.image-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                if (e.target.checked) {
                    selectedIds.add(id);
                } else {
                    selectedIds.delete(id);
                }
                updateBulkActions();
                
                // Visual update for card border
                const card = e.target.closest('.gallery-item');
                if (e.target.checked) {
                    card.classList.replace('border-grayMid', 'border-gold');
                } else {
                    card.classList.replace('border-gold', 'border-grayMid');
                }
            });
        });
        
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => editImage(e.currentTarget.dataset.id));
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => deleteImage(e.currentTarget.dataset.id));
        });
        
        document.querySelectorAll('.btn-preview').forEach(btn => {
            btn.addEventListener('click', (e) => previewImage(e.currentTarget.dataset.id));
        });
    }
    
    function updateStats() {
        document.getElementById('stat-total').textContent = gallery.length;
        const visibleCount = gallery.filter(img => img.visible !== false).length;
        document.getElementById('stat-visible').textContent = visibleCount;
    }
    
    function updateBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        const countSpan = document.getElementById('selected-count');
        
        if (selectedIds.size > 0) {
            bulkActions.classList.remove('hidden');
            countSpan.textContent = selectedIds.size;
        } else {
            bulkActions.classList.add('hidden');
        }
    }
    
    function openModal(img = null) {
        const modal = document.getElementById('image-modal');
        const form = document.getElementById('image-form');
        const title = document.getElementById('modal-title');
        const previewContainer = document.getElementById('image-preview-container');
        
        form.reset();
        
        if (img) {
            title.textContent = 'Sửa ảnh';
            document.getElementById('image-id').value = img.id;
            document.getElementById('image-url').value = img.url;
            document.getElementById('image-alt').value = img.alt;
            document.getElementById('image-caption').value = img.caption || '';
            document.getElementById('image-category').value = img.category;
            document.getElementById('image-visibility').checked = img.visible !== false;
            
            document.getElementById('image-preview').src = img.url;
            previewContainer.classList.remove('hidden');
        } else {
            title.textContent = 'Thêm ảnh mới';
            document.getElementById('image-id').value = '';
            document.getElementById('image-visibility').checked = true;
            previewContainer.classList.add('hidden');
        }
        
        modal.classList.remove('hidden');
    }
    
    function closeModal() {
        document.getElementById('image-modal').classList.add('hidden');
    }
    
    function handleSaveImage(e) {
        e.preventDefault();
        
        const id = document.getElementById('image-id').value;
        const imgData = {
            id: id || window.AdminCore.generateId(),
            url: document.getElementById('image-url').value.trim(),
            alt: document.getElementById('image-alt').value.trim(),
            caption: document.getElementById('image-caption').value.trim(),
            category: document.getElementById('image-category').value,
            visible: document.getElementById('image-visibility').checked,
            addedAt: id ? undefined : new Date().toISOString()
        };
        
        if (id) {
            const index = gallery.findIndex(img => img.id === id);
            if (index !== -1) {
                // Preserve addedAt
                imgData.addedAt = gallery[index].addedAt;
                gallery[index] = imgData;
                window.AdminCore.logActivity('update', \`Cập nhật ảnh thư viện\`);
                window.AdminCore.showToast('Đã cập nhật ảnh', 'success');
            }
        } else {
            gallery.unshift(imgData); // Add to beginning
            window.AdminCore.logActivity('create', \`Thêm ảnh mới vào thư viện\`);
            window.AdminCore.showToast('Đã thêm ảnh', 'success');
        }
        
        saveGallery();
        renderGallery();
        updateStats();
        closeModal();
    }
    
    function editImage(id) {
        const img = gallery.find(i => i.id === id);
        if (img) {
            openModal(img);
        }
    }
    
    function deleteImage(id) {
        window.AdminCore.showConfirm(\`Bạn có chắc chắn muốn xóa ảnh này?\`, () => {
            gallery = gallery.filter(img => img.id !== id);
            selectedIds.delete(id); // Remove from selection if there
            
            saveGallery();
            window.AdminCore.logActivity('delete', \`Xóa ảnh khỏi thư viện\`);
            window.AdminCore.showToast('Đã xóa ảnh', 'success');
            
            updateBulkActions();
            renderGallery();
            updateStats();
        });
    }
    
    function handleBulkDelete() {
        window.AdminCore.showConfirm(\`Bạn có chắc chắn muốn xóa \${selectedIds.size} ảnh đã chọn?\`, () => {
            gallery = gallery.filter(img => !selectedIds.has(img.id));
            
            window.AdminCore.logActivity('delete', \`Xóa hàng loạt \${selectedIds.size} ảnh\`);
            window.AdminCore.showToast(\`Đã xóa \${selectedIds.size} ảnh\`, 'success');
            
            selectedIds.clear();
            saveGallery();
            
            updateBulkActions();
            renderGallery();
            updateStats();
        });
    }
    
    function previewImage(id) {
        const img = gallery.find(i => i.id === id);
        if (img) {
            const lightbox = document.getElementById('lightbox');
            document.getElementById('lightbox-img').src = img.url;
            document.getElementById('lightbox-caption').textContent = img.caption || img.alt;
            lightbox.classList.remove('hidden');
            lightbox.classList.add('flex');
        }
    }
})();
