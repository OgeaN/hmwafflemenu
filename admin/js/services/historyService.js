import { parseDateKey } from '../utils/dateUtils.js';
import { getLogValueByProduct, getExtraMoneyValue, getRevenueKey } from '../utils/logMapper.js';

function formatCurrency(value) {
    return `${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}

function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

function parseManualDate(text) {
    const parts = String(text || '').split('.');
    if (parts.length !== 3) {
        return null;
    }

    const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function parseFlexibleDateInput(value) {
    const raw = String(value || '').trim();
    if (!raw) {
        return null;
    }

    if (raw.includes('-')) {
        const date = new Date(raw);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    return parseManualDate(raw);
}

function parseMonthInput(value) {
    const raw = String(value || '').trim();
    if (!raw) {
        return null;
    }

    if (raw.includes('-')) {
        const [yyyy, mm] = raw.split('-');
        if (!yyyy || !mm || yyyy.length !== 4 || mm.length !== 2) {
            return null;
        }
        return { mm, yyyy };
    }

    const [mm, yyyy] = raw.split('.');
    if (!mm || !yyyy || mm.length !== 2 || yyyy.length !== 4) {
        return null;
    }

    return { mm, yyyy };
}

function getProductName(product, fallbackKey) {
    return product?.urunAdi || fallbackKey;
}

function buildPerProductStats(log, products) {
    const productTotals = [];

    for (const [productKey, product] of Object.entries(products || {})) {
        const productName = getProductName(product, productKey);
        const kasaQty = getLogValueByProduct(log, 'Kasa', productName);
        const trendyolQty = getLogValueByProduct(log, 'Trendyol', productName);
        const yemekQty = getLogValueByProduct(log, 'Yemeksepeti', productName);
        const migrosQty = getLogValueByProduct(log, 'Migros', productName);
        const totalQty = kasaQty + trendyolQty + yemekQty + migrosQty;

        if (!totalQty) {
            continue;
        }

        productTotals.push({
            productName,
            kasaQty,
            trendyolQty,
            yemekQty,
            migrosQty,
            totalQty,
        });
    }

    productTotals.sort((a, b) => b.totalQty - a.totalQty);
    return productTotals;
}

function calculateRevenueFromProducts(log, products) {
    const totals = { kasa: 0, trendyol: 0, yemeksepeti: 0, migros: 0 };

    for (const [productKey, product] of Object.entries(products || {})) {
        const productName = getProductName(product, productKey);
        totals.kasa += getLogValueByProduct(log, 'Kasa', productName) * Number(product.storePrice || 0);
        totals.trendyol += getLogValueByProduct(log, 'Trendyol', productName) * Number(product.trendyolPrice || 0);
        totals.yemeksepeti += getLogValueByProduct(log, 'Yemeksepeti', productName) * Number(product.yemeksepetiPrice || 0);
        totals.migros += getLogValueByProduct(log, 'Migros', productName) * Number(product.migrosPrice || 0);
    }

    totals.kasa += getExtraMoneyValue(log, 'Kasa');
    totals.trendyol += getExtraMoneyValue(log, 'Trendyol');
    totals.yemeksepeti += getExtraMoneyValue(log, 'Yemeksepeti');
    totals.migros += getExtraMoneyValue(log, 'Migros');

    return totals;
}

function applyRevenueOverrides(log, totals) {
    const channelRevenueKeys = {
        kasa: getRevenueKey('Kasa'),
        trendyol: getRevenueKey('Trendyol'),
        yemeksepeti: getRevenueKey('Yemeksepeti'),
        migros: getRevenueKey('Migros'),
    };

    const hasRevenueFields = Object.values(channelRevenueKeys).some((key) => log[key] !== undefined);
    if (!hasRevenueFields) {
        return totals;
    }

    return {
        kasa: Number(log[channelRevenueKeys.kasa] ?? totals.kasa) || 0,
        trendyol: Number(log[channelRevenueKeys.trendyol] ?? totals.trendyol) || 0,
        yemeksepeti: Number(log[channelRevenueKeys.yemeksepeti] ?? totals.yemeksepeti) || 0,
        migros: Number(log[channelRevenueKeys.migros] ?? totals.migros) || 0,
    };
}

function buildDailyMetrics(log, products) {
    const computedTotals = calculateRevenueFromProducts(log, products);
    const totals = applyRevenueOverrides(log, computedTotals);
    const perProduct = buildPerProductStats(log, products);

    return {
        totals,
        perProduct,
        totalRevenue: totals.kasa + totals.trendyol + totals.yemeksepeti + totals.migros,
        totalSoldQty: perProduct.reduce((sum, item) => sum + item.totalQty, 0),
    };
}

function buildHistoryRows(logs, products, startDate, endDate) {
    const sortedLogKeys = Object.keys(logs || {}).sort((a, b) => parseDateKey(b) - parseDateKey(a));

    return sortedLogKeys
        .map((dateKey) => {
            const date = parseDateKey(dateKey);
            if ((startDate && date < startDate) || (endDate && date > endDate)) {
                return null;
            }

            const log = logs[dateKey] || {};
            const metrics = buildDailyMetrics(log, products);
            const formattedDate = formatDate(date);

            return {
                dateKey,
                date,
                formattedDate,
                log,
                kasa: metrics.totals.kasa,
                trendyol: metrics.totals.trendyol,
                yemeksepeti: metrics.totals.yemeksepeti,
                migros: metrics.totals.migros,
                total: metrics.totalRevenue,
                perProduct: metrics.perProduct,
                totalSoldQty: metrics.totalSoldQty,
                searchableText: `${formattedDate} ${metrics.perProduct.map((item) => item.productName).join(' ')}`.toLowerCase(),
            };
        })
        .filter(Boolean);
}

function filterRows(rows, term) {
    const normalizedTerm = String(term || '').trim().toLowerCase();
    if (!normalizedTerm) {
        return [...rows];
    }
    return rows.filter((row) => row.searchableText.includes(normalizedTerm));
}

function paginateRows(rows, currentPage, pageSize) {
    if (!rows.length) {
        return {
            totalPages: 0,
            currentPage: 0,
            pageRows: [],
        };
    }

    const totalPages = Math.ceil(rows.length / pageSize);
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * pageSize;

    return {
        totalPages,
        currentPage: safePage,
        pageRows: rows.slice(start, start + pageSize),
    };
}

function getAvailableYears(logs) {
    return [...new Set(Object.keys(logs || {}).map((dateKey) => parseDateKey(dateKey).getFullYear()))]
        .sort((a, b) => b - a);
}

function calculateYearlyDistribution(logs, products, year) {
    const monthTotals = new Array(12).fill(0);
    const monthChannelTotals = Array.from({ length: 12 }, () => ({
        kasa: 0,
        trendyol: 0,
        yemeksepeti: 0,
        migros: 0,
    }));

    const numericYear = Number(year);

    for (const [dateKey, log] of Object.entries(logs || {})) {
        const date = parseDateKey(dateKey);
        if (date.getFullYear() !== numericYear) {
            continue;
        }

        const metrics = buildDailyMetrics(log || {}, products);
        const monthIndex = date.getMonth();

        monthTotals[monthIndex] += metrics.totalRevenue;
        monthChannelTotals[monthIndex].kasa += metrics.totals.kasa;
        monthChannelTotals[monthIndex].trendyol += metrics.totals.trendyol;
        monthChannelTotals[monthIndex].yemeksepeti += metrics.totals.yemeksepeti;
        monthChannelTotals[monthIndex].migros += metrics.totals.migros;
    }

    return { monthTotals, monthChannelTotals };
}

function pickKeysByMonthlyOrRangeFilter(logs, monthInput, rangeInput) {
    if (monthInput) {
        const parsedMonth = parseMonthInput(monthInput);
        if (!parsedMonth) {
            return { error: 'Ay secimi gecersiz. Takvimden ay secin.', keys: [] };
        }

        const { mm, yyyy } = parsedMonth;
        const keys = Object.keys(logs || {}).filter((key) => key.slice(2, 4) === mm && key.slice(4) === yyyy);
        return { keys };
    }

    if (rangeInput) {
        const parts = String(rangeInput)
            .trim()
            .split(/\s+to\s+|\s+-\s+/)
            .filter(Boolean);

        const startDate = parseFlexibleDateInput(parts[0]);
        const endDate = parseFlexibleDateInput(parts[1] || parts[0]);

        if (!startDate || !endDate) {
            return { error: 'Tarih araligi gecersiz. Takvimden baslangic ve bitis secin.', keys: [] };
        }

        const keys = Object.keys(logs || {}).filter((key) => {
            const logDate = parseDateKey(key);
            return logDate >= startDate && logDate <= endDate;
        });

        return { keys };
    }

    return { error: 'Hesaplama icin bir ay ya da tarih araligi secin.', keys: [] };
}

function calculateTotalsByKeys(logs, products, keys) {
    const totals = { kasa: 0, trendyol: 0, yemeksepeti: 0, migros: 0 };

    keys.forEach((key) => {
        const metrics = buildDailyMetrics(logs[key] || {}, products);
        totals.kasa += metrics.totals.kasa;
        totals.trendyol += metrics.totals.trendyol;
        totals.yemeksepeti += metrics.totals.yemeksepeti;
        totals.migros += metrics.totals.migros;
    });

    return totals;
}

function calculateProductSalesByKeys(logs, products, keys) {
    const totalsByProduct = new Map();

    keys.forEach((key) => {
        const metrics = buildDailyMetrics(logs[key] || {}, products);
        metrics.perProduct.forEach((item) => {
            const current = totalsByProduct.get(item.productName) || {
                productName: item.productName,
                kasaQty: 0,
                trendyolQty: 0,
                yemekQty: 0,
                migrosQty: 0,
                totalQty: 0,
            };

            current.kasaQty += item.kasaQty;
            current.trendyolQty += item.trendyolQty;
            current.yemekQty += item.yemekQty;
            current.migrosQty += item.migrosQty;
            current.totalQty += item.totalQty;
            totalsByProduct.set(item.productName, current);
        });
    });

    return [...totalsByProduct.values()].sort((a, b) => b.totalQty - a.totalQty);
}

export {
    formatCurrency,
    formatDate,
    parseManualDate,
    buildDailyMetrics,
    buildHistoryRows,
    filterRows,
    paginateRows,
    getAvailableYears,
    calculateYearlyDistribution,
    pickKeysByMonthlyOrRangeFilter,
    calculateTotalsByKeys,
    calculateProductSalesByKeys,
};
