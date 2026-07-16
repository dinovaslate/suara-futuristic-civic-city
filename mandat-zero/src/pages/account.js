import { mountPortal, escapeHtml, toast } from '../portal.js';
import { PolicyStore, formatNumber } from '../policyStore.js';

const store = new PolicyStore();
const context = await mountPortal({ active: 'account', phase: 'orbit' });
let user = context.auth.current();
const root = document.querySelector('#accountRoot');

if (!user) {
  root.className = '';
  root.innerHTML = `<section class="auth-shell reveal is-visible" style="margin:auto;max-width:1000px"><div class="auth-visual" style="min-height:520px"><div><div class="eyebrow"><i></i> Identity required</div><h1>Akunmu adalah<br><em>jejak mandat.</em></h1><p>Masuk untuk melihat dan mengubah profil jaringanmu.</p></div></div><div class="auth-panel"><h2>Sesi belum aktif.</h2><p>Verifikasi identitas sebelum membuka pengaturan.</p><a class="button button--primary" href="login.html"><span>Masuk sekarang</span><b>↗</b></a><p class="auth-switch">Belum punya akun? <a href="register.html">Daftar</a></p></div></section>`;
} else {
  const initials = user.name.split(/\s+/).map(part => part[0]).slice(0,2).join('').toUpperCase();
  root.innerHTML = `
    <aside class="account-card reveal is-visible"><div class="avatar-orb">${escapeHtml(initials)}</div><h2>${escapeHtml(user.name)}</h2><p>${escapeHtml(user.role)}</p><div class="account-card__meta"><span>KOTA <b>${escapeHtml(user.city || '—')}</b></span><span>MANDAT <b>${store.list().filter(item=>item.id.startsWith('citizen-')).length}</b></span><span>DUKUNGAN <b>${formatNumber(store.list().reduce((sum,item)=>sum+item.support,0))}</b></span></div><button class="button button--ghost" id="logoutButton"><span>Keluar jaringan</span><b>→</b></button></aside>
    <section class="settings-panel reveal is-visible"><header class="settings-panel__head"><div><div class="eyebrow"><i></i> Account configuration</div><h1>Identitas<br>jaringan.</h1></div><p>Atur profil publik, wilayah utama, dan preferensi notifikasi pada perangkat ini.</p></header>
      <form class="settings-form" id="settingsForm"><fieldset><legend>PROFIL PUBLIK</legend><div class="settings-form__row"><label><span>Nama</span><input name="name" required value="${escapeHtml(user.name)}"></label><label><span>Kota</span><input name="city" required value="${escapeHtml(user.city || '')}"></label></div><label><span>Peran publik</span><input name="role" value="${escapeHtml(user.role || '')}"></label><label><span>Bio singkat</span><textarea name="bio" rows="4" placeholder="Fokus isu dan pengalamanmu…">${escapeHtml(user.bio || '')}</textarea></label></fieldset><fieldset><legend>PREFERENSI SIGNAL</legend><label><span>Isu utama</span><select name="focus"><option ${user.focus==='Kota'?'selected':''}>Kota</option><option ${user.focus==='Iklim'?'selected':''}>Iklim</option><option ${user.focus==='Digital'?'selected':''}>Digital</option><option ${user.focus==='Kesehatan'?'selected':''}>Kesehatan</option></select></label><label class="toggle-row"><span>Notifikasi momentum mandat</span><input name="notifications" type="checkbox" ${user.notifications!==false?'checked':''}></label><label class="toggle-row"><span>Tampilkan kota pada profil publik</span><input name="publicCity" type="checkbox" ${user.publicCity!==false?'checked':''}></label></fieldset><button class="button button--primary" type="submit"><span>Simpan konfigurasi</span><b>↗</b></button></form>
    </section>`;
  document.querySelector('#logoutButton').addEventListener('click', () => { context.auth.logout(); location.href='login.html'; });
  document.querySelector('#settingsForm').addEventListener('submit', event => {
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); data.notifications=event.currentTarget.notifications.checked; data.publicCity=event.currentTarget.publicCity.checked; context.auth.updateProfile(data); toast('Konfigurasi akun disimpan.');
  });
}
