function parseDateKey(dateKey) {
    const day = parseInt(dateKey.substring(0, 2), 10);
    const month = parseInt(dateKey.substring(2, 4), 10) - 1; // Month is 0-indexed
    const year = parseInt(dateKey.substring(4, 8), 10);
    return new Date(year, month, day);
}

export { parseDateKey };
