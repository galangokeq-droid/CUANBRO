/* ============================================================
   user.js — fitur utama user
   Profil, saldo, antrean tarik, misi, riwayat, tarik saldo
   ============================================================ */

/* ===== PROFIL ===== */
async function loadProfile(){
  const { data: { session } } = await sb.auth.getSession();
  uid = session ? session.user.id : null;
  let name = 'Pengguna';
  if(uid){
    $('acc-email').textContent = session.user.email || '';
    const { data } = await sb.from('profiles').select('full_name').eq('id', uid).maybeSingle();
    if(data && data.full_name) name = data.full_name;
    $('logout').style.display = 'block';
  }
  $('greet').textContent = 'Halo, ' + name;
  $('acc-name').textContent = name;
  $('avatar').textContent = name.charAt(0).toUpperCase();
}

/* ===== SALDO ===== */
let balanceValue = 0;
let balanceHidden = store.get('hideBal') === '1';

function paintBalance(){
  const text = balanceHidden ? 'Rp ••••••' : rp(balanceValue);
  $('balance').textContent = text;
  document.querySelectorAll('[data-bal]').forEach(e => e.textContent = text);
  $('eye').textContent = balanceHidden ? '🙈' : '👁';
  $('eye').setAttribute('aria-label', balanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo');
}
$('eye').onclick = () => {
  balanceHidden = !balanceHidden;
  store.set('hideBal', balanceHidden ? '1' : '0');
  paintBalance();
};

async function loadBalance(){
  const { data, error } = await sb.from('wallets').select('balance').maybeSingle();
  balanceValue = error ? 0 : (data ? data.balance : 0);
  paintBalance();
}

// Tombol "Perbarui" (ada di Home dan Riwayat)
document.querySelectorAll('.refresh').forEach(b => b.addEventListener('click', () => {
  b.classList.add('spin');
  setTimeout(() => b.classList.remove('spin'), 700);
  loadAll();
}));

/* ===== ANTREAN PENARIKAN ===== */
async function loadQueue(){
  const card = $('queue-card'), box = $('queue-list');
  if(!uid){ card.style.display = 'none'; return; }
  const { data, error } = await sb.rpc('get_withdrawal_queue');
  if(error || !data || !data.length){ card.style.display = 'none'; return; }

  box.innerHTML = '';
  data.forEach(q => {
    const ahead = Number(q.ahead), total = Number(q.total_pending);
    const line = mk('div', 'qrow'), info = mk('div');
    info.append(
      mk('div', 'n', ahead === 0 ? 'Giliranmu berikutnya' : ahead + ' antrean di depanmu'),
      mk('div', 's', 'dari ' + total + ' antrean · ' + rp(q.amount))
    );
    line.append(mk('div', 'qbig', '#' + q.queue_no), info);
    box.appendChild(line);

    const bar = mk('div', 'bar'), fill = mk('i');
    fill.style.width = (total > 0 ? Math.max(4, Math.round((total - ahead) / total * 100)) : 100) + '%';
    bar.appendChild(fill);
    box.appendChild(bar);
  });
  card.style.display = 'block';
}
$('queue-refresh').onclick = async () => {
  const b = $('queue-refresh');
  b.classList.add('spin');
  await loadQueue();
  b.classList.remove('spin');
};

/* ===== MISI ===== */
let missions = [];       // semua misi aktif
let umMap = {};          // misi milik user: { mission_id: user_missions }
let myAll = [];          // daftar user_missions milik user
let missionFilter = 'aktif';

const missionState = m => umMap[m.id] ? umMap[m.id].status : 'none';

async function loadMissions(){
  const { data, error } = await sb.from('missions')
    .select('id,title,description,instructions,reward,duration_hours,verification_hours,max_participants,proof_type')
    .eq('is_active', true).order('created_at', { ascending: false }).limit(30);
  missions = error ? [] : (data || []);
  renderMissions();
}

async function loadMyMissions(){
  umMap = {}; myAll = [];
  if(uid){
    const { data, error } = await sb.from('user_missions')
      .select('mission_id,status,claimed_at,due_at,submitted_at,reviewed_at,completed_at,proof_text,proof_url,admin_note,admin_instructions,missions(title,reward)')
      .eq('user_id', uid).order('claimed_at', { ascending: false, nullsFirst: false }).limit(100);
    myAll = error ? [] : (data || []);
  }
  myAll.forEach(x => { umMap[x.mission_id] = x; });

  // Statistik Home. Status database: in_progress, pending, completed, rejected
  const done = myAll.filter(x => x.status === 'completed');
  $('st-done').textContent = done.length;
  $('st-reward').textContent = rp(done.reduce((sum, x) => sum + Number(x.missions ? x.missions.reward : 0), 0));

  const today = new Date().toDateString();
  const doneToday = done.filter(x => {
    const t = x.reviewed_at || x.completed_at;
    return t && new Date(t).toDateString() === today;
  }).length;
  $('prog-txt').textContent = Math.min(doneToday, DAILY_TARGET) + '/' + DAILY_TARGET;
  $('prog-bar').style.width = Math.min(100, doneToday / DAILY_TARGET * 100) + '%';
}

function dueText(m, u){
  if(u && u.status === 'in_progress' && u.due_at) return 'Batas: ' + fdate(u.due_at);
  if(m.duration_hours) return 'Selesaikan dalam ' + m.duration_hours + ' jam';
  return 'Tanpa batas waktu';
}

function missionRow(m){
  const u = umMap[m.id];
  const badge = u ? statusOf(u.status) : { label: 'Tersedia', tone: 'none' };
  const d = mk('div', 'item act'), l = mk('div'), r = mk('div', 'ar');
  d.tabIndex = 0;
  d.setAttribute('role', 'button');
  l.append(mk('div', 'n', m.title), mk('div', 's', dueText(m, u)));
  r.append(mk('div', 'rw', '+' + rp(m.reward)), mk('span', 'badge ' + badge.tone, badge.label));
  d.append(l, r);
  d.onclick = () => openMission(m);
  d.onkeydown = e => { if(e.key === 'Enter') openMission(m); };
  return d;
}

function renderMissions(){
  const q = $('search').value.trim().toLowerCase();
  const list = q ? missions.filter(m => m.title.toLowerCase().includes(q)) : missions;

  // Home: utamakan misi yang belum diambil
  const available = list.filter(m => missionState(m) === 'none');
  fillList($('mis-home'), (available.length ? available : list).slice(0, 4).map(missionRow),
    q ? 'Misi tidak ditemukan.' : 'Belum ada misi aktif.');

  // Halaman Misi: tab Aktif / Selesai
  const shown = list.filter(m => missionFilter === 'selesai' ? missionState(m) === 'completed' : missionState(m) !== 'completed');
  fillList($('mis-all'), shown.map(missionRow),
    q ? 'Misi tidak ditemukan.' : (missionFilter === 'selesai' ? 'Belum ada misi yang selesai.' : 'Belum ada misi aktif.'));
}

// "Misi saya" di Home: yang sedang dikerjakan / menunggu verifikasi
function renderMy(){
  const active = myAll.filter(x => x.status === 'in_progress' || x.status === 'pending');
  fillList($('my-home'), active.slice(0, 3).map(x => {
    const m = missions.find(k => k.id === x.mission_id);
    return m ? missionRow(m)
             : row(x.missions ? x.missions.title : 'Misi', statusOf(x.status).label, x.missions ? rp(x.missions.reward) : '', 'rw');
  }), 'Belum ada misi yang sedang dikerjakan.');
}

document.querySelectorAll('#m-chips .chip').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('#m-chips .chip').forEach(x => x.classList.toggle('on', x === c));
  missionFilter = c.dataset.f;
  renderMissions();
}));
$('search').addEventListener('input', renderMissions);

/* ----- Detail misi: ambil misi & ajukan verifikasi ----- */
let currentMission = null, currentMode = null; // mode: 'claim' | 'submit' | null

function openMission(m){
  currentMission = m;
  const u = umMap[m.id], status = u ? u.status : 'none';
  const badge = u ? statusOf(status) : { label: 'Tersedia', tone: 'none' };
  const body = $('m-body'), goBtn = $('m-go');

  $('m-title').textContent = m.title;
  body.innerHTML = '';
  const add = (k, v) => {
    const r = mk('div', 'drow');
    r.append(mk('span', '', k), v instanceof Node ? v : mk('span', '', v));
    body.appendChild(r);
  };
  const block = (title, text) => {
    const b = mk('div', 'pblock');
    b.append(mk('div', 'pt', title), mk('div', 'pb', text));
    body.appendChild(b);
  };

  add('Hadiah', '+' + rp(m.reward));
  add('Batas waktu', dueText(m, u));
  add('Verifikasi admin', 'Maks. ' + m.verification_hours + ' jam');
  if(m.max_participants) add('Kuota', m.max_participants + ' peserta');
  add('Status', mk('span', 'badge ' + badge.tone, badge.label));
  if(m.description) block('Deskripsi', m.description);
  if(m.instructions) block('Instruksi', m.instructions);
  if(u && u.admin_instructions) block('Instruksi khusus untuk kamu', u.admin_instructions);
  if(u && u.admin_note) block('Catatan admin', u.admin_note);

  // Tombol aksi tergantung status
  if(status === 'none'){
    currentMode = 'claim'; goBtn.textContent = 'Ambil Misi'; goBtn.style.display = 'block';
  } else if(status === 'in_progress' || status === 'rejected'){
    currentMode = 'submit';
    goBtn.textContent = status === 'rejected' ? 'Ajukan Ulang' : 'Saya Sudah Mengerjakan';
    goBtn.style.display = 'block';
  } else {
    currentMode = null; goBtn.style.display = 'none';
  }

  $('m-msg').textContent = '';
  $('m-msg').className = 'msg';
  showSheet('msheet');
}
bindSheet('msheet', 'm-close');

$('m-go').onclick = async () => {
  const msg = $('m-msg'), btn = $('m-go');
  msg.className = 'msg';
  msg.textContent = '';
  if(!uid){ msg.textContent = 'Sesi tidak ditemukan. Silakan masuk.'; return; }

  const m = currentMission, mode = currentMode, label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Memproses...';
  const res = mode === 'claim'
    ? await sb.rpc('claim_mission', { p_mission_id: m.id })
    : await sb.rpc('submit_mission', { p_mission_id: m.id, p_proof_text: 'Pengguna menandai misi sudah dikerjakan', p_proof_url: null });
  btn.disabled = false;
  btn.textContent = label;

  if(res.error){ msg.textContent = res.error.message; return; }
  await loadAll();

  if(mode === 'claim'){
    openMission(m); // tampilkan ulang dengan status baru
    $('m-msg').textContent = 'Misi berhasil diambil. Kerjakan, lalu tekan Saya Sudah Mengerjakan.';
    $('m-msg').className = 'msg ok';
  } else {
    msg.textContent = 'Terkirim. Menunggu verifikasi admin.';
    msg.className = 'msg ok';
    setTimeout(() => hideSheet('msheet'), 1200);
  }
};

/* ===== RIWAYAT & AKTIVITAS TERBARU ===== */
const KIND = { misi: 'Misi', tarik: 'Penarikan', saldo: 'Transaksi Saldo' };
let acts = [], actsMsg = '';

async function loadActivity(){
  acts = []; actsMsg = '';
  if(!uid){ actsMsg = 'Masuk untuk melihat riwayat aktivitas.'; renderActs(); return; }

  const query = (table, cols) => sb.from(table).select(cols).eq('user_id', uid).limit(200);
  const [tx, wd, um] = await Promise.all([
    query('transactions', 'id,type,amount,note,created_at'),
    query('withdrawals', 'id,amount,status,created_at,reviewed_at,admin_note'),
    query('user_missions', 'mission_id,status,claimed_at,submitted_at,reviewed_at,completed_at,admin_note,missions(title,reward)')
  ]);
  if(tx.error || wd.error || um.error) actsMsg = 'Sebagian riwayat gagal dimuat. Coba perbarui.';

  // dup = transaksi penarikan yang sama dengan data di tabel withdrawals (disembunyikan di Aktivitas terbaru)
  (tx.data || []).forEach(t => acts.push({
    kind: 'saldo', at: t.created_at, title: t.note || TX[t.type] || 'Transaksi saldo',
    amount: Number(t.amount), s: { label: 'Berhasil', tone: 'success' },
    id: t.id, idLabel: 'ID transaksi', note: null, dup: t.type === 'withdraw'
  }));
  (wd.data || []).forEach(w => acts.push({
    kind: 'tarik', at: w.created_at, title: 'Penarikan saldo',
    amount: -Math.abs(Number(w.amount)), s: statusOf(w.status),
    id: w.id, idLabel: 'ID transaksi', note: w.admin_note
  }));
  (um.data || []).forEach(m => {
    const at = m.reviewed_at || m.submitted_at || m.claimed_at || m.completed_at;
    if(!at) return;
    acts.push({
      kind: 'misi', at, title: m.missions ? m.missions.title : 'Misi',
      amount: m.missions ? Number(m.missions.reward) : null, s: statusOf(m.status),
      id: m.mission_id, idLabel: 'ID misi', note: m.admin_note
    });
  });

  acts.sort((a, b) => new Date(b.at) - new Date(a.at));
  renderActs();
}

function actRow(a){
  const d = mk('div', 'item act'), l = mk('div'), r = mk('div', 'ar');
  d.tabIndex = 0;
  d.setAttribute('role', 'button');
  l.append(mk('div', 'n', a.title), mk('div', 's', KIND[a.kind] + ' · ' + fdate(a.at)));
  if(a.amount != null) r.append(mk('div', 'rw ' + (a.amount >= 0 ? 'plus' : 'minus'), (a.amount >= 0 ? '+' : '-') + rp(Math.abs(a.amount))));
  r.append(mk('span', 'badge ' + a.s.tone, a.s.label));
  d.append(l, r);
  d.onclick = () => openDetail(a);
  d.onkeydown = e => { if(e.key === 'Enter') openDetail(a); };
  return d;
}

function renderActs(){
  fillList($('act-home'), acts.filter(a => !a.dup).slice(0, 5).map(actRow), actsMsg || 'Belum ada aktivitas.');
  fillList($('tx-wallet'), acts.filter(a => a.kind === 'saldo').map(actRow), actsMsg || 'Belum ada transaksi.');
}

function openDetail(a){
  const d = new Date(a.at), body = $('d-body');
  $('d-title').textContent = a.title;
  body.innerHTML = '';
  const add = (k, v) => {
    const r = mk('div', 'drow');
    r.append(mk('span', '', k), v instanceof Node ? v : mk('span', '', v));
    body.appendChild(r);
  };
  add('Jenis', KIND[a.kind]);
  add('Tanggal', d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  add('Waktu', d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  add('Nominal', a.amount == null ? '-' : (a.amount >= 0 ? '+' : '-') + rp(Math.abs(a.amount)));
  add('Status', mk('span', 'badge ' + a.s.tone, a.s.label));
  if(a.id) add(a.idLabel, String(a.id));
  if(a.note) add('Catatan admin', a.note);
  showSheet('detail');
}
bindSheet('detail', 'd-close');

/* ===== MUAT ULANG SEMUA DATA ===== */
async function loadAll(){
  await loadProfile();
  await Promise.all([loadBalance(), loadMissions(), loadMyMissions(), loadDest(), loadQueue()]);
  renderMissions();
  renderMy();
  await loadActivity();
}

/* ===== TARIK SALDO ===== */
let dest = null; // data rekening tujuan

async function loadDest(){
  dest = null;
  if(!uid) return;
  const { data, error } = await sb.from('profiles').select('bank_name,account_name,account_number').eq('id', uid).maybeSingle();
  if(!error && data && data.bank_name && data.account_name && data.account_number) dest = data;
}

function renderDest(){
  const box = $('dest-box');
  box.innerHTML = '';
  if(!dest){ box.appendChild(mk('div', 'empty', 'Data rekening belum terdaftar.')); return; }
  box.append(
    mk('div', 'n', dest.bank_name),
    mk('div', 's', 'a.n. ' + dest.account_name),
    mk('div', 's', '••••' + String(dest.account_number).slice(-4))
  );
}

function openWithdraw(){
  $('sh-title').textContent = 'Tarik saldo';
  $('sh-sub').textContent = 'Minimal penarikan ' + rp(MIN_WITHDRAW) + '. Pastikan data tujuan benar.';
  $('sh-amount').min = MIN_WITHDRAW;
  $('sh-amount').value = '';
  $('sh-msg').textContent = '';
  $('sh-msg').className = 'msg';
  renderDest();
  showSheet('sheet');
}
const closeWithdraw = bindSheet('sheet', 'sh-cancel');
document.querySelectorAll('[data-open]').forEach(b => b.onclick = openWithdraw);

$('sh-go').onclick = async () => {
  const amount = Math.floor(Number($('sh-amount').value));
  const msg = $('sh-msg'), btn = $('sh-go');
  msg.className = 'msg';

  if(!amount || amount < MIN_WITHDRAW){ msg.textContent = 'Minimal penarikan ' + rp(MIN_WITHDRAW) + '.'; return; }
  if(!dest){ msg.textContent = 'Data rekening belum terdaftar. Hubungi admin.'; return; }
  if(!uid){ msg.textContent = 'Sesi tidak ditemukan. Data tidak bisa dikirim.'; return; }

  btn.disabled = true;
  btn.textContent = 'Memproses...';
  const { error } = await sb.rpc('request_withdrawal', { p_amount: amount });
  btn.disabled = false;
  btn.textContent = 'Kirim';

  if(error){ msg.textContent = error.message; return; }
  msg.textContent = 'Permintaan dikirim. Lihat nomor antreanmu di Home.';
  msg.className = 'msg ok';
  loadAll();
  setTimeout(closeWithdraw, 1600);
};