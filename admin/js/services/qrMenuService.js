import { ref, get, set, push, update, remove } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { db } from '../firebase.js';

const QR_MENU_PATH = 'QrMenu';

function toNumber(value) {
    if (typeof value === 'string') {
        const normalized = value.replace(',', '.').trim();
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeItem(item = {}, fallbackOrder = 0) {
    return {
        name: String(item.name ?? '').trim(),
        price: toNumber(item.price),
        image: String(item.image ?? '').trim(),
        category: String(item.category ?? '').trim(),
        order: Number.isFinite(Number(item.order)) ? Number(item.order) : fallbackOrder,
        hidden: item.hidden === true,
    };
}

async function getQrMenu() {
    const snapshot = await get(ref(db, QR_MENU_PATH));
    if (!snapshot.exists()) {
        return {};
    }
    const raw = snapshot.val();
    const normalized = {};
    let idx = 0;
    for (const [id, item] of Object.entries(raw)) {
        normalized[id] = normalizeItem(item, idx++);
    }
    return normalized;
}

// QrMenu düğümü boşsa seed dizisini bir kez yazar. Yazıldıysa true döner.
async function seedQrMenuIfEmpty(seedArray) {
    const snapshot = await get(ref(db, QR_MENU_PATH));
    if (snapshot.exists()) {
        return false;
    }

    // Kategori-içi sırayı korumak için kategori başına artan order ver.
    const orderByCategory = {};
    const payload = {};
    for (const item of seedArray) {
        const category = String(item.category ?? '').trim();
        const order = orderByCategory[category] ?? 0;
        orderByCategory[category] = order + 1;

        const newRef = push(ref(db, QR_MENU_PATH));
        payload[newRef.key] = normalizeItem({ ...item, order, hidden: false }, order);
    }

    await update(ref(db, QR_MENU_PATH), payload);
    return true;
}

async function updateQrItem(id, data) {
    await set(ref(db, `${QR_MENU_PATH}/${id}`), normalizeItem(data));
}

async function addQrItem(data) {
    const newRef = push(ref(db, QR_MENU_PATH));
    await set(newRef, normalizeItem(data));
    return newRef.key;
}

async function removeQrItem(id) {
    await remove(ref(db, `${QR_MENU_PATH}/${id}`));
}

// updatesMap: { id: orderNumber } — sürükle-bırak sonrası toplu sıra güncelleme.
async function updateOrder(updatesMap) {
    const payload = {};
    for (const [id, order] of Object.entries(updatesMap)) {
        payload[`${id}/order`] = Number(order) || 0;
    }
    await update(ref(db, QR_MENU_PATH), payload);
}

export { getQrMenu, seedQrMenuIfEmpty, updateQrItem, addQrItem, removeQrItem, updateOrder };
