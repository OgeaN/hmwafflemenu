import { checkAuth } from '../auth.js';
import { getProducts } from '../services/productService.js';
import { getLog, saveLog } from '../services/logService.js';
import { getFirms } from '../services/firmService.js';
import {
    generateLogKey,
    getLogValueByProduct,
    getExtraMoneyKey,
    getExtraMoneyValue,
    getRevenueKey,
} from '../utils/logMapper.js';
import { showToast, setButtonLoading } from '../ui/feedback.js';

const datePicker = document.getElementById('date-picker');
const salesDataContainer = document.getElementById('sales-data-container');
const saveButton = document.getElementById('save-sales-data');
const paymentKasa = document.getElementById('payment-kasa');
const paymentVisa = document.getElementById('payment-visa');
const manualDateInput = document.getElementById('manual-date');
const dayEndModal = document.getElementById('day-end-modal');
const dayEndClose = document.getElementById('day-end-close');
const dayEndBody = document.getElementById('day-end-body');
const dayEndTitle = document.getElementById('day-end-modal-title');
const dayEndConfirmSave = document.getElementById('day-end-confirm-save');

const channels = ['Kasa', 'Trendyol', 'Yemeksepeti', 'Migros'];
const legacyChannelAliases = {
    kasa: ['america', 'bardak', 'bubble', 'cay', 'cicek', 'cubuk', 'dond', 'duble', 'ekstra', 'gazoz', 'kahve', 'kase', 'meyveli', 'sandvic', 'soda', 'soguk', 'su', 'turk'],
    trendyol: ['bardak', 'bubble', 'cicek', 'cubuk', 'dond', 'duble', 'ekstra', 'gazoz', 'kase', 'meyveli', 'sandvic', 'soda', 'soguk', 'su', 'gelir'],
    yemeksepeti: ['bardak', 'bubble', 'cicek', 'cubuk', 'dond', 'duble', 'ekstra', 'gazoz', 'kase', 'meyveli', 'sandvic', 'soda', 'soguk', 'su', 'gelir'],
    migros: ['bardak', 'bubble', 'cicek', 'cubuk', 'dond', 'duble', 'ekstra', 'gazoz', 'kase', 'meyveli', 'sandvic', 'soda', 'soguk', 'su', 'gelir'],
};

const requiredLegacyKeys = [
    ...legacyChannelAliases.kasa.map((alias) => `kasa_${alias}`),
    ...legacyChannelAliases.trendyol.map((alias) => `trendyol_${alias}`),
    ...legacyChannelAliases.yemeksepeti.map((alias) => `yemeksepeti_${alias}`),
    ...legacyChannelAliases.migros.map((alias) => `migros_${alias}`),
];
const allowedLegacyInputKeySet = new Set(requiredLegacyKeys);
let cachedProducts = {};
let cachedFirms = {};
let pendingSavePayload = null;

function parseManualDateStrict(text) {
    const match = String(text || '').trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
        Number.isNaN(date.getTime())
        || date.getFullYear() !== year
        || date.getMonth() !== month - 1
        || date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

function toDateText(date) {
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}

function toInputDateValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseInputDateStrict(value) {
    const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
        Number.isNaN(date.getTime())
        || date.getFullYear() !== year
        || date.getMonth() !== month - 1
        || date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

function toDateKey(date) {
    return `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
}

function getValidDateContext() {
    const manualDate = parseManualDateStrict(manualDateInput.value);
    if (manualDate) {
        // Manual input is the source of truth in UI. Keep date picker synchronized.
        datePicker.value = toInputDateValue(manualDate);
        manualDateInput.value = toDateText(manualDate);
    }

    if (!datePicker.value) {
        return null;
    }

    const date = parseInputDateStrict(datePicker.value);
    if (!date) {
        return null;
    }

    const dateKey = toDateKey(date);
    if (!/^\d{8}$/.test(dateKey)) {
        return null;
    }

    return {
        date,
        dateKey,
        dateText: toDateText(date),
    };
}

function isSameCalendarDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function normalizeRate(value) {
    const raw = Number(value || 0);
    return raw > 1 ? raw / 100 : raw;
}

function normalizeName(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ç/g, 'c')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/\s+/g, '');
}

function formatCurrency(value) {
    return `${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}

function openDayEndModal() {
    dayEndModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function closeDayEndModal() {
    dayEndModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

function openNativeDatePicker() {
    if (!datePicker) {
        return;
    }

    if (typeof datePicker.showPicker === 'function') {
        datePicker.showPicker();
        return;
    }

    datePicker.focus();
    datePicker.click();
}

function findFirmByChannel(channel) {
    const aliasesByChannel = {
        Trendyol: ['trendyolgo', 'trendyol_yemek'],
        Yemeksepeti: ['yemeksepeti', 'yemeksepeti.com'],
        Migros: ['migroshemen', 'migroshemenyemek'],
        Kasa: ['kasa'],
    };

    const wanted = [normalizeName(channel), ...(aliasesByChannel[channel] || []).map(normalizeName)];
    for (const [firmKey, firm] of Object.entries(cachedFirms || {})) {
        if (wanted.includes(normalizeName(firmKey))) {
            return { firmKey, firm };
        }
    }
    return null;
}

function getChannelGrossTotals(logData) {
    const revenues = { kasa: 0, trendyol: 0, yemeksepeti: 0, migros: 0 };

    for (const productKey in cachedProducts) {
        const product = cachedProducts[productKey];
        const productName = product.urunAdi || productKey;

        revenues.kasa += (Number(logData[generateLogKey('Kasa', productName)] || 0) * Number(product.storePrice || 0));
        revenues.trendyol += (Number(logData[generateLogKey('Trendyol', productName)] || 0) * Number(product.trendyolPrice || 0));
        revenues.yemeksepeti += (Number(logData[generateLogKey('Yemeksepeti', productName)] || 0) * Number(product.yemeksepetiPrice || 0));
        revenues.migros += (Number(logData[generateLogKey('Migros', productName)] || 0) * Number(product.migrosPrice || 0));
    }

    channels.forEach((channel) => {
        const ch = channel.toLowerCase();
        revenues[ch] += Number(logData[getExtraMoneyKey(channel)] || 0);
    });

    return revenues;
}

function calculateDayEndSummary(logData) {
    const grossByChannel = getChannelGrossTotals(logData);
    const lines = channels.map((channel) => {
        const ch = channel.toLowerCase();
        const gross = Number(grossByChannel[ch] || 0);
        const firmHit = findFirmByChannel(channel);
        const kesintiRate = normalizeRate(firmHit?.firm?.kesintiOran || 0);
        const vergiRate = normalizeRate(firmHit?.firm?.vergiOran || 0);
        const commissionAmount = gross * kesintiRate;
        const taxOnCommission = commissionAmount * vergiRate;
        const net = channel === 'Kasa' ? gross : Math.max(0, gross - commissionAmount - taxOnCommission);

        return {
            channel,
            gross,
            net,
            kesintiRate,
            vergiRate,
        };
    });

    const totalGross = lines.reduce((sum, item) => sum + item.gross, 0);
    const totalNet = lines.reduce((sum, item) => sum + item.net, 0);
    const kasaGross = lines.find((item) => item.channel === 'Kasa')?.gross || 0;
    const paymentsTotal = (parseFloat(paymentKasa.value) || 0) + (parseFloat(paymentVisa.value) || 0);
    const paymentDiff = paymentsTotal - kasaGross;

    return {
        lines,
        totalGross,
        totalNet,
        kasaGross,
        paymentsTotal,
        paymentDiff,
    };
}

function renderDayEndSummary(summary, dateText, canSave, isSaved) {
    const isBalanced = Math.abs(summary.paymentDiff) < 0.01;
    const diffText = summary.paymentDiff > 0
        ? `Fazla giris: ${formatCurrency(summary.paymentDiff)}`
        : summary.paymentDiff < 0
            ? `Eksik giris: ${formatCurrency(Math.abs(summary.paymentDiff))}`
            : 'Kasa satisi ile Kasa+Visa eslesiyor.';

    dayEndTitle.textContent = `Gun Sonu Ozeti (${dateText})`;
    dayEndBody.innerHTML = `
        <div class="day-end-selected-date">
            <span>Secili Kayit Tarihi</span>
            <strong>${dateText}</strong>
        </div>

        <div class="day-end-balance ${isBalanced ? 'is-success' : 'is-error'}">
            Kasa Satis Tutari: <strong>${formatCurrency(summary.kasaGross)}</strong> | 
            Kasa+Visa: <strong>${formatCurrency(summary.paymentsTotal)}</strong> | 
            ${diffText}
        </div>

        <table class="day-end-summary-table">
            <thead>
                <tr>
                    <th>Kanal</th>
                    <th>Normal Toplam</th>
                    <th>Eksiltilmis Toplam</th>
                </tr>
            </thead>
            <tbody>
                ${summary.lines.map((line) => `
                    <tr>
                        <td>${line.channel}${line.channel !== 'Kasa' ? ` <small>(K:%${(line.kesintiRate * 100).toFixed(2)} V:%${(line.vergiRate * 100).toFixed(2)})</small>` : ''}</td>
                        <td>${formatCurrency(line.gross)}</td>
                        <td><strong>${formatCurrency(line.net)}</strong></td>
                    </tr>
                `).join('')}
                <tr>
                    <td><strong>Toplam</strong></td>
                    <td>${formatCurrency(summary.totalGross)}</td>
                    <td><strong>${formatCurrency(summary.totalNet)}</strong></td>
                </tr>
            </tbody>
        </table>
        <p style="margin-top:10px; color:#64748b;">
            ${isSaved ? 'Kayit basariyla yapildi.' : canSave ? 'Kontrol tamam. Kaydet butonuyla kaydi tamamlayin.' : 'Kayit yapilamadi. Kasa ve Kasa+Visa esit olmali.'}
        </p>
    `;

    dayEndConfirmSave.disabled = !canSave || isSaved;
    dayEndConfirmSave.textContent = isSaved ? 'Kaydedildi' : 'Kaydet';

    openDayEndModal();
}

function collectLogDataFromInputs(dateContext) {
    const logData = {};
    const inputs = salesDataContainer.querySelectorAll('input');
    inputs.forEach((input) => {
        if (allowedLegacyInputKeySet.has(input.id)) {
            logData[input.id] = parseInt(input.value, 10) || 0;
        }
    });

    channels.forEach((channel) => {
        const extraKey = getExtraMoneyKey(channel);
        logData[`${channel.toLowerCase()}_ekstra_para`] = Number(logData[extraKey] || 0);
    });

    // Enforce required legacy key schema for desktop compatibility.
    requiredLegacyKeys.forEach((key) => {
        logData[key] = Number(logData[key] || 0);
    });

    logData.payment_kasa = parseFloat(paymentKasa.value) || 0;
    logData.payment_visa = parseFloat(paymentVisa.value) || 0;

    // Desktop app compatibility: keep explicit date field non-null in each record.
    logData.Tarih = dateContext.dateText;
    logData.tarih = dateContext.dateText;
    logData.tarihKey = dateContext.dateKey;

    return logData;
}

function applyLegacySummaryFields(logData, summary) {
    const lineByChannel = Object.fromEntries(summary.lines.map((line) => [line.channel.toLowerCase(), line]));
    const kasaLine = lineByChannel.kasa;
    const trendyolLine = lineByChannel.trendyol;
    const yemeksepetiLine = lineByChannel.yemeksepeti;
    const migrosLine = lineByChannel.migros;

    logData.trendyol_gelir = Number((trendyolLine?.net || 0).toFixed(2));
    logData.yemeksepeti_gelir = Number((yemeksepetiLine?.net || 0).toFixed(2));
    logData.migros_gelir = Number((migrosLine?.net || 0).toFixed(2));

    const paymentTotal = Number(logData.payment_kasa || 0) + Number(logData.payment_visa || 0);
    const firmalarToplami = Number((
        Number(trendyolLine?.net || 0)
        + Number(yemeksepetiLine?.net || 0)
        + Number(migrosLine?.net || 0)
    ).toFixed(2));

    logData.firmalar_toplami = firmalarToplami;
    logData.gun_sonu = Number((paymentTotal + firmalarToplami).toFixed(2));
    logData.gunsonu = logData.gun_sonu;
    logData.toplam_gelir = Number((Number(kasaLine?.gross || 0) + firmalarToplami).toFixed(2));

    // Keep revenue fields in legacy schema.
    logData[getRevenueKey('Trendyol')] = logData.trendyol_gelir;
    logData[getRevenueKey('Yemeksepeti')] = logData.yemeksepeti_gelir;
    logData[getRevenueKey('Migros')] = logData.migros_gelir;
}

async function loadSalesData() {
    const dateContext = getValidDateContext();
    if (!dateContext) {
        showToast('Gecerli bir tarih secin.', 'error');
        return;
    }

    const logData = await getLog(dateContext.dateKey);
    const products = await getProducts();
    cachedProducts = products;

    salesDataContainer.innerHTML = '';

    const productOrderMap = [
        'cicek', 'bubble', 'bardak', 'sandvic', 'cubuk', 'kase', 'duble',
        'soguk', 'icecek', 'su', 'm. soda', 'meyveli', 'soda', 'gazoz',
        'dond', 'cay', 'sut', 'turk', 'america'
    ];

    function getProductSortIndex(name) {
        const normalized = String(name || '').toLowerCase()
            .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
            .replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u');
            
        for (let i = 0; i < productOrderMap.length; i++) {
            if (normalized.includes(productOrderMap[i])) {
                return i;
            }
        }
        return 999;
    }

    const sortedProductKeys = Object.keys(products).sort((a, b) => {
        const nameA = products[a].urunAdi || a;
        const nameB = products[b].urunAdi || b;
        return getProductSortIndex(nameA) - getProductSortIndex(nameB) || nameA.localeCompare(nameB);
    });

    for (const channel of channels) {
        const channelContainer = document.createElement('div');
        channelContainer.classList.add('channel-column');
        channelContainer.innerHTML = `<h3>${channel.toUpperCase()}</h3>`;

        for (const productKey of sortedProductKeys) {
            const product = products[productKey];
            const productName = product.urunAdi || productKey;

            // Sıcak içecekler genelde sadece Kasa'da olur, ekran görüntüsünde Online kanallarda yok
            const isHotDrink = /kahve|çay|cay|espresso|americano|süt/i.test(productName);
            if (channel.toLowerCase() !== 'kasa' && isHotDrink) {
                continue;
            }

            const logKey = generateLogKey(channel, productName);
            const quantity = getLogValueByProduct(logData || {}, channel, productName);

            let displayName = productName;
            // Ekranda yer kaplamaması ve ekran görüntüsündeki gibi görünmesi için online kanallarda kısaltmalar:
            if (channel.toLowerCase() !== 'kasa') {
                displayName = displayName.replace(/Waffle/gi, '').trim();
                displayName = displayName.replace(/So[gğ]uk/gi, '').trim();
            }

            const productRow = document.createElement('div');
            productRow.classList.add('sales-input-row');
            productRow.innerHTML = `
                <label for="${logKey}">${displayName}:</label>
                <div class="input-with-button">
                    <input type="number" id="${logKey}" value="${quantity}" min="0">
                    <button class="increment-btn">+</button>
                </div>
            `;
            channelContainer.appendChild(productRow);
        }
        
        // Add "Eks. Para" field based on screenshots
        const extraMoneyKey = getExtraMoneyKey(channel);
        const extraMoneyValue = getExtraMoneyValue(logData || {}, channel);
        const extraMoneyRow = document.createElement('div');
        extraMoneyRow.classList.add('sales-input-row');
        extraMoneyRow.innerHTML = `
            <label for="${extraMoneyKey}">Eks. Para:</label>
            <div class="input-with-button">
                 <input type="number" id="${extraMoneyKey}" value="${extraMoneyValue}" min="0">
                 <span>?</span>
            </div>
        `;
        channelContainer.appendChild(extraMoneyRow);

        salesDataContainer.appendChild(channelContainer);
    }

    paymentKasa.value = logData?.payment_kasa || 0;
    paymentVisa.value = logData?.payment_visa || 0;

    // Add increment functionality
    salesDataContainer.querySelectorAll('.increment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.target.previousElementSibling;
            input.value = (parseInt(input.value) || 0) + 1;
        });
    });
}

async function initializePage() {
    await checkAuth();
    cachedFirms = await getFirms();

    // Default to today
    const today = new Date();
    manualDateInput.value = toDateText(today);
    datePicker.value = toInputDateValue(today);

    // Functions
    const setDateFromManual = () => {
        const d = parseManualDateStrict(manualDateInput.value);
        if (d) {
            datePicker.value = toInputDateValue(d);
            loadSalesData();
        } else {
            showToast('Tarih formati gecersiz. GG.AA.YYYY kullanin.', 'error');
        }
    };

    manualDateInput.addEventListener('change', setDateFromManual);
    manualDateInput.addEventListener('click', openNativeDatePicker);
    manualDateInput.addEventListener('focus', openNativeDatePicker);

    datePicker.addEventListener('change', () => {
        const d = parseInputDateStrict(datePicker.value);
        if (!d) {
            showToast('Gecerli bir tarih secin.', 'error');
            return;
        }
        manualDateInput.value = toDateText(d);
        loadSalesData();
    });

    saveButton.addEventListener('click', async () => {
        const dateContext = getValidDateContext();
        if (!dateContext) {
            showToast('Kayit icin gecerli tarih secin.', 'error');
            return;
        }

        const logData = collectLogDataFromInputs(dateContext);
        const summary = calculateDayEndSummary(logData);
        const dateText = dateContext.dateText;

        const canSave = Math.abs(summary.paymentDiff) < 0.01;
        applyLegacySummaryFields(logData, summary);

        pendingSavePayload = {
            dateContext,
            logData,
            summary,
        };

        if (!canSave) {
            const issueText = summary.paymentDiff > 0
                ? `Kasa+Visa ${formatCurrency(summary.paymentDiff)} fazla.`
                : `Kasa+Visa ${formatCurrency(Math.abs(summary.paymentDiff))} eksik.`;
            showToast(issueText, 'error');
        }

        renderDayEndSummary(summary, dateText, canSave, false);
    });

    dayEndConfirmSave.addEventListener('click', async () => {
        if (!pendingSavePayload) {
            showToast('Kayit icin once gun sonu ozeti olusturun.', 'error');
            return;
        }

        const { dateContext, logData, summary } = pendingSavePayload;

        if (!isSameCalendarDay(dateContext.date, new Date())) {
            const approved = window.confirm(
                `Secili tarih bugun degil (${dateContext.dateText}). Bu tarihe kaydetmek istediginize emin misiniz?`
            );
            if (!approved) {
                showToast('Kaydetme islemi iptal edildi.', 'info');
                return;
            }
        }

        if (Math.abs(summary.paymentDiff) >= 0.01) {
            showToast('Kasa ve Kasa+Visa esit olmadigi icin kaydedilemez.', 'error');
            renderDayEndSummary(summary, dateContext.dateText, false, false);
            return;
        }

        try {
            setButtonLoading(dayEndConfirmSave, true, 'Kaydediliyor...');
            await saveLog(dateContext.dateKey, logData);
            showToast('Gun sonu kaydedildi.', 'success');
            renderDayEndSummary(summary, dateContext.dateText, true, true);
        } catch (error) {
            showToast('Kaydetme sirasinda hata olustu.', 'error');
        } finally {
            setButtonLoading(dayEndConfirmSave, false, 'Kaydet');
        }
    });

    dayEndClose.addEventListener('click', closeDayEndModal);
    dayEndModal.addEventListener('click', (event) => {
        if (event.target === dayEndModal) {
            closeDayEndModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !dayEndModal.classList.contains('hidden')) {
            closeDayEndModal();
        }
    });

    loadSalesData();
}

initializePage();
