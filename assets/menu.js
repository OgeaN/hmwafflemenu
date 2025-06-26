const menu = [
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

function openImageModal(imageSrc, altText) {
    let modal = document.getElementById('image-modal');
    let modalImg = document.getElementById('modal-img');
    let modalAlt = document.getElementById('modal-alt');
    if (modal && modalImg) {
        modal.style.display = 'flex';
        modalImg.src = imageSrc;
        modalImg.alt = altText;
        if (modalAlt) modalAlt.textContent = altText;
    }
}

function closeImageModal() {
    let modal = document.getElementById('image-modal');
    if (modal) modal.style.display = 'none';
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
            <div class="menu-card" onclick=\"openImageModal('${item.image}','${item.name}')\">
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

document.addEventListener('DOMContentLoaded', () => renderMenu());
