// Posts Management Module
(function() {
    'use strict';
    
    // Check auth on page load
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof AdminCore === 'undefined') {
            console.error('AdminCore is required');
            return;
        }
        
        if (AdminCore.checkAuth && !AdminCore.checkAuth()) return;
        
        initMockData();

        const isEditor = window.location.pathname.includes('post-editor.html');
        if (isEditor) {
            initEditor();
        } else {
            initList();
        }
    });

    function initMockData() {
        let posts = AdminCore.getData('ep_posts');
        if (!posts || posts.length === 0) {
            const mock = [
                {
                    id: AdminCore.generateId ? AdminCore.generateId() : '1',
                    title: 'Cách chăm sóc khuyên tai sau khi xỏ',
                    slug: 'cach-cham-soc-khuyen-tai',
                    content: '<p>Nội dung bài viết chăm sóc...</p>',
                    excerpt: 'Hướng dẫn chi tiết cách vệ sinh và chăm sóc.',
                    featuredImage: 'https://images.unsplash.com/photo-1590483866162-8e100c5bc6b5?q=80&w=300&auto=format&fit=crop',
                    category: 'Cham-soc',
                    tags: ['chăm sóc', 'khuyên tai'],
                    status: 'published',
                    seo: { metaTitle: 'Cách chăm sóc khuyên tai an toàn', metaDescription: 'Hướng dẫn chi tiết cách vệ sinh và chăm sóc khuyên tai an toàn tại nhà' },
                    author: 'Admin',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    publishedAt: new Date().toISOString()
                }
            ];
            AdminCore.setData('ep_posts', mock);
        }
    }
    
    // --- LIST PAGE ---
    let allPosts = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    
    function initList() {
        const tbody = document.getElementById('posts-tbody');
        if (!tbody) return;

        if (AdminCore.renderSidebar) AdminCore.renderSidebar('posts');
        
        loadPosts();
        renderTable();
        
        // Event listeners
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            currentPage = 1;
            renderTable();
        });
        
        document.getElementById('filter-status')?.addEventListener('change', (e) => {
            currentPage = 1;
            renderTable();
        });
        
        document.getElementById('select-all')?.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.post-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });
    }

    function loadPosts() {
        allPosts = AdminCore.getData('ep_posts') || [];
    }
    
    function renderTable() {
        const tbody = document.getElementById('posts-tbody');
        const emptyState = document.getElementById('empty-state');
        const paginationContainer = document.getElementById('pagination-container');
        
        const searchTerm = (document.getElementById('search-input')?.value || '').toLowerCase();
        const filterStatus = document.getElementById('filter-status')?.value || 'all';
        
        let filtered = allPosts.filter(post => {
            const matchSearch = post.title.toLowerCase().includes(searchTerm) || (post.category && post.category.toLowerCase().includes(searchTerm));
            const matchStatus = filterStatus === 'all' || post.status === filterStatus;
            return matchSearch && matchStatus;
        });
        
        // Sort newest first
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (filtered.length === 0) {
            tbody.innerHTML = '';
            tbody.parentElement.classList.add('hidden');
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
            paginationContainer.classList.add('hidden');
            return;
        }
        
        tbody.parentElement.classList.remove('hidden');
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
        paginationContainer.classList.remove('hidden');
        
        // Pagination
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages || 1;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const pagedData = filtered.slice(startIndex, startIndex + itemsPerPage);
        
        document.getElementById('pagination-info').innerText = `Hiển thị ${startIndex + 1} đến ${Math.min(startIndex + itemsPerPage, filtered.length)} của ${filtered.length} bài viết`;
        
        renderPagination(totalPages);
        
        tbody.innerHTML = '';
        pagedData.forEach(post => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-grayDark/50 hover:bg-grayDark/20 transition-colors';
            
            const catMap = {
                'Kien-thuc': 'Kiến thức',
                'Tin-tuc': 'Tin tức',
                'Cham-soc': 'Chăm sóc',
                'Huong-dan': 'Hướng dẫn'
            };
            const catLabel = catMap[post.category] || post.category;
            
            const statusBadge = post.status === 'published' 
                ? '<span class="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Đã đăng</span>'
                : '<span class="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Nháp</span>';
            
            const dateStr = AdminCore.formatDate ? AdminCore.formatDate(post.createdAt) : new Date(post.createdAt).toLocaleDateString('vi-VN');

            tr.innerHTML = `
                <td class="p-4 text-center">
                    <input type="checkbox" class="post-checkbox rounded border-grayDark bg-dark accent-gold w-4 h-4 cursor-pointer" value="${post.id}">
                </td>
                <td class="p-4">
                    <div class="font-medium text-white truncate max-w-[200px] sm:max-w-xs" title="${post.title}">${post.title}</div>
                    <div class="text-xs text-grayLight mt-1 truncate max-w-[200px]">${post.slug}</div>
                </td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 text-sm">${catLabel}</td>
                <td class="p-4 text-sm">${dateStr}</td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <a href="post-editor.html?id=${post.id}" class="w-8 h-8 rounded bg-grayDark hover:bg-gold hover:text-dark transition-colors flex items-center justify-center text-grayLight" title="Sửa">
                            <i class="fa-solid fa-pen"></i>
                        </a>
                        <button onclick="AdminPosts.duplicatePost('${post.id}')" class="w-8 h-8 rounded bg-grayDark hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center text-grayLight" title="Nhân bản">
                            <i class="fa-solid fa-copy"></i>
                        </button>
                        <button onclick="AdminPosts.deletePost('${post.id}')" class="w-8 h-8 rounded bg-grayDark hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center text-grayLight" title="Xóa">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    function renderPagination(totalPages) {
        const controls = document.getElementById('pagination-controls');
        controls.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const prevBtn = document.createElement('button');
        prevBtn.className = `w-8 h-8 rounded flex items-center justify-center ${currentPage === 1 ? 'text-grayMid cursor-not-allowed' : 'text-grayLight hover:bg-grayDark hover:text-white'}`;
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderTable(); } };
        controls.appendChild(prevBtn);
        
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = `w-8 h-8 rounded flex items-center justify-center text-sm ${currentPage === i ? 'bg-gold text-dark font-medium' : 'text-grayLight hover:bg-grayDark hover:text-white'}`;
            btn.innerText = i;
            btn.onclick = () => { currentPage = i; renderTable(); };
            controls.appendChild(btn);
        }
        
        const nextBtn = document.createElement('button');
        nextBtn.className = `w-8 h-8 rounded flex items-center justify-center ${currentPage === totalPages ? 'text-grayMid cursor-not-allowed' : 'text-grayLight hover:bg-grayDark hover:text-white'}`;
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderTable(); } };
        controls.appendChild(nextBtn);
    }
    
    // --- EDITOR PAGE ---
    let quill;
    let currentPostId = null;
    let autoSaveInterval;
    
    function initEditor() {
        if (AdminCore.renderSidebar) AdminCore.renderSidebar('posts');
        
        // Init Quill
        quill = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'Viết nội dung bài viết ở đây...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'align': [] }],
                    ['link', 'image', 'video'],
                    ['clean']
                ]
            }
        });

        // Load data if editing
        const urlParams = new URLSearchParams(window.location.search);
        currentPostId = urlParams.get('id');
        
        if (currentPostId) {
            document.getElementById('page-title-display').innerText = 'Chỉnh sửa bài viết';
            loadPostData(currentPostId);
        }
        
        setupEditorEvents();
        
        // Auto save every 30 seconds
        autoSaveInterval = setInterval(autoSave, 30000);
    }
    
    function loadPostData(id) {
        const posts = AdminCore.getData('ep_posts') || [];
        const post = posts.find(p => p.id === id);
        
        if (post) {
            document.getElementById('post-title').value = post.title || '';
            document.getElementById('post-slug').value = post.slug || '';
            document.getElementById('post-excerpt').value = post.excerpt || '';
            document.getElementById('post-status').value = post.status || 'draft';
            document.getElementById('post-category').value = post.category || 'Kien-thuc';
            document.getElementById('post-tags').value = (post.tags || []).join(', ');
            document.getElementById('post-image-url').value = post.featuredImage || '';
            
            if (post.seo) {
                document.getElementById('seo-title').value = post.seo.metaTitle || '';
                document.getElementById('seo-desc').value = post.seo.metaDescription || '';
            }
            
            if (post.content) {
                quill.root.innerHTML = post.content;
            }
            
            updateImagePreview();
            updateSEO();
        }
    }
    
    function setupEditorEvents() {
        const titleInput = document.getElementById('post-title');
        const slugInput = document.getElementById('post-slug');
        const imgInput = document.getElementById('post-image-url');
        const form = document.getElementById('post-form');
        const seoTitle = document.getElementById('seo-title');
        const seoDesc = document.getElementById('seo-desc');
        
        titleInput.addEventListener('input', () => {
            if (!currentPostId || slugInput.value === '') {
                slugInput.value = AdminCore.slugify ? AdminCore.slugify(titleInput.value) : titleInput.value.toLowerCase().replace(/\s+/g, '-');
            }
            updateSEO();
        });
        
        imgInput.addEventListener('input', updateImagePreview);
        
        seoTitle.addEventListener('input', updateSEO);
        seoDesc.addEventListener('input', updateSEO);
        quill.on('text-change', updateSEO);
        
        document.getElementById('btn-save-draft').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('post-status').value = 'draft';
            savePost(false);
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            document.getElementById('post-status').value = 'published';
            savePost(true);
        });

        document.getElementById('btn-preview')?.addEventListener('click', () => {
            savePost(false);
            AdminCore.showToast && AdminCore.showToast('Chức năng xem trước đang được phát triển', 'info');
        });
    }
    
    function updateImagePreview() {
        const url = document.getElementById('post-image-url').value;
        const preview = document.getElementById('image-preview');
        if (url) {
            preview.innerHTML = `<img src="${url}" alt="Preview" class="w-full h-full object-cover">`;
        } else {
            preview.innerHTML = `<span class="text-grayLight text-sm"><i class="fa-regular fa-image text-2xl mb-1 block text-center"></i>Chưa có ảnh</span>`;
        }
        updateSEO();
    }
    
    function updateSEO() {
        const title = document.getElementById('post-title').value;
        const seoTitle = document.getElementById('seo-title').value || title;
        const seoDesc = document.getElementById('seo-desc').value;
        const content = quill.getText().trim();
        const wordCount = content.length > 0 ? content.split(/\s+/).length : 0;
        const imgUrl = document.getElementById('post-image-url').value;
        const slug = document.getElementById('post-slug').value;
        
        // Update counts
        document.getElementById('seo-title-count').innerText = `${seoTitle.length}/60`;
        document.getElementById('seo-title-count').className = seoTitle.length >= 50 && seoTitle.length <= 60 ? 'text-green-500' : 'text-grayLight';
        
        document.getElementById('seo-desc-count').innerText = `${seoDesc.length}/160`;
        document.getElementById('seo-desc-count').className = seoDesc.length >= 120 && seoDesc.length <= 160 ? 'text-green-500' : 'text-grayLight';
        
        // Update SERP
        document.getElementById('serp-title').innerText = seoTitle || 'Tiêu đề SEO';
        document.getElementById('serp-desc').innerText = seoDesc || 'Mô tả SEO sẽ hiển thị ở đây...';
        document.getElementById('serp-slug').innerText = slug || 'duong-dan';
        
        // Calc Score
        let score = 0;
        const checks = [
            { cond: seoTitle.length >= 50 && seoTitle.length <= 60, text: 'Tiêu đề SEO (50-60 ký tự)', points: 25 },
            { cond: seoDesc.length >= 120 && seoDesc.length <= 160, text: 'Mô tả SEO (120-160 ký tự)', points: 25 },
            { cond: imgUrl.length > 5, text: 'Có ảnh đại diện', points: 25 },
            { cond: wordCount >= 300, text: 'Nội dung đủ dài (>300 từ)', points: 25 }
        ];
        
        const checklistEl = document.getElementById('seo-checklist');
        checklistEl.innerHTML = '';
        
        checks.forEach(check => {
            if (check.cond) score += check.points;
            
            const li = document.createElement('li');
            li.className = check.cond ? 'text-green-400' : 'text-red-400';
            li.innerHTML = `<i class="fa-solid ${check.cond ? 'fa-check' : 'fa-xmark'} w-4"></i> ${check.text}`;
            checklistEl.appendChild(li);
        });
        
        const scoreEl = document.getElementById('seo-score-text');
        scoreEl.innerText = `${score}/100`;
        if (score >= 80) scoreEl.className = 'text-green-500';
        else if (score >= 50) scoreEl.className = 'text-yellow-500';
        else scoreEl.className = 'text-red-500';
    }
    
    function getPostData() {
        const tagsVal = document.getElementById('post-tags').value;
        const tags = tagsVal ? tagsVal.split(',').map(t => t.trim()).filter(t => t) : [];
        
        return {
            id: currentPostId || (AdminCore.generateId ? AdminCore.generateId() : Date.now().toString()),
            title: document.getElementById('post-title').value,
            slug: document.getElementById('post-slug').value,
            content: quill.root.innerHTML,
            excerpt: document.getElementById('post-excerpt').value,
            featuredImage: document.getElementById('post-image-url').value,
            category: document.getElementById('post-category').value,
            tags: tags,
            status: document.getElementById('post-status').value,
            seo: {
                metaTitle: document.getElementById('seo-title').value,
                metaDescription: document.getElementById('seo-desc').value
            },
            author: (AdminCore.getCurrentUser && AdminCore.getCurrentUser()) ? AdminCore.getCurrentUser().name : 'Admin',
            updatedAt: new Date().toISOString()
        };
    }
    
    function savePost(redirect = false, isAuto = false) {
        const title = document.getElementById('post-title').value.trim();
        if (!title && !isAuto) {
            if (AdminCore.showToast) AdminCore.showToast('Vui lòng nhập tiêu đề bài viết', 'error');
            return;
        }
        if (!title && isAuto) return; // don't auto-save empty posts
        
        const postData = getPostData();
        let posts = AdminCore.getData('ep_posts') || [];
        
        if (!currentPostId) {
            postData.createdAt = new Date().toISOString();
            if (postData.status === 'published') postData.publishedAt = postData.createdAt;
            posts.push(postData);
            currentPostId = postData.id;
            
            // Update URL without reload
            const url = new URL(window.location);
            url.searchParams.set('id', currentPostId);
            window.history.pushState({}, '', url);
            document.getElementById('page-title-display').innerText = 'Chỉnh sửa bài viết';
        } else {
            const index = posts.findIndex(p => p.id === currentPostId);
            if (index !== -1) {
                if (!posts[index].createdAt) postData.createdAt = new Date().toISOString();
                else postData.createdAt = posts[index].createdAt;
                
                if (postData.status === 'published' && posts[index].status !== 'published') {
                    postData.publishedAt = new Date().toISOString();
                } else {
                    postData.publishedAt = posts[index].publishedAt;
                }
                
                posts[index] = postData;
            } else {
                postData.createdAt = new Date().toISOString();
                posts.push(postData);
            }
        }
        
        AdminCore.setData('ep_posts', posts);
        
        if (isAuto) {
            const statusEl = document.getElementById('auto-save-status');
            const now = new Date();
            statusEl.innerHTML = `<i class="fa-solid fa-check text-green-500 mr-1"></i>Đã lưu lúc ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            statusEl.classList.remove('hidden');
        } else {
            if (AdminCore.showToast) AdminCore.showToast('Lưu bài viết thành công!', 'success');
            if (AdminCore.logActivity) AdminCore.logActivity(postData.status === 'published' ? 'Đăng bài viết' : 'Lưu nháp', `Bài viết: ${postData.title}`);
            if (redirect) {
                setTimeout(() => {
                    window.location.href = 'posts.html';
                }, 1000);
            }
        }
    }
    
    function autoSave() {
        if (document.getElementById('post-title').value.trim()) {
            savePost(false, true);
        }
    }
    
    // --- EXPORT GLOBALS FOR LIST PAGE ACTIONS ---
    window.AdminPosts = {
        deletePost: function(id) {
            if (AdminCore.showConfirm) {
                AdminCore.showConfirm('Bạn có chắc chắn muốn xóa bài viết này?', () => {
                    performDelete(id);
                });
            } else {
                if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
                    performDelete(id);
                }
            }
        },
        duplicatePost: function(id) {
            let posts = AdminCore.getData('ep_posts') || [];
            const original = posts.find(p => p.id === id);
            if (original) {
                const clone = JSON.parse(JSON.stringify(original));
                clone.id = AdminCore.generateId ? AdminCore.generateId() : Date.now().toString();
                clone.title = clone.title + ' (Bản sao)';
                clone.slug = clone.slug + '-ban-sao';
                clone.status = 'draft';
                clone.createdAt = new Date().toISOString();
                clone.updatedAt = new Date().toISOString();
                delete clone.publishedAt;
                
                posts.push(clone);
                AdminCore.setData('ep_posts', posts);
                if (AdminCore.showToast) AdminCore.showToast('Đã nhân bản bài viết', 'success');
                loadPosts();
                renderTable();
            }
        }
    };
    
    function performDelete(id) {
        let posts = AdminCore.getData('ep_posts') || [];
        const index = posts.findIndex(p => p.id === id);
        if (index !== -1) {
            const title = posts[index].title;
            posts.splice(index, 1);
            AdminCore.setData('ep_posts', posts);
            if (AdminCore.showToast) AdminCore.showToast('Đã xóa bài viết', 'success');
            if (AdminCore.logActivity) AdminCore.logActivity('Xóa bài viết', `Bài viết: ${title}`);
            loadPosts();
            renderTable();
        }
    }
})();
