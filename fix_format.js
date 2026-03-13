const fs = require('fs');

function fix(file) {
    let content = fs.readFileSync(file, 'utf8');
    const regex = /function formatCurrency\(value\) \{\s*return `\$\{Number\(value \|\| 0\)\.toLocaleString\("tr-TR", \{ minimumFractionDigits: 2, maximumFractionDigits: 2 \)?[^\}]*\}/;
    if (regex.test(content)) {
        content = content.replace(regex, "function formatCurrency(value) {\n    return `${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ?`;\n}");
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed ' + file);
    } else {
        const regex2 = /function formatCurrency\(value\) \{\r?\n\s*return `[^`]*`\r?\n\}/;
        if (regex2.test(content)) {
            content = content.replace(regex2, "function formatCurrency(value) {\n    return `${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ?`;\n}");
            fs.writeFileSync(file, content, 'utf8');
            console.log('Fixed ' + file + ' with fallback');
        } else {
            console.log('Could not match in ' + file);
        }
    }
}

fix('admin/js/pages/dashboard.js');
fix('admin/js/services/historyService.js');
