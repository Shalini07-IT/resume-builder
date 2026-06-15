/* =============================================
   ResumeForge — Premium Resume Builder JS
   ============================================= */

'use strict';

// ─── State ───────────────────────────────────────
const state = {
  // Personal
  firstName: '', lastName: '', jobTitle: '', dob: '', nationality: '',
  // Contact
  email: '', phone: '', location: '', linkedin: '', portfolio: '', website: '',
  // Summary
  summary: '',
  // Dynamic arrays
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  // Text blocks
  achievements: '', interests: '',
  // Photo
  photo: '',
  // Design
  template: 'corporate',
  accentColor: '#6c63ff',
  font: 'inter',
};

const SECTION_ORDER = [
  'personal','contact','summary','experience','education',
  'skills','projects','certifications','languages','achievements','interests','design'
];
let currentSectionIdx = 0;
let zoomScale = 1;
let isDarkTheme = true;

// ─── DOM Refs ─────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ─── Init ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  buildParticles();
  setupNavigation();
  setupFormBindings();
  setupPhotoUpload();
  setupSkillsSection();
  setupLanguagesSection();
  setupDynamicSections();
  setupDesignSection();
  setupThemeToggle();
  setupZoom();
  setupSaveButton();
  setupDownloadButton();
  setupMobileMenu();
  setupSectionNav();
  applyFont(state.font);
  applyAccentColor(state.accentColor);
  renderPreview();
  updateProgress();
  populateAllInputs();
  showSection(0);
});

// ─── Particles ────────────────────────────────────
function buildParticles() {
  const container = $('particles');
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px; height: ${size}px;
      animation-duration: ${Math.random() * 18 + 12}s;
      animation-delay: ${Math.random() * 10}s;
      opacity: ${Math.random() * 0.25 + 0.05};
    `;
    container.appendChild(p);
  }
}

// ─── Navigation ───────────────────────────────────
function setupNavigation() {
  $$('.nav-item').forEach((item, i) => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const sectionKey = item.dataset.section;
      const idx = SECTION_ORDER.indexOf(sectionKey);
      if (idx >= 0) showSection(idx);
      // Close mobile sidebar
      if (window.innerWidth <= 900) closeMobileSidebar();
    });
  });
}

function showSection(idx) {
  currentSectionIdx = Math.max(0, Math.min(idx, SECTION_ORDER.length - 1));
  const key = SECTION_ORDER[currentSectionIdx];
  // Hide all sections
  $$('.form-section').forEach(s => s.classList.remove('active'));
  const target = $(`section-${key}`);
  if (target) target.classList.add('active');
  // Update nav items
  $$('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === key);
  });
  // Update prev/next buttons
  $('prevBtn').disabled = currentSectionIdx === 0;
  $('nextBtn').disabled = currentSectionIdx === SECTION_ORDER.length - 1;
  // Scroll editor to top
  const ei = document.querySelector('.editor-inner');
  if (ei) ei.scrollTop = 0;
}

function setupSectionNav() {
  $('prevBtn').addEventListener('click', () => showSection(currentSectionIdx - 1));
  $('nextBtn').addEventListener('click', () => showSection(currentSectionIdx + 1));
}

// ─── Form Bindings ────────────────────────────────
function setupFormBindings() {
  // Simple key bindings
  const simpleKeys = ['firstName','lastName','jobTitle','dob','nationality',
    'email','phone','location','linkedin','portfolio','website',
    'achievements','interests'];
  simpleKeys.forEach(key => {
    const el = $(key);
    if (!el) return;
    el.addEventListener('input', () => {
      state[key] = el.value;
      renderPreview();
      updateProgress();
      debounceSave();
    });
  });

  // Summary with char count
  const summaryEl = $('summary');
  if (summaryEl) {
    summaryEl.addEventListener('input', () => {
      state.summary = summaryEl.value;
      const count = summaryEl.value.length;
      $('summaryCount').textContent = count;
      renderPreview();
      updateProgress();
      debounceSave();
    });
  }
}

function populateAllInputs() {
  const simpleKeys = ['firstName','lastName','jobTitle','dob','nationality',
    'email','phone','location','linkedin','portfolio','website',
    'achievements','interests','summary'];
  simpleKeys.forEach(key => {
    const el = $(key);
    if (el && state[key]) el.value = state[key];
  });
  if ($('summaryCount')) $('summaryCount').textContent = state.summary.length;
  if (state.photo) {
    const prev = $('photoPreview');
    prev.innerHTML = `<img src="${state.photo}" alt="Profile" />`;
  }
}

// ─── Photo Upload ─────────────────────────────────
function setupPhotoUpload() {
  const zone = $('photoDropZone');
  const input = $('photoInput');

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadPhoto(file);
  });
  zone.addEventListener('click', e => {
    if (e.target.tagName !== 'LABEL') input.click();
  });
  input.addEventListener('change', () => {
    if (input.files[0]) loadPhoto(input.files[0]);
  });
}

function loadPhoto(file) {
  const reader = new FileReader();
  reader.onload = e => {
    state.photo = e.target.result;
    const prev = $('photoPreview');
    prev.innerHTML = `<img src="${state.photo}" alt="Profile" />`;
    renderPreview();
    debounceSave();
    showToast('Photo uploaded! 📸', 'success');
  };
  reader.readAsDataURL(file);
}

// ─── Skills ───────────────────────────────────────
function setupSkillsSection() {
  const input = $('skillInput');
  const levelSel = $('skillLevel');
  const addBtn = $('addSkillBtn');

  function addSkill() {
    const name = input.value.trim();
    if (!name) return;
    state.skills.push({ name, level: levelSel.value });
    input.value = '';
    renderSkillTags();
    renderPreview();
    updateProgress();
    debounceSave();
  }
  addBtn.addEventListener('click', addSkill);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addSkill(); });
  renderSkillTags();
}

function renderSkillTags() {
  const container = $('skillTags');
  container.innerHTML = '';
  state.skills.forEach((skill, i) => {
    const tag = document.createElement('div');
    tag.className = 'skill-tag';
    tag.innerHTML = `
      <span>${escHtml(skill.name)}</span>
      <span class="tag-level">${skill.level}</span>
      <span class="tag-remove" data-i="${i}">✕</span>
    `;
    tag.querySelector('.tag-remove').addEventListener('click', () => {
      state.skills.splice(i, 1);
      renderSkillTags(); renderPreview(); debounceSave();
    });
    container.appendChild(tag);
  });
}

// ─── Languages ────────────────────────────────────
function setupLanguagesSection() {
  const input = $('langInput');
  const levelSel = $('langLevel');
  const addBtn = $('addLangBtn');

  function addLang() {
    const name = input.value.trim();
    if (!name) return;
    state.languages.push({ name, level: levelSel.value });
    input.value = '';
    renderLangTags();
    renderPreview();
    debounceSave();
  }
  addBtn.addEventListener('click', addLang);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addLang(); });
  renderLangTags();
}

function renderLangTags() {
  const container = $('langTags');
  container.innerHTML = '';
  state.languages.forEach((lang, i) => {
    const tag = document.createElement('div');
    tag.className = 'skill-tag';
    tag.innerHTML = `
      <span>${escHtml(lang.name)}</span>
      <span class="tag-level">${lang.level}</span>
      <span class="tag-remove" data-i="${i}">✕</span>
    `;
    tag.querySelector('.tag-remove').addEventListener('click', () => {
      state.languages.splice(i, 1);
      renderLangTags(); renderPreview(); debounceSave();
    });
    container.appendChild(tag);
  });
}

// ─── Dynamic Sections ─────────────────────────────
function setupDynamicSections() {
  // Experience
  $('addExperience').addEventListener('click', () => {
    state.experience.push({ company:'', role:'', from:'', to:'', current: false, desc:'' });
    renderExperienceList();
    renderPreview();
    debounceSave();
  });
  // Education
  $('addEducation').addEventListener('click', () => {
    state.education.push({ school:'', degree:'', field:'', from:'', to:'', gpa:'' });
    renderEducationList();
    renderPreview();
    debounceSave();
  });
  // Projects
  $('addProject').addEventListener('click', () => {
    state.projects.push({ name:'', tech:'', url:'', desc:'' });
    renderProjectList();
    renderPreview();
    debounceSave();
  });
  // Certifications
  $('addCert').addEventListener('click', () => {
    state.certifications.push({ name:'', issuer:'', date:'', url:'' });
    renderCertList();
    renderPreview();
    debounceSave();
  });

  // Render initial data
  renderExperienceList();
  renderEducationList();
  renderProjectList();
  renderCertList();
}

function makeCard(title, subtitle, bodyHTML, onRemove) {
  const card = document.createElement('div');
  card.className = 'dynamic-card';
  card.innerHTML = `
    <div class="card-header">
      <div>
        <div class="card-title">${title || 'Untitled'}</div>
        <div class="card-sub">${subtitle || ''}</div>
      </div>
      <div class="card-controls">
        <span class="card-toggle open">▼</span>
        <button class="btn-remove" title="Remove">✕</button>
      </div>
    </div>
    <div class="card-body">${bodyHTML}</div>
  `;
  const header = card.querySelector('.card-header');
  const body = card.querySelector('.card-body');
  const toggle = card.querySelector('.card-toggle');
  const removeBtn = card.querySelector('.btn-remove');

  header.addEventListener('click', e => {
    if (e.target.closest('.btn-remove')) return;
    body.classList.toggle('collapsed');
    toggle.classList.toggle('open', !body.classList.contains('collapsed'));
  });
  removeBtn.addEventListener('click', onRemove);
  return card;
}

function renderExperienceList() {
  const list = $('experienceList');
  list.innerHTML = '';
  state.experience.forEach((exp, i) => {
    const bodyHTML = `
      <div class="field-wrap full"><label>Company</label><input type="text" class="exp-company" value="${escAttr(exp.company)}" placeholder="Acme Corp" /></div>
      <div class="field-wrap full"><label>Job Title / Role</label><input type="text" class="exp-role" value="${escAttr(exp.role)}" placeholder="Software Engineer" /></div>
      <div class="field-wrap"><label>Start Date</label><input type="date" class="exp-from" value="${escAttr(exp.from)}" /></div>
      <div class="field-wrap"><label>End Date</label><input type="date" class="exp-to" value="${escAttr(exp.to)}" ${exp.current ? 'disabled' : ''} /></div>
      <div class="field-wrap full" style="flex-direction:row;align-items:center;gap:8px;padding-top:4px"><input type="checkbox" class="exp-current" ${exp.current ? 'checked' : ''} id="expCurrent${i}" style="width:16px;height:16px;cursor:pointer"/><label for="expCurrent${i}" style="text-transform:none;font-size:13px;font-weight:500;cursor:pointer">Currently working here</label></div>
      <div class="field-wrap full"><label>Description</label><textarea class="exp-desc" rows="3" placeholder="• Developed key features…&#10;• Led a team of 4 engineers…">${escHtml(exp.desc)}</textarea></div>
    `;
    const card = makeCard(
      exp.role || 'New Position',
      exp.company || 'Company Name',
      bodyHTML,
      () => { state.experience.splice(i, 1); renderExperienceList(); renderPreview(); debounceSave(); }
    );
    // Bind inputs
    function bindExp() {
      state.experience[i].company = card.querySelector('.exp-company').value;
      state.experience[i].role = card.querySelector('.exp-role').value;
      state.experience[i].from = card.querySelector('.exp-from').value;
      state.experience[i].to = card.querySelector('.exp-to').value;
      state.experience[i].desc = card.querySelector('.exp-desc').value;
      card.querySelector('.card-title').textContent = state.experience[i].role || 'New Position';
      card.querySelector('.card-sub').textContent = state.experience[i].company || 'Company Name';
      renderPreview(); debounceSave();
    }
    card.querySelectorAll('input, textarea').forEach(el => el.addEventListener('input', bindExp));
    card.querySelector('.exp-current').addEventListener('change', e => {
      state.experience[i].current = e.target.checked;
      card.querySelector('.exp-to').disabled = e.target.checked;
      bindExp();
    });
    list.appendChild(card);
  });
}

function renderEducationList() {
  const list = $('educationList');
  list.innerHTML = '';
  state.education.forEach((edu, i) => {
    const bodyHTML = `
      <div class="field-wrap full"><label>Institution</label><input type="text" class="edu-school" value="${escAttr(edu.school)}" placeholder="MIT" /></div>
      <div class="field-wrap"><label>Degree</label><input type="text" class="edu-degree" value="${escAttr(edu.degree)}" placeholder="Bachelor of Science" /></div>
      <div class="field-wrap"><label>Field of Study</label><input type="text" class="edu-field" value="${escAttr(edu.field)}" placeholder="Computer Science" /></div>
      <div class="field-wrap"><label>From</label><input type="date" class="edu-from" value="${escAttr(edu.from)}" /></div>
      <div class="field-wrap"><label>To</label><input type="date" class="edu-to" value="${escAttr(edu.to)}" /></div>
      <div class="field-wrap full"><label>GPA / Grade (optional)</label><input type="text" class="edu-gpa" value="${escAttr(edu.gpa)}" placeholder="3.9 / 4.0" /></div>
    `;
    const card = makeCard(
      edu.degree || 'New Degree',
      edu.school || 'Institution',
      bodyHTML,
      () => { state.education.splice(i, 1); renderEducationList(); renderPreview(); debounceSave(); }
    );
    function bindEdu() {
      state.education[i].school = card.querySelector('.edu-school').value;
      state.education[i].degree = card.querySelector('.edu-degree').value;
      state.education[i].field = card.querySelector('.edu-field').value;
      state.education[i].from = card.querySelector('.edu-from').value;
      state.education[i].to = card.querySelector('.edu-to').value;
      state.education[i].gpa = card.querySelector('.edu-gpa').value;
      card.querySelector('.card-title').textContent = state.education[i].degree || 'New Degree';
      card.querySelector('.card-sub').textContent = state.education[i].school || 'Institution';
      renderPreview(); debounceSave();
    }
    card.querySelectorAll('input').forEach(el => el.addEventListener('input', bindEdu));
    list.appendChild(card);
  });
}

function renderProjectList() {
  const list = $('projectList');
  list.innerHTML = '';
  state.projects.forEach((proj, i) => {
    const bodyHTML = `
      <div class="field-wrap full"><label>Project Name</label><input type="text" class="proj-name" value="${escAttr(proj.name)}" placeholder="My Awesome App" /></div>
      <div class="field-wrap full"><label>Technologies Used</label><input type="text" class="proj-tech" value="${escAttr(proj.tech)}" placeholder="React, Node.js, MongoDB" /></div>
      <div class="field-wrap full"><label>Project URL (optional)</label><input type="url" class="proj-url" value="${escAttr(proj.url)}" placeholder="https://github.com/..." /></div>
      <div class="field-wrap full"><label>Description</label><textarea class="proj-desc" rows="3" placeholder="What does it do? What problems does it solve?">${escHtml(proj.desc)}</textarea></div>
    `;
    const card = makeCard(
      proj.name || 'New Project',
      proj.tech || 'Technologies',
      bodyHTML,
      () => { state.projects.splice(i, 1); renderProjectList(); renderPreview(); debounceSave(); }
    );
    function bindProj() {
      state.projects[i].name = card.querySelector('.proj-name').value;
      state.projects[i].tech = card.querySelector('.proj-tech').value;
      state.projects[i].url = card.querySelector('.proj-url').value;
      state.projects[i].desc = card.querySelector('.proj-desc').value;
      card.querySelector('.card-title').textContent = state.projects[i].name || 'New Project';
      card.querySelector('.card-sub').textContent = state.projects[i].tech || 'Technologies';
      renderPreview(); debounceSave();
    }
    card.querySelectorAll('input, textarea').forEach(el => el.addEventListener('input', bindProj));
    list.appendChild(card);
  });
}

function renderCertList() {
  const list = $('certList');
  list.innerHTML = '';
  state.certifications.forEach((cert, i) => {
    const bodyHTML = `
      <div class="field-wrap full"><label>Certification Name</label><input type="text" class="cert-name" value="${escAttr(cert.name)}" placeholder="AWS Certified Solutions Architect" /></div>
      <div class="field-wrap"><label>Issuing Organization</label><input type="text" class="cert-issuer" value="${escAttr(cert.issuer)}" placeholder="Amazon Web Services" /></div>
      <div class="field-wrap"><label>Date Issued</label><input type="date" class="cert-date" value="${escAttr(cert.date)}" /></div>
      <div class="field-wrap full"><label>Credential URL (optional)</label><input type="url" class="cert-url" value="${escAttr(cert.url)}" placeholder="https://..." /></div>
    `;
    const card = makeCard(
      cert.name || 'New Certification',
      cert.issuer || 'Issuing Organization',
      bodyHTML,
      () => { state.certifications.splice(i, 1); renderCertList(); renderPreview(); debounceSave(); }
    );
    function bindCert() {
      state.certifications[i].name = card.querySelector('.cert-name').value;
      state.certifications[i].issuer = card.querySelector('.cert-issuer').value;
      state.certifications[i].date = card.querySelector('.cert-date').value;
      state.certifications[i].url = card.querySelector('.cert-url').value;
      card.querySelector('.card-title').textContent = state.certifications[i].name || 'New Certification';
      card.querySelector('.card-sub').textContent = state.certifications[i].issuer || 'Issuing Organization';
      renderPreview(); debounceSave();
    }
    card.querySelectorAll('input').forEach(el => el.addEventListener('input', bindCert));
    list.appendChild(card);
  });
}

// ─── Design Section ───────────────────────────────
function setupDesignSection() {
  // Template cards
  $$('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('.template-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.template = card.dataset.template;
      renderPreview();
      debounceSave();
      showToast(`Template: ${card.querySelector('span').textContent}`, 'info');
    });
  });

  // Color swatches
  $$('.swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      $$('.swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      state.accentColor = sw.dataset.color;
      applyAccentColor(state.accentColor);
      renderPreview();
      debounceSave();
    });
  });

  // Custom color
  $('customColor').addEventListener('input', e => {
    state.accentColor = e.target.value;
    $$('.swatch').forEach(s => s.classList.remove('active'));
    applyAccentColor(state.accentColor);
    renderPreview();
    debounceSave();
  });

  // Font buttons
  $$('.font-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.font-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.font = btn.dataset.font;
      applyFont(state.font);
      renderPreview();
      debounceSave();
    });
  });

  // Restore design state
  const tplCard = document.querySelector(`[data-template="${state.template}"]`);
  if (tplCard) { $$('.template-card').forEach(c => c.classList.remove('active')); tplCard.classList.add('active'); }
  const swatchEl = document.querySelector(`[data-color="${state.accentColor}"]`);
  if (swatchEl) { $$('.swatch').forEach(s => s.classList.remove('active')); swatchEl.classList.add('active'); }
  const fontBtn = document.querySelector(`[data-font="${state.font}"]`);
  if (fontBtn) { $$('.font-btn').forEach(b => b.classList.remove('active')); fontBtn.classList.add('active'); }
}

function applyAccentColor(color) {
  document.documentElement.style.setProperty('--accent', color);
  // Compute glow
  document.documentElement.style.setProperty('--accent-glow', hexToRgba(color, 0.35));
  document.documentElement.style.setProperty('--accent-light', hexToRgba(color, 0.12));
}

function applyFont(font) {
  const map = {
    inter: "'Inter', sans-serif",
    merriweather: "'Merriweather', serif",
    montserrat: "'Montserrat', sans-serif",
    playfair: "'Playfair Display', serif",
    roboto: "'Roboto', sans-serif",
  };
  document.documentElement.style.setProperty('--font', map[font] || map.inter);
  document.body.style.fontFamily = map[font] || map.inter;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Theme Toggle ─────────────────────────────────
function setupThemeToggle() {
  const btn = $('themeToggle');
  const saved = localStorage.getItem('rf_theme');
  if (saved === 'light') { isDarkTheme = false; document.documentElement.dataset.theme = 'light'; btn.textContent = '☀️'; }
  btn.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    document.documentElement.dataset.theme = isDarkTheme ? 'dark' : 'light';
    btn.textContent = isDarkTheme ? '🌙' : '☀️';
    localStorage.setItem('rf_theme', isDarkTheme ? 'dark' : 'light');
    showToast(isDarkTheme ? 'Dark mode on 🌙' : 'Light mode on ☀️', 'info');
  });
}

// ─── Zoom ─────────────────────────────────────────
function setupZoom() {
  $('zoomIn').addEventListener('click', () => { zoomScale = Math.min(zoomScale + 0.1, 1.5); applyZoom(); });
  $('zoomOut').addEventListener('click', () => { zoomScale = Math.max(zoomScale - 0.1, 0.4); applyZoom(); });
}
function applyZoom() {
  $('resumeSheet').style.transform = `scale(${zoomScale})`;
  $('zoomLevel').textContent = Math.round(zoomScale * 100) + '%';
}

// ─── Mobile Menu ──────────────────────────────────
function setupMobileMenu() {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  $('mobileMenuBtn').addEventListener('click', () => {
    $('sidebar').classList.add('open');
    overlay.classList.add('visible');
  });
  overlay.addEventListener('click', closeMobileSidebar);
}

function closeMobileSidebar() {
  $('sidebar').classList.remove('open');
  document.querySelector('.sidebar-overlay').classList.remove('visible');
}

// ─── Save Button ──────────────────────────────────
function setupSaveButton() {
  $('saveBtn').addEventListener('click', () => {
    saveToStorage();
    showToast('Resume saved! 💾', 'success');
    addRipple($('saveBtn'));
  });
}

let saveTimeout;
function debounceSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToStorage, 1500);
}

function saveToStorage() {
  try {
    localStorage.setItem('rf_state', JSON.stringify(state));
  } catch (e) { /* quota exceeded */ }
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem('rf_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
    }
    const theme = localStorage.getItem('rf_theme');
    if (theme === 'light') document.documentElement.dataset.theme = 'light';
  } catch (e) { /* ignore */ }
}

// ─── Download PDF ─────────────────────────────────
function setupDownloadButton() {
  $('downloadBtn').addEventListener('click', () => {
    addRipple($('downloadBtn'));
    showToast('Preparing PDF…', 'info');
    setTimeout(() => {
      const sheet = $('resumeSheet');
      // Temporarily reset zoom for printing
      const prevTransform = sheet.style.transform;
      sheet.style.transform = 'scale(1)';
      window.print();
      sheet.style.transform = prevTransform;
    }, 300);
  });
}

// ─── Progress ─────────────────────────────────────
function updateProgress() {
  const checks = [
    !!state.firstName, !!state.lastName, !!state.jobTitle,
    !!state.email, !!state.phone, !!state.location,
    !!state.summary,
    state.experience.length > 0,
    state.education.length > 0,
    state.skills.length > 0,
    state.projects.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  const pct = Math.round((filled / checks.length) * 100);
  $('progressPct').textContent = pct + '%';
  // Update ring
  const circumference = 163.36;
  const offset = circumference - (pct / 100) * circumference;
  $('progressRing').style.strokeDashoffset = offset;
}

// ─── Toast ────────────────────────────────────────
let toastTimeout;
function showToast(msg, type = 'info') {
  const toast = $('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 2500);
}

// ─── Ripple ───────────────────────────────────────
function addRipple(btn) {
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  const r = document.createElement('span');
  r.className = 'ripple';
  const size = Math.max(btn.offsetWidth, btn.offsetHeight);
  r.style.cssText = `width:${size}px;height:${size}px;left:${btn.offsetWidth/2 - size/2}px;top:${btn.offsetHeight/2 - size/2}px`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 700);
}

// ─── Preview Render ───────────────────────────────
function renderPreview() {
  const sheet = $('resumeSheet');
  // Remove all template classes
  sheet.className = 'resume-sheet';
  sheet.classList.add(`tpl-${state.template}`);
  sheet.style.setProperty('--r-accent', state.accentColor);

  // Font
  const fontMap = {
    inter: "'Inter', sans-serif",
    merriweather: "'Merriweather', serif",
    montserrat: "'Montserrat', sans-serif",
    playfair: "'Playfair Display', serif",
    roboto: "'Roboto', sans-serif",
  };
  sheet.style.fontFamily = fontMap[state.font] || fontMap.inter;

  const fn = {
    corporate: renderCorporate,
    creative: renderCreative,
    modern: renderModern,
    minimalist: renderMinimalist,
    tech: renderTech,
  };
  (fn[state.template] || renderCorporate)(sheet);
}

// ---- Helpers ----
function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}
function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function skillWidth(level) {
  return { beginner: '25%', intermediate: '55%', advanced: '80%', expert: '100%' }[level] || '50%';
}

// ---- Section Builders (shared pieces) ----
function buildSummarySection() {
  if (!state.summary) return '';
  return `<div class="resume-section">
    <div class="resume-section-title">Summary</div>
    <p class="resume-summary">${escHtml(state.summary)}</p>
  </div>`;
}
function buildExperienceSection() {
  if (!state.experience.length) return '';
  return `<div class="resume-section">
    <div class="resume-section-title">Experience</div>
    ${state.experience.map(e => `
      <div class="resume-entry">
        <div class="entry-title">${escHtml(e.role)}</div>
        <div class="entry-sub">${escHtml(e.company)}</div>
        <div class="entry-date">${fmtDate(e.from)}${e.from||e.to ? ' — ' : ''}${e.current ? 'Present' : fmtDate(e.to)}</div>
        ${e.desc ? `<div class="entry-desc">${escHtml(e.desc)}</div>` : ''}
      </div>`).join('')}
  </div>`;
}
function buildEducationSection() {
  if (!state.education.length) return '';
  return `<div class="resume-section">
    <div class="resume-section-title">Education</div>
    ${state.education.map(e => `
      <div class="resume-entry">
        <div class="entry-title">${escHtml(e.degree)}${e.field ? ` in ${escHtml(e.field)}` : ''}</div>
        <div class="entry-sub">${escHtml(e.school)}</div>
        <div class="entry-date">${fmtDate(e.from)}${e.from||e.to ? ' — ' : ''}${fmtDate(e.to)}${e.gpa ? `  ·  GPA: ${escHtml(e.gpa)}` : ''}</div>
      </div>`).join('')}
  </div>`;
}
function buildSkillsSection() {
  if (!state.skills.length) return '';
  return `<div class="resume-section">
    <div class="resume-section-title">Skills</div>
    <div class="resume-skill-list">${state.skills.map(s => `<span class="resume-skill-tag">${escHtml(s.name)}</span>`).join('')}</div>
  </div>`;
}
function buildSkillBarsSection() {
  if (!state.skills.length) return '';
  return `<div class="resume-section">
    <div class="resume-section-title">Skills</div>
    ${state.skills.map(s => `
      <div class="skill-bar-wrap">
        <div class="skill-bar-label"><span>${escHtml(s.name)}</span><span>${s.level}</span></div>
        <div class="skill-bar-track"><div class="skill-bar-fill" style="width:${skillWidth(s.level)}"></div></div>
      </div>`).join('')}
  </div>`;
}
function buildProjectsSection() {
  if (!state.projects.length) return '';
  return `<div class="resume-section">
    <div class="resume-section-title">Projects</div>
    ${state.projects.map(p => `
      <div class="resume-entry">
        <div class="entry-title">${escHtml(p.name)}${p.url ? ` <a href="${escAttr(p.url)}" style="color:var(--r-accent,#6c63ff);font-size:11px;font-weight:400" target="_blank">↗</a>` : ''}</div>
        ${p.tech ? `<div class="entry-sub">${escHtml(p.tech)}</div>` : ''}
        ${p.desc ? `<div class="entry-desc">${escHtml(p.desc)}</div>` : ''}
      </div>`).join('')}
  </div>`;
}
function buildCertificationsSection() {
  if (!state.certifications.length) return '';
  return `<div class="resume-section">
    <div class="resume-section-title">Certifications</div>
    ${state.certifications.map(c => `
      <div class="resume-entry">
        <div class="entry-title">${escHtml(c.name)}</div>
        <div class="entry-sub">${escHtml(c.issuer)}${c.date ? `  ·  ${fmtDate(c.date)}` : ''}</div>
      </div>`).join('')}
  </div>`;
}
function buildLanguagesSection() {
  if (!state.languages.length) return '';
  return `<div class="resume-section">
    <div class="resume-section-title">Languages</div>
    ${state.languages.map(l => `<div class="lang-item"><span>${escHtml(l.name)}</span><span class="lang-level">${l.level}</span></div>`).join('')}
  </div>`;
}
function buildAchievementsSection() {
  if (!state.achievements) return '';
  return `<div class="resume-section">
    <div class="resume-section-title">Achievements</div>
    <div class="entry-desc">${escHtml(state.achievements)}</div>
  </div>`;
}
function buildInterestsSection() {
  if (!state.interests) return '';
  return `<div class="resume-section">
    <div class="resume-section-title">Interests</div>
    <div class="entry-desc">${escHtml(state.interests)}</div>
  </div>`;
}
function buildContactList() {
  const items = [];
  if (state.email) items.push(`📧 ${escHtml(state.email)}`);
  if (state.phone) items.push(`📱 ${escHtml(state.phone)}`);
  if (state.location) items.push(`📍 ${escHtml(state.location)}`);
  if (state.linkedin) items.push(`🔗 ${escHtml(state.linkedin)}`);
  if (state.portfolio) items.push(`💻 ${escHtml(state.portfolio)}`);
  if (state.website) items.push(`🌐 ${escHtml(state.website)}`);
  return items;
}
function buildContactListHTML() {
  return `<ul class="resume-contact-list">${buildContactList().map(i => `<li>${i}</li>`).join('')}</ul>`;
}
function buildContactInlineHTML() {
  return buildContactList().map(i => `<span>${i}</span>`).join('');
}
function buildHeaderPhoto(cls = '') {
  return state.photo
    ? `<div class="${cls || 'header-photo'}"><img src="${state.photo}" alt="Profile" /></div>`
    : `<div class="${cls || 'header-photo'}"></div>`;
}
function fullName() {
  return `${escHtml(state.firstName)} ${escHtml(state.lastName)}`.trim() || 'Your Name';
}

// ─── Template: Corporate ──────────────────────────
function renderCorporate(sheet) {
  sheet.innerHTML = `
    <div class="resume-header">
      ${buildHeaderPhoto()}
      <div class="header-info">
        <h1>${fullName()}</h1>
        <div class="job-title">${escHtml(state.jobTitle)}</div>
        <div class="header-contacts">${buildContactInlineHTML()}</div>
      </div>
    </div>
    <div class="resume-body">
      <div class="resume-left">
        ${buildSkillBarsSection()}
        ${buildLanguagesSection()}
        ${buildCertificationsSection()}
        ${buildInterestsSection()}
      </div>
      <div class="resume-right">
        ${buildSummarySection()}
        ${buildExperienceSection()}
        ${buildEducationSection()}
        ${buildProjectsSection()}
        ${buildAchievementsSection()}
      </div>
    </div>
  `;
}

// ─── Template: Creative ───────────────────────────
function renderCreative(sheet) {
  sheet.innerHTML = `
    <div class="creative-sidebar">
      <div class="photo-wrap">${state.photo ? `<img src="${state.photo}" alt="Profile"/>` : ''}</div>
      <h1>${fullName()}</h1>
      <div class="job-title">${escHtml(state.jobTitle)}</div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">Contact</div>
        ${buildContactList().map(i => `<p>${i}</p>`).join('')}
      </div>
      ${state.skills.length ? `
      <div class="sidebar-section">
        <div class="sidebar-section-title">Skills</div>
        ${state.skills.map(s => `
          <div class="skill-bar-wrap" style="margin-bottom:8px">
            <div class="skill-bar-label" style="color:rgba(255,255,255,0.8);font-size:11px;margin-bottom:3px"><span>${escHtml(s.name)}</span></div>
            <div class="skill-bar-track" style="background:rgba(255,255,255,0.2)"><div class="skill-bar-fill" style="width:${skillWidth(s.level)};background:#fff"></div></div>
          </div>`).join('')}
      </div>` : ''}
      ${state.languages.length ? `
      <div class="sidebar-section">
        <div class="sidebar-section-title">Languages</div>
        ${state.languages.map(l => `<div class="lang-item" style="color:rgba(255,255,255,0.85)"><span>${escHtml(l.name)}</span><span style="font-size:10px;opacity:0.7">${l.level}</span></div>`).join('')}
      </div>` : ''}
      ${state.interests ? `
      <div class="sidebar-section">
        <div class="sidebar-section-title">Interests</div>
        <p style="font-size:12px;opacity:0.85">${escHtml(state.interests)}</p>
      </div>` : ''}
    </div>
    <div class="creative-main">
      ${buildSummarySection()}
      ${buildExperienceSection()}
      ${buildEducationSection()}
      ${buildProjectsSection()}
      ${buildCertificationsSection()}
      ${buildAchievementsSection()}
    </div>
  `;
}

// ─── Template: Modern ─────────────────────────────
function renderModern(sheet) {
  sheet.innerHTML = `
    <div class="resume-header">
      <div class="header-info">
        <h1>${fullName()}</h1>
        <div class="job-title">${escHtml(state.jobTitle)}</div>
      </div>
      ${buildHeaderPhoto()}
    </div>
    <div class="modern-contact-bar">${buildContactInlineHTML()}</div>
    <div class="modern-body">
      <div>
        ${buildSummarySection()}
        ${buildExperienceSection()}
        ${buildProjectsSection()}
        ${buildAchievementsSection()}
      </div>
      <div>
        ${buildEducationSection()}
        ${buildSkillsSection()}
        ${buildCertificationsSection()}
        ${buildLanguagesSection()}
        ${buildInterestsSection()}
      </div>
    </div>
  `;
}

// ─── Template: Minimalist ─────────────────────────
function renderMinimalist(sheet) {
  sheet.innerHTML = `
    <div class="resume-header">
      <h1>${fullName()}</h1>
      <div class="job-title">${escHtml(state.jobTitle)}</div>
      <div class="min-divider"></div>
      <div class="min-contacts">${buildContactInlineHTML()}</div>
    </div>
    <div class="min-body">
      <div>
        ${buildSummarySection()}
        ${buildExperienceSection()}
        ${buildProjectsSection()}
        ${buildAchievementsSection()}
      </div>
      <div>
        ${buildEducationSection()}
        ${buildSkillsSection()}
        ${buildCertificationsSection()}
        ${buildLanguagesSection()}
        ${buildInterestsSection()}
      </div>
    </div>
  `;
}

// ─── Template: Tech ───────────────────────────────
function renderTech(sheet) {
  sheet.innerHTML = `
    <div class="tech-header">
      <div>
        <div class="prompt">$ whoami</div>
        <h1>${fullName()}</h1>
        <div class="job-title">${escHtml(state.jobTitle)}</div>
      </div>
      <div class="tech-photo">${state.photo ? `<img src="${state.photo}" alt="Profile"/>` : ''}</div>
    </div>
    <div class="tech-body">
      <div>
        ${buildSummarySection()}
        ${buildExperienceSection()}
        ${buildProjectsSection()}
        ${buildAchievementsSection()}
      </div>
      <div>
        <div class="resume-section">
          <div class="resume-section-title">Contact</div>
          ${buildContactList().map(i => `<div class="entry-sub" style="margin-bottom:5px">${i}</div>`).join('')}
        </div>
        ${buildEducationSection()}
        ${buildSkillsSection()}
        ${buildCertificationsSection()}
        ${buildLanguagesSection()}
        ${buildInterestsSection()}
      </div>
    </div>
  `;
}

// ─── Preview Toggle (mobile) ──────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const btn = $('previewToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const panel = $('previewPanel');
      if (window.innerWidth <= 900) {
        panel.classList.toggle('mobile-visible');
      }
    });
  }
});
