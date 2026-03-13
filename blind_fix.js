const fs = require('fs');

['admin/js/pages/dashboard.js', 'admin/js/services/historyService.js'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const start = content.indexOf('function formatCurrency(value) {');
    if (start > -1) {
        const end = content.indexOf('}', start);
        if (end > -1) {
            const newFunc = "function formatCurrency(value) {\n    return `${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ?`;\n}";
            content = content.substring(0, start) + newFunc + content.substring(end + 1);
            fs.writeFileSync(file, content, 'utf8');
            console.log('Fixed ' + file);
        }
    }
});
