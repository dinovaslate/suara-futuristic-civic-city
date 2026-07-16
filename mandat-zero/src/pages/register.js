import { mountPortal, toast } from '../portal.js';

const { auth, world } = await mountPortal({ active: 'account', phase: 'orbit', compact: true });
const form = document.querySelector('#registerForm');
const error = document.querySelector('#authError');
form.addEventListener('submit', async event => {
  event.preventDefault(); error.textContent = '';
  const button = form.querySelector('button'); button.disabled = true; button.querySelector('span').textContent = 'Membentuk node…';
  try {
    await auth.register(Object.fromEntries(new FormData(form))); world.pulse('#54dcff'); toast('Identitas baru aktif.');
    setTimeout(() => location.href = 'account.html', 650);
  } catch (exception) {
    error.textContent = exception.message; button.disabled = false; button.querySelector('span').textContent = 'Aktifkan identitas';
  }
});
