import { consultation, getConsultation, processSteps } from './consultationData.js';
import { getResponse, isFollowed, saveResponse, toggleFollow } from './consultationStore.js';
import { daysUntil, escapeHtml, formatDate, formatNumber, initShell, refreshIcons, showToast } from './shared.js';
import { createPolicyMap } from './policyMap.js';

initShell();

const params = new URLSearchParams(location.search);
const record = getConsultation(params.get('id')) || consultation;
const validTabs = ['summary', 'documents', 'questions', 'public', 'discussion', 'outcome', 'history'];
let activeTab = validTabs.includes(params.get('tab')) ? params.get('tab') : 'summary';
let currentQuestion = 0;
let answers = { ...(getResponse(record.id)?.answers || {}) };

renderHeader();
renderSummary();
renderDocuments();
renderQuestions();
renderPublic();
renderDiscussion();
renderOutcome();
renderHistory();
setTab(activeTab, false);
refreshIcons();
createPolicyMap(document.querySelector('#detailPolicyMap'));

function renderHeader() {
  document.title = `${record.shortTitle} — SUARA`;
  document.querySelector('#crumbTopic').textContent = record.topic;
  document.querySelector('#detailStatus').append(record.statusLabel);
  document.querySelector('#detailTitle').textContent = record.title;
  document.querySelector('#detailInstitution').textContent = `${record.institution} · ${record.region} · Data simulasi prototipe`;
  document.querySelector('#detailMeta').innerHTML = `
    <div><span>Periode konsultasi</span><strong>${formatDate(record.opensAt, { year: undefined })}–${formatDate(record.closesAt)}</strong></div>
    <div><span>Ditutup dalam</span><strong>${daysUntil(record.closesAt)} hari</strong></div>
    <div><span>Diterbitkan</span><strong>${formatDate(record.publishedAt)}</strong></div>
    <div><span>Terakhir diperbarui</span><strong>${formatDate(record.updatedAt)}</strong></div>`;
  document.querySelector('#processStepper').innerHTML = processSteps.map((label, index) => `<div class="stepper-item ${index + 1 < record.stage ? 'done' : index + 1 === record.stage ? 'active' : ''}">${label}</div>`).join('');
}

function renderSummary() {
  document.querySelector('#panel-summary').innerHTML = `
    <div class="panel-heading"><div><p class="section-kicker">Ringkasan untuk warga</p><h2>Apa yang sedang diusulkan?</h2></div><p>Mulai dari inti kebijakan, alasan, dampak, dan ruang perubahan. Dokumen lengkap tetap tersedia saat Anda membutuhkannya.</p></div>
    <div class="summary-grid">
      <article class="content-card"><h3>Usulan utama</h3><p class="proposal-lead">${record.proposition}</p><h3 style="margin-top:28px">Mengapa perubahan ini diusulkan?</h3><p>${record.reason}</p><div class="scope-grid"><section class="scope-box open"><h4>Masih terbuka untuk berubah</h4><ul class="clean-list">${record.openToChange.map((item) => `<li>${item}</li>`).join('')}</ul></section><section class="scope-box fixed"><h4>Di luar ruang konsultasi</h4><ul class="clean-list">${record.outsideScope.map((item) => `<li>${item}</li>`).join('')}</ul></section></div><h3 style="margin-top:28px">Pilihan yang sedang dipertimbangkan</h3><div class="option-grid">${record.options.map((item) => `<article><h4>${item.title}</h4><p>${item.description}</p></article>`).join('')}</div></article>
      <aside class="sidebar-stack">
        <article class="content-card deadline-card"><p class="section-kicker">Konsultasi dibuka</p><div class="deadline-count"><strong>${daysUntil(record.closesAt)}</strong><span>hari tersisa</span></div><p>Jawaban dapat disimpan sebagai draf sebelum dikirim.</p><a class="primary-button" style="width:100%" href="?id=${record.id}&tab=questions" data-tab-link="questions">Jawab konsultasi <i data-lucide="arrow-right"></i></a></article>
        <article class="content-card"><h3>Siapa yang perlu didengar?</h3><div class="tag-list">${record.affectedGroups.map((group) => `<span>${group}</span>`).join('')}</div></article>
        <article class="map-card"><div class="detail-map" id="detailPolicyMap" role="img" aria-label="Model tiga dimensi konteks wilayah kebijakan"></div><div class="map-card-copy"><h3>Model konteks kota</h3><p>Visual simulasi untuk menjelaskan pusat aktivitas dan zona dampak. Bukan batas resmi.</p></div></article>
        <article class="content-card"><h3>Bukti dan konteks</h3><div class="evidence-list">${record.evidence.map((item) => `<a class="evidence-link" href="${item.url}" target="_blank" rel="noreferrer"><small>${item.label}</small><strong>${item.title}</strong><span>${item.source}</span></a>`).join('')}</div></article>
      </aside>
    </div>`;
}

function renderDocuments() {
  const first = record.sections[0];
  document.querySelector('#panel-documents').innerHTML = `
    <div class="panel-heading"><div><p class="section-kicker">Dokumen dan pasal</p><h2>Baca teks asli dan artinya berdampingan.</h2></div><p>Ringkasan bahasa sederhana membantu orientasi, tetapi tidak menggantikan teks rancangan simulasi.</p></div>
    <div class="document-toolbar"><span class="document-label">Teks rancangan resmi — simulasi</span><div><button class="secondary-button" type="button" id="readAloud"><i data-lucide="volume-2"></i>Dengarkan ringkasan</button></div></div>
    <div class="document-explorer">
      <aside class="document-outline"><h3>Daftar isi rancangan</h3><div class="outline-list">${record.sections.map((section, index) => `<button class="${index === 0 ? 'active' : ''}" data-section-id="${section.id}">${section.number}: ${section.title}</button>`).join('')}</div></aside>
      <article class="official-text"><span class="document-label">Teks rancangan — simulasi</span><h2 id="officialHeading">${first.number}: ${first.title}</h2><p class="official-copy" id="officialCopy">${first.official}</p></article>
      <aside class="plain-explanation"><span class="document-label" style="color:var(--blue);background:var(--blue-soft)">Ringkasan bahasa sederhana</span><h3 id="plainHeading" style="margin-top:23px">Apa artinya?</h3><div class="explanation-block"><small>Penjelasan</small><p id="plainCopy">${first.plain}</p></div><div class="explanation-block"><small>Siapa yang terdampak?</small><strong id="plainAffects">${first.affects}</strong></div><div class="explanation-block"><small>Perubahan utama</small><p id="plainChange">${first.change}</p></div><button class="primary-button section-action" type="button" id="sectionFeedback">Beri masukan pada bagian ini <i data-lucide="arrow-right"></i></button></aside>
    </div>
    <div class="document-cards">${record.documents.map((doc) => `<article class="document-card"><small>${doc.type}</small><strong>${doc.title}</strong><span>${doc.format} · ${doc.accessible ? 'Format aksesibel' : ''}</span></article>`).join('')}</div>`;

  let activeSection = first;
  document.querySelectorAll('[data-section-id]').forEach((button) => button.addEventListener('click', () => {
    activeSection = record.sections.find((section) => section.id === button.dataset.sectionId);
    document.querySelectorAll('[data-section-id]').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelector('#officialHeading').textContent = `${activeSection.number}: ${activeSection.title}`;
    document.querySelector('#officialCopy').textContent = activeSection.official;
    document.querySelector('#plainCopy').textContent = activeSection.plain;
    document.querySelector('#plainAffects').textContent = activeSection.affects;
    document.querySelector('#plainChange').textContent = activeSection.change;
  }));
  document.querySelector('#sectionFeedback').addEventListener('click', () => {
    setTab('questions');
    const questionIndex = record.questions.findIndex((question) => question.id === activeSection.questionId);
    showQuestion(Math.max(0, questionIndex));
  });
  document.querySelector('#readAloud').addEventListener('click', () => {
    if (!('speechSynthesis' in window)) return showToast('Fitur tidak tersedia', 'Peramban ini belum mendukung pembacaan teks.');
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeSection.plain);
    utterance.lang = 'id-ID';
    speechSynthesis.speak(utterance);
    showToast('Ringkasan dibacakan', 'Gunakan kontrol audio perangkat untuk mengatur volume.');
  });
}

function renderQuestions() {
  const saved = getResponse(record.id);
  const submitted = saved?.status === 'submitted';
  document.querySelector('#panel-questions').innerHTML = `
    <div class="panel-heading"><div><p class="section-kicker">Pertanyaan konsultasi</p><h2>Sampaikan dampak, alternatif, dan bukti.</h2></div><p>Formulir menggabungkan pertanyaan terstruktur dan jawaban terbuka agar masukan dapat dianalisis tanpa kehilangan konteks.</p></div>
    <div class="response-shell" id="responseShell">
      <aside class="response-progress"><h3>Tanggapan Anda</h3><div class="response-steps">${record.questions.map((question, index) => `<button class="response-step" type="button" data-question-step="${index}"><span>${index + 1}</span><b>${question.section}</b></button>`).join('')}</div><div class="save-state" id="saveState">${submitted ? `Terkirim · ${saved.receipt}` : saved ? 'Draf terakhir tersimpan di perangkat ini.' : 'Jawaban disimpan hanya di perangkat ini.'}</div></aside>
      <form class="response-form" id="consultationForm" novalidate>
        ${record.questions.map((question, index) => questionPanel(question, index)).join('')}
        <section class="question-panel" data-preview-panel><span class="question-number">Tinjau tanggapan</span><h3>Pastikan jawaban Anda sudah mewakili pengalaman dan usulan yang ingin disampaikan.</h3><div class="preview-summary" id="previewSummary"></div><div class="display-options"><label><input type="checkbox" id="publicDisplay" ${saved?.publicDisplay ? 'checked' : ''} /> Tampilkan tanggapan ini di Masukan Publik pada perangkat ini</label><label for="displayName">Nama tampilan atau biarkan kosong untuk anonim</label><input class="display-name" id="displayName" maxlength="40" value="${escapeHtml(saved?.displayName || '')}" placeholder="Contoh: Rina P." /></div><div class="response-actions"><button class="secondary-button" type="button" data-back> Kembali</button><button class="primary-button" type="submit">Kirim tanggapan simulasi <i data-lucide="send"></i></button></div></section>
        <section class="question-panel" data-success-panel><div class="submission-success"><span class="success-icon"><i data-lucide="check"></i></span><h3>Masukan simulasi Anda telah dicatat.</h3><p>Instansi akan menganalisis seluruh tanggapan setelah periode konsultasi berakhir.</p><div class="receipt-code" id="receiptCode">${saved?.receipt || ''}</div><div class="hero-actions" style="justify-content:center"><a class="primary-button" href="/my-responses.html">Lacak tanggapan</a><a class="secondary-button" href="?id=${record.id}&tab=outcome" data-tab-link="outcome">Lihat contoh hasil</a></div></div></section>
      </form>
    </div>`;

  document.querySelectorAll('[data-question-step]').forEach((button) => button.addEventListener('click', () => showQuestion(Number(button.dataset.questionStep))));
  document.querySelectorAll('[data-next]').forEach((button) => button.addEventListener('click', nextQuestion));
  document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => showQuestion(Math.max(0, currentQuestion - 1))));
  document.querySelector('#consultationForm').addEventListener('input', handleAnswerInput);
  document.querySelector('#consultationForm').addEventListener('submit', submitResponse);
  if (submitted) showSuccess(saved);
  else showQuestion(0);
}

function questionPanel(question, index) {
  const saved = answers[question.id];
  let control = '';
  if (question.type === 'single' || question.type === 'scale') {
    control = `<div class="choice-list">${question.options.map((option) => `<label><input type="radio" name="${question.id}" value="${escapeHtml(option)}" ${saved === option ? 'checked' : ''} />${option}</label>`).join('')}</div>`;
  } else if (question.type === 'multi') {
    const selected = Array.isArray(saved) ? saved : [];
    control = `<div class="choice-list">${question.options.map((option) => `<label><input type="checkbox" name="${question.id}" value="${escapeHtml(option)}" ${selected.includes(option) ? 'checked' : ''} />${option}</label>`).join('')}</div>`;
  } else if (question.type === 'evidence') {
    control = `<input class="evidence-input" name="${question.id}" type="url" value="${escapeHtml(saved || '')}" placeholder="https://contoh-sumber.id atau kosongkan" /><button class="secondary-button" type="button" style="margin-top:9px" onclick="return false"><i data-lucide="paperclip"></i>Simulasikan lampiran</button>`;
  } else {
    control = `<textarea class="long-answer" name="${question.id}" rows="7" placeholder="${escapeHtml(question.hint || '')}">${escapeHtml(saved || '')}</textarea>`;
  }
  return `<section class="question-panel" data-question-panel="${index}"><span class="question-number">Pertanyaan ${index + 1} dari ${record.questions.length} · ${question.required ? 'Wajib' : 'Opsional'}</span><h3>${question.prompt}</h3><p>${question.hint || 'Pilih jawaban yang paling sesuai dengan konteks Anda.'}</p>${control}<p class="response-error">Jawab pertanyaan ini sebelum melanjutkan.</p><div class="response-actions"><button class="secondary-button" type="button" data-back ${index === 0 ? 'style="visibility:hidden"' : ''}>Kembali</button><button class="primary-button" type="button" data-next>${index === record.questions.length - 1 ? 'Tinjau tanggapan' : 'Lanjutkan'} <i data-lucide="arrow-right"></i></button></div></section>`;
}

function handleAnswerInput(event) {
  const input = event.target;
  if (!input.name) return;
  if (input.type === 'checkbox') answers[input.name] = [...document.querySelectorAll(`input[name="${input.name}"]:checked`)].map((item) => item.value);
  else answers[input.name] = input.value;
  const saved = saveResponse(record.id, { answers, status: 'draft' });
  document.querySelector('#saveState').textContent = `Draf tersimpan ${new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(saved.updatedAt))}`;
  event.target.closest('.question-panel')?.querySelector('.response-error')?.classList.remove('show');
  updateQuestionSteps();
}

function nextQuestion() {
  const question = record.questions[currentQuestion];
  const value = answers[question.id];
  const valid = !question.required || (Array.isArray(value) ? value.length > 0 : String(value || '').trim().length > 0);
  if (!valid) {
    document.querySelector(`[data-question-panel="${currentQuestion}"] .response-error`).classList.add('show');
    return;
  }
  if (currentQuestion === record.questions.length - 1) showPreview();
  else showQuestion(currentQuestion + 1);
}

function showQuestion(index) {
  currentQuestion = index;
  document.querySelectorAll('.question-panel').forEach((panel) => panel.classList.remove('active'));
  document.querySelector(`[data-question-panel="${index}"]`)?.classList.add('active');
  updateQuestionSteps();
  document.querySelector('#responseShell')?.scrollIntoView({ block: 'nearest' });
}

function updateQuestionSteps() {
  document.querySelectorAll('[data-question-step]').forEach((button, index) => {
    const value = answers[record.questions[index].id];
    button.classList.toggle('active', index === currentQuestion);
    button.classList.toggle('complete', Array.isArray(value) ? value.length > 0 : Boolean(String(value || '').trim()));
  });
}

function showPreview() {
  currentQuestion = record.questions.length;
  document.querySelectorAll('.question-panel').forEach((panel) => panel.classList.remove('active'));
  document.querySelector('[data-preview-panel]').classList.add('active');
  document.querySelector('#previewSummary').innerHTML = record.questions.map((question) => {
    const value = answers[question.id];
    return `<div class="preview-answer"><small>${question.prompt}</small><strong>${escapeHtml(Array.isArray(value) ? value.join(', ') : value || 'Tidak ada jawaban')}</strong></div>`;
  }).join('');
  updateQuestionSteps();
}

function submitResponse(event) {
  event.preventDefault();
  const saved = saveResponse(record.id, {
    answers,
    status: 'submitted',
    publicDisplay: document.querySelector('#publicDisplay').checked,
    displayName: document.querySelector('#displayName').value,
  });
  showSuccess(saved);
  showToast('Tanggapan simulasi terkirim', `Nomor bukti ${saved.receipt}`);
}

function showSuccess(saved) {
  document.querySelectorAll('.question-panel').forEach((panel) => panel.classList.remove('active'));
  document.querySelector('[data-success-panel]').classList.add('active');
  document.querySelector('#receiptCode').textContent = saved.receipt;
  document.querySelector('#saveState').textContent = `Terkirim · ${saved.receipt}`;
  document.querySelectorAll('[data-question-step]').forEach((button) => button.classList.add('complete'));
}

function renderPublic() {
  const response = getResponse(record.id);
  const own = response?.status === 'submitted' && response.publicDisplay ? [{
    id: 'own', name: response.displayName || 'Anonim', role: response.answers.q1 || 'Responden', reference: 'Tanggapan Anda', position: response.answers.q2 || '—', issue: 'Masukan baru', text: response.answers.q4 || 'Tidak ada uraian risiko.', proposal: response.answers.q5 || 'Tidak ada usulan.', relevant: 0, evidence: Boolean(response.answers.q6), response: 'Tercatat',
  }] : [];
  const submissions = [...own, ...record.publicSubmissions];
  const issues = [...new Set(submissions.map((item) => item.issue))];
  const positions = [...new Set(submissions.map((item) => item.position))];
  document.querySelector('#panel-public').innerHTML = `
    <div class="panel-heading"><div><p class="section-kicker">Masukan publik</p><h2>Pengalaman, bukti, dan perubahan yang diusulkan.</h2></div><p>Kontribusi dinilai berdasarkan relevansi terhadap kebijakan, bukan popularitas penulis.</p></div>
    <div class="public-toolbar"><label class="filter-field"><i data-lucide="search"></i><input id="publicSearch" type="search" placeholder="Cari masukan..." /></label><label class="filter-field"><select id="issueFilter"><option value="all">Semua isu</option>${issues.map((item) => `<option>${item}</option>`).join('')}</select></label><label class="filter-field"><select id="positionFilter"><option value="all">Semua posisi</option>${positions.map((item) => `<option>${item}</option>`).join('')}</select></label></div>
    <div class="public-submissions" id="publicSubmissionGrid"></div>`;
  const grid = document.querySelector('#publicSubmissionGrid');
  function render() {
    const query = document.querySelector('#publicSearch').value.trim().toLowerCase();
    const issue = document.querySelector('#issueFilter').value;
    const position = document.querySelector('#positionFilter').value;
    const data = submissions.filter((item) => (!query || `${item.name} ${item.role} ${item.text} ${item.proposal}`.toLowerCase().includes(query)) && (issue === 'all' || item.issue === issue) && (position === 'all' || item.position === position));
    grid.innerHTML = data.map(submissionCard).join('') || '<div class="empty-results show"><h3>Tidak ada masukan pada filter ini.</h3></div>';
    refreshIcons();
  }
  ['#publicSearch', '#issueFilter', '#positionFilter'].forEach((selector) => document.querySelector(selector).addEventListener(selector === '#publicSearch' ? 'input' : 'change', render));
  render();
}

function submissionCard(item) {
  return `<article class="submission-card"><div class="submission-head"><div class="submission-person"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.role)} · ${escapeHtml(item.issue)}</span></div><span class="position-chip">${escapeHtml(item.position)}</span></div><div class="submission-ref"><i data-lucide="link-2"></i>${escapeHtml(item.reference)}</div><p>${escapeHtml(item.text)}</p><div class="proposal-change"><strong>Usulan perubahan</strong>${escapeHtml(item.proposal)}</div><div class="submission-foot"><span><i data-lucide="thumbs-up"></i>${item.relevant} orang menilai relevan</span><span>${item.evidence ? 'Dengan bukti · ' : ''}${escapeHtml(item.response)}</span></div></article>`;
}

function renderDiscussion() {
  const rooms = [...new Set(record.discussionPosts.map((post) => post.room))];
  document.querySelector('#panel-discussion').innerHTML = `
    <div class="panel-heading"><div><p class="section-kicker">Ruang Musyawarah</p><h2>Diskusikan dampak sebelum mengirim masukan.</h2></div><p>Ruang ini membantu warga membandingkan pengalaman, menguji bukti, dan menyiapkan tanggapan formal yang lebih kuat.</p></div>
    <div class="discussion-banner"><i data-lucide="info"></i><div><strong>Diskusi bukan tanggapan formal.</strong><br>Hanya respons yang dikirim melalui formulir konsultasi yang tercatat sebagai tanggapan resmi dalam prototipe ini.</div></div>
    <div class="discussion-layout"><aside class="room-list"><h3>Ruang isu</h3><div><button class="active" data-room="all">Semua ruang</button>${rooms.map((room) => `<button data-room="${escapeHtml(room)}">${escapeHtml(room)}</button>`).join('')}</div></aside><section class="discussion-feed"><div class="discussion-feed-head"><h3 id="roomHeading">Semua ruang</h3><span class="status-badge is-open"><i></i>Musyawarah dibuka</span></div><div id="discussionPosts"></div></section><aside class="deliberation-summary"><h3>Ringkasan musyawarah</h3><p>${record.deliberationSummary.headline}</p><div class="summary-stat-grid"><div><strong>${record.deliberationSummary.contributions}</strong><span>kontribusi</span></div><div><strong>${record.deliberationSummary.issues}</strong><span>isu utama</span></div><div><strong>${record.deliberationSummary.answered}</strong><span>sudah dijawab</span></div><div><strong>${record.deliberationSummary.pending}</strong><span>menunggu jawaban</span></div></div><div class="unresolved-list"><div>Bagaimana verifikasi pekerja shift dilakukan?</div><div>Apakah evaluasi mencakup jalan lingkungan?</div><div>Kapan akses malam transportasi ditinjau?</div></div></aside></div>`;
  function showRoom(room) {
    document.querySelectorAll('[data-room]').forEach((button) => button.classList.toggle('active', button.dataset.room === room));
    document.querySelector('#roomHeading').textContent = room === 'all' ? 'Semua ruang' : room;
    const posts = room === 'all' ? record.discussionPosts : record.discussionPosts.filter((post) => post.room === room);
    document.querySelector('#discussionPosts').innerHTML = posts.map((post) => `<article class="discussion-post"><strong>${post.author}</strong> <small>${post.role} · ${post.reference}</small><p>${post.text}</p><footer><span>${post.replies} balasan</span><span>${post.relevant} menilai relevan</span></footer></article>`).join('');
  }
  document.querySelectorAll('[data-room]').forEach((button) => button.addEventListener('click', () => showRoom(button.dataset.room)));
  showRoom('all');
}

function renderOutcome() {
  const accepted = record.institutionalResponses.filter((item) => item.tone === 'accepted').length;
  document.querySelector('#panel-outcome').innerHTML = `
    <div class="panel-heading"><div><p class="section-kicker">Respons instansi — simulasi</p><h2>Apa yang kami dengar, pertimbangkan, dan putuskan.</h2></div><p>Contoh outcome menunjukkan bagaimana instansi dapat menjawab isu besar tanpa menjanjikan bahwa setiap masukan diterima.</p></div>
    <div class="outcome-stats"><article><strong>${formatNumber(record.responseCount)}</strong><span>respons simulasi</span></article><article><strong>${record.affectedGroups.length}</strong><span>kelompok terdampak</span></article><article><strong>${record.institutionalResponses.length}</strong><span>isu utama dijawab</span></article><article><strong>${accepted}</strong><span>perubahan diterima</span></article></div>
    <div class="response-table"><div class="response-row header"><div>Isu yang diangkat</div><div>Masukan publik</div><div>Pertimbangan dan hasil</div><div>Keputusan</div></div>${record.institutionalResponses.map((item) => `<article class="response-row"><div><strong>${item.issue}</strong><p>${item.section}</p></div><div><strong>${formatNumber(item.count)} respons</strong><p>${item.groups.join(', ')}<br>${item.evidence}</p></div><div><strong>Pertimbangan instansi</strong><p>${item.consideration}</p><strong style="display:block;margin-top:10px">Perubahan pada rancangan</strong><p>${item.outcome}</p></div><div><span class="decision-chip ${item.tone}">${item.decision}</span></div></article>`).join('')}</div>
    <div style="margin-top:22px"><a class="primary-button" href="?id=${record.id}&tab=history" data-tab-link="history">Bandingkan versi rancangan <i data-lucide="git-compare-arrows"></i></a></div>`;
}

function renderHistory() {
  const history = [
    ['8 Jul', 'Draf 1 diterbitkan'], ['8 Jul', 'Konsultasi dibuka'], ['15 Jul', 'Klarifikasi ditambahkan'], ['5 Agu', 'Konsultasi ditutup'], ['20 Agu', 'Respons diterbitkan'], ['22 Agu', 'Draf 2 diterbitkan'],
  ];
  document.querySelector('#panel-history').innerHTML = `
    <div class="panel-heading"><div><p class="section-kicker">Perubahan setelah konsultasi</p><h2>Lihat tepatnya apa yang berubah.</h2></div><p>Perbandingan menghubungkan masukan publik dengan keputusan dan teks revisi, bukan sekadar menyatakan bahwa konsultasi selesai.</p></div>
    <div class="revision-timeline">${record.revisions.map((item) => `<article class="revision-card"><header class="revision-head"><strong>${item.section}</strong><span class="decision-chip accepted">${item.status}</span></header><div class="revision-body"><section class="revision-side"><small>Sebelum konsultasi</small><p>${item.before}</p></section><section class="revision-side"><small>Setelah konsultasi</small><p>${item.after}</p></section></div><div class="revision-reason"><strong>Alasan perubahan:</strong> ${item.reason}</div></article>`).join('')}</div>
    <div class="history-list">${history.map(([date, label]) => `<div class="history-item"><strong>${label}</strong><span>${date} 2026 · simulasi</span></div>`).join('')}</div>`;
}

document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));
document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-tab-link]');
  if (!link) return;
  event.preventDefault();
  setTab(link.dataset.tabLink);
});

function setTab(tab, updateUrl = true) {
  activeTab = validTabs.includes(tab) ? tab : 'summary';
  document.querySelectorAll('[data-tab]').forEach((button) => {
    const active = button.dataset.tab === activeTab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `panel-${activeTab}`));
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set('tab', activeTab);
    history.replaceState({}, '', url);
    document.querySelector('.consultation-tabs-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (activeTab === 'public') renderPublic();
  refreshIcons();
}

const followButton = document.createElement('button');
followButton.className = `secondary-button ${isFollowed(record.id) ? 'on' : ''}`;
followButton.innerHTML = `<i data-lucide="bookmark"></i><span>${isFollowed(record.id) ? 'Mengikuti konsultasi' : 'Ikuti konsultasi'}</span>`;
document.querySelector('.detail-title').appendChild(followButton);
followButton.addEventListener('click', () => {
  const followed = toggleFollow(record.id);
  followButton.classList.toggle('on', followed);
  followButton.querySelector('span').textContent = followed ? 'Mengikuti konsultasi' : 'Ikuti konsultasi';
  showToast(followed ? 'Konsultasi diikuti' : 'Berhenti mengikuti', followed ? 'Pembaruan tampil di Masukan Saya.' : 'Konsultasi dihapus dari daftar ikuti.');
});
refreshIcons(followButton);
