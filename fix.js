const fs = require('fs');

['admin/js/pages/dashboard.js', 'admin/js/services/historyService.js'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const funcStartIdx = content.indexOf('function formatCurrency(value)');
    if (funcStartIdx > -1) {
        const funcEndIdx = content.indexOf('}', funcStartIdx);
        if (funcEndIdx > -1) {
            const badBlock = content.substring(funcStartIdx, funcEndIdx + 1);
            const goodBlock = "function formatCurrency(value) {\n    return `${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ?`;\n}";
            content = content.replace(badBlock, goodBlock);
            fs.writeFileSync(file, content, 'utf8');
            console.log('Fixed block in ' + file);
        }
    }
});
