const fs = require('fs');

function fixUtf8(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('₺')) {
        content = content.replace(/₺/g, '?');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed encoding in ' + filePath);
    }
}

fixUtf8('admin/js/pages/dashboard.js');
fixUtf8('admin/js/services/historyService.js');
