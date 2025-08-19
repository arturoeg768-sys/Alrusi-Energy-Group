document.addEventListener('DOMContentLoaded', () => {
  // Selecciona miniaturas y también el plano
  const clickables = document.querySelectorAll('img.zoomable, .plan-figure img.plano-prev, .plan-figure img');

  // Crear modal una sola vez
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="image-modal__backdrop" data-close="1"></div>
    <figure class="image-modal__dialog" role="dialog" aria-modal="true" aria-label="Vista ampliada">
      <button class="image-modal__close" type="button" aria-label="Cerrar">✕</button>
      <img class="image-modal__img" id="lbImg" alt="">
      <figcaption class="image-modal__cap" id="lbCap"></figcaption>
    </figure>
  `;
  document.body.appendChild(modal);

  const imgEl   = modal.querySelector('#lbImg');
  const capEl   = modal.querySelector('#lbCap');
  const closeBtn= modal.querySelector('.image-modal__close');
  const backdrop= modal.querySelector('.image-modal__backdrop');

function open(img) {
  const fallback = img.currentSrc || img.src;
  const wanted   = (img.dataset.full && img.dataset.full.trim()) || fallback;
  const caption  = img.dataset.caption || img.alt || '';

  const test = new Image();
  test.onload = () => {
    imgEl.src = wanted;             // la “full” existe → úsala
    capEl.textContent = caption;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };
  test.onerror = () => {
    console.warn('[lightbox] No se pudo cargar data-full:', wanted, '→ usando src:', fallback);
    imgEl.src = fallback;           // usa la miniatura como respaldo
    capEl.textContent = caption + ' (vista previa)';
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };
  test.src = wanted;
}



  function close() {
    modal.classList.remove('is-open');
    imgEl.src = '';
    capEl.textContent = '';
    document.body.style.overflow = '';
  }

  clickables.forEach(el => {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', () => open(el));
  });

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
  });
});



// Reutilizar modal existente .image-modal para las imágenes de la gal-fit
document.querySelectorAll('.mant2-gallery.gal-fit img').forEach(img => {
  img.addEventListener('click', () => {
    const modal = document.querySelector('.image-modal');
    const modalImg = modal.querySelector('.image-modal__img');
    const caption = modal.querySelector('.image-modal__cap');

    modalImg.src = img.src;
    caption.textContent = img.alt || '';
    modal.classList.add('is-open');
  });
});






/* ===== Carrusel: mejoras SOLO para móvil ===== */
(function () {
  // Solo activar si el viewport es móvil
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (!isMobile) return;

  const wrap  = document.querySelector('.carrusel-infinito');
  const track = wrap?.querySelector('.carrusel-track');
  if (!track) return;

  // Guardamos los nodos originales una sola vez
  const originals = [...track.children].map(n => n.cloneNode(true));

  // Suma el ancho real de todos los items (incluyendo gap)
  function baseWidth() {
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const items = [...track.children];
    const widths = items.map(el => el.getBoundingClientRect().width);
    return widths.reduce((a, w) => a + w, 0) + gap * (items.length - 1);
  }

  // Rellena el track para que haya contenido suficiente y no “salte”
  function ensureCopies() {
    track.innerHTML = '';
    originals.forEach(n => track.appendChild(n.cloneNode(true)));

    const bw = baseWidth();
    const target = Math.max(window.innerWidth * 2, bw * 1.6); // contenido ≥ 2x viewport
    let w = bw;
    while (w < target) {
      originals.forEach(n => track.appendChild(n.cloneNode(true)));
      w += bw;
    }
    return w;
  }

  // Velocidad homogénea en px/seg (ajústala si quieres)
  function speed() { return 90; } // más alto = más rápido

  // Aplica variables CSS para duración y recorrido
  function apply() {
    const loopWidth = ensureCopies();
    const dur = loopWidth / speed(); // s
    track.style.setProperty('--loop', `${loopWidth}px`);
    track.style.setProperty('--dur',  `${dur}s`);

    // Reinicia la animación para que use la nueva duración
    track.style.animation = 'none';
    // forzar reflow
    // eslint-disable-next-line no-unused-expressions
    track.offsetHeight;
    track.style.animation = '';
  }

  apply();
  let raf;
  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(apply);
  }, { passive: true });
})();


(function () {
  // Solo móvil
  if (!window.matchMedia('(max-width: 768px)').matches) return;

  function encodePath(path) {
    // Evita codificar las barras: segmenta y codifica cada parte
    return path.split('/').map(part => {
      // si ya viene codificado, lo dejamos
      try { return decodeURIComponent(part) !== part ? part : encodeURIComponent(part); }
      catch { return encodeURIComponent(part); }
    }).join('/');
  }

  // Corrige src y data-full (para el lightbox)
  document.querySelectorAll('img').forEach(img => {
    const raw = img.getAttribute('src');
    if (!raw) return;
    try {
      const u = new URL(raw, location.href);
      const fixedPath = encodePath(u.pathname);
      const fixed = fixedPath + (u.search || '') + (u.hash || '');
      if (u.pathname !== fixedPath) img.setAttribute('src', fixed);
    } catch {}
    const df = img.getAttribute('data-full');
    if (df) {
      try {
        const u2 = new URL(df, location.href);
        const fp2 = encodePath(u2.pathname) + (u2.search || '') + (u2.hash || '');
        if (df !== fp2) img.setAttribute('data-full', fp2);
      } catch {}
    }
  });
})();