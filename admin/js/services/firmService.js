import { ref, get, set } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { db } from '../firebase.js';

async function getFirms() {
    const firmsRef = ref(db, 'Firmalar');
    const snapshot = await get(firmsRef);
    if (snapshot.exists()) {
        return snapshot.val();
    } else {
        return {};
    }
}

async function updateFirm(firmKey, firmData) {
    const firmRef = ref(db, `Firmalar/${firmKey}`);
    await set(firmRef, firmData);
}

export { getFirms, updateFirm };
