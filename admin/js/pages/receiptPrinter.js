import { checkAuth } from '../auth.js';
import { getProducts } from '../services/productService.js';
import { showToast } from '../ui/feedback.js';

const productsGrid = document.getElementById('receipt-products-grid');
const preview = document.getElementById('receipt-preview');
const printBtn = document.getElementById('receipt-print-btn');
const clearBtn = document.getElementById('receipt-clear-btn');
const priceSourceSelect = document.getElementById('receipt-price-source');
const storeNameInput = document.getElementById('receipt-store-name');

let products = {};
let selectedItems = {};

function formatPrice(value) {
    return Number(value || 0).toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatCurrency(value) {
    return `${formatPrice(value)} ₺`;
}

function getUnitPrice(product, sourceKey) {
    const value = Number(product?.[sourceKey] ?? 0);
    return Number.isFinite(value) ? value : 0;
}

function sortProductEntries(entries) {
    return entries.sort((a, b) => {
        const aName = (a[1]?.urunAdi || a[0] || '').toString();
        const bName = (b[1]?.urunAdi || b[0] || '').toString();
        return aName.localeCompare(bName, 'tr');
    });
}

function getSelectedKeys() {
    return Object.keys(selectedItems).filter((key) => (selectedItems[key]?.quantity || 0) > 0);
}

function renderPreview() {
    const now = new Date();
    const selectedKeys = getSelectedKeys();

    if (!selectedKeys.length) {
        preview.innerHTML = `
            <div class="receipt-empty">Onizleme icin soldan en az bir urun secin.</div>
        `;
        return;
    }

    let total = 0;
    const rows = selectedKeys.map((key) => {
        const item = selectedItems[key];
        const lineTotal = item.quantity * item.unitPrice;
        total += lineTotal;

        return `
            <div class="receipt-line">
                <div class="receipt-line-top">
                    <span class="receipt-item-name">${item.name}</span>
                    <span class="receipt-item-total">${formatCurrency(lineTotal)}</span>
                </div>
                <div class="receipt-line-sub">${item.quantity} x ${formatCurrency(item.unitPrice)}</div>
            </div>
        `;
    }).join('');

    preview.innerHTML = `
        <div class="receipt-header">
            <img class="receipt-logo-image" src="../assets/menu-images/hmwaffle.png" alt="HM Waffle Logo">
            <div class="receipt-brand-text">
                <h4>${storeNameInput.value.trim() || 'HM Waffle'}</h4>
                <div class="receipt-meta">Waffle & Tatli</div>
            </div>
            <div class="receipt-meta">${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR')}</div>
        </div>
        <div class="receipt-items">${rows}</div>
        <div class="receipt-total-row">
            <span>TOPLAM</span>
            <strong>${formatCurrency(total)}</strong>
        </div>
        <img class="receipt-waffle-stamp" src="../assets/menu-images/waffle.png" alt="Waffle">
        <div class="receipt-footer">Afiyet olsun</div>
    `;
}

function ensureSelectedItem(productKey) {
    if (selectedItems[productKey]) {
        return selectedItems[productKey];
    }

    const product = products[productKey] || {};
    const item = {
        name: product.urunAdi || productKey,
        quantity: 0,
        unitPrice: getUnitPrice(product, priceSourceSelect.value),
    };
    selectedItems[productKey] = item;
    return item;
}

function updateCardState(productKey) {
    const card = productsGrid.querySelector(`[data-product-key="${productKey}"]`);
    if (!card) {
        return;
    }

    const item = ensureSelectedItem(productKey);
    card.classList.toggle('is-selected', item.quantity > 0);
    const qtyBadge = card.querySelector('.receipt-card-qty');
    if (qtyBadge) {
        qtyBadge.textContent = item.quantity;
    }
}

function incrementProduct(productKey, amount = 1) {
    const item = ensureSelectedItem(productKey);
    item.quantity = Math.max(0, (item.quantity || 0) + amount);
    updateCardState(productKey);
    renderPreview();
}

function decrementProduct(productKey) {
    const item = ensureSelectedItem(productKey);
    item.quantity = Math.max(0, (item.quantity || 0) - 1);
    updateCardState(productKey);
    renderPreview();
}

function bindCardEvents(card, productKey) {
    const minusBtn = card.querySelector('.receipt-card-minus');
    const resetBtn = card.querySelector('.receipt-card-reset');

    card.addEventListener('click', (event) => {
        if (event.target.closest('.receipt-card-minus') || event.target.closest('.receipt-card-reset')) {
            return;
        }
        incrementProduct(productKey, 1);
    });

    minusBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        decrementProduct(productKey);
    });

    resetBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const item = ensureSelectedItem(productKey);
        item.quantity = 0;
        updateCardState(productKey);
        renderPreview();
    });
}

function renderProductCards() {
    const sourceKey = priceSourceSelect.value;
    const entries = sortProductEntries(Object.entries(products));

    if (!entries.length) {
        productsGrid.innerHTML = '<div class="empty-state">Urun bulunamadi.</div>';
        renderPreview();
        return;
    }

    productsGrid.innerHTML = entries.map(([productKey, product]) => {
        const cached = selectedItems[productKey];
        const quantity = Math.max(0, cached?.quantity || 0);
        const unitPrice = getUnitPrice(product, sourceKey);

        selectedItems[productKey] = {
            name: product.urunAdi || productKey,
            quantity,
            unitPrice,
        };

        return `
            <article class="receipt-product-card ${quantity > 0 ? 'is-selected' : ''}" data-product-key="${productKey}" role="button" tabindex="0" aria-label="${product.urunAdi || productKey}">
                <div class="receipt-card-top">
                    <h4>${product.urunAdi || productKey}</h4>
                    <span class="receipt-card-price">${formatCurrency(unitPrice)}</span>
                </div>
                <div class="receipt-card-bottom">
                    <button type="button" class="receipt-card-minus" aria-label="Azalt">-</button>
                    <span class="receipt-card-qty">${quantity}</span>
                    <button type="button" class="receipt-card-reset" aria-label="Sifirla">0</button>
                </div>
            </article>
        `;
    }).join('');

    productsGrid.querySelectorAll('.receipt-product-card').forEach((card) => {
        const productKey = card.dataset.productKey;
        bindCardEvents(card, productKey);
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                incrementProduct(productKey, 1);
            }
        });
    });

    renderPreview();
}

async function initializePage() {
    await checkAuth();

    products = await getProducts();
    renderProductCards();

    priceSourceSelect.addEventListener('change', () => {
        const sourceKey = priceSourceSelect.value;

        Object.entries(products).forEach(([productKey, product]) => {
            const line = ensureSelectedItem(productKey);
            line.name = product.urunAdi || productKey;
            line.unitPrice = getUnitPrice(product, sourceKey);
        });

        renderProductCards();
    });

    storeNameInput.addEventListener('input', renderPreview);

    clearBtn.addEventListener('click', () => {
        Object.keys(selectedItems).forEach((productKey) => {
            selectedItems[productKey].quantity = 0;
            updateCardState(productKey);
        });
        renderPreview();
    });

    printBtn.addEventListener('click', () => {
        const hasSelected = getSelectedKeys().length > 0;
        if (!hasSelected) {
            showToast('Yazdirmak icin en az bir urun secin.', 'error');
            return;
        }
        window.print();
    });
}

initializePage().catch(() => {
    showToast('Sayfa yuklenirken hata olustu.', 'error');
});
