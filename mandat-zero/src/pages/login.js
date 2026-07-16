import { mountPortal, toast } from '../portal.js';

const { auth, user, world } = await mountPortal({ active: 'account', phase: 'core', compact: true });
if (user) document.querySelector('.auth-switch').innerHTML = `Kamu sudah masuk sebagai <strong>${user.name}</strong>. <a href="dashboard.html">Buka dashboard</a>`;

const form = document.querySelector('#loginForm');
const error = document.querySelector('#authError');
form.addEventListener('submit', async event => {
  event.preventDefault(); error.textContent = '';
  const button = form.querySelector('button'); button.disabled = true; button.querySelector('span').textContent = 'Memverifikasi…';
  try {
    const data = Object.fromEntries(new FormData(form));
    await auth.login(data.email, data.password); world.pulse('#d7ff3f'); toast('Identitas terverifikasi. Membuka dashboard…');
    setTimeout(() => location.href = 'dashboard.html', 650);
  } catch (exception) {
    error.textContent = exception.message; button.disabled = false; button.querySelector('span').textContent = 'Verifikasi identitas';
  }
});
