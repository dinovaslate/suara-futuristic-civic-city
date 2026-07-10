import {
  createIcons,
  Landmark,
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  CalendarDays,
  Building2,
  MapPin,
  FileText,
  Files,
  MessageSquareText,
  ListChecks,
  History,
  GitCompareArrows,
  ShieldCheck,
  Scale,
  Users,
  CircleHelp,
  CheckCircle2,
  Clock3,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  BookOpenText,
  Accessibility,
  Volume2,
  Bookmark,
  Save,
  Send,
  Link2,
  Paperclip,
  ThumbsUp,
  Filter,
  PanelLeft,
  RotateCcw,
  Eye,
  CircleUserRound,
  AlertTriangle,
  Info,
  Check,
  Minus,
} from 'lucide';
import './suara.css';

const icons = {
  Landmark, Menu, X, ArrowRight, ArrowUpRight, Search, SlidersHorizontal,
  CalendarDays, Building2, MapPin, FileText, Files, MessageSquareText,
  ListChecks, History, GitCompareArrows, ShieldCheck, Scale, Users,
  CircleHelp, CheckCircle2, Clock3, ChevronRight, ChevronDown, ExternalLink,
  BookOpenText, Accessibility, Volume2, Bookmark, Save, Send, Link2,
  Paperclip, ThumbsUp, Filter, PanelLeft, RotateCcw, Eye, CircleUserRound,
  AlertTriangle, Info, Check, Minus,
};

export const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;',
}[character]));

export const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

export const formatDate = (value, options = {}) => new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'long', year: 'numeric', ...options,
}).format(new Date(value));

export function daysUntil(value) {
  const now = new Date();
  const target = new Date(`${value}T23:59:59`);
  return Math.max(0, Math.ceil((target - now) / 86400000));
}

export const statusClass = (status) => ({
  open: 'is-open', analysis: 'is-analysis', closed: 'is-closed', outcome: 'is-outcome',
}[status] || '');

export function refreshIcons(root = document) {
  createIcons({ icons, root });
}

export function initShell() {
  refreshIcons();
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-main-nav]');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.innerHTML = `<i data-lucide="${open ? 'x' : 'menu'}"></i>`;
      refreshIcons(toggle);
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-page]').forEach((link) => {
    link.classList.toggle('active', link.dataset.navPage === current);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px' });
  document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
}

export function showToast(title, message) {
  let toast = document.querySelector('#globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'global-toast';
    toast.innerHTML = '<i data-lucide="check-circle-2"></i><div><strong></strong><span></span></div>';
    document.body.appendChild(toast);
  }
  toast.querySelector('strong').textContent = title;
  toast.querySelector('span').textContent = message;
  toast.classList.add('show');
  refreshIcons(toast);
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 3300);
}

export function consultationCard(item) {
  const deadline = item.status === 'open' ? `Ditutup dalam ${daysUntil(item.closesAt)} hari` : item.statusLabel;
  const hasFullDemo = Boolean(item.featured);
  return `<article class="consultation-card" data-topic="${escapeHtml(item.topic)}" data-status="${escapeHtml(item.status)}">
    <div class="card-status-row"><span class="status-badge ${statusClass(item.status)}"><i></i>${escapeHtml(item.statusLabel)}</span><span>${escapeHtml(item.region)}</span></div>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.excerpt)}</p>
    <div class="institution-line"><i data-lucide="building-2"></i><span>${escapeHtml(item.institution)}</span></div>
    <div class="affected-list">${item.affectedGroups.slice(0, 3).map((group) => `<span>${escapeHtml(group)}</span>`).join('')}</div>
    <div class="card-facts"><span><b>${item.questionCount}</b> pertanyaan</span><span><b>${item.documentCount}</b> dokumen</span><span>${escapeHtml(deadline)}</span></div>
    <a class="card-link" href="/consultation.html?id=${encodeURIComponent(hasFullDemo ? item.id : 'blok-m-lez')}">${hasFullDemo ? 'Lihat konsultasi' : 'Lihat contoh alur lengkap'} <i data-lucide="arrow-up-right"></i></a>
  </article>`;
}
