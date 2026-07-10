import test from 'node:test';
import assert from 'node:assert/strict';
import { getResponse, isFollowed, normalizeState, readState, saveResponse, toggleFollow } from '../src/consultationStore.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('invalid storage safely falls back to empty state', () => {
  const storage = memoryStorage({ suara_consultation_demo_v1: '{broken' });
  assert.deepEqual(readState(storage), { version: 1, responses: {}, followed: [] });
  assert.deepEqual(normalizeState(null), { version: 1, responses: {}, followed: [] });
});

test('draft can be saved, resumed, and submitted with a stable receipt', () => {
  const storage = memoryStorage();
  const draft = saveResponse('blok-m-lez', { answers: { q1: 'Bekerja' }, status: 'draft' }, storage);
  assert.equal(draft.status, 'draft');
  assert.equal(getResponse('blok-m-lez', storage).answers.q1, 'Bekerja');

  const submitted = saveResponse('blok-m-lez', { answers: { ...draft.answers, q2: 'Setuju' }, status: 'submitted' }, storage);
  assert.equal(submitted.status, 'submitted');
  assert.match(submitted.receipt, /^SUA-\d{4}-/);
  const secondSave = saveResponse('blok-m-lez', { answers: submitted.answers, status: 'submitted' }, storage);
  assert.equal(secondSave.receipt, submitted.receipt);
});

test('follow state toggles without duplicates', () => {
  const storage = memoryStorage();
  assert.equal(toggleFollow('blok-m-lez', storage), true);
  assert.equal(isFollowed('blok-m-lez', storage), true);
  assert.equal(toggleFollow('blok-m-lez', storage), false);
  assert.equal(isFollowed('blok-m-lez', storage), false);
});
