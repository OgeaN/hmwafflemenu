import { login } from '../auth.js';

const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const result = await login(email, password);

    if (result.success) {
        window.location.href = 'dashboard.html';
    } else {
        errorMessage.textContent = result.errorMessage;
    }
});
