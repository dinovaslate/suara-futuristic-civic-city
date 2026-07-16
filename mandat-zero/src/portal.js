import './portal.css';
import { CivicWorld } from './scene.js';
import { auth } from './authStore.js';

const activeClass = (value, active) => value === active ? 'is-active' : '';

export async function mountPortal({ active = '', phase = 'network', compact = false } = {}) {
  document.body.classList.add('portal-body');
  if (compact) document.body.classList.add('portal-body--compact');
  document.body.insertAdjacentHTML('afterbegin', `
    <canvas id="world" aria-hidden="true"></canvas>
    <div class="ambient" aria-hidden="true"><span class="ambient__flare ambient__flare--red"></span><span class="ambient__flare ambient__flare--blue"></span><span class="ambient__scan"></span><span class="ambient__noise"></span></div>
    <div class="portal-boot" id="portalBoot"><span>M/0</span><i></i><small>CONNECTING CIVIC NODE</small></div>
    <header class="topbar portal-topbar" id="topbar">
      <a class="brand" href="index.html" aria-label="MANDAT ZERO beranda"><span class="brand__sigil">M/0</span><span class="brand__word">MANDAT<span>//ZERO</span></span></a>
      <nav class="nav" id="nav" aria-label="Navigasi utama">
        <a class="${activeClass('home', active)}" href="index.html">Beranda</a>
        <a class="${activeClass('petitions', active)}" href="petitions.html">Jelajahi</a>
        <a href="index.html#review">Policy Lab</a>
        <a class="${activeClass('dashboard', active)}" href="dashboard.html">Dashboard</a>
      </nav>
      <div class="topbar__actions">
        <a class="portal-account ${activeClass('account', active)}" id="portalAccountLink" href="login.html"><i></i><span>Masuk</span></a>
        <a class="button button--mini" href="dashboard.html?action=create"><span>Ajukan mandat</span><b>＋</b></a>
        <button class="menu-button" id="menuButton" aria-expanded="false" aria-controls="nav" aria-label="Buka menu"><span></span><span></span></button>
      </div>
    </header>`);

  document.body.insertAdjacentHTML('beforeend', `
    <footer class="footer portal-footer">
      <div class="footer__primary">
        <a class="brand" href="index.html"><span class="brand__sigil">M/0</span><span class="brand__word">MANDAT<span>//ZERO</span></span></a>
        <p class="footer__copy">Observatorium kebijakan publik untuk melacak tuntutan, menguji bukti, dan membangun tekanan warga yang dapat dipertanggungjawabkan.</p>
        <a class="footer__action" href="dashboard.html?action=create"><span>Ajukan mandat</span><b>↗</b></a>
      </div>
      <div class="footer__rail">
        <nav class="footer__nav" aria-label="Navigasi footer"><a href="petitions.html"><small>01</small>Direktori</a><a href="index.html#review"><small>02</small>Policy Lab</a><a href="dashboard.html"><small>03</small>Dashboard</a><a href="account.html"><small>04</small>Akun</a></nav>
        <div class="footer__meta"><span>THREE.JS · CC BY ASSET</span><span>© 2026 MANDAT ZERO</span></div>
      </div>
    </footer>
    <div class="toast" id="portalToast" role="status"></div>`);

  const world = new CivicWorld(document.querySelector('#world'));
  world.setPhase(phase);

  const menuButton = document.querySelector('#menuButton');
  menuButton.addEventListener('click', () => {
    const open = document.querySelector('#nav').classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('#nav a').forEach(link => link.addEventListener('click', () => document.querySelector('#nav').classList.remove('is-open')));
  addEventListener('scroll', () => document.querySelector('#topbar').classList.toggle('is-scrolled', scrollY > 30), { passive: true });

  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
  }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(item => revealObserver.observe(item));

  await auth.ready();
  const user = auth.current();
  const accountLink = document.querySelector('#portalAccountLink');
  if (user) {
    accountLink.href = 'account.html';
    accountLink.querySelector('span').textContent = user.name.split(' ')[0];
    accountLink.classList.add('is-authenticated');
  }

  let hidden = false;
  const hideBoot = () => {
    if (hidden) return;
    hidden = true;
    document.querySelector('#portalBoot')?.classList.add('is-hidden');
  };
  addEventListener('civic-world-ready', () => setTimeout(hideBoot, 180), { once: true });
  setTimeout(hideBoot, 2500);
  return { world, user, auth };
}

let toastTimer;
export function toast(message, tone = 'default') {
  const node = document.querySelector('#portalToast');
  if (!node) return;
  clearTimeout(toastTimer);
  node.textContent = message;
  node.dataset.tone = tone;
  node.classList.add('is-visible');
  toastTimer = setTimeout(() => node.classList.remove('is-visible'), 2600);
}

export const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
