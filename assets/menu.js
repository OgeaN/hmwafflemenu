const menu = [
    { name: "Duble Waffle", price: 380, image: "assets/menu-images/duble-waffle.jpg", category: "Waffle" },
    { name: "Bubble Waffle", price: 300, image: "assets/menu-images/bubble-waffle.jpg", category: "Waffle" },
    { name: "Çiçek Waffle", price: 250, image: "assets/menu-images/cicek-waffle.jpg", category: "Waffle" },
    { name: "Sandviç Waffle", price: 210, image: "assets/menu-images/sandvic-waffle.jpg", category: "Waffle" },
    { name: "Bardak Waffle", price: 190, image: "assets/menu-images/bardak-waffle.jpg", category: "Waffle" },
    { name: "Çubuk Waffle", price: 190, image: "assets/menu-images/cubuk-waffle.jpg", category: "Waffle" },
    { name: "Kase Waffle", price: 150, image: "assets/menu-images/kase-waffle.jpg", category: "Waffle" },
    { name: "Kahve", price: 80, image: "assets/menu-images/kahve.jpg", category: "Kahveler" },
    { name: "Americano", price: 70, image: "assets/menu-images/americano.jpg", category: "Kahveler" },
    { name: "Türk Kahvesi", price: 70, image: "assets/menu-images/turk-kahvesi.jpg", category: "Kahveler" },
    { name: "Ekstra Dondurma", price: 60, image: "assets/menu-images/ekstra-dondurma.jpg", category: "Ekstralar" },
    { name: "Soğuk İçecek", price: 55, image: "assets/menu-images/soguk-icecek.jpg", category: "İçecekler" },
    { name: "Gazoz", price: 40, image: "assets/menu-images/gazoz.jpg", category: "İçecekler" },
    { name: "Meyveli Soda", price: 30, image: "assets/menu-images/meyveli-soda.jpg", category: "İçecekler" },
    { name: "Soda", price: 20, image: "assets/menu-images/soda.jpg", category: "İçecekler" },
    { name: "Çay", price: 15, image: "assets/menu-images/cay.jpg", category: "İçecekler" },
    { name: "Su", price: 10, image: "assets/menu-images/su.jpg", category: "İçecekler" }
];

function renderCategoryTabs(categories, activeCategory) {
    const tabs = document.getElementById('category-tabs');
    tabs.innerHTML = Object.keys(categories).map(cat => `
        <button class="tab${cat === activeCategory ? ' active' : ''}" data-category="${cat}">${cat}</button>
    `).join('');
    // Tab click event
    Array.from(tabs.querySelectorAll('button')).forEach(btn => {
        btn.onclick = () => renderMenu(btn.dataset.category);
    });
}

function renderMenu(selectedCategory) {
    const menuList = document.getElementById('menu-list');
    menuList.className = 'menu-list';
    // Kategorilere göre gruplama
    const categories = {};
    menu.forEach(item => {
        if (!categories[item.category]) categories[item.category] = [];
        categories[item.category].push(item);
    });
    // İlk kategori default seçili
    const activeCategory = selectedCategory || Object.keys(categories)[0];
    renderCategoryTabs(categories, activeCategory);
    menuList.innerHTML = `
        ${categories[activeCategory].map(item => `
            <div class="menu-card">
                <div class="menu-img">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='assets/menu-images/default.jpg'">
                </div>
                <div class="menu-info">
                  <span class="name">${item.name}</span>
                  <span class="price">${item.price}₺</span>
                </div>
            </div>
        `).join('')}
    `;
}

document.addEventListener('DOMContentLoaded', () => renderMenu());
