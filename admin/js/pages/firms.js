import { checkAuth } from '../auth.js';
import { getFirms, updateFirm } from '../services/firmService.js';
import { showToast, setButtonLoading } from '../ui/feedback.js';

const firmsContainer = document.getElementById('firms-container');

async function renderFirms() {
    const firms = await getFirms();
    firmsContainer.innerHTML = '';

    for (const firmKey in firms) {
        const firm = firms[firmKey];
        const firmCard = document.createElement('div');
        firmCard.classList.add('firm-card');
        firmCard.dataset.firmKey = firmKey;

        firmCard.innerHTML = `
            <h3>${firmKey}</h3>
            <div>
                <label for="kesintiOran-${firmKey}">Kesinti Orani (0.34 = %34)</label>
                <input type="number" step="0.01" min="0" id="kesintiOran-${firmKey}" value="${firm.kesintiOran || 0}">
            </div>
            <div>
                <label for="vergiOran-${firmKey}">Vergi Orani (0.34 = %34)</label>
                <input type="number" step="0.01" min="0" id="vergiOran-${firmKey}" value="${firm.vergiOran || 0}">
            </div>
            <button class="save-firm-btn">Kaydet</button>
        `;
        firmsContainer.appendChild(firmCard);
    }
}

async function handleSaveClick(e) {
    if (!e.target.classList.contains('save-firm-btn')) {
        return;
    }

    const button = e.target;
    const firmCard = button.closest('.firm-card');
    const firmKey = firmCard.dataset.firmKey;

    const firms = await getFirms();
    const firmData = firms[firmKey] || {};

    firmData.kesintiOran = parseFloat(document.getElementById(`kesintiOran-${firmKey}`).value) || 0;
    firmData.vergiOran = parseFloat(document.getElementById(`vergiOran-${firmKey}`).value) || 0;

    try {
        setButtonLoading(button, true, 'Kaydediliyor...');
        await updateFirm(firmKey, firmData);
        showToast(`${firmKey} ayari kaydedildi.`, 'success');
    } catch (error) {
        showToast('Firma kaydedilirken hata olustu.', 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

async function initializePage() {
    await checkAuth();
    firmsContainer.addEventListener('click', handleSaveClick);
    await renderFirms();
}

initializePage();
