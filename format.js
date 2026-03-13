const fs = require('fs');

function replacer(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const regex = /function formatCurrency\(value\) \{\s*return `\$\{Number\(value \|\| 0\)\.toFixed\(2\)\} (.*?)`;\s*\}/;
    if (regex.test(content)) {
        const symbol = content.match(regex)[1];
        const newFunc = `function formatCurrency(value) {\n    return \`\${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}\`;\n}`;
        content = content.replace(regex, newFunc);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + filePath);
    } else {
        console.log('Could not find string in ' + filePath);
    }
}

replacer('admin/js/pages/dashboard.js');
replacer('admin/js/services/historyService.js');
