const USERS_KEY = 'mandat_zero_users_v1';
const SESSION_KEY = 'mandat_zero_session_v1';
const PROFILE_KEY = 'mandat_zero_profile_v1';

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export class AuthStore extends EventTarget {
  async ready() {
    const users = read(USERS_KEY, []);
    if (!users.some(user => user.email === 'warga@mandat.id')) {
      users.push({
        id: 'demo-warga',
        name: 'Warga Jakarta',
        email: 'warga@mandat.id',
        passwordHash: await digest('mandat2026'),
        city: 'Jakarta',
        role: 'Citizen reviewer',
        joinedAt: '2026-07-01T00:00:00.000Z'
      });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    return this;
  }

  current() {
    const session = read(SESSION_KEY, null);
    if (!session) return null;
    const user = read(USERS_KEY, []).find(item => item.id === session.userId);
    if (!user) return null;
    return { ...user, ...read(PROFILE_KEY, {}) };
  }

  async login(email, password) {
    const normalized = email.trim().toLowerCase();
    const passwordHash = await digest(password);
    const user = read(USERS_KEY, []).find(item => item.email === normalized && item.passwordHash === passwordHash);
    if (!user) throw new Error('Email atau kata sandi tidak cocok.');
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, signedInAt: new Date().toISOString() }));
    this.dispatchEvent(new Event('change'));
    return this.current();
  }

  async register({ name, email, password, city }) {
    const users = read(USERS_KEY, []);
    const normalized = email.trim().toLowerCase();
    if (users.some(item => item.email === normalized)) throw new Error('Email sudah terdaftar.');
    const user = {
      id: crypto.randomUUID(), name: name.trim(), email: normalized,
      passwordHash: await digest(password), city: city.trim(), role: 'Citizen reviewer',
      joinedAt: new Date().toISOString()
    };
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, signedInAt: new Date().toISOString() }));
    this.dispatchEvent(new Event('change'));
    return this.current();
  }

  updateProfile(data) {
    if (!this.current()) throw new Error('Sesi tidak ditemukan.');
    const currentProfile = read(PROFILE_KEY, {});
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...currentProfile, ...data, updatedAt: new Date().toISOString() }));
    this.dispatchEvent(new Event('change'));
    return this.current();
  }

  logout() {
    localStorage.removeItem(SESSION_KEY);
    this.dispatchEvent(new Event('change'));
  }
}

export const auth = new AuthStore();
