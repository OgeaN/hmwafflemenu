function renderTable(container, data, columns, actions) {
    const entries = Object.entries(data || {});

    if (entries.length === 0) {
        container.innerHTML = '<div class="empty-state">Henüz kayıt bulunmuyor.</div>';
        return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headerRow = document.createElement('tr');
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.header;
        headerRow.appendChild(th);
    });
    if (actions) {
        const th = document.createElement('th');
        th.textContent = 'Actions';
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);

        for (const [key, item] of entries) {
            const row = document.createElement('tr');
            columns.forEach(col => {
                const td = document.createElement('td');
                if (col.isInput) {
                    const input = document.createElement('input');
                    input.type = col.inputType || 'text';
                    if (input.type === 'number') {
                        input.step = '0.01';
                        input.min = '0';
                    }
                    input.value = item[col.key] || 0; // Default to 0 for missing prices
                    input.dataset.key = col.key;
                    td.appendChild(input);
                } else {
                    td.textContent = item[col.key] || '';
                }
                row.appendChild(td);
            });
    
            if (actions) {
                const td = document.createElement('td');
                actions.forEach(action => {
                    const button = document.createElement('button');
                    button.textContent = action.label;
                    button.classList.add(action.class);
                    button.addEventListener('click', () => action.handler(key, item, row));
                    td.appendChild(button);
                });
                row.appendChild(td);
            }
            tbody.appendChild(row);
        }
    table.appendChild(thead);
    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);
}

export { renderTable };
