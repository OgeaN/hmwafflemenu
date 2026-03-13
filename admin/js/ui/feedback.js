let toastRoot;

function ensureToastRoot() {
    if (toastRoot) {
        return toastRoot;
    }

    toastRoot = document.createElement('div');
    toastRoot.className = 'toast-root';
    document.body.appendChild(toastRoot);
    return toastRoot;
}

function showToast(message, type = 'info', duration = 2800) {
    const root = ensureToastRoot();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    root.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 220);
    }, duration);
}

function setButtonLoading(button, isLoading, loadingText = 'Kaydediliyor...') {
    if (!button) {
        return;
    }

    if (isLoading) {
        button.dataset.prevText = button.textContent;
        button.textContent = loadingText;
        button.disabled = true;
    } else {
        button.textContent = button.dataset.prevText || button.textContent;
        button.disabled = false;
    }
}

export { showToast, setButtonLoading };
