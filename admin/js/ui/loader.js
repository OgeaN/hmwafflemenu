// Sayfa geçişi ve veri yükleme için görsel geri bildirim yardımcıları.

let barEl = null;
let hideTimer = null;

function ensureBar() {
    if (barEl) return barEl;
    barEl = document.createElement('div');
    barEl.className = 'route-progress';
    barEl.innerHTML = '<div class="route-progress-fill"></div>';
    document.body.appendChild(barEl);
    return barEl;
}

// Üst ilerleme çizgisini başlatır (ör. sayfa geçişi tıklamasında).
function startRouteProgress() {
    const bar = ensureBar();
    clearTimeout(hideTimer);
    bar.classList.remove('is-done');
    // reflow ile animasyonu sıfırla
    void bar.offsetWidth;
    bar.classList.add('is-active');
}

// İlerleme çizgisini tamamlayıp gizler (genelde sayfa yüklendiğinde gerekmez,
// yeni sayfa zaten temiz başlar; aynı sayfada async işler için kullanılır).
function finishRouteProgress() {
    if (!barEl) return;
    barEl.classList.add('is-done');
    hideTimer = setTimeout(() => {
        barEl.classList.remove('is-active', 'is-done');
    }, 300);
}

// Sidebar linklerine tıklanınca üst çizgiyi tetikle.
function bindRouteProgressToLinks(root = document) {
    root.querySelectorAll('a[href]').forEach((link) => {
        const href = link.getAttribute('href');
        // Sadece dahili sayfa geçişleri için
        if (!href || href.startsWith('#') || href.startsWith('http') || link.target === '_blank') {
            return;
        }
        link.addEventListener('click', () => startRouteProgress());
    });
}

// Sayfa "show" olduğunda (geri tuşu / bfcache dahil) çizgiyi temizle.
window.addEventListener('pageshow', () => {
    if (barEl) barEl.classList.remove('is-active', 'is-done');
});

// --- Skeleton önizleme ---
// type: 'cards' | 'rows' | 'table'
function skeletonMarkup(type, count) {
    if (type === 'cards') {
        return `<div class="skeleton-cards">${
            Array.from({ length: count }).map(() => `
                <div class="skeleton-card">
                    <div class="skeleton-box sk-thumb"></div>
                    <div class="skeleton-lines">
                        <div class="skeleton-box sk-line sk-line-lg"></div>
                        <div class="skeleton-box sk-line sk-line-sm"></div>
                    </div>
                </div>
            `).join('')
        }</div>`;
    }
    if (type === 'columns') {
        return `<div class="skeleton-columns">${
            Array.from({ length: count }).map(() => `
                <div class="skeleton-column">
                    <div class="skeleton-box sk-line sk-line-lg"></div>
                    ${Array.from({ length: 6 }).map(() => '<div class="skeleton-box sk-row sk-row-sm"></div>').join('')}
                </div>
            `).join('')
        }</div>`;
    }
    if (type === 'table') {
        return `<div class="skeleton-rows">${
            Array.from({ length: count }).map(() => `
                <div class="skeleton-box sk-row"></div>
            `).join('')
        }</div>`;
    }
    // 'rows' (varsayılan): basit satırlar
    return `<div class="skeleton-rows">${
        Array.from({ length: count }).map(() => `
            <div class="skeleton-box sk-row"></div>
        `).join('')
    }</div>`;
}

function showSkeleton(container, type = 'rows', count = 6) {
    if (!container) return;
    container.innerHTML = skeletonMarkup(type, count);
}

export { startRouteProgress, finishRouteProgress, bindRouteProgressToLinks, showSkeleton };
