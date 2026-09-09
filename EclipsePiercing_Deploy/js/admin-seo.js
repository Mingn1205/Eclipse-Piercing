(function() {
    'use strict';
    
    let seoData = {
        metaTitle: '',
        metaDesc: '',
        metaKeywords: '',
        ogTitle: '',
        ogDesc: '',
        ogImage: '',
        robotsTxt: 'User-agent: *\nDisallow:',
        schema: {
            name: 'Eclipse Piercing',
            address: 'Hanoi, Vietnam',
            phone: '',
            email: '',
            hours: 'Mo-Su 10:00-21:00'
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        if (!AdminCore.checkAuth()) return;
        AdminCore.renderSidebar('seo');
        init();
    });
    
    function init() {
        loadData();
        populateForms();
        setupTabs();
        setupEventListeners();
        updatePreviews();
    }
    
    function loadData() {
        const stored = AdminCore.getData('ep_seo');
        if (stored) {
            seoData = { ...seoData, ...stored };
            if (!seoData.schema) seoData.schema = {};
        }
    }
    
    function saveData() {
        AdminCore.setData('ep_seo', seoData);
        AdminCore.logActivity('update_seo', 'Cập nhật cấu hình SEO');
        AdminCore.showToast('Lưu cấu hình SEO thành công', 'success');
    }
    
    function populateForms() {
        // Meta
        document.getElementById('meta-title').value = seoData.metaTitle;
        document.getElementById('meta-desc').value = seoData.metaDesc;
        document.getElementById('meta-keywords').value = seoData.metaKeywords;
        
        // OG
        document.getElementById('og-title').value = seoData.ogTitle;
        document.getElementById('og-desc').value = seoData.ogDesc;
        document.getElementById('og-image').value = seoData.ogImage;
        
        // Robots
        document.getElementById('robots-content').value = seoData.robotsTxt;
        
        // Schema
        document.getElementById('schema-name').value = seoData.schema.name || '';
        document.getElementById('schema-address').value = seoData.schema.address || '';
        document.getElementById('schema-phone').value = seoData.schema.phone || '';
        document.getElementById('schema-email').value = seoData.schema.email || '';
        document.getElementById('schema-hours').value = seoData.schema.hours || '';
        
        generateSchemaOutput();
    }
    
    function setupTabs() {
        const btns = document.querySelectorAll('.seo-tab-btn');
        const contents = document.querySelectorAll('.seo-tab-content');
        
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => {
                    b.classList.remove('active', 'text-gold', 'border-b-2', 'border-gold');
                    b.classList.add('text-grayLight');
                });
                btn.classList.add('active', 'text-gold', 'border-b-2', 'border-gold');
                btn.classList.remove('text-grayLight');
                
                contents.forEach(c => c.classList.add('hidden'));
                document.getElementById(btn.dataset.target).classList.remove('hidden');
            });
        });
    }
    
    function setupEventListeners() {
        // Meta Events
        document.getElementById('meta-title').addEventListener('input', (e) => {
            document.getElementById('count-title').textContent = e.target.value.length;
            seoData.metaTitle = e.target.value;
            updatePreviews();
        });
        document.getElementById('meta-desc').addEventListener('input', (e) => {
            document.getElementById('count-desc').textContent = e.target.value.length;
            seoData.metaDesc = e.target.value;
            updatePreviews();
        });
        document.getElementById('meta-keywords').addEventListener('input', (e) => {
            seoData.metaKeywords = e.target.value;
        });
        
        // OG Events
        document.getElementById('og-title').addEventListener('input', (e) => {
            seoData.ogTitle = e.target.value;
            updatePreviews();
        });
        document.getElementById('og-desc').addEventListener('input', (e) => {
            seoData.ogDesc = e.target.value;
            updatePreviews();
        });
        document.getElementById('og-image').addEventListener('input', (e) => {
            seoData.ogImage = e.target.value;
            updatePreviews();
        });
        
        // Robots presets
        document.querySelectorAll('.btn-robots-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                let content = '';
                if (preset === 'standard') content = "User-agent: *\nDisallow:\nSitemap: https://eclipsepiercing.com/sitemap.xml";
                else if (preset === 'allow') content = "User-agent: *\nDisallow:";
                else if (preset === 'block') content = "User-agent: *\nDisallow: /";
                
                document.getElementById('robots-content').value = content;
                seoData.robotsTxt = content;
            });
        });
        
        document.getElementById('robots-content').addEventListener('input', (e) => {
            seoData.robotsTxt = e.target.value;
        });
        
        // Schema Events
        const schemaInputs = ['name', 'address', 'phone', 'email', 'hours'];
        schemaInputs.forEach(key => {
            document.getElementById(`schema-${key}`).addEventListener('input', (e) => {
                seoData.schema[key] = e.target.value;
                generateSchemaOutput();
            });
        });
        
        // Save Buttons
        document.querySelectorAll('.btn-save').forEach(btn => {
            btn.addEventListener('click', saveData);
        });
        
        // Audit
        document.getElementById('btn-run-audit').addEventListener('click', runAudit);
        
        // Initial Counts
        document.getElementById('count-title').textContent = document.getElementById('meta-title').value.length;
        document.getElementById('count-desc').textContent = document.getElementById('meta-desc').value.length;
    }
    
    function updatePreviews() {
        // Google
        document.getElementById('preview-g-title').textContent = seoData.metaTitle || 'Tiêu đề website';
        document.getElementById('preview-g-desc').textContent = seoData.metaDesc || 'Mô tả website sẽ hiển thị ở đây.';
        
        // Facebook
        document.getElementById('preview-fb-title').textContent = seoData.ogTitle || 'OG Title';
        document.getElementById('preview-fb-desc').textContent = seoData.ogDesc || 'OG Description';
        
        const img = document.getElementById('preview-fb-img');
        const placeholder = document.getElementById('preview-fb-placeholder');
        if (seoData.ogImage) {
            img.src = seoData.ogImage;
            img.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } else {
            img.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
    }
    
    function generateSchemaOutput() {
        const schema = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": seoData.schema.name,
            "address": seoData.schema.address,
            "telephone": seoData.schema.phone,
            "email": seoData.schema.email,
            "openingHours": seoData.schema.hours
        };
        document.getElementById('schema-output').textContent = JSON.stringify(schema, null, 2);
    }
    
    function runAudit() {
        const checklist = [];
        let score = 0;
        const totalTests = 6;
        
        // 1. Meta Title
        const titleLen = seoData.metaTitle.length;
        if (titleLen >= 50 && titleLen <= 60) {
            checklist.push({ title: 'Meta Title: Độ dài tối ưu (50-60 ký tự)', status: 'pass' });
            score += 1;
        } else if (titleLen > 0) {
            checklist.push({ title: 'Meta Title: Cần điều chỉnh độ dài', status: 'warning' });
            score += 0.5;
        } else {
            checklist.push({ title: 'Meta Title: Bị thiếu', status: 'fail' });
        }
        
        // 2. Meta Desc
        const descLen = seoData.metaDesc.length;
        if (descLen >= 150 && descLen <= 160) {
            checklist.push({ title: 'Meta Description: Độ dài tối ưu (150-160 ký tự)', status: 'pass' });
            score += 1;
        } else if (descLen > 0) {
            checklist.push({ title: 'Meta Description: Cần điều chỉnh độ dài', status: 'warning' });
            score += 0.5;
        } else {
            checklist.push({ title: 'Meta Description: Bị thiếu', status: 'fail' });
        }
        
        // 3. OG Tags
        if (seoData.ogTitle && seoData.ogDesc && seoData.ogImage) {
            checklist.push({ title: 'Open Graph Tags: Đầy đủ', status: 'pass' });
            score += 1;
        } else {
            checklist.push({ title: 'Open Graph Tags: Thiếu thông tin', status: 'fail' });
        }
        
        // 4. Schema
        if (seoData.schema.name && seoData.schema.address && seoData.schema.phone) {
            checklist.push({ title: 'Structured Data: Cấu hình cơ bản đầy đủ', status: 'pass' });
            score += 1;
        } else {
            checklist.push({ title: 'Structured Data: Cần điền thêm Tên, Địa chỉ, SĐT', status: 'warning' });
            score += 0.5;
        }
        
        // 5. Robots.txt
        if (seoData.robotsTxt && !seoData.robotsTxt.includes('Disallow: /') && seoData.robotsTxt.length > 5) {
            checklist.push({ title: 'Robots.txt: Cho phép bot thu thập dữ liệu', status: 'pass' });
            score += 1;
        } else {
            checklist.push({ title: 'Robots.txt: Đang chặn hoặc chưa cấu hình', status: 'fail' });
        }
        
        // 6. Keywords
        if (seoData.metaKeywords.length > 0) {
            checklist.push({ title: 'Keywords: Đã khai báo', status: 'pass' });
            score += 1;
        } else {
            checklist.push({ title: 'Keywords: Bị thiếu', status: 'warning' });
            score += 0.5;
        }
        
        // Calculate final score
        const finalScore = Math.round((score / totalTests) * 100);
        
        // Animate score
        let currentScore = 0;
        const scoreEl = document.getElementById('audit-score-text');
        const circle = document.getElementById('audit-score-circle');
        
        const interval = setInterval(() => {
            if (currentScore >= finalScore) {
                clearInterval(interval);
                scoreEl.textContent = finalScore;
                circle.style.strokeDasharray = `${finalScore}, 100`;
                
                if (finalScore >= 80) circle.classList.replace('text-gold', 'text-green-500');
                else if (finalScore >= 50) circle.classList.replace('text-gold', 'text-yellow-500');
                else circle.classList.replace('text-gold', 'text-red-500');
            } else {
                currentScore++;
                scoreEl.textContent = currentScore;
                circle.style.strokeDasharray = `${currentScore}, 100`;
            }
        }, 15);
        
        // Render checklist
        const listEl = document.getElementById('audit-checklist');
        listEl.innerHTML = checklist.map(item => {
            let icon, colorClass;
            if (item.status === 'pass') {
                icon = 'fa-solid fa-check-circle';
                colorClass = 'text-green-500';
            } else if (item.status === 'warning') {
                icon = 'fa-solid fa-triangle-exclamation';
                colorClass = 'text-yellow-500';
            } else {
                icon = 'fa-solid fa-xmark-circle';
                colorClass = 'text-red-500';
            }
            
            return `
                <div class="flex items-center gap-4 p-4 bg-grayDark/50 rounded-lg border border-grayMid">
                    <i class="${icon} ${colorClass} text-xl"></i>
                    <span class="text-white">${item.title}</span>
                </div>
            `;
        }).join('');
    }
})();
