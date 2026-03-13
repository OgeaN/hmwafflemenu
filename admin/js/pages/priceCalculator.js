import { checkAuth } from '../auth.js';
import { getFirms } from '../services/firmService.js';
import { calculateFinalPrice, normalizeRate } from '../utils/calculations.js';
import { showToast } from '../ui/feedback.js';

const basePriceInput = document.getElementById('base-price');
const firmSelect = document.getElementById('firm-select');
const calculateBtn = document.getElementById('calculate-btn');
const resultsContainer = document.getElementById('results-container');

let firms = {};

async function populateFirms() {
    firms = await getFirms();
    firmSelect.innerHTML = '';

    if (Object.keys(firms).length === 0) {
        resultsContainer.innerHTML = '<div class="empty-state">Hesaplama icin once firma tanimi ekleyin.</div>';
        return;
    }

    for (const firmKey in firms) {
        const option = document.createElement('option');
        option.value = firmKey;
        option.textContent = firmKey;
        firmSelect.appendChild(option);
    }
}

async function initializePage() {
    await checkAuth();

    calculateBtn.addEventListener('click', () => {
        const basePrice = parseFloat(basePriceInput.value);
        const selectedFirmKey = firmSelect.value;

        if (isNaN(basePrice) || !selectedFirmKey) {
            showToast('Gecerli bir taban fiyat girin ve platform secin.', 'error');
            return;
        }

        const firm = firms[selectedFirmKey];
        const finalPrice = calculateFinalPrice(basePrice, firm.kesintiOran, firm.vergiOran);
        const commissionPercent = normalizeRate(firm.kesintiOran) * 100;
        const taxPercent = normalizeRate(firm.vergiOran) * 100;
        const deductionTotal = basePrice - finalPrice;

        resultsContainer.innerHTML = `
            <div class="result-card">
                <h3>${selectedFirmKey} Icin Hesaplama</h3>
                <p>Brut Tutar: <strong>${basePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</strong></p>
                <p>Komisyon: <strong>%${commissionPercent.toFixed(2)}</strong></p>
                <p>Vergi: <strong>%${taxPercent.toFixed(2)}</strong></p>
                <p>Toplam Kesinti: <strong>${deductionTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</strong></p>
                <h4>Kesinti Sonrasi Net: ${finalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</h4>
            </div>
        `;
    });

    populateFirms();
}

initializePage();
