import { auth } from '../firebase.js';

const sidebarContainer = document.getElementById('sidebar-container');

const icons = {
    dashboard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:10px"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
    products: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:10px"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    firms: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:10px"><path d="M2 20h20"/><path d="M4 20V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16"/><path d="M9 16v4"/><path d="M15 16v4"/></svg>`,
    history: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:10px"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>`,
    calculator: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:10px"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>`,
    receipt: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:10px"><path d="M6 3h12a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2-3-2V5a2 2 0 0 1 2-2z"/><path d="M9 8h6"/><path d="M9 12h6"/></svg>`,
    logout: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:10px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`
};

const sidebarContent = `
    <div style="padding: 0 12px; margin-bottom: 30px; display: flex; align-items: center; gap: 12px;">
        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, var(--accent), #eab308); border-radius: 12px; display: flex; justify-content: center; align-items: center; font-weight: 700; color: #111827; font-size: 1.2rem;">
            W
        </div>
        <div>
            <h3 style="margin:0; padding:0; color:#fff; font-size:1.1rem; letter-spacing:0; text-transform:none;">Admin Panel</h3>
            <span style="font-size:0.75rem; color:#94a3b8;">Yönetim Sistemi</span>
        </div>
    </div>
    <ul>
        <li><a href="dashboard.html">${icons.dashboard} Ana Menü</a></li>
        <li><a href="products.html">${icons.products} Ürünler</a></li>
        <li><a href="firms.html">${icons.firms} Firmalar</a></li>
        <li><a href="history.html">${icons.history} Geçmiş</a></li>
        <li><a href="price-calculator.html">${icons.calculator} Fiyat Hesapla</a></li>
        <li><a href="receipt-printer.html">${icons.receipt} Fiş Yazdır</a></li>
    </ul>
    <button id="logout-btn">${icons.logout} Çıkış Yap</button>
`;

if (sidebarContainer) {
    sidebarContainer.innerHTML = sidebarContent;
}

// Add active class to current page
const currentPage = window.location.pathname.split('/').pop();
if (sidebarContainer) {
    const links = sidebarContainer.querySelectorAll('a');
    links.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    });
}
