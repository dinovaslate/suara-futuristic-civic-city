export const STORAGE_KEY = 'suara_consultation_demo_v1';

const emptyState = () => ({ version: 1, responses: {}, followed: [] });

export function normalizeState(input) {
  if (!input || typeof input !== 'object') return emptyState();
  const responses = input.responses && typeof input.responses === 'object' ? input.responses : {};
  const followed = Array.isArray(input.followed) ? [...new Set(input.followed.filter((id) => typeof id === 'string'))] : [];
  return { version: 1, responses, followed };
}

export function readState(storage = globalThis.localStorage) {
  if (!storage) return emptyState();
  try {
    return normalizeState(JSON.parse(storage.getItem(STORAGE_KEY) || 'null'));
  } catch {
    return emptyState();
  }
}

export function writeState(state, storage = globalThis.localStorage) {
  const normalized = normalizeState(state);
  storage?.setItem(STORAGE_KEY, JSON.stringify(normalized));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('suara:consultation-state', { detail: normalized }));
  return normalized;
}

export function getResponse(consultationId, storage) {
  return readState(storage).responses[consultationId] || null;
}

export function saveResponse(consultationId, input, storage) {
  const state = readState(storage);
  const existing = state.responses[consultationId] || {};
  const record = {
    ...existing,
    consultationId,
    answers: input.answers && typeof input.answers === 'object' ? input.answers : existing.answers || {},
    displayName: String(input.displayName ?? existing.displayName ?? '').trim(),
    publicDisplay: Boolean(input.publicDisplay ?? existing.publicDisplay),
    status: input.status === 'submitted' ? 'submitted' : 'draft',
    updatedAt: new Date().toISOString(),
    submittedAt: input.status === 'submitted' ? existing.submittedAt || new Date().toISOString() : existing.submittedAt || null,
    receipt: input.status === 'submitted' ? existing.receipt || createReceipt() : existing.receipt || null,
  };
  state.responses[consultationId] = record;
  writeState(state, storage);
  return record;
}

export function toggleFollow(consultationId, storage) {
  const state = readState(storage);
  state.followed = state.followed.includes(consultationId)
    ? state.followed.filter((id) => id !== consultationId)
    : [...state.followed, consultationId];
  writeState(state, storage);
  return state.followed.includes(consultationId);
}

export function isFollowed(consultationId, storage) {
  return readState(storage).followed.includes(consultationId);
}

export function subscribeState(callback) {
  const local = (event) => callback(event.detail || readState());
  const remote = (event) => event.key === STORAGE_KEY && callback(readState());
  window.addEventListener('suara:consultation-state', local);
  window.addEventListener('storage', remote);
  return () => {
    window.removeEventListener('suara:consultation-state', local);
    window.removeEventListener('storage', remote);
  };
}

function createReceipt() {
  const suffix = globalThis.crypto?.randomUUID?.().slice(0, 8) || Math.random().toString(16).slice(2, 10);
  return `SUA-${new Date().getFullYear()}-${suffix.toUpperCase()}`;
}
