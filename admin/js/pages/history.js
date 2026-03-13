import { checkAuth } from '../auth.js';
import { getLogs } from '../services/logService.js';
import { getProducts } from '../services/productService.js';
import { getExtraMoneyValue } from '../utils/logMapper.js';
import { showToast } from '../ui/feedback.js';
import {
    formatCurrency,
    buildHistoryRows,
    filterRows,
    paginateRows,
    getAvailableYears,
    calculateYearlyDistribution,
    pickKeysByMonthlyOrRangeFilter,
    calculateTotalsByKeys,
    calculateProductSalesByKeys,
} from '../services/historyService.js';

let chartInstances = {};

const dom = {
    historyContainer: document.getElementById('history-container'),
    startDateInput: document.getElementById('start-date'),
    endDateInput: document.getElementById('end-date'),
    filterBtn: document.getElementById('filter-btn'),
    searchInput: document.getElementById('history-search'),
    prevPageBtn: document.getElementById('prev-page-btn'),
    nextPageBtn: document.getElementById('next-page-btn'),
    pageInfo: document.getElementById('page-info'),
    sumTotalRecords: document.getElementById('sum-total-records'),
    sumFilteredRecords: document.getElementById('sum-filtered-records'),
    sumFilteredRevenue: document.getElementById('sum-filtered-revenue'),
    distributionYearSelect: document.getElementById('distribution-year'),
    yearlyDistributionList: document.getElementById('yearly-distribution-list'),
    dayDetailModal: document.getElementById('day-detail-modal'),
    dayDetailClose: document.getElementById('day-detail-close'),
    dayDetailModalTitle: document.getElementById('day-detail-modal-title'),
    dayDetailModalBody: document.getElementById('day-detail-modal-body'),
    periodProductsModal: document.getElementById('period-products-modal'),
    periodProductsClose: document.getElementById('period-products-close'),
    periodProductsTitle: document.getElementById('period-products-title'),
    periodProductsBody: document.getElementById('period-products-body'),
    monthInput: document.getElementById('month-input'),
    rangeInput: document.getElementById('range-input'),
    calculateBtn: document.getElementById('calculate-btn'),
    showProductTotalsBtn: document.getElementById('show-product-totals-btn'),
    resKasa: document.getElementById('res-kasa'),
    resTrendyol: document.getElementById('res-trendyol'),
    resYemeksepeti: document.getElementById('res-yemeksepeti'),
    resMigros: document.getElementById('res-migros'),
    resTotal: document.getElementById('res-total'),
};

const state = {
    pageSize: 15,
    currentPage: 1,
    selectedDateKey: null,
    allRows: [],
    filteredRows: [],
    logs: {},
    products: {},
};

function formatMonthOptionLabel(value) {
    const [year, month] = String(value || '').split('-');
    const monthNames = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
    const monthIndex = Number(month) - 1;
    if (!year || monthIndex < 0 || monthIndex > 11) {
        return value;
    }
    return `${monthNames[monthIndex]} ${year}`;
}

function populateMonthDropdown() {
    const monthValues = [...new Set(
        Object.keys(state.logs || {}).map((key) => `${key.slice(4)}-${key.slice(2, 4)}`)
    )].sort((a, b) => b.localeCompare(a));

    const currentValue = dom.monthInput.value;
    dom.monthInput.innerHTML = '<option value="">Ay secin</option>';

    monthValues.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = formatMonthOptionLabel(value);
        dom.monthInput.appendChild(option);
    });

    if (monthValues.includes(currentValue)) {
        dom.monthInput.value = currentValue;
    }
}

function initializeRangePicker() {
    if (!window.flatpickr || !dom.rangeInput) {
        return;
    }

    window.flatpickr(dom.rangeInput, {
        mode: 'range',
        dateFormat: 'Y-m-d',
        rangeSeparator: ' to ',
        allowInput: false,
    });
}

function updateSummaryBar() {
    const totalRecords = state.allRows.length;
    const filteredRecords = state.filteredRows.length;
    const filteredRevenue = state.filteredRows.reduce((sum, row) => sum + Number(row.total || 0), 0);

    dom.sumTotalRecords.textContent = String(totalRecords);
    dom.sumFilteredRecords.textContent = String(filteredRecords);
    dom.sumFilteredRevenue.textContent = formatCurrency(filteredRevenue);
}

function openDayModal() {
    dom.dayDetailModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function closeDayModal() {
    dom.dayDetailModal.classList.add('hidden');
    if (dom.periodProductsModal.classList.contains('hidden')) {
        document.body.classList.remove('modal-open');
    }
}

function openPeriodProductsModal() {
    dom.periodProductsModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function closePeriodProductsModal() {
    dom.periodProductsModal.classList.add('hidden');
    if (dom.dayDetailModal.classList.contains('hidden')) {
        document.body.classList.remove('modal-open');
    }
}

function getSelectedPeriodKeys() {
    const monthInput = dom.monthInput.value.trim();
    const rangeInput = dom.rangeInput.value.trim();
    return pickKeysByMonthlyOrRangeFilter(state.logs, monthInput, rangeInput);
}

function setMonthlyResultTotals(totals) {
    dom.resKasa.textContent = formatCurrency(totals.kasa);
    dom.resTrendyol.textContent = formatCurrency(totals.trendyol);
    dom.resYemeksepeti.textContent = formatCurrency(totals.yemeksepeti);
    dom.resMigros.textContent = formatCurrency(totals.migros);
    dom.resTotal.textContent = formatCurrency(
        totals.kasa + totals.trendyol + totals.yemeksepeti + totals.migros
    );
}

function renderDayModal(row) {
    const topFive = row.perProduct.slice(0, 5);
    const extraKasa = getExtraMoneyValue(row.log, 'Kasa');
    const extraTrendyol = getExtraMoneyValue(row.log, 'Trendyol');
    const extraYemeksepeti = getExtraMoneyValue(row.log, 'Yemeksepeti');
    const extraMigros = getExtraMoneyValue(row.log, 'Migros');

    dom.dayDetailModalTitle.textContent = `${row.formattedDate} Detayi`;
    dom.dayDetailModalBody.innerHTML = `
        <div class="day-summary-grid">
            <div><span>Kasa:</span><strong>${formatCurrency(row.kasa)}</strong></div>
            <div><span>Trendyol:</span><strong>${formatCurrency(row.trendyol)}</strong></div>
            <div><span>Yemeksepeti:</span><strong>${formatCurrency(row.yemeksepeti)}</strong></div>
            <div><span>Migros:</span><strong>${formatCurrency(row.migros)}</strong></div>
            <div><span>Toplam Gelir:</span><strong>${formatCurrency(row.total)}</strong></div>
            <div><span>Toplam Satilan Adet:</span><strong>${row.totalSoldQty}</strong></div>
        </div>

        <div class="day-top-products">
            <h4>En Cok Satan 5 Urun</h4>
            ${topFive.length ? `
                <ol>
                    ${topFive.map((item) => `<li>${item.productName} <strong>${item.totalQty} adet</strong></li>`).join('')}
                </ol>
            ` : '<p>Bu gunde satis kaydi yok.</p>'}
        </div>

        <div class="day-extra-grid">
            <div>Eks. Para (Kasa): <strong>${formatCurrency(extraKasa)}</strong></div>
            <div>Eks. Para (Trendyol): <strong>${formatCurrency(extraTrendyol)}</strong></div>
            <div>Eks. Para (Yemeksepeti): <strong>${formatCurrency(extraYemeksepeti)}</strong></div>
            <div>Eks. Para (Migros): <strong>${formatCurrency(extraMigros)}</strong></div>
        </div>

        <div class="day-detail-table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Urun</th>
                        <th>Kasa</th>
                        <th>Trendyol</th>
                        <th>Yemeksepeti</th>
                        <th>Migros</th>
                        <th>Toplam Adet</th>
                    </tr>
                </thead>
                <tbody>
                    ${row.perProduct.length ? row.perProduct.map((line) => `
                        <tr>
                            <td>${line.productName}</td>
                            <td>${line.kasaQty}</td>
                            <td>${line.trendyolQty}</td>
                            <td>${line.yemekQty}</td>
                            <td>${line.migrosQty}</td>
                            <td><strong>${line.totalQty}</strong></td>
                        </tr>
                    `).join('') : '<tr><td colspan="6">Bu gunde urun hareketi yok.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;

    openDayModal();
}

function renderPeriodProductsModal(productTotals, keyCount) {
    const totalQty = productTotals.reduce((sum, item) => sum + item.totalQty, 0);
    const topFive = productTotals.slice(0, 5);

    dom.periodProductsTitle.textContent = `Donem Urun Satislari (${keyCount} gun)`;
    dom.periodProductsBody.innerHTML = `
        <div class="day-summary-grid">
            <div><span>Kayitli Gun:</span><strong>${keyCount}</strong></div>
            <div><span>Urun Cesidi:</span><strong>${productTotals.length}</strong></div>
            <div><span>Toplam Satilan Adet:</span><strong>${totalQty}</strong></div>
        </div>

        <div class="day-top-products">
            <h4>En Cok Satan 5 Urun</h4>
            ${topFive.length ? `
                <ol>
                    ${topFive.map((item) => `<li>${item.productName} <strong>${item.totalQty} adet</strong></li>`).join('')}
                </ol>
            ` : '<p>Bu filtrede urun satisi yok.</p>'}
        </div>

        <div class="day-detail-table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Urun</th>
                        <th>Kasa</th>
                        <th>Trendyol</th>
                        <th>Yemeksepeti</th>
                        <th>Migros</th>
                        <th>Toplam Adet</th>
                    </tr>
                </thead>
                <tbody>
                    ${productTotals.length ? productTotals.map((line) => `
                        <tr>
                            <td>${line.productName}</td>
                            <td>${line.kasaQty}</td>
                            <td>${line.trendyolQty}</td>
                            <td>${line.yemekQty}</td>
                            <td>${line.migrosQty}</td>
                            <td><strong>${line.totalQty}</strong></td>
                        </tr>
                    `).join('') : '<tr><td colspan="6">Bu filtrede urun hareketi yok.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;

    openPeriodProductsModal();
}

function drawSimpleBarChart(canvasId, values, labels, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const isLineChart = canvasId === 'yearly-distribution-chart';
    
    chartInstances[canvasId] = new window.Chart(ctx, {
        type: isLineChart ? 'bar' : 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Satislar (?)',
                data: values,
                backgroundColor: color,
                borderColor: color,
                borderWidth: isLineChart ? 2 : 0,
                borderRadius: isLineChart ? 0 : 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function drawStackedMonthlyChart(monthChannelTotals) {
    const canvas = document.getElementById('monthly-stacked-chart');
    if (!canvas) return;

    if (chartInstances['monthly-stacked-chart']) {
        chartInstances['monthly-stacked-chart'].destroy();
    }

    const labels = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const channels = ['kasa', 'trendyol', 'yemeksepeti', 'migros'];
    const colors = {
        kasa: '#0369a1',
        trendyol: '#f59e0b',
        yemeksepeti: '#e11d48',
        migros: '#f97316',
    };

    const ctx = canvas.getContext('2d');
    
    const datasets = channels.map(channel => ({
        label: channel.charAt(0).toUpperCase() + channel.slice(1),
        data: monthChannelTotals.map(month => month[channel] || 0),
        backgroundColor: colors[channel],
        borderWidth: 0,
        stack: 'Stack 0'
    }));

    chartInstances['monthly-stacked-chart'] = new window.Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12 } }
            },
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        }
    });
}

function renderYearlyDistributionList(monthTotals) {
    const labels = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
    dom.yearlyDistributionList.innerHTML = labels
        .map((label, idx) => `<div><span>${label}</span><strong>${formatCurrency(monthTotals[idx] || 0)}</strong></div>`)
        .join('');
}

function renderYearlyDistribution() {
    const year = dom.distributionYearSelect.value;
    const monthLabels = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    if (!year) {
        const zeros = new Array(12).fill(0);
        drawSimpleBarChart('yearly-distribution-chart', zeros, monthLabels, '#1d4ed8');
        drawStackedMonthlyChart(Array.from({ length: 12 }, () => ({ kasa: 0, trendyol: 0, yemeksepeti: 0, migros: 0 })));
        renderYearlyDistributionList(zeros);
        return;
    }

    const { monthTotals, monthChannelTotals } = calculateYearlyDistribution(state.logs, state.products, year);
    drawSimpleBarChart('yearly-distribution-chart', monthTotals, monthLabels, '#1d4ed8');
    drawStackedMonthlyChart(monthChannelTotals);
    renderYearlyDistributionList(monthTotals);
}

function renderTablePage() {
    const page = paginateRows(state.filteredRows, state.currentPage, state.pageSize);
    state.currentPage = page.currentPage || 1;

    if (!page.pageRows.length) {
        dom.historyContainer.innerHTML = '<div class="empty-state">Aramaya uygun kayit bulunamadi.</div>';
        dom.pageInfo.textContent = 'Sayfa 0 / 0';
        dom.prevPageBtn.disabled = true;
        dom.nextPageBtn.disabled = true;
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Tarih</th>
                <th>Kasa</th>
                <th>Trendyol</th>
                <th>Yemeksepeti</th>
                <th>Migros</th>
                <th>Toplam</th>
            </tr>
        </thead>
        <tbody>
            ${page.pageRows.map((row) => `
                <tr class="history-row-clickable ${row.dateKey === state.selectedDateKey ? 'is-selected' : ''}" data-date-key="${row.dateKey}">
                    <td>${row.formattedDate}</td>
                    <td>${formatCurrency(row.kasa)}</td>
                    <td>${formatCurrency(row.trendyol)}</td>
                    <td>${formatCurrency(row.yemeksepeti)}</td>
                    <td>${formatCurrency(row.migros)}</td>
                    <td><strong>${formatCurrency(row.total)}</strong></td>
                </tr>
            `).join('')}
        </tbody>
    `;

    dom.historyContainer.innerHTML = '';
    dom.historyContainer.appendChild(table);

    table.querySelector('tbody').addEventListener('click', (event) => {
        const rowEl = event.target.closest('tr[data-date-key]');
        if (!rowEl) {
            return;
        }

        state.selectedDateKey = rowEl.dataset.dateKey;
        renderTablePage();
        const selectedRow = state.allRows.find((row) => row.dateKey === state.selectedDateKey);
        if (selectedRow) {
            renderDayModal(selectedRow);
        }
    });

    dom.pageInfo.textContent = `Sayfa ${page.currentPage} / ${page.totalPages}`;
    dom.prevPageBtn.disabled = page.currentPage <= 1;
    dom.nextPageBtn.disabled = page.currentPage >= page.totalPages;
}

function applySearchAndRender() {
    state.filteredRows = filterRows(state.allRows, dom.searchInput.value);
    state.currentPage = 1;
    updateSummaryBar();
    renderTablePage();
}

async function loadHistoryData() {
    state.logs = await getLogs();
    state.products = await getProducts();
    populateMonthDropdown();

    if (!Object.keys(state.logs).length) {
        state.allRows = [];
        state.filteredRows = [];
        updateSummaryBar();
        renderTablePage();
        return;
    }

    const startDate = dom.startDateInput.value ? new Date(dom.startDateInput.value) : null;
    const endDate = dom.endDateInput.value ? new Date(dom.endDateInput.value) : null;

    state.allRows = buildHistoryRows(state.logs, state.products, startDate, endDate);
    applySearchAndRender();

    const availableYears = getAvailableYears(state.logs);
    dom.distributionYearSelect.innerHTML = availableYears
        .map((year) => `<option value="${year}">${year}</option>`)
        .join('');

    const currentYear = new Date().getFullYear();
    if (availableYears.includes(currentYear)) {
        dom.distributionYearSelect.value = String(currentYear);
    }

    renderYearlyDistribution();
}

async function handleMonthlyCalculate() {
    const { keys, error } = getSelectedPeriodKeys();
    if (error) {
        showToast(error, 'error');
        return;
    }

    if (!keys.length) {
        showToast('Hesaplama icin secilen filtrede kayit yok.', 'info');
        const emptyTotals = { kasa: 0, trendyol: 0, yemeksepeti: 0, migros: 0 };
        setMonthlyResultTotals(emptyTotals);
        drawSimpleBarChart('monthly-chart', [0, 0, 0, 0], ['Kasa', 'Trendyol', 'Yemeksepeti', 'Migros'], '#334155');
        return;
    }

    const totals = calculateTotalsByKeys(state.logs, state.products, keys);
    setMonthlyResultTotals(totals);
    drawSimpleBarChart(
        'monthly-chart',
        [totals.kasa, totals.trendyol, totals.yemeksepeti, totals.migros],
        ['Kasa', 'Trendyol', 'Yemeksepeti', 'Migros'],
        '#0f172a'
    );
}

function handleShowProductTotals() {
    const { keys, error } = getSelectedPeriodKeys();
    if (error) {
        showToast(error, 'error');
        return;
    }

    if (!keys.length) {
        showToast('Secilen filtrede urun satis kaydi yok.', 'info');
        return;
    }

    const productTotals = calculateProductSalesByKeys(state.logs, state.products, keys);
    renderPeriodProductsModal(productTotals, keys.length);
}

function wireEvents() {
    dom.filterBtn.addEventListener('click', loadHistoryData);
    dom.searchInput.addEventListener('input', applySearchAndRender);

    dom.prevPageBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage -= 1;
            renderTablePage();
        }
    });

    dom.nextPageBtn.addEventListener('click', () => {
        const page = paginateRows(state.filteredRows, state.currentPage, state.pageSize);
        if (state.currentPage < page.totalPages) {
            state.currentPage += 1;
            renderTablePage();
        }
    });

    dom.calculateBtn.addEventListener('click', handleMonthlyCalculate);
    dom.showProductTotalsBtn.addEventListener('click', handleShowProductTotals);
    dom.distributionYearSelect.addEventListener('change', renderYearlyDistribution);

    dom.dayDetailClose.addEventListener('click', closeDayModal);
    dom.periodProductsClose.addEventListener('click', closePeriodProductsModal);
    dom.dayDetailModal.addEventListener('click', (event) => {
        if (event.target === dom.dayDetailModal) {
            closeDayModal();
        }
    });
    dom.periodProductsModal.addEventListener('click', (event) => {
        if (event.target === dom.periodProductsModal) {
            closePeriodProductsModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !dom.dayDetailModal.classList.contains('hidden')) {
            closeDayModal();
        }
        if (event.key === 'Escape' && !dom.periodProductsModal.classList.contains('hidden')) {
            closePeriodProductsModal();
        }
    });
}

async function initializePage() {
    await checkAuth();
    initializeRangePicker();
    wireEvents();
    await loadHistoryData();

    drawSimpleBarChart('monthly-chart', [0, 0, 0, 0], ['Kasa', 'Trendyol', 'Yemeksepeti', 'Migros'], '#334155');
}

initializePage();
