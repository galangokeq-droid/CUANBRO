/* ============================================================
   config.js — pengaturan, koneksi Supabase, fungsi bantu
   URUTAN FILE di index.html (jangan diubah):
   config → ui → user → help → notif → admin → auth
   ============================================================ */

/* ===== PENGATURAN (aman diedit) ===== */
const SUPABASE_URL = 'https://ifywhogjctrelgnvhjmd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FGpFr35IwMH5dZ_do2bZaQ_alxzxEZp'; // kunci publishable: memang boleh ada di browser

const DAILY_TARGET = 3;      // target misi per hari
const MIN_WITHDRAW = 50000;  // minimal penarikan (Rp)

// Teks pengumuman di Home. Kosongkan ('') untuk menyembunyikan.
const ANNOUNCEMENT = 'Selamat datang di CUANBRO. Baca instruksi misi dengan teliti sebelum mengerjakan.';

// Pengaturan notifikasi
const NOTIF_CFG = {
  vapidPublicKey: '',      // isi kunci PUBLIK VAPID. Kunci private JANGAN ditaruh di file ini.
  swPath: 'sw.js',         // service worker, satu folder dengan index.html
  pushServerReady: false,  // ubah ke true HANYA setelah Edge Function pengirim push terpasang & diuji
  snoozeMs: 5 * 60 * 1000  // jeda pop-up izin setelah klik Tolak
};

/* ===== DAFTAR BANK & E-WALLET (form daftar & ubah rekening) ===== */
const PAY = {
  bank: {
    label: 'Pilih bank', acc: 'Nomor rekening', ph: 'Hanya angka',
    list: ['BCA','BRI','BNI','Mandiri','BSI','CIMB Niaga','Permata','BTN','Danamon','OCBC','Jago','SeaBank','Bank Neo Commerce','Jenius (BTPN)']
  },
  ewallet: {
    label: 'Pilih e-wallet', acc: 'Nomor e-wallet (nomor HP)', ph: 'Hanya angka, mis. 08123456789',
    list: ['DANA','OVO','GoPay','ShopeePay','LinkAja']
  }
};

/* ===== LABEL ===== */
const TIER = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' };
const TX = { topup: 'Isi saldo', withdraw: 'Penarikan saldo', mission_reward: 'Hadiah misi', adjustment: 'Penyesuaian saldo' };

// Status dari database → warna badge
const STATUS_TONES = {
  success: ['approved','completed','success','succeeded','done','paid'],
  warning: ['pending','submitted','waiting','under_review','review'],
  danger:  ['rejected','failed','declined','cancelled','canceled','expired'],
  info:    ['processing','in_progress','claimed']
};
// Status dari database → teks yang tampil
const STATUS_LABELS = {
  approved:'Disetujui', completed:'Berhasil', success:'Berhasil', succeeded:'Berhasil', done:'Berhasil', paid:'Berhasil',
  pending:'Menunggu verifikasi', submitted:'Menunggu verifikasi', waiting:'Menunggu verifikasi', under_review:'Menunggu verifikasi', review:'Menunggu verifikasi',
  rejected:'Ditolak', declined:'Ditolak', failed:'Gagal', cancelled:'Dibatalkan', canceled:'Dibatalkan', expired:'Kedaluwarsa',
  processing:'Diproses', in_progress:'Sedang dikerjakan', claimed:'Sedang dikerjakan'
};
function statusOf(raw){
  const key = String(raw || '').toLowerCase();
  let tone = 'info';
  for(const t in STATUS_TONES) if(STATUS_TONES[t].includes(key)) tone = t;
  return { label: STATUS_LABELS[key] || raw || '-', tone };
}

/* ===== KONEKSI ===== */
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ===== STATE BERSAMA ===== */
let uid = null;          // id user yang sedang login
let enteredUid = null;   // id user yang sudah masuk ke aplikasi
let recovering = false;  // true saat proses reset password berjalan

/* ===== FUNGSI BANTU ===== */
const $ = id => document.getElementById(id);
const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const fdate = s => new Date(s).toLocaleString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });

// Buat elemen: mk('div', 'kelas', 'teks')
function mk(tag, cls, text){
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(text !== undefined) e.textContent = text;
  return e;
}

// Isi kotak dengan daftar elemen, atau pesan kosong
function fillList(box, rows, emptyText){
  box.innerHTML = '';
  if(!rows.length){ box.appendChild(mk('p', 'empty', emptyText)); return; }
  rows.forEach(r => box.appendChild(r));
}

// Satu baris daftar: nama, keterangan, nilai di kanan
function row(name, sub, right, rightCls){
  const d = mk('div', 'item'), l = mk('div');
  l.append(mk('div', 'n', name), mk('div', 's', sub));
  d.append(l, mk('div', rightCls, right));
  return d;
}

// Pesan di bawah form (ok = hijau)
function setMsg(id, text, ok){
  const e = $(id);
  e.textContent = text;
  e.classList.toggle('ok', !!ok);
}

// Tombol loading
function setBusy(id, on, label){
  const b = $(id);
  b.disabled = on;
  b.textContent = on ? 'Memproses...' : label;
}

// Penyimpanan lokal aman: jika localStorage diblokir, pakai memori
const store = {
  mem: {},
  get(k){
    let v = null;
    try { v = localStorage.getItem(k); } catch(e){}
    return v !== null ? v : (k in this.mem ? this.mem[k] : null);
  },
  set(k, v){ this.mem[k] = v; try { localStorage.setItem(k, v); } catch(e){} },
  del(k){ delete this.mem[k]; try { localStorage.removeItem(k); } catch(e){} }
};