import test from 'node:test';
import assert from 'node:assert/strict';
import { consultation, consultations, getConsultation, PRIMARY_CONSULTATION_ID } from '../src/consultationData.js';

test('primary consultation is complete enough for the judged journey', () => {
  assert.equal(getConsultation(PRIMARY_CONSULTATION_ID).id, PRIMARY_CONSULTATION_ID);
  assert.equal(consultation.questions.length, 6);
  assert.ok(consultation.sections.length >= 5);
  assert.ok(consultation.publicSubmissions.length >= 10);
  assert.ok(consultation.discussionPosts.length >= 12);
  assert.ok(consultation.institutionalResponses.some((item) => item.tone === 'rejected'));
  assert.ok(consultation.revisions.length >= 3);
});

test('every consultation exposes directory metadata and a simulation institution', () => {
  for (const item of consultations) {
    assert.ok(item.id);
    assert.ok(item.title);
    assert.ok(item.statusLabel);
    assert.ok(item.institution.includes('simulasi'));
    assert.ok(Array.isArray(item.affectedGroups) && item.affectedGroups.length > 0);
  }
});

test('each detailed policy section links to a real question', () => {
  const ids = new Set(consultation.questions.map((question) => question.id));
  for (const section of consultation.sections) assert.ok(ids.has(section.questionId));
});
