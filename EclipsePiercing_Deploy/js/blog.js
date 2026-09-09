/**
 * Eclipse Piercing — Blog Logic
 * Renders blog posts from localStorage on public blog pages
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'ep_posts';
    const POSTS_PER_PAGE = 9;
    const LOGO_URL = 'https://res.cloudinary.com/dmqg578zx/image/upload/f_auto,q_auto/ChatGPT_Image_13_32_42_4_thg_6_2026_efamgb';

    document.addEventListener('DOMContentLoaded', () => {
        // Detect which page we're on
        if (document.getElementById('blog-grid')) {
            initBlogList();
        } else if (document.getElementById('blog-post-content')) {
            initBlogPost();
        }
    });

    // ============================================================
    // Blog List Page
    // ============================================================
    function initBlogList() {
        const posts = getPublishedPosts();
        const grid = document.getElementById('blog-grid');
        const filterContainer = document.getElementById('category-filters');
        const postCount = document.getElementById('post-count');
        const emptyState = document.getElementById('blog-empty');
        const paginationEl = document.getElementById('blog-pagination');

        if (posts.length === 0) {
            grid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            if (paginationEl) paginationEl.style.display = 'none';
            return;
        }

        // Get URL params
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = parseInt(urlParams.get('page')) || 1;
        const currentCategory = urlParams.get('category') || 'all';

        // Render category filters
        if (filterContainer) {
            const categories = [...new Set(posts.map(p => p.category).filter(Boolean))];
            let filterHTML = `<button class="category-filter-btn ${currentCategory === 'all' ? 'active' : ''}" data-category="all">Tất cả</button>`;
            categories.forEach(cat => {
                filterHTML += `<button class="category-filter-btn ${currentCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>`;
            });
            filterContainer.innerHTML = filterHTML;

            filterContainer.querySelectorAll('.category-filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const cat = btn.dataset.category;
                    const params = new URLSearchParams(window.location.search);
                    if (cat === 'all') {
                        params.delete('category');
                    } else {
                        params.set('category', cat);
                    }
                    params.delete('page');
                    window.location.search = params.toString();
                });
            });
        }

        // Filter posts
        let filteredPosts = currentCategory === 'all' 
            ? posts 
            : posts.filter(p => p.category === currentCategory);

        if (postCount) {
            postCount.textContent = `${filteredPosts.length} bài viết`;
        }

        // Paginate
        const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
        const startIdx = (currentPage - 1) * POSTS_PER_PAGE;
        const pagePosts = filteredPosts.slice(startIdx, startIdx + POSTS_PER_PAGE);

        // Render posts
        grid.innerHTML = pagePosts.map(post => renderBlogCard(post)).join('');

        // Render pagination
        if (paginationEl && totalPages > 1) {
            let paginationHTML = '';
            if (currentPage > 1) {
                paginationHTML += `<a href="?page=${currentPage - 1}${currentCategory !== 'all' ? '&category=' + currentCategory : ''}" class="pagination-btn"><i class="fa-solid fa-chevron-left"></i></a>`;
            }
            for (let i = 1; i <= totalPages; i++) {
                paginationHTML += `<a href="?page=${i}${currentCategory !== 'all' ? '&category=' + currentCategory : ''}" class="pagination-btn ${i === currentPage ? 'active' : ''}">${i}</a>`;
            }
            if (currentPage < totalPages) {
                paginationHTML += `<a href="?page=${currentPage + 1}${currentCategory !== 'all' ? '&category=' + currentCategory : ''}" class="pagination-btn"><i class="fa-solid fa-chevron-right"></i></a>`;
            }
            paginationEl.innerHTML = paginationHTML;
        }
    }

    function renderBlogCard(post) {
        const excerpt = post.excerpt || stripHtml(post.content).substring(0, 150) + '...';
        const readTime = estimateReadTime(post.content);
        const date = formatDate(post.publishedAt || post.createdAt);
        const imageUrl = post.featuredImage || LOGO_URL;

        return `
            <article class="blog-card">
                <a href="blog-post.html?slug=${post.slug}">
                    <img src="${imageUrl}" alt="${post.title}" class="card-image" loading="lazy" onerror="this.src='${LOGO_URL}'">
                </a>
                <div class="card-body">
                    ${post.category ? `<span class="card-category">${post.category}</span>` : ''}
                    <h2 class="card-title">
                        <a href="blog-post.html?slug=${post.slug}">${post.title}</a>
                    </h2>
                    <p class="card-excerpt">${excerpt}</p>
                    <div class="card-meta">
                        <span>${date}</span>
                        <span class="read-time"><i class="fa-regular fa-clock"></i> ${readTime} phút đọc</span>
                    </div>
                </div>
            </article>
        `;
    }

    // ============================================================
    // Blog Post Page
    // ============================================================
    function initBlogPost() {
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');

        if (!slug) {
            show404();
            return;
        }

        const posts = getPublishedPosts();
        const post = posts.find(p => p.slug === slug);

        if (!post) {
            show404();
            return;
        }

        // Update page title
        document.title = (post.seo?.metaTitle || post.title) + ' | Eclipse Piercing Blog';

        // Update meta tags
        if (post.seo?.metaDescription) {
            setMeta('description', post.seo.metaDescription);
        }

        // Schema.org Article markup
        const articleSchema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post.excerpt || stripHtml(post.content).substring(0, 160),
            "image": post.featuredImage || LOGO_URL,
            "author": { "@type": "Person", "name": post.author || "Eclipse Piercing" },
            "publisher": {
                "@type": "Organization",
                "name": "Eclipse Piercing",
                "logo": { "@type": "ImageObject", "url": LOGO_URL }
            },
            "datePublished": post.publishedAt || post.createdAt,
            "dateModified": post.updatedAt || post.createdAt
        };
        const schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        schemaScript.textContent = JSON.stringify(articleSchema);
        document.head.appendChild(schemaScript);

        // Render post content
        const contentEl = document.getElementById('blog-post-content');
        const readTime = estimateReadTime(post.content);
        const date = formatDate(post.publishedAt || post.createdAt, 'long');
        const authorInitial = (post.author || 'E').charAt(0).toUpperCase();

        contentEl.innerHTML = `
            <nav class="text-sm text-grayLight/50 mb-8 flex items-center gap-2 flex-wrap">
                <a href="index.html" class="hover:text-gold transition-colors">Trang chủ</a>
                <i class="fa-solid fa-chevron-right text-[10px]"></i>
                <a href="blog.html" class="hover:text-gold transition-colors">Blog</a>
                <i class="fa-solid fa-chevron-right text-[10px]"></i>
                <span class="text-grayLight">${post.title}</span>
            </nav>

            ${post.category ? `<span class="card-category">${post.category}</span>` : ''}
            <h1>${post.title}</h1>
            
            <div class="post-meta">
                <div class="author">
                    <div class="author-avatar">${authorInitial}</div>
                    <span>${post.author || 'Eclipse Piercing'}</span>
                </div>
                <span><i class="fa-regular fa-calendar mr-1"></i> ${date}</span>
                <span><i class="fa-regular fa-clock mr-1"></i> ${readTime} phút đọc</span>
            </div>

            ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${post.title}" class="featured-image" onerror="this.style.display='none'">` : ''}

            <div class="article-body">
                ${post.content}
            </div>

            ${post.tags && post.tags.length > 0 ? `
                <div class="flex flex-wrap gap-2 mt-8">
                    ${post.tags.map(tag => `<span class="px-3 py-1 border border-grayDark rounded-full text-xs text-grayLight">#${tag}</span>`).join('')}
                </div>
            ` : ''}

            <div class="share-buttons">
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" class="share-btn facebook">
                    <i class="fa-brands fa-facebook-f"></i> Chia sẻ Facebook
                </a>
                <button class="share-btn" onclick="navigator.clipboard.writeText(window.location.href); this.innerHTML='<i class=\\'fa-solid fa-check\\'></i> Đã sao chép!';">
                    <i class="fa-solid fa-link"></i> Sao chép link
                </button>
            </div>
        `;

        // Render related posts
        renderRelatedPosts(post, posts);
    }

    function renderRelatedPosts(currentPost, allPosts) {
        const container = document.getElementById('related-posts');
        if (!container) return;

        const related = allPosts
            .filter(p => p.id !== currentPost.id && p.category === currentPost.category)
            .slice(0, 3);

        if (related.length === 0) {
            // Show other recent posts
            const recent = allPosts.filter(p => p.id !== currentPost.id).slice(0, 3);
            if (recent.length === 0) return;
            container.innerHTML = `
                <h3>Bài viết mới nhất</h3>
                <div class="blog-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                    ${recent.map(p => renderBlogCard(p)).join('')}
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <h3>Bài viết liên quan</h3>
            <div class="blog-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                ${related.map(p => renderBlogCard(p)).join('')}
            </div>
        `;
    }

    function show404() {
        const contentEl = document.getElementById('blog-post-content');
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="text-center py-20">
                    <i class="fa-regular fa-file-lines text-5xl text-grayDark mb-4"></i>
                    <h2 class="text-2xl font-bold text-white mb-3">Không tìm thấy bài viết</h2>
                    <p class="text-grayLight mb-6">Bài viết bạn tìm không tồn tại hoặc đã bị xóa.</p>
                    <a href="blog.html" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#D4AF37;color:#0A0A0A;border-radius:10px;font-weight:600;text-decoration:none;">
                        <i class="fa-solid fa-arrow-left"></i> Quay lại Blog
                    </a>
                </div>
            `;
        }
    }

    // ============================================================
    // Helpers
    // ============================================================
    function getPublishedPosts() {
        try {
            const posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            return posts
                .filter(p => p.status === 'published')
                .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
        } catch (e) {
            return [];
        }
    }

    function stripHtml(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    function estimateReadTime(content) {
        const words = stripHtml(content).split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200));
    }

    function formatDate(dateString, format) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date)) return '';
        
        if (format === 'long') {
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit', month: 'long', year: 'numeric'
            });
        }
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
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
})();
