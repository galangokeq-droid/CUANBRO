/* ============================================================
   ui.js — elemen tampilan umum
   Sheet (pop-up bawah), toast, navigasi bawah, menu samping
   ============================================================ */

/* ===== SHEET ===== */
const showSheet = id => $(id).classList.add('show');
const hideSheet = id => $(id).classList.remove('show');

// Pasang tombol tutup + klik di luar sheet. Mengembalikan fungsi tutupnya.
function bindSheet(id, closeBtnId, onClose){
  const close = onClose || (() => hideSheet(id));
  if(closeBtnId) $(closeBtnId).onclick = close;
  $(id).onclick = e => { if(e.target === $(id)) close(); };
  return close;
}

// Sheet serbaguna (#isheet): judul + isi berupa elemen
function openInfo(title, nodes){
  $('i-title').textContent = title;
  const body = $('i-body');
  body.innerHTML = '';
  nodes.forEach(n => body.appendChild(n));
  showSheet('isheet');
}
bindSheet('isheet', 'i-close');

/* ===== TOAST ===== */
let toastTimer = null;
function showToast(text){
  const t = $('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 4500);
}
$('toast').onclick = () => { $('toast').classList.remove('show'); openNotif(); };

/* ===== NAVIGASI BAWAH ===== */
const nav = $('nav'), lens = $('lens');

// Pindahkan "lensa air" ke tombol aktif
function moveLens(btn){
  if(!btn) return;
  const n = nav.getBoundingClientRect(), b = btn.getBoundingClientRect();
  if(btn.classList.contains('center-btn')){
    lens.style.left = (b.left - n.left) + 'px';
    lens.style.width = b.width + 'px';
    lens.style.top = (b.top - n.top) + 'px';
    lens.style.height = b.height + 'px';
    lens.style.borderRadius = '50%';
    lens.classList.add('over');
  } else {
    lens.style.left = (b.left - n.left + 4) + 'px';
    lens.style.width = (b.width - 8) + 'px';
    lens.style.top = '8px';
    lens.style.height = 'calc(100% - 16px)';
    lens.style.borderRadius = '22px';
    lens.classList.remove('over');
  }
}

// Fungsi yang dijalankan saat halaman tertentu dibuka (id halaman → fungsi)
const PAGE_HOOKS = {
  leaderboard: () => loadLB(),
  profile: () => loadProfileX()
};

// Pindah halaman. Admin/owner yang menekan Home diarahkan ke #dash.
function go(id){
  const staffHome = id === 'home' && isStaff() && $('dash');
  const pageId = staffHome ? 'dash' : id;
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === pageId));

  let active = null;
  document.querySelectorAll('#nav button').forEach(b => {
    const on = b.dataset.go === id;
    b.classList.toggle('active', on);
    if(on) active = b;
  });
  moveLens(active);
  window.scrollTo(0, 0);

  if(staffHome) loadDash();
  else if(PAGE_HOOKS[id]) PAGE_HOOKS[id]();
}
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
window.addEventListener('resize', () => moveLens(document.querySelector('#nav button.active')));
$('avatar').onclick = () => go('profile');
$('bell').onclick = () => openNotif();

/* ----- Navigasi bisa digeser (lensa air mengikuti jari) ----- */
(() => {
  let down = false, drag = false, startX = 0, pointerId = null, swallowClick = false;
  const buttons = () => [...nav.querySelectorAll('button')];

  const nearest = x => {
    let best = null, bestDist = 1e9;
    buttons().forEach(b => {
      const r = b.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - x);
      if(d < bestDist){ bestDist = d; best = b; }
    });
    return best;
  };

  nav.addEventListener('pointerdown', e => { down = true; drag = false; startX = e.clientX; pointerId = e.pointerId; });

  nav.addEventListener('pointermove', e => {
    if(!down) return;
    if(!drag){
      if(Math.abs(e.clientX - startX) < 8) return; // belum dianggap geser
      drag = true;
      try { nav.setPointerCapture(pointerId); } catch(_){}
      nav.classList.add('dragging');
      lens.classList.remove('over');
      lens.classList.add('drag');
      lens.style.width = '76px';
      lens.style.top = '8px';
      lens.style.height = 'calc(100% - 16px)';
      lens.style.borderRadius = '28px';
    }
    const n = nav.getBoundingClientRect();
    lens.style.left = Math.max(4, Math.min(n.width - 80, e.clientX - n.left - 38)) + 'px';
    const target = nearest(e.clientX);
    buttons().forEach(b => b.classList.toggle('hot', b === target));
  });

  const endDrag = e => {
    if(!down) return;
    down = false;
    if(!drag) return;
    drag = false;
    const target = nearest(e.clientX);
    nav.classList.remove('dragging');
    lens.classList.remove('drag');
    buttons().forEach(b => b.classList.remove('hot'));
    try { nav.releasePointerCapture(pointerId); } catch(_){}
    swallowClick = true;
    setTimeout(() => { swallowClick = false; }, 80);
    if(target) go(target.dataset.go);
  };
  nav.addEventListener('pointerup', endDrag);
  nav.addEventListener('pointercancel', endDrag);
  // cegah klik "nyasar" tepat setelah selesai menggeser
  nav.addEventListener('click', e => { if(swallowClick){ e.stopPropagation(); e.preventDefault(); } }, true);
})();

/* ===== MENU SAMPING (garis tiga) ===== */
const drawer = $('drawer'), drawerBack = $('drawer-back');

function openDrawer(){
  $('dm-out').style.display = uid ? 'flex' : 'none';
  drawer.classList.add('open');
  drawerBack.classList.add('show');
  drawer.setAttribute('aria-hidden', 'false');
  $('menu-btn').setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeDrawer(){
  drawer.classList.remove('open');
  drawerBack.classList.remove('show');
  drawer.setAttribute('aria-hidden', 'true');
  $('menu-btn').setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
$('menu-btn').onclick = openDrawer;
$('drawer-close').onclick = closeDrawer;
drawerBack.onclick = closeDrawer;
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeDrawer(); });
document.querySelectorAll('.dm-item[data-go]').forEach(b => b.addEventListener('click', closeDrawer));

/* ===== ANIMASI MUNCUL SAAT SCROLL ===== */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if(e.isIntersecting){
      e.target.style.transitionDelay = (i * 60) + 'ms';
      e.target.classList.add('in');
    } else if(e.target.offsetParent === null){
      e.target.classList.remove('in'); // halaman disembunyikan: ulangi animasi saat dibuka lagi
    }
  });
}, { threshold: .08, rootMargin: '0px 0px -4% 0px' });

document.querySelectorAll('.page > *').forEach(el => {
  el.classList.add('rv');
  revealObserver.observe(el);
});