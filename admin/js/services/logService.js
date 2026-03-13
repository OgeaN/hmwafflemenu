import { ref, get, set } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { db } from '../firebase.js';

async function getLog(dateKey) {
    const logRef = ref(db, `Logs/${dateKey}`);
    const snapshot = await get(logRef);
    if (snapshot.exists()) {
        return snapshot.val();
    } else {
        return null;
    }
}

async function getLogs() {
    const logsRef = ref(db, 'Logs');
    const snapshot = await get(logsRef);
    if (snapshot.exists()) {
        return snapshot.val();
    } else {
        return {};
    }
}

async function saveLog(dateKey, logData) {
    const logRef = ref(db, `Logs/${dateKey}`);
    await set(logRef, logData);
}

export { getLog, getLogs, saveLog };
