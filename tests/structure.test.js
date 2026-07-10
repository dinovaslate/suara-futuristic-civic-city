import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const routes = ['index.html', 'consultations.html', 'consultation.html', 'my-responses.html'];

test('every public route labels the experience as a prototype', async () => {
  for (const route of routes) {
    const html = await readFile(new URL(`../${route}`, import.meta.url), 'utf8');
    assert.match(html, /Prototipe|prototipe|simulasi/i, route);
    assert.doesNotMatch(html, /Mulai petisi|Tanda tangani|100\.000 suara/i, route);
  }
});

test('consultation route exposes the complete accountability tabs', async () => {
  const html = await readFile(new URL('../consultation.html', import.meta.url), 'utf8');
  for (const label of ['Dokumen & Pasal', 'Pertanyaan Konsultasi', 'Ruang Musyawarah', 'Respons Instansi', 'Riwayat Perubahan']) assert.ok(html.includes(label));
});
