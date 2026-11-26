const sb = supabase.createClient('https://ifywhogjctrelgnvhjmd.supabase.co','sb_publishable_FGpFr35IwMH5dZ_do2bZaQ_alxzxEZp');
const $ = id => document.getElementById(id);
const rp = n => 'Rp ' + Number(n||0).toLocaleString('id-ID');
const DAILY_TARGET = 3;
// Teks pengumuman: ubah di sini (belum ada tabel pengumuman di database)
const ANNOUNCEMENT = 'Selamat datang di CUANBRO. Baca instruksi misi dengan teliti sebelum mengerjakan.';

let uid = null, hidden = false, balanceValue = 0;
try { hidden = localStorage.getItem('hideBal') === '1'; } catch(e){}

function mk(tag, cls, text){ const e=document.createElement(tag); if(cls)e.className=cls; if(text!==undefined)e.textContent=text; return e; }
function fillList(box, rows, emptyText){
  box.innerHTML='';
  if(!rows.length){ box.appendChild(mk('p','empty',emptyText)); return; }
  rows.forEach(r=>box.appendChild(r));
}
function row(name, sub, right, rightCls){
  const d=mk('div','item'), l=mk('div');
  l.append(mk('div','n',name), mk('div','s',sub));
  d.append(l, mk('div',rightCls,right));
  return d;
}
const fdate = s => new Date(s).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});

/* ----- Helper form (pesan & tombol loading) ----- */
function setMsg(id, text, ok){
  const e = $(id); e.textContent = text;
  e.classList.toggle('ok', !!ok);
}
function setBusy(id, on, label){
  const b = $(id); b.disabled = on;
  b.textContent = on ? 'Memproses...' : label;
}

/* ----- Ikon mata password ----- */
const EYE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYEOFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.9 17.9A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a18 18 0 0 1 4.1-5M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2"/><path d="M1 1l22 22"/></svg>';
document.querySelectorAll('.eyebtn').forEach(b=>{
  b.innerHTML = EYE;
  b.addEventListener('click',()=>{
    const i = b.previousElementSibling, show = i.type==='password';
    i.type = show ? 'text' : 'password';
    b.innerHTML = show ? EYEOFF : EYE;
    b.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Lihat password');
  });
});

/* ----- Saldo & sembunyikan ----- */
function paintBalance(){
  const t = hidden ? 'Rp ••••••' : rp(balanceValue);
  $('balance').textContent = t;
  document.querySelectorAll('[data-bal]').forEach(e=>e.textContent=t);
  $('eye').textContent = hidden ? '🙈' : '👁';
  $('eye').setAttribute('aria-label', hidden ? 'Tampilkan saldo' : 'Sembunyikan saldo');
}
$('eye').onclick = () => {
  hidden = !hidden;
  try { localStorage.setItem('hideBal', hidden ? '1':'0'); } catch(e){}
  paintBalance();
};

document.querySelectorAll('.refresh').forEach(b=>b.addEventListener('click',()=>{
  b.classList.add('spin'); setTimeout(()=>b.classList.remove('spin'),700);
  loadAll();
}));

/* ----- Data ----- */
const TX = {topup:'Isi saldo',withdraw:'Penarikan saldo',mission_reward:'Hadiah misi',adjustment:'Penyesuaian saldo'};
// Status user_missions di database: in_progress, pending, completed, rejected
const MS = {in_progress:'Sedang dikerjakan',pending:'Menunggu verifikasi',completed:'Berhasil',rejected:'Ditolak'};
let missions = [];

async function loadProfile(){
  const {data:{session}} = await sb.auth.getSession();
  uid = session ? session.user.id : null;
  let name = 'Pengguna';
  if(uid){
    $('acc-email').textContent = session.user.email || '';
    const {data} = await sb.from('profiles').select('full_name').eq('id',uid).maybeSingle();
    if(data && data.full_name) name = data.full_name;
    $('logout').style.display='block';
  }
  $('greet').textContent = 'Halo, ' + name;
  $('acc-name').textContent = name;
  $('avatar').textContent = name.charAt(0).toUpperCase();
}

let dest = null;
async function loadDest(){
  dest = null;
  if(!uid) return;
  const {data,error} = await sb.from('profiles').select('bank_name,account_name,account_number').eq('id',uid).maybeSingle();
  if(!error && data && data.bank_name && data.account_name && data.account_number) dest = data;
}
function renderDest(){
  const box = $('dest-box'); box.innerHTML = '';
  if(!dest){ box.appendChild(mk('div','empty','Data rekening belum terdaftar.')); return; }
  box.append(mk('div','n',dest.bank_name), mk('div','s','a.n. '+dest.account_name), mk('div','s','••••'+String(dest.account_number).slice(-4)));
}

async function loadQueue(){
  const card = $('queue-card'), box = $('queue-list');
  if(!uid){ card.style.display = 'none'; return; }
  const {data, error} = await sb.rpc('get_withdrawal_queue');
  if(error || !data || !data.length){ card.style.display = 'none'; return; }
  box.innerHTML = '';
  data.forEach(q=>{
    const ahead = Number(q.ahead), total = Number(q.total_pending);
    const row = mk('div','qrow');
    const info = mk('div');
    info.append(
      mk('div','n', ahead===0 ? 'Giliranmu berikutnya' : ahead + ' antrean di depanmu'),
      mk('div','s', 'dari ' + total + ' antrean · ' + rp(q.amount))
    );
    row.append(mk('div','qbig','#'+q.queue_no), info);
    box.appendChild(row);
    const bar = mk('div','bar'), fill = mk('i');
    fill.style.width = (total>0 ? Math.max(4, Math.round((total-ahead)/total*100)) : 100) + '%';
    bar.appendChild(fill); box.appendChild(bar);
  });
  card.style.display = 'block';
}
$('queue-refresh').onclick = async () => {
  const b = $('queue-refresh'); b.classList.add('spin');
  await loadQueue();
  b.classList.remove('spin');
};

async function loadBalance(){
  const {data,error} = await sb.from('wallets').select('balance').maybeSingle();
  balanceValue = error ? 0 : (data ? data.balance : 0);
  paintBalance();
}

async function loadMissions(){
  const {data,error} = await sb.from('missions').select('id,title,description,instructions,reward,duration_hours,verification_hours,max_participants,proof_type').eq('is_active',true).order('created_at',{ascending:false}).limit(30);
  missions = error ? [] : (data||[]);
  renderMissions();
}
let mFilter = 'aktif';
let umMap = {}, myAll = [];
const mState = m => umMap[m.id] ? umMap[m.id].status : 'none';
function dueText(m, u){
  if(u && u.status==='in_progress' && u.due_at) return 'Batas: ' + fdate(u.due_at);
  if(m.duration_hours) return 'Selesaikan dalam ' + m.duration_hours + ' jam';
  return 'Tanpa batas waktu';
}
function missionRow(m){
  const u = umMap[m.id];
  const sBadge = u ? st(u.status) : {label:'Tersedia', tone:'none'};
  const d = mk('div','item act');
  d.tabIndex = 0; d.setAttribute('role','button');
  const l = mk('div');
  l.append(mk('div','n',m.title), mk('div','s',dueText(m,u)));
  const r = mk('div','ar');
  r.append(mk('div','rw','+'+rp(m.reward)), mk('span','badge '+sBadge.tone, sBadge.label));
  d.append(l, r);
  d.onclick = () => openMission(m);
  d.onkeydown = e => { if(e.key==='Enter') openMission(m); };
  return d;
}
function renderMissions(){
  const q = $('search').value.trim().toLowerCase();
  const list = q ? missions.filter(m=>m.title.toLowerCase().includes(q)) : missions;
  const avail = list.filter(m=>mState(m)==='none');
  fillList($('mis-home'), (avail.length ? avail : list).slice(0,4).map(missionRow), q ? 'Misi tidak ditemukan.' : 'Belum ada misi aktif.');
  const shown = list.filter(m=> mFilter==='selesai' ? mState(m)==='completed' : mState(m)!=='completed');
  fillList($('mis-all'), shown.map(missionRow), q ? 'Misi tidak ditemukan.' : (mFilter==='selesai' ? 'Belum ada misi yang selesai.' : 'Belum ada misi aktif.'));
}
document.querySelectorAll('#m-chips .chip').forEach(c=>c.addEventListener('click',()=>{
  document.querySelectorAll('#m-chips .chip').forEach(x=>x.classList.toggle('on',x===c));
  mFilter = c.dataset.f; renderMissions();
}));
$('search').addEventListener('input', renderMissions);

async function loadMyMissions(){
  umMap = {}; myAll = [];
  if(uid){
    const {data,error} = await sb.from('user_missions')
      .select('mission_id,status,claimed_at,due_at,submitted_at,reviewed_at,completed_at,proof_text,proof_url,admin_note,admin_instructions,missions(title,reward)')
      .eq('user_id', uid).order('claimed_at',{ascending:false,nullsFirst:false}).limit(100);
    myAll = error ? [] : (data||[]);
  }
  myAll.forEach(x=>{ umMap[x.mission_id] = x; });

  // Status database: in_progress, pending, completed, rejected
  const done = myAll.filter(x=>x.status==='completed');
  $('st-done').textContent = done.length;
  $('st-reward').textContent = rp(done.reduce((a,x)=>a+Number(x.missions?x.missions.reward:0),0));

  const today = new Date().toDateString();
  const n = done.filter(x=>{ const t = x.reviewed_at||x.completed_at; return t && new Date(t).toDateString()===today; }).length;
  $('prog-txt').textContent = Math.min(n,DAILY_TARGET)+'/'+DAILY_TARGET;
  $('prog-bar').style.width = Math.min(100,n/DAILY_TARGET*100)+'%';
}
function renderMy(){
  const active = myAll.filter(x=>x.status==='in_progress'||x.status==='pending');
  fillList($('my-home'), active.slice(0,3).map(x=>{
    const m = missions.find(k=>k.id===x.mission_id);
    return m ? missionRow(m) : row(x.missions?x.missions.title:'Misi', st(x.status).label, x.missions?rp(x.missions.reward):'', 'rw');
  }), 'Belum ada misi yang sedang dikerjakan.');
}

/* ----- Detail misi, ambil misi, ajukan verifikasi ----- */
let curM = null, curMode = null;
function openMission(m){
  curM = m;
  const u = umMap[m.id], status = u ? u.status : 'none';
  const sb2 = u ? st(status) : {label:'Tersedia', tone:'none'};
  $('m-title').textContent = m.title;
  const body = $('m-body'); body.innerHTML = '';
  const add = (k, v) => { const r = mk('div','drow'); r.append(mk('span','',k)); r.append(v instanceof Node ? v : mk('span','',v)); body.appendChild(r); };
  const block = (t, txt) => { const b = mk('div','pblock'); b.append(mk('div','pt',t), mk('div','pb',txt)); body.appendChild(b); };
  add('Hadiah', '+'+rp(m.reward));
  add('Batas waktu', dueText(m,u));
  add('Verifikasi admin', 'Maks. ' + m.verification_hours + ' jam');
  if(m.max_participants) add('Kuota', m.max_participants + ' peserta');
  add('Status', mk('span','badge '+sb2.tone, sb2.label));
  if(m.description) block('Deskripsi', m.description);
  if(m.instructions) block('Instruksi', m.instructions);
  if(u && u.admin_instructions) block('Instruksi khusus untuk kamu', u.admin_instructions);
  if(u && u.admin_note) block('Catatan admin', u.admin_note);
  const canSubmit = status==='in_progress' || status==='rejected';
  const go = $('m-go');
  if(status==='none'){ curMode='claim'; go.textContent='Ambil Misi'; go.style.display='block'; }
  else if(canSubmit){ curMode='submit'; go.textContent = status==='rejected' ? 'Ajukan Ulang' : 'Saya Sudah Mengerjakan'; go.style.display='block'; }
  else { curMode=null; go.style.display='none'; }
  $('m-msg').textContent=''; $('m-msg').className='msg';
  $('msheet').classList.add('show');
}
$('m-close').onclick = () => $('msheet').classList.remove('show');
$('msheet').onclick = e => { if(e.target===$('msheet')) $('msheet').classList.remove('show'); };

$('m-go').onclick = async () => {
  const msg = $('m-msg'), btn = $('m-go');
  msg.className = 'msg'; msg.textContent = '';
  if(!uid){ msg.textContent = 'Sesi tidak ditemukan. Silakan masuk.'; return; }
  const m = curM, mode = curMode;
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Memproses...';
  const res = mode==='claim'
    ? await sb.rpc('claim_mission', {p_mission_id: m.id})
    : await sb.rpc('submit_mission', {p_mission_id: m.id, p_proof_text: 'Pengguna menandai misi sudah dikerjakan', p_proof_url: null});
  btn.disabled = false; btn.textContent = label;
  if(res.error){ msg.textContent = res.error.message; return; }
  await loadAll();
  if(mode==='claim'){
    openMission(m);
    $('m-msg').textContent = 'Misi berhasil diambil. Kerjakan, lalu tekan Saya Sudah Mengerjakan.';
    $('m-msg').className = 'msg ok';
  } else {
    msg.textContent = 'Terkirim. Menunggu verifikasi admin.'; msg.className = 'msg ok';
    setTimeout(()=>$('msheet').classList.remove('show'), 1200);
  }
};

/* ----- Aktivitas: data milik akun yang login ----- */
const KIND = {misi:'Misi', tarik:'Penarikan', saldo:'Transaksi Saldo'};
const TONES = {
  success:['approved','completed','success','succeeded','done','paid'],
  warning:['pending','submitted','waiting','under_review','review'],
  danger:['rejected','failed','declined','cancelled','canceled','expired'],
  info:['processing','in_progress','claimed']
};
const SLABEL = {approved:'Disetujui',completed:'Berhasil',success:'Berhasil',succeeded:'Berhasil',done:'Berhasil',paid:'Berhasil',
  pending:'Menunggu verifikasi',submitted:'Menunggu verifikasi',waiting:'Menunggu verifikasi',under_review:'Menunggu verifikasi',review:'Menunggu verifikasi',
  rejected:'Ditolak',declined:'Ditolak',failed:'Gagal',cancelled:'Dibatalkan',canceled:'Dibatalkan',expired:'Kedaluwarsa',
  processing:'Diproses',in_progress:'Diproses',claimed:'Sedang dikerjakan'};
function st(raw){
  const k = String(raw||'').toLowerCase();
  let tone = 'info';
  for(const t in TONES) if(TONES[t].includes(k)) tone = t;
  return {label: SLABEL[k] || raw || '-', tone};
}

let acts = [], actsMsg = '', fKind = 'all';

async function loadActivity(){
  acts = []; actsMsg = '';
  if(!uid){ actsMsg = 'Masuk untuk melihat riwayat aktivitas.'; renderActs(); return; }
  const q = (t, cols) => sb.from(t).select(cols).eq('user_id', uid).limit(200);
  const [tx, wd, um] = await Promise.all([
    q('transactions','id,type,amount,note,created_at'),
    q('withdrawals','id,amount,status,created_at,reviewed_at,admin_note'),
    q('user_missions','mission_id,status,claimed_at,submitted_at,reviewed_at,completed_at,admin_note,missions(title,reward)')
  ]);
  if(tx.error||wd.error||um.error) actsMsg = 'Sebagian riwayat gagal dimuat. Coba perbarui.';
  (tx.data||[]).forEach(t=>acts.push({kind:'saldo', at:t.created_at, title:t.note||TX[t.type]||'Transaksi saldo', amount:Number(t.amount), s:{label:'Berhasil',tone:'success'}, id:t.id, idLabel:'ID transaksi', note:null, dup:t.type==='withdraw'}));
  (wd.data||[]).forEach(w=>acts.push({kind:'tarik', at:w.created_at, title:'Penarikan saldo', amount:-Math.abs(Number(w.amount)), s:st(w.status), id:w.id, idLabel:'ID transaksi', note:w.admin_note}));
  (um.data||[]).forEach(m=>{
    const at = m.reviewed_at||m.submitted_at||m.claimed_at||m.completed_at;
    if(!at) return;
    acts.push({kind:'misi', at, title:(m.missions?m.missions.title:'Misi'), amount:m.missions?Number(m.missions.reward):null, s:st(m.status), id:m.mission_id, idLabel:'ID misi', note:m.admin_note});
  });
  acts.sort((a,b)=>new Date(b.at)-new Date(a.at));
  renderActs();
}

function actRow(a){
  const d = mk('div','item act');
  d.tabIndex = 0; d.setAttribute('role','button');
  const l = mk('div');
  l.append(mk('div','n',a.title), mk('div','s',KIND[a.kind]+' · '+fdate(a.at)));
  const r = mk('div','ar');
  if(a.amount!=null) r.append(mk('div','rw '+(a.amount>=0?'plus':'minus'), (a.amount>=0?'+':'-')+rp(Math.abs(a.amount))));
  r.append(mk('span','badge '+a.s.tone, a.s.label));
  d.append(l, r);
  d.onclick = () => openDetail(a);
  d.onkeydown = e => { if(e.key==='Enter') openDetail(a); };
  return d;
}

function periodRange(){
  const p = $('a-period').value, now = new Date();
  const sod = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if(p==='today') return [sod(now), null];
  if(p==='7' || p==='30'){ const f = sod(now); f.setDate(f.getDate()-(Number(p)-1)); return [f, null]; }
  if(p==='custom'){
    const f = $('a-from').value ? new Date($('a-from').value+'T00:00:00') : null;
    const t = $('a-to').value ? new Date($('a-to').value+'T23:59:59.999') : null;
    return [f, t];
  }
  return [null, null];
}

function renderActs(){
  const q = $('a-search').value.trim().toLowerCase();
  const [from, to] = periodRange();
  const list = acts.filter(a=>{
    if(fKind!=='all' && a.kind!==fKind) return false;
    if(fKind==='all' && a.dup) return false;
    if(q && !(a.title.toLowerCase().includes(q) || KIND[a.kind].toLowerCase().includes(q))) return false;
    const t = new Date(a.at);
    if(from && t<from) return false;
    if(to && t>to) return false;
    return true;
  });
  const none = actsMsg || (acts.length ? 'Tidak ada aktivitas yang cocok.' : 'Belum ada aktivitas.');
  fillList($('act-all'), list.map(actRow), none);
  fillList($('act-home'), acts.filter(a=>!a.dup).slice(0,5).map(actRow), actsMsg || 'Belum ada aktivitas.');
  fillList($('tx-wallet'), acts.filter(a=>a.kind==='saldo').map(actRow), actsMsg || 'Belum ada transaksi.');
}

function openDetail(a){
  const d = new Date(a.at);
  $('d-title').textContent = a.title;
  const body = $('d-body'); body.innerHTML = '';
  const add = (k, v) => { const r = mk('div','drow'); r.append(mk('span','',k)); if(v instanceof Node) r.append(v); else r.append(mk('span','',v)); body.appendChild(r); };
  add('Jenis', KIND[a.kind]);
  add('Tanggal', d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
  add('Waktu', d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));
  add('Nominal', a.amount==null ? '-' : (a.amount>=0?'+':'-')+rp(Math.abs(a.amount)));
  add('Status', mk('span','badge '+a.s.tone, a.s.label));
  if(a.id) add(a.idLabel, String(a.id));
  if(a.note) add('Catatan admin', a.note);
  $('detail').classList.add('show');
}
$('d-close').onclick = () => $('detail').classList.remove('show');
$('detail').onclick = e => { if(e.target===$('detail')) $('detail').classList.remove('show'); };

document.querySelectorAll('#a-chips .chip').forEach(c=>c.addEventListener('click',()=>{
  document.querySelectorAll('#a-chips .chip').forEach(x=>x.classList.toggle('on',x===c));
  fKind = c.dataset.f; renderActs();
}));
$('a-search').addEventListener('input', renderActs);
$('a-period').addEventListener('change', ()=>{
  const custom = $('a-period').value==='custom';
  $('a-from').classList.toggle('hid',!custom); $('a-to').classList.toggle('hid',!custom);
  renderActs();
});
$('a-from').addEventListener('change', renderActs);
$('a-to').addEventListener('change', renderActs);

async function loadAll(){
  await loadProfile();
  await Promise.all([loadBalance(), loadMissions(), loadMyMissions(), loadDest(), loadQueue()]);
  renderMissions(); renderMy();
  await loadActivity();
}

/* ----- Tarik saldo ----- */
function openSheet(){
  $('sh-title').textContent = 'Tarik saldo';
  $('sh-sub').textContent = 'Minimal penarikan Rp 50.000. Pastikan data tujuan benar.';
  $('sh-amount').value=''; renderDest(); $('sh-msg').textContent=''; $('sh-msg').className='msg';
  $('sheet').classList.add('show');
}
const closeSheet = () => $('sheet').classList.remove('show');
document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openSheet());
$('sh-cancel').onclick = closeSheet;
$('sheet').onclick = e => { if(e.target===$('sheet')) closeSheet(); };

$('sh-go').onclick = async () => {
  const amount = Math.floor(Number($('sh-amount').value));
  const msg = $('sh-msg'), btn = $('sh-go');
  msg.className='msg';
  if(!amount || amount < 50000){ msg.textContent='Minimal penarikan Rp 50.000.'; return; }
  if(!dest){ msg.textContent='Data rekening belum terdaftar. Hubungi admin.'; return; }
  if(!uid){ msg.textContent='Sesi tidak ditemukan. Data tidak bisa dikirim.'; return; }
  btn.disabled=true; btn.textContent='Memproses...';
  const {error} = await sb.rpc('request_withdrawal',{p_amount:amount});
  btn.disabled=false; btn.textContent='Kirim';
  if(error){ msg.textContent=error.message; return; }
  msg.textContent='Permintaan dikirim. Lihat nomor antreanmu di Home.'; msg.className='msg ok';
  loadAll(); setTimeout(closeSheet,1600);
};

/* ----- Navigasi ----- */
const nav = $('nav'), lens = $('lens');
function moveLens(btn){
  if(!btn) return;
  const n = nav.getBoundingClientRect(), b = btn.getBoundingClientRect();
  if(btn.classList.contains('center-btn')){
    lens.style.left=(b.left-n.left)+'px'; lens.style.width=b.width+'px';
    lens.style.top=(b.top-n.top)+'px'; lens.style.height=b.height+'px';
    lens.style.borderRadius='50%'; lens.classList.add('over');
  } else {
    lens.style.left=(b.left-n.left+4)+'px'; lens.style.width=(b.width-8)+'px';
    lens.style.top='8px'; lens.style.height='calc(100% - 16px)';
    lens.style.borderRadius='22px'; lens.classList.remove('over');
  }
}
function go(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));
  let active=null;
  document.querySelectorAll('#nav button').forEach(b=>{const on=b.dataset.go===id; b.classList.toggle('active',on); if(on)active=b;});
  moveLens(active);
  window.scrollTo(0,0);
}
window.addEventListener('resize',()=>moveLens(document.querySelector('#nav button.active')));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
$('avatar').onclick = () => go('profile');
$('bell').onclick = () => openNotif();
$('logout').onclick = async () => { await pushDetach(); await sb.auth.signOut(); location.reload(); };

/* ----- Animasi muncul saat scroll ----- */
const io = new IntersectionObserver(entries=>{
  entries.forEach((e,i)=>{
    if(e.isIntersecting){
      e.target.style.transitionDelay = (i*60)+'ms';
      e.target.classList.add('in');
    } else if(e.target.offsetParent === null){
      e.target.classList.remove('in');
    }
  });
},{threshold:.08,rootMargin:'0px 0px -4% 0px'});
document.querySelectorAll('.page > *').forEach(el=>{ el.classList.add('rv'); io.observe(el); });

/* ----- Menu garis tiga ----- */
const drawer = $('drawer'), dback = $('drawer-back');
function openDrawer(){
  $('dm-out').style.display = uid ? 'flex' : 'none';
  drawer.classList.add('open'); dback.classList.add('show');
  drawer.setAttribute('aria-hidden','false'); $('menu-btn').setAttribute('aria-expanded','true');
  document.body.style.overflow = 'hidden';
}
function closeDrawer(){
  drawer.classList.remove('open'); dback.classList.remove('show');
  drawer.setAttribute('aria-hidden','true'); $('menu-btn').setAttribute('aria-expanded','false');
  document.body.style.overflow = '';
}
$('menu-btn').onclick = openDrawer;
$('drawer-close').onclick = closeDrawer;
dback.onclick = closeDrawer;
document.addEventListener('keydown', e => { if(e.key==='Escape') closeDrawer(); });
document.querySelectorAll('.dm-item[data-go]').forEach(b=>b.addEventListener('click', closeDrawer));
$('dm-out').onclick = async () => { await pushDetach(); await sb.auth.signOut(); location.reload(); };

function openInfo(title, nodes){
  $('i-title').textContent = title;
  const b = $('i-body'); b.innerHTML = '';
  nodes.forEach(n => b.appendChild(n));
  $('isheet').classList.add('show');
}
$('i-close').onclick = () => $('isheet').classList.remove('show');
$('isheet').onclick = e => { if(e.target===$('isheet')) $('isheet').classList.remove('show'); };

function showTutorial(){
  const steps = [
    ['Pilih misi', 'Buka menu Misi, lalu pilih misi yang tersedia. Baca deskripsi, instruksi, hadiah, dan batas waktunya.'],
    ['Ambil misi', 'Tekan Ambil Misi. Waktu pengerjaan mulai dihitung sejak misi diambil.'],
    ['Kerjakan misi', 'Selesaikan sesuai instruksi, lalu tekan Saya Sudah Mengerjakan. Tidak perlu mengirim foto atau bukti.'],
    ['Tunggu verifikasi', 'Admin memeriksa di panelnya apakah akunmu sudah mengerjakan misi tersebut. Kalau ditolak, baca catatan admin lalu ajukan ulang.'],
    ['Hadiah masuk ke saldo', 'Setelah misi berstatus Berhasil, hadiah masuk ke saldo. Pantau di Aktivitas dan Riwayat.'],
    ['Tarik saldo', 'Tekan Tarik Saldo di Home (minimal Rp 50.000). Penarikan dikirim ke rekening yang terdaftar di akunmu.']
  ];
  openInfo('Tutorial', steps.map((st2,i)=>{
    const b = mk('div','pblock');
    b.append(mk('div','pt','Langkah '+(i+1)+' · '+st2[0]), mk('div','pb',st2[1]));
    return b;
  }));
}

/* ----- Chat CS: bot AI, admin/owner bisa ambil alih ----- */
let csMode = 'bot', csChan = null, csTimer = null;
const csSeen = new Set();

function csSetMode(m){
  csMode = m;
  const b = $('cs-mode');
  b.textContent = m==='bot' ? '🤖 Bot AI' : '👤 Admin';
  b.className = 'badge ' + (m==='bot' ? 'info' : 'success');
  $('cs-sub').textContent = m==='bot' ? 'Dibalas bot AI. Kamu bisa minta admin kapan saja.' : 'Percakapan ditangani admin. Tunggu balasan ya.';
  $('cs-human').style.display = (m==='bot' && uid) ? 'inline-flex' : 'none';
  if(m!=='bot') csTyping(false);
}
function csTyping(on){
  $('cs-typing').style.display = on ? 'block' : 'none';
  clearTimeout(csTimer);
  if(on) csTimer = setTimeout(()=>csTyping(false), 25000);
}
function csBubble(kind, body, at){
  const w = mk('div','bub '+(kind==='user' ? 'me' : 'them'));
  if(kind!=='user') w.append(mk('div','who', kind==='bot' ? 'Bot CUANBRO' : 'Admin'));
  w.append(mk('div','',body||''));
  if(at) w.append(mk('div','bt', new Date(at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})));
  const list = $('cs-list'); list.appendChild(w); list.scrollTop = list.scrollHeight;
}
function csAdd(m){
  if(csSeen.has(m.id)) return;
  csSeen.add(m.id);
  const kind = m.sender_kind || 'user';
  csBubble(kind, m.body, m.created_at);
  if(kind!=='user') csTyping(false);
}
function csLeave(){
  $('csheet').classList.remove('show');
  csTyping(false);
  if(csChan){ sb.removeChannel(csChan); csChan = null; }
}
async function showCS(){
  $('csheet').classList.add('show');
  const list = $('cs-list'); list.innerHTML = ''; csSeen.clear();
  $('cs-msg').textContent = '';
  const on = !!uid;
  $('cs-text').disabled = !on; $('cs-send').disabled = !on;
  if(!on){ list.appendChild(mk('p','empty','Masuk untuk memakai chat bantuan.')); csSetMode('bot'); return; }
  csBubble('bot', 'Halo! Saya bot CS CUANBRO. Ada yang bisa dibantu?');
  const [th, ms] = await Promise.all([
    sb.from('cs_threads').select('mode').eq('user_id', uid).maybeSingle(),
    sb.from('messages').select('id,sender_kind,body,created_at').eq('thread_id', uid).order('created_at',{ascending:true}).limit(100)
  ]);
  csSetMode(th.data ? th.data.mode : 'bot');
  if(ms.error){ $('cs-msg').textContent = 'Chat belum bisa dimuat. Pastikan setup SQL sudah dijalankan.'; return; }
  (ms.data||[]).forEach(csAdd);
  if(csChan) sb.removeChannel(csChan);
  csChan = sb.channel('cs-'+uid)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'thread_id=eq.'+uid}, p=>csAdd(p.new))
    .on('postgres_changes',{event:'*',schema:'public',table:'cs_threads',filter:'user_id=eq.'+uid}, p=>{ if(p.new && p.new.mode) csSetMode(p.new.mode); })
    .subscribe();
}
async function csSend(){
  const inp = $('cs-text'), body = inp.value.trim();
  if(!body || !uid) return;
  $('cs-msg').textContent = '';
  inp.value = ''; $('cs-send').disabled = true;
  const {data, error} = await sb.from('messages').insert({thread_id:uid, sender_id:uid, type:'text', body})
    .select('id,sender_kind,body,created_at').single();
  $('cs-send').disabled = false;
  if(error){ inp.value = body; $('cs-msg').textContent = 'Pesan gagal terkirim. Coba lagi.'; return; }
  csAdd(data);
  if(csMode==='bot'){
    csTyping(true);
    const r = await sb.functions.invoke('cs-bot');
    if(r.error){ csTyping(false); $('cs-msg').textContent = 'Bot sedang tidak tersedia. Tekan Minta admin.'; }
  }
}
$('cs-send').onclick = csSend;
$('cs-text').addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); csSend(); } });
$('cs-human').onclick = async () => {
  const {error} = await sb.rpc('cs_request_human');
  if(error){ $('cs-msg').textContent = 'Gagal meminta admin. Coba lagi.'; return; }
  csSetMode('human');
};
$('cs-close').onclick = csLeave;
$('csheet').onclick = e => { if(e.target===$('csheet')) csLeave(); };
document.querySelectorAll('.dm-item[data-info]').forEach(b=>b.addEventListener('click',()=>{
  closeDrawer();
  b.dataset.info==='tutorial' ? showTutorial() : showCS();
}));

/* ===== Notifikasi: pop-up izin, pusat notifikasi, pengaturan, push ===== */
const NOTIF_CFG = {
  vapidPublicKey: '',      // isi dengan kunci PUBLIK VAPID. Kunci private TIDAK boleh ada di file ini.
  swPath: 'sw.js',         // service worker, satu folder dengan file HTML ini
  pushServerReady: false,  // ubah ke true HANYA setelah Edge Function pengirim push terpasang dan diuji
  snoozeMs: 5*60*1000      // jeda pop-up setelah Tolak
};

/* penyimpanan lokal aman: jika localStorage tidak tersedia, pakai memori */
const store = {
  mem: {},
  get(k){ let v = null; try{ v = localStorage.getItem(k); }catch(e){} return v !== null ? v : (k in this.mem ? this.mem[k] : null); },
  set(k,v){ this.mem[k] = v; try{ localStorage.setItem(k,v); }catch(e){} },
  del(k){ delete this.mem[k]; try{ localStorage.removeItem(k); }catch(e){} }
};
/* semua kunci memakai id akun, jadi tiap akun punya preferensi sendiri */
const kPop = u => 'cb:n:pop:' + u;
const kInapp = u => 'cb:n:inapp:' + u;
const kPushOwner = 'cb:n:pushowner';
const inappOn = u => store.get(kInapp(u)) !== '0';
const permNow = () => ('Notification' in window) ? Notification.permission : 'unsupported';

let toastT = null;
function showToast(text){
  const t = $('toast'); t.textContent = text; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove('show'), 4500);
}
$('toast').onclick = () => { $('toast').classList.remove('show'); openNotif(); };

function requestPerm(){
  return new Promise((resolve, reject)=>{
    try{
      const p = Notification.requestPermission(resolve);
      if(p && typeof p.then === 'function') p.then(resolve, reject);
    }catch(e){ reject(e); }
  });
}

/* ----- Push (sisi browser) ----- */
const pushSupported = () => window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
function b64ToU8(s){
  const b = (s + '='.repeat((4 - s.length % 4) % 4)).replace(/-/g,'+').replace(/_/g,'/');
  return Uint8Array.from(atob(b), c => c.charCodeAt(0));
}
async function pushCurrentSub(){
  if(!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}
async function pushSubscribe(u){
  if(!pushSupported()) throw new Error('Browser atau perangkat ini tidak mendukung push (butuh HTTPS).');
  if(!NOTIF_CFG.vapidPublicKey) throw new Error('Kunci VAPID publik belum diisi.');
  if(Notification.permission !== 'granted') throw new Error('Izin notifikasi browser belum diberikan.');
  const reg = await navigator.serviceWorker.register(NOTIF_CFG.swPath);
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  // subscription milik akun lain di perangkat ini tidak boleh dipakai ulang
  if(sub && store.get(kPushOwner) !== u){ await sub.unsubscribe(); sub = null; }
  if(!sub) sub = await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:b64ToU8(NOTIF_CFG.vapidPublicKey)});
  const j = sub.toJSON();
  const {error} = await sb.from('push_subscriptions').upsert(
    {user_id:u, endpoint:j.endpoint, p256dh:j.keys.p256dh, auth:j.keys.auth, user_agent:(navigator.userAgent||'').slice(0,200)},
    {onConflict:'endpoint'});
  if(error) throw new Error('Subscription gagal disimpan: ' + error.message);
  store.set(kPushOwner, u);
}
async function pushUnsubscribe(){
  try{
    const sub = await pushCurrentSub();
    if(sub){
      const ep = sub.endpoint;
      try{ await sb.from('push_subscriptions').delete().eq('endpoint', ep); }catch(e){}
      await sub.unsubscribe();
    }
  }catch(e){}
  store.del(kPushOwner);
}
/* dipanggil sebelum signOut: lepas subscription dari akun ini (maksimal 2,5 detik) */
function pushDetach(){
  return Promise.race([pushUnsubscribe(), new Promise(r=>setTimeout(r,2500))]).catch(()=>{});
}
async function pushStatus(u){
  if(!pushSupported()) return 'unsupported';
  if(!NOTIF_CFG.vapidPublicKey) return 'unconfigured';
  let sub = null; try{ sub = await pushCurrentSub(); }catch(e){}
  return (sub && store.get(kPushOwner) === u) ? 'on' : 'off';
}

/* ----- Pop-up izin setelah login / daftar ----- */
let popShownFor = null, popUid = null;
function popState(u){ try{ return JSON.parse(store.get(kPop(u)) || '{}') || {}; }catch(e){ return {}; } }
function popSave(u, o){ store.set(kPop(u), JSON.stringify(o)); }
function popShouldShow(u){
  if(!('Notification' in window)) return false;       // tidak ada API: notifikasi dalam aplikasi tetap jalan
  if(Notification.permission !== 'default') return false; // sudah granted/denied: jangan minta lagi
  if(popShownFor === u) return false;                  // satu kali per sesi
  const s = popState(u), now = Date.now();
  // masih dalam masa tunda 5 menit (abaikan nilai yang tidak masuk akal akibat jam diubah)
  if(s.snoozeUntil && now < s.snoozeUntil && s.snoozeUntil - now <= NOTIF_CFG.snoozeMs) return false;
  return true;
}
function modalBusy(){
  return !!document.querySelector('.back.show') || $('drawer').classList.contains('open') || recovering;
}
function consentSchedule(u){
  let tries = 0;
  const tick = () => {
    if(enteredUid !== u || !popShouldShow(u)) return;
    if(modalBusy()){ if(tries++ < 40){ setTimeout(tick, 1500); } return; }
    showConsent(u);
  };
  setTimeout(tick, 900);
}
function showConsent(u){
  popShownFor = u; popUid = u;
  $('pop-msg').textContent = ''; $('pop-msg').className = 'msg';
  $('pop-allow').disabled = false; $('pop-deny').disabled = false;
  $('pop').classList.add('show'); $('pop').setAttribute('aria-hidden','false');
  setTimeout(()=>{ try{ $('pop-allow').focus(); }catch(e){} }, 350);
}
function hideConsent(){
  $('pop').classList.remove('show'); $('pop').setAttribute('aria-hidden','true');
  popUid = null;
}
$('pop-deny').onclick = () => {
  const u = popUid; if(!u) return;
  popSave(u, {perm:'declined', at:Date.now(), snoozeUntil:Date.now() + NOTIF_CFG.snoozeMs});
  hideConsent();
};
document.addEventListener('keydown', e => { if(e.key==='Escape' && popUid) $('pop-deny').click(); });
$('pop-allow').onclick = async () => {
  const u = popUid; if(!u) return;
  const msg = $('pop-msg');
  $('pop-allow').disabled = true; $('pop-deny').disabled = true;
  let res;
  try{ res = await requestPerm(); }catch(e){ res = permNow(); }
  if(popUid !== u) return; // akun berganti saat menunggu
  if(res === 'granted'){
    popSave(u, {perm:'granted', at:Date.now()});
    let text = 'Izin browser aktif. Notifikasi dalam aplikasi siap dipakai.';
    if(NOTIF_CFG.vapidPublicKey && pushSupported()){
      try{ await pushSubscribe(u); text += ' Perangkat ini terdaftar untuk push.'; }
      catch(e){ text += ' Push belum bisa diaktifkan: ' + e.message; }
    } else {
      text += ' Push ke layar HP memerlukan konfigurasi tambahan.';
    }
    msg.textContent = text; msg.className = 'msg ok';
  } else if(res === 'denied'){
    popSave(u, {perm:'denied', at:Date.now()});
    msg.textContent = 'Izin ditolak di browser. Notifikasi dalam aplikasi tetap bisa dipakai.'; msg.className = 'msg';
  } else {
    popSave(u, {perm:'default', at:Date.now(), snoozeUntil:Date.now() + NOTIF_CFG.snoozeMs});
    msg.textContent = 'Belum ada keputusan. Kamu bisa mengaturnya di Profile.'; msg.className = 'msg';
  }
  renderNotifSettings();
  setTimeout(()=>{ if(popUid === u) hideConsent(); }, 2200);
};

/* ----- Pusat notifikasi ----- */
const N = {uid:null, items:[], unread:0, seen:new Set(), loaded:false, loading:false, err:'', chan:null, timer:null, rtOk:false, busy:false, soon:null};

function paintBadge(){
  const b = $('nbadge'), n = (N.uid && inappOn(N.uid)) ? N.unread : 0;
  b.textContent = n > 99 ? '99+' : String(n);
  b.classList.toggle('on', n > 0);
  $('bell').setAttribute('aria-label', n > 0 ? 'Notifikasi, ' + n + ' belum dibaca' : 'Notifikasi');
}
function renderNotif(){
  paintBadge();
  const box = $('n-list'), all = $('n-all');
  box.innerHTML = '';
  const on = N.uid && inappOn(N.uid);
  all.style.display = on ? '' : 'none';
  all.disabled = N.busy || N.unread === 0;
  $('n-sub').textContent = on ? (N.unread > 0 ? N.unread + ' belum dibaca' : 'Semua sudah dibaca') : '';
  if(!on){
    box.appendChild(mk('p','empty','Notifikasi dalam aplikasi dimatikan. Aktifkan lewat Profile → Notifikasi.'));
    return;
  }
  if(!N.loaded){
    box.appendChild(mk('p','empty', N.err || 'Memuat notifikasi...'));
    return;
  }
  if(N.err) box.appendChild(mk('p','msg',N.err));
  if(!N.items.length){ box.appendChild(mk('p','empty','Belum ada notifikasi.')); return; }
  N.items.forEach(it=>{
    const b = mk('button','nitem' + (it.is_read ? '' : ' unread'));
    b.type = 'button';
    b.setAttribute('aria-label', (it.is_read ? '' : 'Belum dibaca. ') + it.title);
    const d = mk('span','nd'), c = mk('div');
    c.append(mk('div','nt',it.title||'Notifikasi'));
    if(it.body) c.append(mk('div','nb',it.body));
    c.append(mk('div','nm', fdate(it.created_at) + (it.is_read ? ' · Dibaca' : ' · Ketuk untuk tandai dibaca')));
    b.append(d, c);
    b.onclick = () => nMarkRead(it.id);
    box.appendChild(b);
  });
}
function nMsg(t){ $('n-msg').textContent = t || ''; }

async function nFetch(){
  const u = N.uid;
  if(!u || !inappOn(u) || N.loading) return;
  N.loading = true;
  try{
    const [l, c] = await Promise.all([
      sb.from('notifications').select('id,title,body,type,is_read,created_at').eq('user_id',u).order('created_at',{ascending:false}).limit(50),
      sb.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',u).eq('is_read',false)
    ]);
    if(N.uid !== u) return; // akun berganti selagi memuat
    if(l.error){ N.err = 'Notifikasi gagal dimuat. Coba lagi nanti.'; renderNotif(); return; }
    N.err = '';
    const rows = l.data || [];
    const fresh = rows.filter(r => !N.seen.has(r.id));
    rows.forEach(r => N.seen.add(r.id));
    N.items = rows;
    N.unread = c.error ? rows.filter(r=>!r.is_read).length : (c.count || 0);
    const wasLoaded = N.loaded;
    N.loaded = true;
    renderNotif();
    // beri tahu notifikasi baru hanya setelah muatan awal, dan hanya yang belum dibaca
    const newest = fresh.filter(r=>!r.is_read)[0];
    if(wasLoaded && newest && !$('nsheet').classList.contains('show')) showToast('🔔 ' + (newest.title||'Notifikasi baru'));
  }catch(e){
    if(N.uid === u){ N.err = 'Notifikasi gagal dimuat. Coba lagi nanti.'; renderNotif(); }
  }finally{ N.loading = false; }
}
function nFetchSoon(){ clearTimeout(N.soon); N.soon = setTimeout(nFetch, 300); }

async function nMarkRead(id){
  const u = N.uid, it = N.items.find(x=>x.id===id);
  if(!u || !it || it.is_read) return;
  it.is_read = true; N.unread = Math.max(0, N.unread-1); nMsg(''); renderNotif();
  const {data, error} = await sb.from('notifications').update({is_read:true}).eq('id',id).eq('user_id',u).select('id');
  if(N.uid !== u) return;
  if(error || !data || !data.length){
    it.is_read = false; N.unread++; renderNotif();
    nMsg('Gagal menandai dibaca. Coba lagi.');
  }
}
async function nMarkAll(){
  const u = N.uid;
  if(!u || N.busy || N.unread === 0) return;
  N.busy = true; nMsg('');
  const prev = N.items.map(x=>x.is_read), prevUnread = N.unread;
  N.items.forEach(x=>x.is_read = true); N.unread = 0; renderNotif();
  const {data, error} = await sb.from('notifications').update({is_read:true}).eq('user_id',u).eq('is_read',false).select('id');
  N.busy = false;
  if(N.uid !== u) return;
  if(error || !data || !data.length){
    N.items.forEach((x,i)=>x.is_read = prev[i]); N.unread = prevUnread;
    nMsg('Gagal menandai semua dibaca. Coba lagi.');
  }
  renderNotif();
}
$('n-all').onclick = nMarkAll;

function openNotif(){
  nMsg('');
  renderNotif();
  $('nsheet').classList.add('show');
  if(N.uid && inappOn(N.uid)) nFetch();
}
const closeNotif = () => $('nsheet').classList.remove('show');
$('n-close').onclick = closeNotif;
$('nsheet').onclick = e => { if(e.target === $('nsheet')) closeNotif(); };

function nSchedule(){
  clearTimeout(N.timer);
  if(!N.uid || !inappOn(N.uid)) return;
  // polling aman sebagai cadangan; lebih jarang jika Realtime aktif
  N.timer = setTimeout(async()=>{ if(!document.hidden) await nFetch(); nSchedule(); }, N.rtOk ? 120000 : 30000);
}
function nDataStart(u){
  nDataStop(false);
  N.uid = u; N.loaded = false; N.err = '';
  renderNotif();
  if(!inappOn(u)) return;
  nFetch();
  try{
    N.chan = sb.channel('notif-' + u)
      .on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:'user_id=eq.'+u}, nFetchSoon)
      .subscribe(s => { N.rtOk = (s === 'SUBSCRIBED'); });
  }catch(e){ N.rtOk = false; }
  nSchedule();
}
function nDataStop(clearUid){
  clearTimeout(N.timer); clearTimeout(N.soon);
  if(N.chan){ try{ sb.removeChannel(N.chan); }catch(e){} N.chan = null; }
  N.rtOk = false; N.items = []; N.unread = 0; N.seen = new Set(); N.loaded = false; N.loading = false; N.err = '';
  if(clearUid !== false) N.uid = null;
  renderNotif();
}
document.addEventListener('visibilitychange', () => { if(!document.hidden && N.uid && inappOn(N.uid)) nFetch(); });

/* ----- Pengaturan notifikasi (Profile) ----- */
async function renderNotifSettings(){
  const u = N.uid; if(!u) return;
  const perm = permNow(), help = $('ns-help'), btn = $('ns-btn');
  $('ns-perm').textContent = {granted:'Diizinkan', denied:'Ditolak', default:'Belum diminta', unsupported:'Tidak didukung'}[perm];
  $('ns-inapp').checked = inappOn(u);
  help.style.display = 'none';
  if(perm === 'denied'){
    help.textContent = 'Izin diblokir di browser. Buka pengaturan situs di browser (ikon gembok/⋮ di bilah alamat → Izin → Notifikasi), pilih Izinkan, lalu muat ulang halaman. Aplikasi tidak bisa memaksa izin ini.';
    help.style.display = 'block';
  }
  const ps = await pushStatus(u);
  if(N.uid !== u) return;
  $('ns-support').textContent = pushSupported() ? 'Didukung' : 'Tidak didukung' + (window.isSecureContext ? '' : ' (butuh HTTPS)');
  $('ns-push').textContent = {
    unsupported:'Tidak tersedia',
    unconfigured:'Belum dikonfigurasi (server belum siap)',
    off:'Belum diaktifkan',
    on: NOTIF_CFG.pushServerReady ? 'Aktif' : 'Perangkat terdaftar, pengirim server belum diuji'
  }[ps];
  btn.style.display = 'none'; btn.dataset.act = '';
  if(perm === 'default'){ btn.textContent = 'Izinkan notifikasi browser'; btn.dataset.act = 'perm'; btn.style.display = 'block'; }
  else if(perm === 'granted' && ps === 'off'){ btn.textContent = 'Aktifkan push di perangkat ini'; btn.dataset.act = 'on'; btn.style.display = 'block'; }
  else if(perm === 'granted' && ps === 'on'){ btn.textContent = 'Nonaktifkan push di perangkat ini'; btn.dataset.act = 'off'; btn.style.display = 'block'; }
}
$('ns-inapp').onchange = () => {
  const u = N.uid; if(!u) return;
  const on = $('ns-inapp').checked;
  store.set(kInapp(u), on ? '1' : '0');
  if(on) nDataStart(u); else nDataStop(false);
  setMsg('ns-msg', on ? 'Notifikasi dalam aplikasi diaktifkan.' : 'Notifikasi dalam aplikasi dimatikan.', true);
};
$('ns-btn').onclick = async () => {
  const u = N.uid, act = $('ns-btn').dataset.act; if(!u || !act) return;
  const btn = $('ns-btn'); btn.disabled = true; setMsg('ns-msg','');
  try{
    if(act === 'perm'){
      const r = await requestPerm();
      setMsg('ns-msg', r==='granted' ? 'Izin browser aktif.' : r==='denied' ? 'Izin ditolak di browser.' : 'Belum ada keputusan.', r==='granted');
      if(r==='granted') popSave(u,{perm:'granted',at:Date.now()}); else if(r==='denied') popSave(u,{perm:'denied',at:Date.now()});
    } else if(act === 'on'){
      await pushSubscribe(u);
      setMsg('ns-msg','Perangkat ini terdaftar untuk push.', true);
    } else {
      await pushUnsubscribe();
      setMsg('ns-msg','Push dinonaktifkan di perangkat ini.', true);
    }
  }catch(e){ setMsg('ns-msg', e.message || 'Gagal. Coba lagi.'); }
  btn.disabled = false;
  renderNotifSettings();
};

/* dipanggil setelah login berhasil dan dashboard siap */
function notifStart(u){
  hideConsent(); popShownFor = null;
  nDataStart(u);
  renderNotifSettings();
  consentSchedule(u);
  // sinkronkan ulang subscription hanya jika pengguna ini sudah pernah mengaktifkannya di perangkat ini
  if(NOTIF_CFG.vapidPublicKey && pushSupported() && permNow()==='granted' && store.get(kPushOwner)===u){
    pushSubscribe(u).then(renderNotifSettings).catch(()=>{});
  }
}
function notifStop(){
  hideConsent(); popShownFor = null;
  closeNotif(); $('toast').classList.remove('show');
  nDataStop(true);
}

/* ----- Masuk, daftar, lupa password ----- */
const SUBS = {login:'Masuk untuk melanjutkan', register:'Buat akun baru', forgot:'Lupa password', reset:'Password baru'};
function showView(n){
  document.querySelectorAll('#auth .view').forEach(v=>v.classList.toggle('active', v.id==='view-'+n));
  document.querySelectorAll('#auth .msg').forEach(m=>{ m.textContent=''; m.classList.remove('ok'); });
  $('brand-sub').textContent = SUBS[n] || '';
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
const backTo = () => window.location.origin + window.location.pathname;

$('login-form').addEventListener('submit', async e=>{
  e.preventDefault(); setMsg('login-msg','');
  setBusy('login-btn', true, 'Masuk');
  const {error} = await sb.auth.signInWithPassword({email:$('login-email').value.trim(), password:$('login-password').value});
  setBusy('login-btn', false, 'Masuk');
  if(error) setMsg('login-msg', 'Email atau password salah.');
  // jika berhasil, onAuthStateChange membuka aplikasi
});

/* ----- Pilihan bank / e-wallet pada formulir daftar ----- */
const PAY = {
  bank:{label:'Pilih bank', acc:'Nomor rekening', ph:'Hanya angka', list:['BCA','BRI','BNI','Mandiri','BSI','CIMB Niaga','Permata','BTN','Danamon','OCBC','Jago','SeaBank','Bank Neo Commerce','Jenius (BTPN)']},
  ewallet:{label:'Pilih e-wallet', acc:'Nomor e-wallet (nomor HP)', ph:'Hanya angka, mis. 08123456789', list:['DANA','OVO','GoPay','ShopeePay','LinkAja']}
};
$('reg-type').addEventListener('change', ()=>{
  const t = PAY[$('reg-type').value], f = $('reg-bank-field'), sel = $('reg-bank');
  sel.innerHTML = '';
  if(!t){ f.style.display = 'none'; sel.append(new Option('Pilih...','')); $('reg-acc-label').textContent = 'Nomor rekening / e-wallet'; return; }
  sel.append(new Option(t.label + '...',''));
  t.list.forEach(n => sel.append(new Option(n, n)));
  $('reg-bank-label').textContent = t.label;
  $('reg-acc-label').textContent = t.acc;
  $('reg-acc').placeholder = t.ph;
  f.style.display = 'block';
});
$('register-form').addEventListener('submit', async e=>{
  e.preventDefault(); setMsg('register-msg','');
  const name = $('reg-name').value.trim(), email = $('reg-email').value.trim();
  const pw = $('reg-password').value, pw2 = $('reg-confirm').value;
  const bank = $('reg-bank').value.trim(), accName = $('reg-accname').value.trim();
  const acc = $('reg-acc').value.replace(/[\s-]/g,'');
  if(pw !== pw2){ setMsg('register-msg','Password dan ulangi password tidak sama.'); return; }
  if(!$('reg-type').value){ setMsg('register-msg','Pilih dulu Bank atau E-wallet.'); return; }
  if(!bank){ setMsg('register-msg','Pilih ' + (PAY[$('reg-type').value].label.toLowerCase().replace('pilih ','')) + ' yang digunakan.'); return; }
  if(!accName){ setMsg('register-msg','Isi nama pemilik rekening.'); return; }
  if(!/^\d{5,20}$/.test(acc)){ setMsg('register-msg','Nomor rekening harus angka (5-20 digit).'); return; }
  if(!$('reg-ok').checked){ setMsg('register-msg','Centang konfirmasi bahwa data rekening sudah benar.'); return; }
  setBusy('register-btn', true, 'Daftar');
  const {data, error} = await sb.auth.signUp({
    email, password: pw,
    options:{ data:{full_name:name, bank_name:bank, account_name:accName, account_number:acc}, emailRedirectTo: backTo() }
  });
  setBusy('register-btn', false, 'Daftar');
  if(error){ setMsg('register-msg', error.message); return; }
  if(data.session) return; // konfirmasi email nonaktif: langsung masuk
  setMsg('register-msg','Akun dibuat. Cek email untuk konfirmasi, lalu masuk.', true);
});

$('forgot-form').addEventListener('submit', async e=>{
  e.preventDefault(); setMsg('forgot-msg','');
  setBusy('forgot-btn', true, 'Kirim tautan reset');
  const {error} = await sb.auth.resetPasswordForEmail($('forgot-email').value.trim(), {redirectTo: backTo()});
  setBusy('forgot-btn', false, 'Kirim tautan reset');
  if(error){ setMsg('forgot-msg', error.message); return; }
  setMsg('forgot-msg','Jika email terdaftar, tautan reset password sudah dikirim.', true);
});

let recovering = false;
$('reset-form').addEventListener('submit', async e=>{
  e.preventDefault(); setMsg('reset-msg','');
  setBusy('reset-btn', true, 'Simpan password');
  const {error} = await sb.auth.updateUser({password:$('new-password').value});
  setBusy('reset-btn', false, 'Simpan password');
  if(error){ setMsg('reset-msg', error.message); return; }
  setMsg('reset-msg','Password berhasil diganti.', true);
  setTimeout(()=>{ window.history.replaceState({}, '', window.location.pathname); recovering = false; location.reload(); }, 1200);
});

/* ----- Status sesi: buka aplikasi hanya jika sudah masuk ----- */
let enteredUid = null;
function showApp(on){
  $('auth').style.display = on ? 'none' : 'flex';
  $('app').style.display = on ? 'block' : 'none';
}
sb.auth.onAuthStateChange((event, session)=>{
  if(event === 'PASSWORD_RECOVERY'){ recovering = true; showApp(false); showView('reset'); return; }
  if(recovering) return;
  if(session && session.user){
    if(enteredUid !== session.user.id){
      enteredUid = session.user.id;
      showApp(true);
      const u = session.user.id;
      setTimeout(async ()=>{ go('home'); try{ await loadAll(); }catch(e){} if(enteredUid === u) notifStart(u); }, 0); // jangan panggil Supabase langsung di dalam callback
    }
  } else {
    enteredUid = null; uid = null;
    notifStop();
    showApp(false); showView('login');
  }
});

/* ----- Awal ----- */
$('banner-text').textContent = ANNOUNCEMENT;
$('banner').style.display = ANNOUNCEMENT ? 'block' : 'none';
paintBalance();

/* extra.js: dimuat SETELAH app.js. Memakai sb, $, mk, row, rp, fdate, fillList, go, showView dari app.js */
(()=>{
const TIER = {bronze:'Bronze', silver:'Silver', gold:'Gold'};
const DN = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const sec = t => mk('div','sec',t);
let ROLE = 'user', roleFor = null;
const staff = () => ROLE==='admin' || ROLE==='owner';

/* ---------- Role: arahkan ke dashboard sesuai role ---------- */
async function initRole(u){
  if(roleFor === u) return;
  roleFor = u;
  const {data} = await sb.rpc('my_role');
  ROLE = (data==='admin' || data==='owner') ? data : 'user';
  if(staff()){
    document.querySelectorAll('#nav [data-go="home"], .dm-item[data-go="home"]').forEach(b=>{ b.lastChild.textContent = 'Dashboard'; });
    if(!$('dash')){ const s = mk('section','page'); s.id = 'dash'; document.querySelector('main').appendChild(s); }
    if(document.querySelector('.page.active') && ['home','dash'].includes(document.querySelector('.page.active').id)) go('home');
  }
}
sb.auth.onAuthStateChange((ev, s)=>{
  if(s && s.user) setTimeout(()=>initRole(s.user.id), 0);
  else { ROLE = 'user'; roleFor = null; }
});

/* ---------- Aktivitas jadi Leaderboard (elemen lama tetap ada, hanya disembunyikan) ---------- */
document.querySelectorAll('#nav [data-go="aktivitas"], .dm-item[data-go="aktivitas"]').forEach(b=>{
  const ic = b.querySelector('.icon,.ic'); if(ic) ic.textContent = '🏆';
  b.lastChild.textContent = 'Leaderboard';
});
[...$('aktivitas').children].forEach(c=>c.classList.add('lbhide'));
const lbBox = mk('div'); lbBox.id = 'lb'; $('aktivitas').appendChild(lbBox);

async function loadLB(){
  lbBox.innerHTML = '';
  const h = mk('div','hello'); h.append(mk('h1','','🏆 Leaderboard'), mk('p','','Top 5 paling rajin mengerjakan misi minggu ini. Reset tiap Senin 00:00 WIB.'));
  const card = mk('div','card'); lbBox.append(h, card);
  card.append(mk('p','empty','Memuat...'));
  const {data, error} = await sb.rpc('get_leaderboard');
  card.innerHTML = '';
  if(error){ card.append(mk('p','empty','Leaderboard gagal dimuat.')); return; }
  if(!data.length){ card.append(mk('p','empty','Belum ada misi selesai minggu ini. Jadilah yang pertama!')); return; }
  data.forEach(r=>{
    const d = mk('div','item lb' + (r.is_me ? ' me' : '')), l = mk('div','lbl'), t = mk('div');
    t.append(mk('div','n','@' + r.username + (r.is_me ? ' (kamu)' : '')), mk('div','s', r.done + ' misi minggu ini'));
    l.append(mk('span','medal', ['🥇','🥈','🥉'][r.pos-1] || '#' + r.pos), t);
    d.append(l, mk('span','tier ' + r.tier, TIER[r.tier] || r.tier));
    card.append(d);
  });
}

/* ---------- Override go(): dashboard staff, leaderboard, profil ---------- */
const _go = go;
go = function(id){
  _go(id);
  if(id==='home' && staff()){
    document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active', p.id==='dash'));
    loadDash();
  }
  if(id==='aktivitas') loadLB();
  if(id==='profile') loadProfileX();
};

/* ---------- Navigasi bisa digeser ---------- */
(()=>{
  const nav = $('nav'), lens = $('lens');
  let down = false, drag = false, sx = 0, pid = null, swallow = false;
  const bs = () => [...nav.querySelectorAll('button')];
  const nearest = x => { let best = null, bd = 1e9; bs().forEach(b=>{ const r = b.getBoundingClientRect(), d = Math.abs(r.left + r.width/2 - x); if(d < bd){ bd = d; best = b; } }); return best; };
  nav.addEventListener('pointerdown', e=>{ down = true; drag = false; sx = e.clientX; pid = e.pointerId; });
  nav.addEventListener('pointermove', e=>{
    if(!down) return;
    if(!drag){
      if(Math.abs(e.clientX - sx) < 8) return;
      drag = true;
      try{ nav.setPointerCapture(pid); }catch(_){}
      nav.classList.add('dragging'); lens.classList.remove('over'); lens.classList.add('drag');
      lens.style.width = '76px'; lens.style.top = '8px'; lens.style.height = 'calc(100% - 16px)'; lens.style.borderRadius = '28px';
    }
    const n = nav.getBoundingClientRect();
    lens.style.left = Math.max(4, Math.min(n.width - 80, e.clientX - n.left - 38)) + 'px';
    const nb = nearest(e.clientX);
    bs().forEach(b=>b.classList.toggle('hot', b === nb));
  });
  const end = e=>{
    if(!down) return; down = false;
    if(!drag) return; drag = false;
    const nb = nearest(e.clientX);
    nav.classList.remove('dragging'); lens.classList.remove('drag');
    bs().forEach(b=>b.classList.remove('hot'));
    try{ nav.releasePointerCapture(pid); }catch(_){}
    swallow = true; setTimeout(()=>{ swallow = false; }, 80);
    if(nb) go(nb.dataset.go);
  };
  nav.addEventListener('pointerup', end);
  nav.addEventListener('pointercancel', end);
  nav.addEventListener('click', e=>{ if(swallow){ e.stopPropagation(); e.preventDefault(); } }, true);
})();

/* ---------- Profil: pangkat, grafik 7 hari, username, rekening, password ---------- */
function chart(days){
  const W = 300, H = 110, P = 18, n = days.length;
  const max = Math.max(3, ...days.map(d=>d.count));
  const x = i => P + i*(W - 2*P)/(n - 1), y = v => H - 22 - (v/max)*(H - 44);
  const pts = days.map((d,i)=>x(i) + ',' + y(d.count)).join(' ');
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart"><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#60a5fa" stop-opacity=".45"/><stop offset="1" stop-color="#60a5fa" stop-opacity="0"/></linearGradient></defs>`;
  s += `<polygon points="${x(0)},${H-22} ${pts} ${x(n-1)},${H-22}" fill="url(#cg)"/><polyline points="${pts}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  days.forEach((d,i)=>{
    const c = Number(d.count) || 0, nm = DN[new Date(d.day + 'T00:00:00').getDay()];
    s += `<circle cx="${x(i)}" cy="${y(c)}" r="3.5" fill="#fff" stroke="#2563eb" stroke-width="2"/><text x="${x(i)}" y="${y(c)-8}" text-anchor="middle" font-size="10" font-weight="700" fill="#1e40af">${c}</text><text x="${x(i)}" y="${H-6}" text-anchor="middle" font-size="9" fill="#64748b">${nm}</text>`;
  });
  return s + '</svg>';
}

function formSheet(title, fields, label, onSubmit, datalist, after){
  const nodes = [], inputs = {};
  fields.forEach(f=>{
    const i = document.createElement('input');
    i.type = f.type || 'text'; i.placeholder = f.ph; i.autocomplete = 'off';
    if(f.val) i.value = f.val; if(f.max) i.maxLength = f.max; if(f.list) i.setAttribute('list', f.list);
    inputs[f.k] = i; nodes.push(i);
  });
  if(datalist){ const dl = document.createElement('datalist'); dl.id = 'bl'; datalist.forEach(n=>dl.append(new Option(n))); nodes.push(dl); }
  const msg = mk('p','msg'), btn = mk('button','go',label); btn.type = 'button';
  btn.onclick = async ()=>{
    msg.className = 'msg'; msg.textContent = ''; btn.disabled = true;
    try{
      const v = {}; for(const k in inputs) v[k] = inputs[k].value;
      msg.textContent = (await onSubmit(v)) || 'Berhasil.'; msg.className = 'msg ok';
      setTimeout(()=>{ $('isheet').classList.remove('show'); (after || loadProfileX)(); }, 900);
    }catch(e){ msg.textContent = e.message || 'Gagal.'; }
    btn.disabled = false;
  };
  nodes.push(msg, btn); openInfo(title, nodes);
}
const must = r => { if(r.error) throw r.error; };

async function loadProfileX(){
  let px = $('px');
  if(!px){ px = mk('div'); px.id = 'px'; $('profile').children[0].after(px); }
  const {data:{session}} = await sb.auth.getSession();
  if(!session) return;
  const [st, pr] = await Promise.all([
    sb.rpc('get_my_stats'),
    sb.from('profiles').select('username,bank_name,account_name,account_number').eq('id', session.user.id).maybeSingle()
  ]);
  const S = st.data || {}, P = pr.data || {}, done = S.done || 0, tr = S.rank || 'bronze';
  px.innerHTML = '';

  px.append(sec('Pangkat'));
  const rc = mk('div','card'), top = mk('div','qtop');
  top.append(mk('b','', done + ' misi selesai'), mk('span','tier big ' + tr, TIER[tr]));
  const bar = mk('div','bar'), fill = mk('i');
  fill.style.width = S.next_need ? Math.min(100, Math.round(done/S.next_need*100)) + '%' : '100%';
  bar.append(fill);
  rc.append(top, bar, mk('div','muted', S.next_need ? Math.max(0, S.next_need - done) + ' misi lagi menuju ' + TIER[S.next_rank] : 'Kamu sudah di pangkat tertinggi 🎉'));
  px.append(rc);

  px.append(sec('Misi selesai 7 hari terakhir'));
  const cc = mk('div','card');
  if(S.days && S.days.length > 1) cc.innerHTML = chart(S.days); else cc.append(mk('p','empty','Grafik belum tersedia.'));
  px.append(cc);

  px.append(sec('Data akun'));
  const ac = mk('div','card');
  const line = (k, v) => { const d = mk('div','drow'); d.append(mk('span','',k), mk('span','',v || '-')); ac.append(d); };
  line('Username', P.username ? '@' + P.username : '-');
  line('Bank / e-wallet', P.bank_name);
  line('Atas nama', P.account_name);
  line('Nomor', P.account_number ? '••••' + String(P.account_number).slice(-4) : '-');
  const br = mk('div','btnrow');
  const mb = (t, fn) => { const b = mk('button','mini',t); b.type = 'button'; b.onclick = fn; br.append(b); };
  mb('Ubah username', ()=>formSheet('Ubah username', [{k:'u', ph:'3-20 huruf kecil, angka, _', val:P.username, max:20}], 'Simpan', async v=>{ must(await sb.rpc('set_my_username',{p_username:v.u})); }));
  mb('Ubah rekening', ()=>formSheet('Ubah rekening', [
    {k:'b', ph:'Bank / e-wallet', val:P.bank_name, list:'bl'}, {k:'n', ph:'Atas nama', val:P.account_name, max:60},
    {k:'a', ph:'Nomor rekening (angka)', max:25}, {k:'p', ph:'Password akun (konfirmasi)', type:'password'}
  ], 'Simpan rekening', async v=>{ must(await sb.rpc('update_my_bank',{p_bank_name:v.b, p_account_name:v.n, p_account_number:v.a, p_password:v.p})); }, PAY.bank.list.concat(PAY.ewallet.list)));
  mb('Ubah password', ()=>formSheet('Ubah password', [
    {k:'o', ph:'Password lama', type:'password'}, {k:'n', ph:'Password baru (min. 8 karakter)', type:'password'}, {k:'c', ph:'Ulangi password baru', type:'password'}
  ], 'Simpan password', async v=>{
    if(v.n.length < 8) throw new Error('Password baru minimal 8 karakter.');
    if(v.n !== v.c) throw new Error('Password baru dan ulangi tidak sama.');
    const r = await sb.auth.signInWithPassword({email:session.user.email, password:v.o});
    if(r.error) throw new Error('Password lama salah.');
    must(await sb.auth.updateUser({password:v.n}));
  }));
  ac.append(br); px.append(ac);
}

/* ---------- Dashboard admin / owner ---------- */
function btns(fn){
  const w = mk('div','abtns');
  [['Setujui', true, 'ok'], ['Tolak', false, 'no']].forEach(([t, ok, c])=>{
    const b = mk('button','mini ' + c, t); b.type = 'button';
    b.onclick = async ()=>{
      let note = null;
      if(!ok){ note = prompt('Alasan penolakan (opsional)'); if(note === null) return; }
      w.querySelectorAll('button').forEach(x=>x.disabled = true);
      const {error} = await fn(ok, note || null);
      if(error){ showToast(error.message); w.querySelectorAll('button').forEach(x=>x.disabled = false); return; }
      showToast('✅ Tersimpan'); loadDash();
    };
    w.append(b);
  });
  return w;
}

async function loadDash(){
  const box = $('dash'); if(!box) return;
  const [sm, pm, wd] = await Promise.all([
    sb.rpc('admin_summary'), sb.rpc('admin_pending_missions'), sb.rpc('admin_withdrawals',{p_status:'pending'})
  ]);
  box.innerHTML = '';
  const h = mk('div','hello'); h.append(mk('h1','', ROLE==='owner' ? 'Dashboard Owner' : 'Dashboard Admin'), mk('p','','Kelola verifikasi misi dan penarikan.'));
  const rb = mk('button','mini','↻ Perbarui'); rb.type = 'button'; rb.style.marginTop = '8px'; rb.onclick = loadDash; h.append(rb);
  box.append(h);

  const S = sm.data || {}, stats = mk('div','stats dstats');
  [['Misi menunggu', S.pending_missions], ['Penarikan menunggu', S.pending_withdrawals], ['Top-up menunggu', S.pending_topups], ['Member', S.members], ['Selesai hari ini', S.done_today]].forEach(([k, v])=>{
    const c = mk('div','card'); c.append(mk('small','',k), mk('div','v', String(v ?? 0))); stats.append(c);
  });
  box.append(stats);

  box.append(sec('Misi menunggu verifikasi'));
  const mc = mk('div','card');
  fillList(mc, (pm.data || []).map(r=>{
    const d = mk('div','item'), l = mk('div');
    l.append(mk('div','n',r.title), mk('div','s','@' + r.username + ' · ' + rp(r.reward) + (r.submitted_at ? ' · ' + fdate(r.submitted_at) : '')));
    d.append(l, btns((ok, note)=>sb.rpc('review_mission',{p_user_id:r.user_id, p_mission_id:r.mission_id, p_approve:ok, p_admin_note:note})));
    return d;
  }), pm.error ? 'Gagal memuat.' : 'Tidak ada misi menunggu.');
  box.append(mc);

  box.append(sec('Penarikan menunggu'));
  const wc = mk('div','card');
  fillList(wc, (wd.data || []).map(r=>{
    const d = mk('div','item'), l = mk('div');
    l.append(mk('div','n','#' + r.queue_no + ' @' + r.username + ' · ' + rp(r.amount)), mk('div','s', r.bank_name + ' ' + r.account_number + ' a.n. ' + r.account_name));
    d.append(l, btns((ok, note)=>sb.rpc('review_withdrawal',{p_withdrawal_id:r.id, p_approve:ok, p_admin_note:note})));
    return d;
  }), wd.error ? 'Gagal memuat.' : 'Tidak ada penarikan menunggu.');
  box.append(wc);

  if(ROLE === 'owner') await ownerPanel(box);
}

async function ownerPanel(box){
  const [rs, mem, pr] = await Promise.all([
    sb.from('rank_settings').select('rank,min_missions'),
    sb.rpc('owner_members'),
    sb.from('profiles').select('id,role')
  ]);
  const m = {}; (rs.data || []).forEach(r=>m[r.rank] = r.min_missions);

  box.append(sec('Pengaturan pangkat'));
  const c = mk('div','card'); c.append(mk('p','muted','Minimal total misi selesai untuk naik pangkat. Bronze = 0.'));
  const inp = (label, val) => { const w = mk('div','rkrow'), i = document.createElement('input'); i.type = 'number'; i.min = 1; i.value = val; w.append(mk('label','',label), i); c.append(w); return i; };
  const si = inp('Silver (misi)', m.silver ?? 10), gi = inp('Gold (misi)', m.gold ?? 30);
  const msg = mk('p','msg'), sv = mk('button','go','Simpan pangkat'); sv.type = 'button';
  sv.onclick = async ()=>{
    sv.disabled = true; msg.className = 'msg';
    const {error} = await sb.rpc('owner_save_ranks',{p_silver:Number(si.value), p_gold:Number(gi.value)});
    sv.disabled = false;
    msg.textContent = error ? error.message : 'Pangkat disimpan.'; if(!error) msg.className = 'msg ok';
  };
  c.append(msg, sv); box.append(c);

  box.append(sec('Member & role'));
  const roles = {}; (pr.data || []).forEach(p=>roles[p.id] = p.role);
  const mc = mk('div','card'), q = document.createElement('input');
  q.type = 'search'; q.className = 'msrch'; q.placeholder = 'Cari username / nama / email...';
  const list = mk('div'); mc.append(q, list); box.append(mc);
  const all = mem.data || [];
  const draw = () => {
    const k = q.value.trim().toLowerCase();
    const rows = all.filter(x=>!k || [x.username, x.full_name, x.email].some(v=>String(v || '').toLowerCase().includes(k))).slice(0, 40);
    fillList(list, rows.map(x=>{
      const role = roles[x.user_id] || 'user', d = mk('div','item'), l = mk('div');
      l.append(mk('div','n','@' + x.username + ' · ' + role), mk('div','s', (x.full_name || '') + ' · ' + x.done + ' misi · ' + rp(x.balance)));
      d.append(l);
      if(role !== 'owner'){
        const b = mk('button','mini', role === 'admin' ? 'Jadikan user' : 'Jadikan admin'); b.type = 'button';
        b.onclick = async ()=>{
          b.disabled = true;
          const {error} = await sb.rpc('owner_set_role',{p_user_id:x.user_id, p_role: role === 'admin' ? 'user' : 'admin'});
          if(error){ showToast(error.message); b.disabled = false; return; }
          roles[x.user_id] = role === 'admin' ? 'user' : 'admin'; draw();
        };
        d.append(b);
      }
      return d;
    }), mem.error ? 'Gagal memuat member.' : 'Member tidak ditemukan.');
  };
  q.addEventListener('input', draw); draw();
  await ownerMissions(box);
  await ownerCS(box);
}

/* ---------- Owner: kelola misi (tambah, edit, aktif/nonaktif, hapus) ---------- */
function missionForm(m){
  const n = x => (x === null || x === undefined) ? '' : String(x);
  formSheet(m ? 'Edit misi' : 'Tambah misi', [
    {k:'t', ph:'Judul misi', val:m && m.title, max:120},
    {k:'d', ph:'Deskripsi', val:m && m.description},
    {k:'i', ph:'Instruksi pengerjaan', val:m && m.instructions},
    {k:'r', ph:'Hadiah (Rp)', type:'number', val:m && n(m.reward)},
    {k:'h', ph:'Batas waktu pengerjaan (jam)', type:'number', val:m && n(m.duration_hours)},
    {k:'v', ph:'Durasi verifikasi admin (jam)', type:'number', val:m && n(m.verification_hours)},
    {k:'q', ph:'Kuota peserta (kosong = tanpa batas)', type:'number', val:m && n(m.max_participants)}
  ], 'Simpan misi', async v=>{
    if(!v.t.trim()) throw new Error('Judul wajib diisi.');
    if(!(Number(v.r) > 0)) throw new Error('Hadiah harus lebih dari 0.');
    must(await sb.rpc('owner_save_mission',{
      p_id: m ? String(m.id) : null, p_title: v.t.trim(), p_description: v.d.trim(), p_instructions: v.i.trim(),
      p_reward: Number(v.r), p_duration_hours: Number(v.h) || 24, p_verification_hours: Number(v.v) || 24,
      p_max_participants: v.q ? Number(v.q) : null, p_is_active: m ? m.is_active : true
    }));
  }, null, loadDash);
}

async function ownerMissions(box){
  const h = mk('div','sec'), add = mk('button','','+ Tambah misi');
  h.append(mk('span','','Kelola misi'), add); add.type = 'button'; add.onclick = () => missionForm(null);
  box.append(h);
  const c = mk('div','card'); box.append(c);
  const {data, error} = await sb.rpc('owner_list_missions');
  fillList(c, (data || []).map(m=>{
    const d = mk('div','item'), l = mk('div');
    l.append(mk('div','n', m.title), mk('div','s', rp(m.reward) + ' · ' + (m.is_active ? 'Aktif' : 'Nonaktif')));
    const w = mk('div','abtns');
    const b = (t, cls, fn) => { const x = mk('button','mini ' + cls, t); x.type = 'button'; x.onclick = fn; w.append(x); };
    b('Edit', '', () => missionForm(m));
    b(m.is_active ? 'Matikan' : 'Aktifkan', '', async ()=>{
      const {error} = await sb.rpc('owner_toggle_mission',{p_id:String(m.id), p_active:!m.is_active});
      if(error) showToast(error.message); else loadDash();
    });
    b('Hapus', 'no', async ()=>{
      if(!confirm('Hapus misi "' + m.title + '"? Tindakan ini tidak bisa dibatalkan.')) return;
      const {error} = await sb.rpc('owner_delete_mission',{p_id:String(m.id)});
      if(error) showToast(error.message); else { showToast('Misi dihapus'); loadDash(); }
    });
    d.append(l, w); return d;
  }), error ? 'Gagal memuat misi.' : 'Belum ada misi.');
}

/* ---------- Owner: chat bantuan (CS) ---------- */
async function ownerCS(box){
  box.append(sec('Chat bantuan (CS)'));
  const c = mk('div','card'); box.append(c);
  const {data, error} = await sb.rpc('owner_cs_threads');
  fillList(c, (data || []).map(t=>{
    const d = mk('div','item act'), l = mk('div');
    l.append(mk('div','n','@' + t.uname), mk('div','s', (t.last_body || '-').slice(0, 60)));
    d.append(l, mk('span','badge ' + (t.tmode === 'human' ? 'success' : 'info'), t.tmode === 'human' ? 'Admin' : 'Bot'));
    d.onclick = () => csThread(t); return d;
  }), error ? 'Gagal memuat chat.' : 'Belum ada chat.');
}

function csThread(t){
  const list = mk('div','cs-list'), inp = document.createElement('input'), msg = mk('p','msg'), row2 = mk('div','btnrow');
  inp.placeholder = 'Tulis balasan...'; inp.maxLength = 500;
  const draw = async () => {
    const {data} = await sb.rpc('owner_cs_messages',{p_thread:t.uid});
    list.innerHTML = '';
    (data || []).forEach(m=>{
      const k = m.sender_kind || 'user', w = mk('div','bub ' + (k === 'user' ? 'them' : 'me'));
      if(k !== 'user') w.append(mk('div','who', k === 'bot' ? 'Bot' : 'Admin'));
      w.append(mk('div','', m.body || '')); list.append(w);
    });
    list.scrollTop = list.scrollHeight;
  };
  const send = mk('button','go','Kirim balasan'); send.type = 'button';
  send.onclick = async () => {
    const body = inp.value.trim(); if(!body) return;
    send.disabled = true; msg.textContent = '';
    const {error} = await sb.rpc('owner_cs_reply',{p_thread:t.uid, p_body:body});
    send.disabled = false;
    if(error){ msg.textContent = error.message; return; }
    inp.value = ''; draw();
  };
  const mode = (label, m) => { const b = mk('button','mini',label); b.type = 'button'; b.onclick = async ()=>{ const {error} = await sb.rpc('owner_cs_set_mode',{p_thread:t.uid, p_mode:m}); msg.textContent = error ? error.message : 'Mode diubah ke ' + (m === 'human' ? 'Admin' : 'Bot') + '.'; msg.className = error ? 'msg' : 'msg ok'; }; row2.append(b); };
  mode('Ambil alih (Admin)', 'human'); mode('Kembalikan ke Bot', 'bot');
  const rf = mk('button','mini','↻ Muat ulang'); rf.type = 'button'; rf.onclick = draw; row2.append(rf);
  openInfo('Chat @' + t.uname, [list, inp, msg, send, row2]);
  draw();
}

/* ---------- Lupa password: kode 8 digit dari email ---------- */
(()=>{
  $('view-forgot').innerHTML = `
    <p class="muted" style="margin-bottom:12px" id="forgot-info">Masukkan email akunmu. Kami kirim kode 8 digit ke email.</p>
    <p class="msg" id="forgot-msg"></p>
    <form id="forgot-form" autocomplete="off">
      <div class="field"><label for="forgot-email">Email</label>
        <input type="email" id="forgot-email" placeholder="nama@email.com" autocomplete="email" required></div>
      <button type="submit" class="btn-primary" id="forgot-btn">Kirim kode</button>
    </form>
    <form id="otp-form" autocomplete="off" style="display:none">
      <div class="field"><label for="otp-code">Kode 8 digit</label>
        <input type="text" id="otp-code" inputmode="numeric" maxlength="8" placeholder="12345678" autocomplete="one-time-code" required></div>
      <div class="field"><label for="otp-pw">Password baru</label>
        <input type="password" id="otp-pw" minlength="8" placeholder="Minimal 8 karakter" autocomplete="new-password" required></div>
      <button type="submit" class="btn-primary" id="otp-btn">Simpan password</button>
    </form>
    <div class="switch"><button type="button" class="link" id="forgot-back">Kembali ke halaman masuk</button></div>`;
  $('forgot-back').onclick = () => showView('login');

  let otpEmail = '', verified = false, flow = false;
  const _sv = showView;
  showView = function(n){
    if(n === 'reset' && flow) return; // cegah tampilan reset lama saat alur kode berjalan
    _sv(n);
    if(n === 'forgot'){ $('forgot-form').style.display = ''; $('otp-form').style.display = 'none'; verified = false; }
  };

  $('forgot-form').addEventListener('submit', async e=>{
    e.preventDefault(); setMsg('forgot-msg','');
    setBusy('forgot-btn', true, 'Kirim kode');
    const email = $('forgot-email').value.trim();
    const {error} = await sb.auth.resetPasswordForEmail(email);
    setBusy('forgot-btn', false, 'Kirim kode');
    if(error){ setMsg('forgot-msg', error.message); return; }
    otpEmail = email;
    $('forgot-form').style.display = 'none'; $('otp-form').style.display = 'block';
    $('forgot-info').textContent = 'Jika email terdaftar, kode 8 digit sudah dikirim ke ' + email + '. Masukkan kode dan password baru.';
  });

  $('otp-form').addEventListener('submit', async e=>{
    e.preventDefault(); setMsg('forgot-msg','');
    const code = $('otp-code').value.trim(), pw = $('otp-pw').value;
    if(!verified && !/^\d{8}$/.test(code)){ setMsg('forgot-msg','Kode harus 8 digit angka.'); return; }
    setBusy('otp-btn', true, 'Simpan password');
    flow = true; recovering = true;
    if(!verified){
      const r = await sb.auth.verifyOtp({email:otpEmail, token:code, type:'recovery'});
      if(r.error){ flow = false; recovering = false; setBusy('otp-btn', false, 'Simpan password'); setMsg('forgot-msg','Kode salah atau kedaluwarsa.'); return; }
      verified = true;
    }
    const u = await sb.auth.updateUser({password:pw});
    setBusy('otp-btn', false, 'Simpan password');
    if(u.error){ setMsg('forgot-msg', u.error.message); return; }
    setMsg('forgot-msg','Password berhasil diganti.', true);
    setTimeout(()=>{ recovering = false; location.reload(); }, 1200);
  });
})();
})();
