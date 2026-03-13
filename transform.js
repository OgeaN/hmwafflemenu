const fs = require('fs');
let content = fs.readFileSync('admin/js/pages/history.js', 'utf8');

// Insert chartInstances at the top after imports
if (!content.includes('let chartInstances = {}')) {
  content = content.replace('const dom = {', 'let chartInstances = {};\n\nconst dom = {');
}

// Replace drawSimpleBarChart
const drawSimpleRegex = /function drawSimpleBarChart\([^\{]*\{[\s\S]*?(?=function drawStackedMonthlyChart)/;
const newSimpleBar = `function drawSimpleBarChart(canvasId, values, labels, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const isLineChart = canvasId === 'yearly-distribution-chart';
    
    chartInstances[canvasId] = new window.Chart(ctx, {
        type: isLineChart ? 'bar' : 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Satislar (?)',
                data: values,
                backgroundColor: color,
                borderColor: color,
                borderWidth: isLineChart ? 2 : 0,
                borderRadius: isLineChart ? 0 : 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

`;
content = content.replace(drawSimpleRegex, newSimpleBar);

// Replace drawStackedMonthlyChart
const stackedRegex = /function drawStackedMonthlyChart\([^\{]*\{[\s\S]*?(?=function renderYearlyDistributionList)/;
const newStacked = `function drawStackedMonthlyChart(monthChannelTotals) {
    const canvas = document.getElementById('monthly-stacked-chart');
    if (!canvas) return;

    if (chartInstances['monthly-stacked-chart']) {
        chartInstances['monthly-stacked-chart'].destroy();
    }

    const labels = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const channels = ['kasa', 'trendyol', 'yemeksepeti', 'migros'];
    const colors = {
        kasa: '#0369a1',
        trendyol: '#f59e0b',
        yemeksepeti: '#e11d48',
        migros: '#f97316',
    };

    const ctx = canvas.getContext('2d');
    
    const datasets = channels.map(channel => ({
        label: channel.charAt(0).toUpperCase() + channel.slice(1),
        data: monthChannelTotals.map(month => month[channel] || 0),
        backgroundColor: colors[channel],
        borderWidth: 0,
        stack: 'Stack 0'
    }));

    chartInstances['monthly-stacked-chart'] = new window.Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12 } }
            },
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        }
    });
}

`;
content = content.replace(stackedRegex, newStacked);

fs.writeFileSync('admin/js/pages/history.js', content, 'utf8');
console.log('Successfully updated history.js with Chart.js functions.');
