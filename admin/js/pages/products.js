import { checkAuth } from '../auth.js';
import { getProducts, updateProduct, addProduct } from '../services/productService.js';
import { getFirms, updateFirm } from '../services/firmService.js';
import { renderTable } from '../ui/tableRenderer.js';
import { showToast, setButtonLoading } from '../ui/feedback.js';

const tableContainer = document.getElementById('products-table-container');
const addProductForm = document.getElementById('add-product-form');
const firmsTbody = document.getElementById('firms-tbody');

async function saveProductHandler(productKey, product, row) {
    const button = row.querySelector('.save-product-btn');
    const inputs = row.querySelectorAll('input');
    const updatedData = { ...product };

    inputs.forEach(input => {
        const key = input.dataset.key;
        const value = parseFloat(input.value) || 0;
        updatedData[key] = value;
    });

    try {
        setButtonLoading(button, true, 'Kaydediliyor...');
        await updateProduct(productKey, updatedData);
        showToast('Urun guncellendi.', 'success');
    } catch (error) {
        showToast('Urun kaydedilirken hata olustu.', 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

async function renderFirms() {
    const firms = await getFirms();
    firmsTbody.innerHTML = '';

    for (const firmKey in firms) {
        const firm = firms[firmKey];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${firmKey}</td>
            <td><input type="number" step="0.01" class="firm-kesinti" data-firm="${firmKey}" value="${firm.kesintiOran || 0}"></td>
            <td><input type="number" step="0.01" class="firm-vergi" data-firm="${firmKey}" value="${firm.vergiOran || 0}"></td>
        `;
        firmsTbody.appendChild(row);
    }

    // Add saving logic for firms if needed, or update on change
    firmsTbody.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const firmKey = e.target.dataset.firm;
            const firms = await getFirms();
            const firmData = firms[firmKey];
            
            if (e.target.classList.contains('firm-kesinti')) {
                firmData.kesintiOran = parseFloat(e.target.value) || 0;
            } else {
                firmData.vergiOran = parseFloat(e.target.value) || 0;
            }
            
            try {
                await updateFirm(firmKey, firmData);
                showToast(`${firmKey} ayari guncellendi.`, 'success', 1700);
            } catch (error) {
                showToast(`${firmKey} kaydedilemedi.`, 'error');
            }
        });
    });
}

async function renderProducts() {
    const products = await getProducts();

    const columns = [
        { header: 'Urun Adi', key: 'urunAdi' },
        { header: 'Fiyat', key: 'storePrice', isInput: true, inputType: 'number' },
        { header: 'Trendyol Fiyat', key: 'trendyolPrice', isInput: true, inputType: 'number' },
        { header: 'YemekSep Fiyat', key: 'yemeksepetiPrice', isInput: true, inputType: 'number' },
        { header: 'Migros Fiyat', key: 'migrosPrice', isInput: true, inputType: 'number' },
    ];

    const actions = [
        { label: 'Kaydet', class: 'save-product-btn', handler: saveProductHandler }
    ];

    renderTable(tableContainer, products, columns, actions);
}

async function initializePage() {
    await checkAuth();
    
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = addProductForm.querySelector('#add-product-btn');
        const name = document.getElementById('new-product-name').value.trim();

        if (!name) {
            showToast('Urun adi bos olamaz.', 'error');
            return;
        }

        const newProduct = {
            urunAdi: name,
            storePrice: parseFloat(document.getElementById('new-store-price').value) || 0,
            trendyolPrice: parseFloat(document.getElementById('new-trendyol-price').value) || 0,
            yemeksepetiPrice: parseFloat(document.getElementById('new-yemeksepeti-price').value) || 0,
            migrosPrice: parseFloat(document.getElementById('new-migros-price').value) || 0,
        };

        try {
            setButtonLoading(submitButton, true, 'Ekleniyor...');
            await addProduct(newProduct);
            addProductForm.reset();
            showToast('Urun eklendi.', 'success');
            await renderProducts();
        } catch (error) {
            showToast('Urun eklenirken hata olustu.', 'error');
        } finally {
            setButtonLoading(submitButton, false);
        }
    });

    renderProducts();
    renderFirms();
}

initializePage();
