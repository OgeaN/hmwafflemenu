function slugifyProductName(value) {
    const text = String(value || '').trim().toLowerCase();
    const trMap = {
        i: 'i',
        ı: 'i',
        ğ: 'g',
        ü: 'u',
        ş: 's',
        ö: 'o',
        ç: 'c',
    };

    return text
        .split('')
        .map((char) => trMap[char] || char)
        .join('')
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .join('_');
}

function normalizeChannel(channel) {
    const raw = String(channel || '')
        .trim()
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/\s+/g, '');

    if (raw.includes('yemeksepeti')) return 'yemeksepeti';
    if (raw.includes('trendyol')) return 'trendyol';
    if (raw.includes('migros')) return 'migros';
    if (raw.includes('kasa')) return 'kasa';

    return raw;
}

function getProductAlias(productName) {
    const slug = slugifyProductName(productName);

    if (slug.includes('ekstra') && slug.includes('dond')) return 'dond';
    if (slug.includes('ekstra') && slug.includes('para')) return 'ekstra';
    if (slug.includes('meyveli') && slug.includes('soda')) return 'meyveli';
    if (slug.includes('dond')) return 'dond';
    if (slug.includes('soguk')) return 'soguk';
    if (slug.includes('cicek')) return 'cicek';
    if (slug.includes('bubble')) return 'bubble';
    if (slug.includes('bardak')) return 'bardak';
    if (slug.includes('sandvic')) return 'sandvic';
    if (slug.includes('cubuk')) return 'cubuk';
    if (slug.includes('kase')) return 'kase';
    if (slug.includes('duble')) return 'duble';
    if (slug === 'su' || slug.startsWith('su_')) return 'su';
    if (slug.includes('soda')) return 'soda';
    if (slug.includes('gazoz')) return 'gazoz';
    if (slug.includes('cay')) return 'cay';
    if (slug.includes('americano')) return 'america';
    if (slug.includes('turk')) return 'turk';
    if (slug.includes('sut')) return 'sut';
    if (slug.includes('kahve')) return 'kahve';

    const firstToken = slug.split('_')[0];
    return firstToken || 'urun';
}

function generateLogKey(channel, productName) {
    const ch = normalizeChannel(channel);
    const alias = getProductAlias(productName);
    return `${ch}_${alias}`;
}

function getLogKeyCandidates(channel, productName) {
    const ch = normalizeChannel(channel);
    const slug = slugifyProductName(productName);
    const alias = getProductAlias(productName);
    const firstToken = (slug.split('_')[0] || '').trim();

    const keys = [
        `${ch}_${alias}`,
        `${ch}_${slug}`,
    ];

    if (firstToken) {
        keys.push(`${ch}_${firstToken}`);
    }

    return [...new Set(keys.filter(Boolean))];
}

function getLogValueByProduct(log = {}, channel, productName) {
    const candidates = getLogKeyCandidates(channel, productName);
    for (const key of candidates) {
        if (log[key] !== undefined && log[key] !== null) {
            return Number(log[key]) || 0;
        }
    }
    return 0;
}

function getExtraMoneyKey(channel) {
    const ch = normalizeChannel(channel);
    return `${ch}_ekstra`;
}

function getExtraMoneyValue(log = {}, channel) {
    const ch = normalizeChannel(channel);
    return Number(log[`${ch}_ekstra`] ?? log[`${ch}_ekstra_para`] ?? 0) || 0;
}

function getRevenueKey(channel) {
    return `${normalizeChannel(channel)}_gelir`;
}

function mapLogToStructured(logKey, quantity) {
    const parts = logKey.split('_');
    const channel = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const product = parts.slice(1).join(' ');
    return { channel, product, quantity };
}

export {
    generateLogKey,
    mapLogToStructured,
    getLogKeyCandidates,
    getLogValueByProduct,
    getExtraMoneyKey,
    getExtraMoneyValue,
    getRevenueKey,
};
