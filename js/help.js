/* ============================================================
   help.js — menu Bantuan: Tutorial dan Chat CS
   Chat CS: dibalas bot AI, admin/owner bisa mengambil alih.
   ============================================================ */

/* ===== TUTORIAL (edit langkah di sini) ===== */
const TUTORIAL_STEPS = [
  ['Pilih misi', 'Buka menu Misi, lalu pilih misi yang tersedia. Baca deskripsi, instruksi, hadiah, dan batas waktunya.'],
  ['Ambil misi', 'Tekan Ambil Misi. Waktu pengerjaan mulai dihitung sejak misi diambil.'],
  ['Kerjakan misi', 'Selesaikan sesuai instruksi, lalu tekan Saya Sudah Mengerjakan. Tidak perlu mengirim foto atau bukti.'],
  ['Tunggu verifikasi', 'Admin memeriksa di panelnya apakah akunmu sudah mengerjakan misi tersebut. Kalau ditolak, baca catatan admin lalu ajukan ulang.'],
  ['Hadiah masuk ke saldo', 'Setelah misi berstatus Berhasil, hadiah masuk ke saldo. Pantau di Riwayat.'],
  ['Tarik saldo', 'Tekan Tarik Saldo di Home (minimal ' + rp(MIN_WITHDRAW) + '). Penarikan dikirim ke rekening yang terdaftar di akunmu.']
];

function showTutorial(){
  openInfo('Tutorial', TUTORIAL_STEPS.map((step, i) => {
    const b = mk('div', 'pblock');
    b.append(mk('div', 'pt', 'Langkah ' + (i + 1) + ' · ' + step[0]), mk('div', 'pb', step[1]));
    return b;
  }));
}

/* ===== CHAT CS ===== */
let csMode = 'bot';     // 'bot' | 'human'
let csChannel = null;   // langganan realtime
let csTypingTimer = null;
const csSeen = new Set(); // id pesan yang sudah tampil (cegah dobel)

function csSetMode(mode){
  csMode = mode;
  const b = $('cs-mode');
  b.textContent = mode === 'bot' ? '🤖 Bot AI' : '👤 Admin';
  b.className = 'badge ' + (mode === 'bot' ? 'info' : 'success');
  $('cs-sub').textContent = mode === 'bot'
    ? 'Dibalas bot AI. Kamu bisa minta admin kapan saja.'
    : 'Percakapan ditangani admin. Tunggu balasan ya.';
  $('cs-human').style.display = (mode === 'bot' && uid) ? 'inline-flex' : 'none';
  if(mode !== 'bot') csTyping(false);
}

function csTyping(on){
  $('cs-typing').style.display = on ? 'block' : 'none';
  clearTimeout(csTypingTimer);
  if(on) csTypingTimer = setTimeout(() => csTyping(false), 25000);
}

// kind: 'user' | 'bot' | 'admin'
function csBubble(kind, body, at){
  const w = mk('div', 'bub ' + (kind === 'user' ? 'me' : 'them'));
  if(kind !== 'user') w.append(mk('div', 'who', kind === 'bot' ? 'Bot CUANBRO' : 'Admin'));
  w.append(mk('div', '', body || ''));
  if(at) w.append(mk('div', 'bt', new Date(at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })));
  const list = $('cs-list');
  list.appendChild(w);
  list.scrollTop = list.scrollHeight;
}

function csAdd(m){
  if(csSeen.has(m.id)) return;
  csSeen.add(m.id);
  const kind = m.sender_kind || 'user';
  csBubble(kind, m.body, m.created_at);
  if(kind !== 'user') csTyping(false);
}

function csLeave(){
  hideSheet('csheet');
  csTyping(false);
  if(csChannel){ sb.removeChannel(csChannel); csChannel = null; }
}
bindSheet('csheet', 'cs-close', csLeave);

async function showCS(){
  showSheet('csheet');
  const list = $('cs-list');
  list.innerHTML = '';
  csSeen.clear();
  $('cs-msg').textContent = '';

  const loggedIn = !!uid;
  $('cs-text').disabled = !loggedIn;
  $('cs-send').disabled = !loggedIn;
  if(!loggedIn){
    list.appendChild(mk('p', 'empty', 'Masuk untuk memakai chat bantuan.'));
    csSetMode('bot');
    return;
  }

  csBubble('bot', 'Halo! Saya bot CS CUANBRO. Ada yang bisa dibantu?');
  const [thread, msgs] = await Promise.all([
    sb.from('cs_threads').select('mode').eq('user_id', uid).maybeSingle(),
    sb.from('messages').select('id,sender_kind,body,created_at').eq('thread_id', uid).order('created_at', { ascending: true }).limit(100)
  ]);
  csSetMode(thread.data ? thread.data.mode : 'bot');
  if(msgs.error){ $('cs-msg').textContent = 'Chat belum bisa dimuat. Pastikan setup SQL sudah dijalankan.'; return; }
  (msgs.data || []).forEach(csAdd);

  // Pesan & perubahan mode secara realtime
  if(csChannel) sb.removeChannel(csChannel);
  csChannel = sb.channel('cs-' + uid)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'thread_id=eq.' + uid }, p => csAdd(p.new))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cs_threads', filter: 'user_id=eq.' + uid }, p => { if(p.new && p.new.mode) csSetMode(p.new.mode); })
    .subscribe();
}

async function csSend(){
  const input = $('cs-text'), body = input.value.trim();
  if(!body || !uid) return;
  $('cs-msg').textContent = '';
  input.value = '';
  $('cs-send').disabled = true;

  const { data, error } = await sb.from('messages')
    .insert({ thread_id: uid, sender_id: uid, type: 'text', body })
    .select('id,sender_kind,body,created_at').single();
  $('cs-send').disabled = false;
  if(error){ input.value = body; $('cs-msg').textContent = 'Pesan gagal terkirim. Coba lagi.'; return; }
  csAdd(data);

  if(csMode === 'bot'){
    csTyping(true);
    const r = await sb.functions.invoke('cs-bot');
    if(r.error){ csTyping(false); $('cs-msg').textContent = 'Bot sedang tidak tersedia. Tekan Minta admin.'; }
  }
}
$('cs-send').onclick = csSend;
$('cs-text').addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); csSend(); } });

$('cs-human').onclick = async () => {
  const { error } = await sb.rpc('cs_request_human');
  if(error){ $('cs-msg').textContent = 'Gagal meminta admin. Coba lagi.'; return; }
  csSetMode('human');
};

/* ===== Tombol Tutorial & Bantuan CS di menu samping ===== */
document.querySelectorAll('.dm-item[data-info]').forEach(b => b.addEventListener('click', () => {
  closeDrawer();
  if(b.dataset.info === 'tutorial') showTutorial(); else showCS();
}));