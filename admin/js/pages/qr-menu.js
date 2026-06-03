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

const container = document.getElementById('qr-menu-container');
const addForm = document.getElementById('add-qr-form');
const categoryList = document.getElementById('qr-category-list');

let items = {}; // { id: { name, price, image, category, order, hidden } }

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function groupByCategory(entries) {
    const groups = {};
    for (const [id, item] of entries) {
        const cat = item.category || 'Diğer';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({ id, ...item });
    }
    // Kategori içinde order'a göre sırala
    for (const cat of Object.keys(groups)) {
        groups[cat].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return groups;
}

function refreshCategoryDatalist() {
    const cats = [...new Set(Object.values(items).map(i => i.category).filter(Boolean))].sort();
    categoryList.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}"></option>`).join('');
}

function rowTemplate(item) {
    return `
        <div class="qr-row${item.hidden ? ' qr-row-hidden' : ''}" data-id="${item.id}" draggable="true">
            <span class="qr-drag-handle" title="Sürükle">⠿</span>
            <input class="qr-field qr-name" type="text" data-key="name" value="${escapeHtml(item.name)}" placeholder="Ürün adı">
            <input class="qr-field qr-price" type="number" step="0.01" min="0" data-key="price" value="${item.price ?? 0}">
            <input class="qr-field qr-category" type="text" data-key="category" list="qr-category-list" value="${escapeHtml(item.category)}">
            <input class="qr-field qr-image" type="text" data-key="image" value="${escapeHtml(item.image)}" placeholder="assets/menu-images/...">
            <button class="qr-toggle-btn" data-action="toggle" title="Menüde gizle/göster">${item.hidden ? '🚫 Gizli' : '👁 Görünür'}</button>
            <button class="qr-save-btn" data-action="save">Kaydet</button>
            <button class="qr-delete-btn" data-action="delete">Sil</button>
        </div>
    `;
}

function render() {
    refreshCategoryDatalist();
    const entries = Object.entries(items);

    if (entries.length === 0) {
        container.innerHTML = '<div class="empty-state">Henüz ürün yok. Yukarıdan yeni ürün ekleyebilirsiniz.</div>';
        return;
    }

    const groups = groupByCategory(entries);
    container.innerHTML = Object.keys(groups).sort().map(cat => `
        <section class="qr-category-section" data-category="${escapeHtml(cat)}">
            <h2 class="qr-category-title">${escapeHtml(cat)}</h2>
            <div class="qr-rows">
                ${groups[cat].map(rowTemplate).join('')}
            </div>
        </section>
    `).join('');
}

function readRow(row) {
    const data = {};
    row.querySelectorAll('.qr-field').forEach(input => {
        const key = input.dataset.key;
        data[key] = key === 'price' ? (parseFloat(input.value) || 0) : input.value.trim();
    });
    const id = row.dataset.id;
    data.order = items[id]?.order ?? 0;
    data.hidden = items[id]?.hidden === true;
    return data;
}

async function handleSave(row) {
    const id = row.dataset.id;
    const button = row.querySelector('.qr-save-btn');
    const data = readRow(row);

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

async function handleToggle(row) {
    const id = row.dataset.id;
    const button = row.querySelector('.qr-toggle-btn');
    const data = readRow(row);
    data.hidden = !(items[id]?.hidden === true);

    try {
        setButtonLoading(button, true, '...');
        await updateQrItem(id, data);
        items[id] = { ...items[id], ...data };
        showToast(data.hidden ? 'Ürün menüde gizlendi.' : 'Ürün menüde görünür.', 'success', 1700);
        render();
    } catch (error) {
        showToast('Durum değiştirilemedi.', 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

async function handleDelete(row) {
    const id = row.dataset.id;
    const name = items[id]?.name || 'Ürün';
    if (!window.confirm(`"${name}" silinsin mi? Bu işlem geri alınamaz.`)) {
        return;
    }
    const button = row.querySelector('.qr-delete-btn');

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
    const row = button.closest('.qr-row');
    if (!row) return;

    const action = button.dataset.action;
    if (action === 'save') handleSave(row);
    else if (action === 'toggle') handleToggle(row);
    else if (action === 'delete') handleDelete(row);
}

// --- Sürükle-bırak sıralama (kategori içinde) ---
let dragRow = null;

function handleDragStart(e) {
    const row = e.target.closest('.qr-row');
    if (!row) return;
    dragRow = row;
    row.classList.add('qr-dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (!dragRow) return;
    const row = e.target.closest('.qr-row');
    if (!row || row === dragRow) return;

    // Sadece aynı kategori içinde sürüklemeye izin ver
    const fromSection = dragRow.closest('.qr-category-section');
    const toSection = row.closest('.qr-category-section');
    if (fromSection !== toSection) return;

    e.preventDefault();
    const rect = row.getBoundingClientRect();
    const after = (e.clientY - rect.top) > rect.height / 2;
    const parent = row.parentElement;
    parent.insertBefore(dragRow, after ? row.nextSibling : row);
}

async function handleDrop(e) {
    if (!dragRow) return;
    e.preventDefault();
    const section = dragRow.closest('.qr-category-section');
    dragRow.classList.remove('qr-dragging');
    dragRow = null;
    if (!section) return;

    // Bu kategorideki yeni sırayı topla ve kaydet
    const rows = [...section.querySelectorAll('.qr-row')];
    const updates = {};
    rows.forEach((row, index) => {
        const id = row.dataset.id;
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
    if (dragRow) dragRow.classList.remove('qr-dragging');
    dragRow = null;
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

    // Yeni ürünü kategorinin sonuna yerleştir
    const maxOrder = Object.values(items)
        .filter(i => i.category === category)
        .reduce((max, i) => Math.max(max, i.order ?? 0), -1);

    const newItem = {
        name,
        price: parseFloat(document.getElementById('new-qr-price').value) || 0,
        category,
        image: document.getElementById('new-qr-image').value.trim(),
        order: maxOrder + 1,
        hidden: false,
    };

    try {
        setButtonLoading(button, true, 'Ekleniyor...');
        const id = await addQrItem(newItem);
        items[id] = newItem;
        addForm.reset();
        document.getElementById('new-qr-price').value = '0';
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
    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragend', handleDragEnd);
}

initializePage();
