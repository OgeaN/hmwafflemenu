// Gelişmiş HTML include fonksiyonu
function includeHTML(callback) {
  const elements = document.querySelectorAll('[data-include]:not([data-included])');
  let loaded = 0;
  if (elements.length === 0) { if (callback) callback(); return; }
  elements.forEach(el => {
    const file = el.getAttribute('data-include');
    fetch(file)
      .then(resp => {
        if (!resp.ok) throw new Error('Dosya bulunamadı: ' + file);
        return resp.text();
      })
      .then(data => {
        // Scriptleri çalıştırmak için geçici bir div kullan
        const temp = document.createElement('div');
        temp.innerHTML = data;
        // Scriptleri ayrı ekle
        temp.querySelectorAll('script').forEach(s => {
          const sc = document.createElement('script');
          if (s.src) sc.src = s.src;
          if (s.type) sc.type = s.type;
          sc.textContent = s.textContent;
          document.body.appendChild(sc);
          s.remove();
        });
        // Kalan HTML'i ekle
        el.innerHTML = temp.innerHTML;
        el.setAttribute('data-included', 'true');
        loaded++;
        // Head içindeki stylesheet'leri ekle
        if (el.parentNode.tagName === 'HEAD') {
          temp.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
            const cl = document.createElement('link');
            cl.rel = 'stylesheet';
            cl.href = l.href;
            document.head.appendChild(cl);
          });
        }
        if (loaded === elements.length && callback) callback();
      })
      .catch(e => {
        el.innerHTML = '<div style="color:red;font-size:1rem">Yüklenemedi: '+file+'</div>';
        loaded++;
        if (loaded === elements.length && callback) callback();
      });
  });
}
window.addEventListener('DOMContentLoaded', function() {
  includeHTML();
});
