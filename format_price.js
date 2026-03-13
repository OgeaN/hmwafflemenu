const fs = require('fs');

function replacer(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\$\{basePrice\.toFixed\(2\)\} TL/g, "${basePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL");
    content = content.replace(/\$\{deductionTotal\.toFixed\(2\)\} TL/g, "${deductionTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL");
    content = content.replace(/\$\{finalPrice\.toFixed\(2\)\} TL/g, "${finalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
}

replacer('admin/js/pages/priceCalculator.js');
