import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// Admin paneliyle aynı Firebase projesi (sadece okuma yapılır).
const firebaseConfig = {
    apiKey: "AIzaSyAbbbtdZDoWWdWx8gZD5pTqme4zNtn5I6Q",
    authDomain: "hmwaffle-60e3e.firebaseapp.com",
    databaseURL: "https://hmwaffle-60e3e-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "hmwaffle-60e3e",
    storageBucket: "hmwaffle-60e3e.firebasestorage.app",
    messagingSenderId: "566279108076",
    appId: "1:566279108076:web:7f6e8247de4c68f73bbcc9",
    measurementId: "G-4KL5XBC9TD"
};

// Firebase boş veya erişilemez olursa kullanılacak yedek (fallback) liste.
// admin/js/data/seedMenu.js ile aynı tutulmalıdır.
const seedMenu = [
    { name: "Çiçek Waffle", price: 250, image: "assets/menu-images/cicek-waffle.jpg", category: "Waffle" },
    { name: "Bubble Waffle", price: 300, image: "assets/menu-images/bubble-waffle.jpg", category: "Waffle" },
    { name: "Bardak Waffle", price: 190, image: "assets/menu-images/bardak-waffle.jpg", category: "Waffle" },
    { name: "Kase Waffle", price: 150, image: "assets/menu-images/kase-waffle.jpg", category: "Waffle" },
    { name: "Duble Waffle", price: 380, image: "assets/menu-images/duble-waffle.jpg", category: "Waffle" },
    { name: "Sandviç Waffle", price: 210, image: "assets/menu-images/sandvic-waffle.jpg", category: "Waffle" },
    { name: "Çubuk Waffle", price: 190, image: "assets/menu-images/cubuk-waffle.jpg", category: "Waffle" },
    { name: "Bardak Fondü", price: 190, image: "assets/menu-images/fondu.jpg", category: "Waffle" },



    { name: "Sufle", price: 140, image: "assets/menu-images/sufle.jpg", category: "Tatlılar" },
   // { name: "Cup Dondurma", price: 0, image: "assets/menu-images/ekstra-dondurma.jpg", category: "Tatlılar" },
    { name: "Tiramisu", price: 130, image: "assets/menu-images/tiramisu.jpg", category: "Tatlılar" },
    { name: "Cheesecake", price: 130, image: "assets/menu-images/cheesecake.jpg", category: "Tatlılar" },
    { name: "San Sebastian Cheesecake", price: 150, image: "assets/menu-images/san-seba.jpg", category: "Tatlılar" },
    { name: "Cocostar", price: 150, image: "assets/menu-images/cocostar.jpg", category: "Tatlılar" },
    { name: "Red Velvet", price: 150, image: "assets/menu-images/red-velvet.jpg", category: "Tatlılar" },



    { name: "Türk Kahvesi", price: 70, image: "assets/menu-images/turk-kahvesi.jpg", category: "Kahveler" },
    { name: "Cappucino", price: 80, image: "assets/menu-images/cappucino.jpg", category: "Kahveler" },
    { name: "Flat White", price: 80, image: "assets/menu-images/flat-white.jpg", category: "Kahveler" },
    { name: "Americano", price: 80, image: "assets/menu-images/americano.jpg", category: "Kahveler" },
    { name: "Latte", price: 80, image: "assets/menu-images/latte.jpg", category: "Kahveler" },
    { name: "Espresso", price: 70, image: "assets/menu-images/espresso.jpg", category: "Kahveler" },
    { name: "Latte Macchiato", price: 80, image: "assets/menu-images/latte-macchiato.jpg", category: "Kahveler" },
    

    { name: "Çikolatalı Milkshake", price: 120, image: "assets/menu-images/cikolatali-milkshake.jpg", category: "Milk Shake" },
    { name: "Çilekli Milkshake", price: 120, image: "assets/menu-images/cilekli-milkshake.jpg", category: "Milk Shake" },
    { name: "Vanilyalı Milkshake", price: 120, image: "assets/menu-images/vanilyali-milkshake.jpg", category: "Milk Shake" },



    { name: "Muzlu Süt", price: 100, image: "assets/menu-images/muzlu-sut.jpg", category: "Sütlü İçecekler" },
    { name: "Çilekli Süt", price: 100, image: "assets/menu-images/cilekli-sut.jpg", category: "Sütlü İçecekler" },
    { name: "Çikolatalı Süt", price: 100, image: "assets/menu-images/cikolatali-sut.jpg", category: "Sütlü İçecekler" },
    { name: "Sıcak Çikolata", price: 80, image: "assets/menu-images/sicak-cikolata.jpg", category: "Sütlü İçecekler" },
    { name: "Salep", price: 80, image: "assets/menu-images/salep.jpg", category: "Sütlü İçecekler" },
    
    


    { name: "Kola", price: 55, image: "assets/menu-images/kola.jpg", category: "Soğuk İçecekler" },
    { name: "Fanta", price: 55, image: "assets/menu-images/fanta.jpg", category: "Soğuk İçecekler" },
    { name: "Gazoz", price: 40, image: "assets/menu-images/gazoz.jpg", category: "Soğuk İçecekler" },
    { name: "Ice Tea", price: 55, image: "assets/menu-images/ice-tea.jpg", category: "Soğuk İçecekler" },
    { name: "Meyveli Soda", price: 30, image: "assets/menu-images/meyveli-soda.jpg", category: "Soğuk İçecekler" },
    { name: "Su", price: 10, image: "assets/menu-images/su.jpg", category: "Soğuk İçecekler" },
    { name: "Limonata", price: 55, image: "assets/menu-images/limonata.jpg", category: "Soğuk İçecekler" },
    { name: "Ice Latte", price: 100, image: "assets/menu-images/ice-latte.jpg", category: "Soğuk İçecekler" },



    { name: "Çay", price: 15, image: "assets/menu-images/cay.jpg", category: "Sıcak İçecekler" },
    { name: "Kivi", price: 20, image: "assets/menu-images/kivi.jpg", category: "Sıcak İçecekler" },
    { name: "Portakal", price: 20, image: "assets/menu-images/portakal.jpg", category: "Sıcak İçecekler" },
    { name: "Kuşburnu", price: 20, image: "assets/menu-images/kusburnu.jpg", category: "Sıcak İçecekler" },
    { name: "Elma", price: 20, image: "assets/menu-images/elma.jpg", category: "Sıcak İçecekler" },
    
    
];

// Ekranda gösterilen aktif menü. Önce yedek listeyle başlar, Firebase verisi gelince güncellenir.
let menu = seedMenu;

function renderCategoryTabs(categories, activeCategory) {
    const tabs = document.getElementById('category-tabs');
    tabs.innerHTML = Object.keys(categories).map(cat => `
        <button class="category-tab${cat === activeCategory ? ' active' : ''}" data-category="${cat}">${cat}</button>
    `).join('');
    // Tab click event
    Array.from(tabs.querySelectorAll('button')).forEach(btn => {
        btn.onclick = () => renderMenu(btn.dataset.category);
    });
}

function openImageModal(imageSrc, altText) {
    let modal = document.getElementById('image-modal');
    let modalImg = document.getElementById('modal-img');
    let modalAlt = document.getElementById('modal-alt');
    if (modal && modalImg) {
        modal.classList.add('show');
        modalImg.src = imageSrc;
        modalImg.alt = altText;
        if (modalAlt) modalAlt.textContent = altText;
    }
}

function closeImageModal() {
    let modal = document.getElementById('image-modal');
    if (modal) modal.classList.remove('show');
}

// Modül kapsamındaki bu fonksiyonlar HTML'deki inline onclick'lerden erişilebilsin diye global yapılır.
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;

let currentCategory = null;

function renderMenu(selectedCategory) {
    const menuList = document.getElementById('menu-list');
    menuList.className = 'qr-grid';
    // Kategorilere göre gruplama
    const categories = {};
    menu.forEach(item => {
        if (!categories[item.category]) categories[item.category] = [];
        categories[item.category].push(item);
    });
    // Seçili kategori: parametre > önceki seçim (hâlâ varsa) > ilk kategori
    let activeCategory = selectedCategory || currentCategory;
    if (!activeCategory || !categories[activeCategory]) {
        activeCategory = Object.keys(categories)[0];
    }
    currentCategory = activeCategory;
    if (!activeCategory) {
        menuList.innerHTML = '';
        renderCategoryTabs(categories, activeCategory);
        return;
    }
    renderCategoryTabs(categories, activeCategory);
    menuList.innerHTML = `
        ${categories[activeCategory].map(item => `
            <div class="qr-card" onclick="openImageModal('${item.image}','${item.name}')">
                <img class="qr-card-img" src="${item.image}" alt="${item.name}" onerror="this.src='assets/menu-images/default.jpg'">
                <div class="qr-card-info">
                  <span class="qr-card-name">${item.name}</span>
                  <span class="qr-card-price">${item.price} ₺</span>
                </div>
            </div>
        `).join('')}
    `;
}

// Modalı kapatmak için ESC tuşu ve dışarı tıklama
window.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeImageModal();
        });
    }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeImageModal();
    });
});

// Firebase QrMenu düğümünü canlı dinle; gelen veriyi gizli olmayanlarla,
// kategori-içi 'order' sırasına göre menüye dönüştür.
function applyQrMenuSnapshot(value) {
    if (!value) {
        return false;
    }
    const rows = Object.values(value)
        .filter(item => item && item.hidden !== true && (item.name || '').toString().trim() !== '')
        .map(item => ({
            name: String(item.name ?? ''),
            price: Number(item.price) || 0,
            image: String(item.image ?? ''),
            category: String(item.category ?? 'Diğer'),
            order: Number(item.order) || 0,
        }));

    if (rows.length === 0) {
        return false;
    }

    // Kategori ilk görülme sırasını koru, kategori içinde 'order'a göre sırala.
    const categoryOrder = [];
    rows.forEach(r => {
        if (!categoryOrder.includes(r.category)) categoryOrder.push(r.category);
    });
    rows.sort((a, b) => {
        const catDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        if (catDiff !== 0) return catDiff;
        return a.order - b.order;
    });

    menu = rows;
    return true;
}

function startMenu() {
    // Önce yedek listeyle hemen render et (Firebase yavaş/erişilemez olsa bile menü görünsün).
    renderMenu();

    try {
        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        onValue(
            ref(db, 'QrMenu'),
            (snapshot) => {
                if (applyQrMenuSnapshot(snapshot.val())) {
                    renderMenu();
                }
            },
            () => {
                // Okuma hatası: yedek liste zaten gösteriliyor, sessizce devam et.
            }
        );
    } catch (e) {
        // Firebase başlatılamadı: yedek liste gösterilmeye devam eder.
    }
}

document.addEventListener('DOMContentLoaded', startMenu);
