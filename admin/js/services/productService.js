import { ref, get, set } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { db } from '../firebase.js';

function toNumber(value) {
    if (typeof value === 'string') {
        const normalized = value.replace(',', '.').trim();
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function toFlatNumber(value) {
    if (value && typeof value === 'object') {
        const nested = pickFirst(
            value,
            ['value', 'fiyat', 'price', 'storePrice', 'kasa', 'dukkan', 'amount'],
            0
        );
        return toNumber(nested);
    }
    return toNumber(value);
}

function pickFirst(item, keys, fallback = '') {
    for (const key of keys) {
        if (item && item[key] !== undefined && item[key] !== null && item[key] !== '') {
            return item[key];
        }
    }
    return fallback;
}

function normalizeProduct(productKey, item = {}) {
    const urunAdi = String(
        pickFirst(item, ['urunAdi', 'urunadi', 'UrunAdi', 'urun_adi', 'name', 'productName'], productKey)
    );

    return {
        urunAdi,
        storePrice: toFlatNumber(pickFirst(item, ['storePrice', 'fiyat', 'Fiyat', 'kasaPrice', 'price'], 0)),
        trendyolPrice: toFlatNumber(pickFirst(item, ['trendyolPrice', 'trendyolFiyat', 'TrendyolFiyat', 'trendFiyat'], 0)),
        yemeksepetiPrice: toFlatNumber(pickFirst(item, ['yemeksepetiPrice', 'yemekSepetiPrice', 'yemekSepFiyat', 'yemeksepetiFiyat'], 0)),
        migrosPrice: toFlatNumber(pickFirst(item, ['migrosPrice', 'migrosFiyat', 'MigrosFiyat'], 0)),
    };
}

function toLegacyProductShape(productKey, item = {}) {
    const normalized = normalizeProduct(productKey, item);
    return {
        urun_adi: normalized.urunAdi,
        fiyat: normalized.storePrice,
        trendFiyat: normalized.trendyolPrice,
        yemekSepetiFiyat: normalized.yemeksepetiPrice,
        migrosFiyat: normalized.migrosPrice,
    };
}

async function getProducts() {
    const productsRef = ref(db, 'Product');
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
        const raw = snapshot.val();
        const normalized = {};
        for (const [productKey, item] of Object.entries(raw)) {
            normalized[productKey] = normalizeProduct(productKey, item);
        }
        return normalized;
    } else {
        return {};
    }
}

async function updateProduct(productKey, productData) {
    const productRef = ref(db, `Product/${productKey}`);
    await set(productRef, toLegacyProductShape(productKey, productData));
}

async function addProduct(productData) {
    const normalized = normalizeProduct('', productData);
    const productKey = String(normalized.urunAdi || '').trim();
    const productRef = ref(db, `Product/${productKey}`);
    await set(productRef, toLegacyProductShape(productKey, normalized));
}

export { getProducts, updateProduct, addProduct };
