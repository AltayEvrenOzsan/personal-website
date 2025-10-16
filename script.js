// Tema değiştirme
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Kayıtlı temayı yükle veya sistem tercihini kullan
let currentTheme = 'light';

themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', currentTheme);
});

// Smooth scroll için navigasyon linkleri
const navLinks = document.querySelectorAll('.nav-link');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Aktif linki güncelle
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // İlgili bölüme kaydır
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll animasyonu için aktif menü öğesini güncelle
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Blog yazıları verisi
const blogPosts = [
    {
        id: 1,
        title: 'Web Geliştirmeye Başlarken',
        date: '15 Ekim 2025',
        excerpt: 'Web geliştirme dünyasına ilk adım atanlar için kapsamlı bir rehber. HTML, CSS ve JavaScript temellerini öğrenin.',
        icon: '🌐'
    },
    {
        id: 2,
        title: 'Modern JavaScript İpuçları',
        date: '10 Ekim 2025',
        excerpt: 'ES6+ özellikleri ile JavaScript kodunuzu daha temiz ve verimli hale getirin. Arrow functions, destructuring ve daha fazlası.',
        icon: '⚡'
    },
    {
        id: 3,
        title: 'CSS Grid ve Flexbox Karşılaştırması',
        date: '5 Ekim 2025',
        excerpt: 'Modern layout teknikleri olan CSS Grid ve Flexbox arasındaki farkları ve kullanım senaryolarını keşfedin.',
        icon: '🎨'
    },
    {
        id: 4,
        title: 'React ile Uygulama Geliştirme',
        date: '1 Ekim 2025',
        excerpt: 'React kütüphanesi ile modern web uygulamaları geliştirmeye başlayın. Component yapısı ve state yönetimi.',
        icon: '⚛️'
    },
    {
        id: 5,
        title: 'Responsive Tasarım Prensipleri',
        date: '28 Eylül 2025',
        excerpt: 'Her cihazda mükemmel görünen web siteleri oluşturmak için responsive tasarım tekniklerini öğrenin.',
        icon: '📱'
    },
    {
        id: 6,
        title: 'Git ve GitHub Kullanımı',
        date: '25 Eylül 2025',
        excerpt: 'Versiyon kontrol sistemleri ile projelerinizi yönetin. Git komutları ve GitHub iş akışları hakkında her şey.',
        icon: '🔧'
    }
];

// Blog kartlarını oluştur
function renderBlogPosts() {
    const blogGrid = document.getElementById('blogGrid');
    
    blogPosts.forEach((post, index) => {
        const card = document.createElement('div');
        card.className = 'blog-card';
        card.style.animation = `fadeInUp 0.6s ease ${index * 0.1}s both`;
        
        card.innerHTML = `
            <div class="blog-image">${post.icon}</div>
            <div class="blog-content">
                <div class="blog-date">${post.date}</div>
                <h3 class="blog-title">${post.title}</h3>
                <p class="blog-excerpt">${post.excerpt}</p>
                <a href="#" class="read-more" onclick="showPostDetail(${post.id}); return false;">
                    Devamını Oku →
                </a>
            </div>
        `;
        
        blogGrid.appendChild(card);
    });
}

// Blog yazısı detayını göster (örnek fonksiyon)
function showPostDetail(postId) {
    const post = blogPosts.find(p => p.id === postId);
    if (post) {
        alert(`${post.title}\n\n${post.excerpt}\n\nBu özellik geliştirme aşamasındadır.`);
    }
}

// Sayfa yüklendiğinde blog yazılarını render et
document.addEventListener('DOMContentLoaded', () => {
    renderBlogPosts();
});

// Sayfa kaydırıldığında navbar'a gölge efekti ekle
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 20px var(--shadow)';
    } else {
        navbar.style.boxShadow = '0 2px 10px var(--shadow)';
    }
});