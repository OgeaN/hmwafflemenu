import { checkAuth } from '../auth.js';
import {
    getQrMenu,
    seedQrMenuIfEmpty,
    updateQrItem,
    addQrItem,
    removeQrItem,
    updateOrder,
} from '../services/qrMenuService.js';
import { seedMenu } from '../data/seedMenu.js';
import { showToast, setButtonLoading } from '../ui/feedback.js';
import { showSkeleton } from '../ui/loader.js';

const container = document.getElementById('qr-menu-container');
const addForm = document.getElementById('add-qr-form');
const categoryList = document.getElementById('qr-category-list');
const searchInput = document.getElementById('qr-search');
const newImageInput = document.getElementById('new-qr-image');
const newImagePreview = document.getElementById('new-qr-image-preview');

const PLACEHOLDER_IMG = 'assets/menu-images/default.jpg';
let items = {}; // { id: { name, price, image, category, order, hidden } }
let searchTerm = '';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Virgül veya nokta ile yazılan fiyatı sayıya çevirir ("12,50" -> 12.5).
function parsePrice(value) {
    const n = parseFloat(String(value).replace(',', '.').trim());
    return Number.isFinite(n) && n >= 0 ? n : 0;
}

// Hem internet URL'i (http/https) hem yerel yolu (assets/...) olduğu gibi kabul eder.
function resolvePreviewSrc(image) {
    const val = String(image ?? '').trim();
    return val || PLACEHOLDER_IMG;
}

function groupByCategory(entries) {
    const groups = {};
    for (const [id, item] of entries) {
        const cat = item.category || 'Diğer';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({ id, ...item });
    }
    for (const cat of Object.keys(groups)) {
        groups[cat].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return groups;
}

function refreshCategoryDatalist() {
    const cats = [...new Set(Object.values(items).map(i => i.category).filter(Boolean))].sort();
    categoryList.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}"></option>`).join('');
}

function cardTemplate(item) {
    const src = escapeHtml(resolvePreviewSrc(item.image));
    return `
        <article class="qr-card-admin${item.hidden ? ' is-hidden' : ''}" data-id="${item.id}" draggable="true">
            <div class="qr-card-top">
                <span class="qr-drag-handle" title="Sürükleyerek sırala">⠿</span>
                <div class="qr-thumb">
                    <img src="${src}" alt="${escapeHtml(item.name)}" data-role="thumb"
                         onerror="this.src='${PLACEHOLDER_IMG}'">
                </div>
                <div class="qr-card-head">
                    <span class="qr-card-title" data-role="title">${escapeHtml(item.name) || 'Adsız ürün'}</span>
                    <span class="qr-card-sub" data-role="sub">${item.price ?? 0} ₺ · ${escapeHtml(item.category)}</span>
                </div>
                <div class="qr-card-quick">
                    <button class="qr-icon-btn qr-toggle-btn" data-action="toggle"
                            title="${item.hidden ? 'Menüde göster' : 'Menüde gizle'}">${item.hidden ? '🚫' : '👁'}</button>
                    <button class="qr-icon-btn qr-expand-btn" data-action="expand" title="Düzenle">✎</button>
                </div>
            </div>
            <div class="qr-card-body">
                <label class="qr-field-group">
                    <span>Ürün adı</span>
                    <input class="qr-field" type="text" data-key="name" value="${escapeHtml(item.name)}" placeholder="Ürün adı">
                </label>
                <div class="qr-field-row">
                    <label class="qr-field-group">
                        <span>Fiyat (₺)</span>
                        <input class="qr-field" type="text" inputmode="decimal" data-key="price" value="${item.price ?? 0}">
                    </label>
                    <label class="qr-field-group">
                        <span>Kategori</span>
                        <input class="qr-field" type="text" data-key="category" list="qr-category-list" value="${escapeHtml(item.category)}">
                    </label>
                </div>
                <label class="qr-field-group">
                    <span>Görsel (URL veya yol)</span>
                    <input class="qr-field" type="text" data-key="image" value="${escapeHtml(item.image)}"
                           placeholder="https://... veya assets/menu-images/...">
                </label>
                <div class="qr-card-actions">
                    <button class="qr-save-btn" data-action="save">Kaydet</button>
                    <button class="qr-delete-btn" data-action="delete">Sil</button>
                </div>
            </div>
        </article>
    `;
}

function matchesSearch(item) {
    if (!searchTerm) return true;
    return (`${item.name} ${item.category}`).toLowerCase().includes(searchTerm);
}

function render() {
    refreshCategoryDatalist();
    const entries = Object.entries(items).filter(([, item]) => matchesSearch(item));

    if (entries.length === 0) {
        container.innerHTML = `<div class="empty-state">${
            searchTerm ? 'Aramayla eşleşen ürün yok.' : 'Henüz ürün yok. Yukarıdan yeni ürün ekleyebilirsiniz.'
        }</div>`;
        return;
    }

    const groups = groupByCategory(entries);
    container.innerHTML = Object.keys(groups).sort().map(cat => `
        <section class="qr-category-section" data-category="${escapeHtml(cat)}">
            <div class="qr-category-head">
                <h2 class="qr-category-title">${escapeHtml(cat)}</h2>
                <span class="qr-category-count">${groups[cat].length} ürün</span>
            </div>
            <div class="qr-cards">
                ${groups[cat].map(cardTemplate).join('')}
            </div>
        </section>
    `).join('');
}

function readCard(card) {
    const data = {};
    card.querySelectorAll('.qr-field').forEach(input => {
        const key = input.dataset.key;
        data[key] = key === 'price' ? parsePrice(input.value) : input.value.trim();
    });
    const id = card.dataset.id;
    data.order = items[id]?.order ?? 0;
    data.hidden = items[id]?.hidden === true;
    return data;
}

async function handleSave(card) {
    const id = card.dataset.id;
    const button = card.querySelector('.qr-save-btn');
    const data = readCard(card);

    if (!data.name) {
        showToast('Ürün adı boş olamaz.', 'error');
        return;
    }

    try {
        setButtonLoading(button, true, 'Kaydediliyor...');
        await updateQrItem(id, data);
        items[id] = { ...items[id], ...data };
        showToast('Ürün güncellendi.', 'success');
        render();
    } catch (error) {
        showToast('Ürün kaydedilirken hata oluştu.', 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

async function handleToggle(card) {
    const id = card.dataset.id;
    const button = card.querySelector('.qr-toggle-btn');
    const data = readCard(card);
    data.hidden = !(items[id]?.hidden === true);

    try {
        button.disabled = true;
        await updateQrItem(id, data);
        items[id] = { ...items[id], ...data };
        showToast(data.hidden ? 'Ürün menüde gizlendi.' : 'Ürün menüde görünür.', 'success', 1700);
        render();
    } catch (error) {
        showToast('Durum değiştirilemedi.', 'error');
        button.disabled = false;
    }
}

async function handleDelete(card) {
    const id = card.dataset.id;
    const name = items[id]?.name || 'Ürün';
    if (!window.confirm(`"${name}" silinsin mi? Bu işlem geri alınamaz.`)) {
        return;
    }
    const button = card.querySelector('.qr-delete-btn');

    try {
        setButtonLoading(button, true, 'Siliniyor...');
        await removeQrItem(id);
        delete items[id];
        showToast('Ürün silindi.', 'success');
        render();
    } catch (error) {
        showToast('Ürün silinirken hata oluştu.', 'error');
        setButtonLoading(button, false);
    }
}

function handleContainerClick(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const card = button.closest('.qr-card-admin');
    if (!card) return;

    const action = button.dataset.action;
    if (action === 'save') handleSave(card);
    else if (action === 'toggle') handleToggle(card);
    else if (action === 'delete') handleDelete(card);
    else if (action === 'expand') card.classList.toggle('is-open');
}

// Görsel alanı yazılırken kart başlığındaki thumbnail'i canlı güncelle.
function handleContainerInput(e) {
    const input = e.target.closest('.qr-field');
    if (!input) return;
    const card = input.closest('.qr-card-admin');
    if (!card) return;
    const key = input.dataset.key;

    if (key === 'image') {
        const thumb = card.querySelector('[data-role="thumb"]');
        if (thumb) thumb.src = resolvePreviewSrc(input.value);
    } else if (key === 'name') {
        const title = card.querySelector('[data-role="title"]');
        if (title) title.textContent = input.value.trim() || 'Adsız ürün';
    } else if (key === 'price' || key === 'category') {
        const priceVal = card.querySelector('[data-key="price"]').value || 0;
        const catVal = card.querySelector('[data-key="category"]').value || '';
        const sub = card.querySelector('[data-role="sub"]');
        if (sub) sub.textContent = `${priceVal} ₺ · ${catVal}`;
    }
}

// --- Sürükle-bırak sıralama (kategori içinde) ---
let dragCard = null;

function handleDragStart(e) {
    const card = e.target.closest('.qr-card-admin');
    if (!card) return;
    dragCard = card;
    card.classList.add('qr-dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (!dragCard) return;
    const card = e.target.closest('.qr-card-admin');
    if (!card || card === dragCard) return;

    const fromSection = dragCard.closest('.qr-category-section');
    const toSection = card.closest('.qr-category-section');
    if (fromSection !== toSection) return;

    e.preventDefault();
    const rect = card.getBoundingClientRect();
    const after = (e.clientY - rect.top) > rect.height / 2;
    card.parentElement.insertBefore(dragCard, after ? card.nextSibling : card);
}

async function handleDrop(e) {
    if (!dragCard) return;
    e.preventDefault();
    const section = dragCard.closest('.qr-category-section');
    dragCard.classList.remove('qr-dragging');
    dragCard = null;
    if (!section) return;

    const cards = [...section.querySelectorAll('.qr-card-admin')];
    const updates = {};
    cards.forEach((card, index) => {
        const id = card.dataset.id;
        if (items[id]) items[id].order = index;
        updates[id] = index;
    });

    try {
        await updateOrder(updates);
        showToast('Sıralama güncellendi.', 'success', 1700);
    } catch (error) {
        showToast('Sıralama kaydedilemedi.', 'error');
    }
}

function handleDragEnd() {
    if (dragCard) dragCard.classList.remove('qr-dragging');
    dragCard = null;
}

async function handleAdd(e) {
    e.preventDefault();
    const button = document.getElementById('add-qr-btn');
    const name = document.getElementById('new-qr-name').value.trim();
    const category = document.getElementById('new-qr-category').value.trim();

    if (!name) {
        showToast('Ürün adı boş olamaz.', 'error');
        return;
    }
    if (!category) {
        showToast('Kategori boş olamaz.', 'error');
        return;
    }

    const maxOrder = Object.values(items)
        .filter(i => i.category === category)
        .reduce((max, i) => Math.max(max, i.order ?? 0), -1);

    const newItem = {
        name,
        price: parsePrice(document.getElementById('new-qr-price').value),
        category,
        image: newImageInput.value.trim(),
        order: maxOrder + 1,
        hidden: false,
    };

    try {
        setButtonLoading(button, true, 'Ekleniyor...');
        const id = await addQrItem(newItem);
        items[id] = newItem;
        addForm.reset();
        document.getElementById('new-qr-price').value = '0';
        if (newImagePreview) newImagePreview.src = PLACEHOLDER_IMG;
        showToast('Ürün eklendi.', 'success');
        render();
    } catch (error) {
        showToast('Ürün eklenirken hata oluştu.', 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

async function initializePage() {
    await checkAuth();

    showSkeleton(container, 'cards', 6);

    try {
        const seeded = await seedQrMenuIfEmpty(seedMenu);
        if (seeded) {
            showToast('Menü ilk kez Firebase\'e aktarıldı.', 'info', 2500);
        }
        items = await getQrMenu();
    } catch (error) {
        showToast('Menü yüklenirken hata oluştu.', 'error');
        items = {};
    }

    render();

    addForm.addEventListener('submit', handleAdd);
    container.addEventListener('click', handleContainerClick);
    container.addEventListener('input', handleContainerInput);
    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragend', handleDragEnd);

    if (newImageInput && newImagePreview) {
        newImageInput.addEventListener('input', () => {
            newImagePreview.src = resolvePreviewSrc(newImageInput.value);
        });
    }
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            searchTerm = searchInput.value.trim().toLowerCase();
            render();
        });
    }
}

initializePage();
