function normalizeRate(value) {
    const raw = Number(value || 0);
    // DB format: 0.34 means 34%. If older data uses 34, keep it compatible.
    return raw > 1 ? raw / 100 : raw;
}

function calculateFinalPrice(basePrice, commission, tax) {
    const commissionRate = normalizeRate(commission);
    const taxRate = normalizeRate(tax);
    const gross = Number(basePrice || 0);
    const commissionAmount = gross * commissionRate;
    const taxOnCommission = commissionAmount * taxRate;
    return Math.max(0, gross - commissionAmount - taxOnCommission);
}

export { calculateFinalPrice, normalizeRate };
