// script.js - handles animation, validation, terms modal, form submit (Formspree)

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xnnoeyng'; // your endpoint

/* ---------- Intro animation ---------- */
window.addEventListener('DOMContentLoaded', () => {
  // Hide intro after animation
  const overlay = document.getElementById('intro-overlay');
  if (overlay) {
    // Keep overlay visible for ~2s then hide smoothly
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }, 1800);
  }

  // populate DOB selects where present
  populateDobSelects();
  bindRoleCards();
  bindHeaderAudition();
  setupForms();
});

/* ---------- Helper: populate DOB selects ---------- */
function populateDobSelects() {
  const yearEl = document.getElementById('dob-year');
  const monthEl = document.getElementById('dob-month');
  const dayEl = document.getElementById('dob-day');

  if (!yearEl || !monthEl || !dayEl) return;

  // Compute allowed birth years based on ages 12-14 (allowing birthdays all year)
  const now = new Date();
  const currentYear = now.getFullYear();
  const maxAge = 14;
  const minAge = 12;

  // For birth year range: from (currentYear - minAge) down to (currentYear - maxAge)
  const startYear = currentYear - minAge;
  const endYear = currentYear - maxAge;

  yearEl.innerHTML = '<option value="">Year</option>';
  for (let y = startYear; y >= endYear; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearEl.appendChild(opt);
  }

  monthEl.innerHTML = '<option value="">Month</option>';
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = String(m).padStart(2, '0');
    opt.textContent = new Date(2000, m - 1).toLocaleString(undefined, { month: 'short' });
    monthEl.appendChild(opt);
  }

  dayEl.innerHTML = '<option value="">Day</option>';
  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement('option');
    opt.value = String(d).padStart(2, '0');
    opt.textContent = d;
    dayEl.appendChild(opt);
  }

  // If month/year change, you could adjust days but simple approach is ok for demo.
}

/* ---------- Role card details ---------- */
function bindRoleCards() {
  const cards = document.querySelectorAll('.role-card');
  const detail = document.getElementById('role-detail');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const role = card.dataset.role;
      if (!detail) return;
      detail.hidden = false;
      detail.innerHTML = `<strong>${role}</strong><p style="margin:8px 0 0;color:#374151">
        ${card.querySelector('p').textContent}
      </p><p style="margin-top:8px;color:#6b7280">Click another role to view details.</p>`;
      window.scrollTo({ top: detail.offsetTop - 20, behavior: 'smooth' });
    });
  });
}

/* ---------- Header Audition button opens audition1 in new tab and shows modal there ---------- */
function bindHeaderAudition() {
  const btn = document.getElementById('audition-open');
  if (!btn) return;
  btn.addEventListener('click', () => {
    // open Part 1 in new tab
    window.open('audition1.html', '_blank');
  });
}

/* ---------- Forms and modal handling ---------- */
function setupForms() {
  // Terms modal controls (in audition1)
  const termsModal = document.getElementById('terms-modal');
  const termsClose = document.getElementById('terms-close');
  const termsContinue = document.getElementById('terms-continue');
  const termsAccept = document.getElementById('terms-accept');

  if (termsClose) {
    termsClose.addEventListener('click', () => {
      if (termsModal) termsModal.setAttribute('aria-hidden', 'true');
    });
  }

  if (termsContinue) {
    termsContinue.addEventListener('click', () => {
      if (!termsAccept.checked) {
        alert('Please accept the Terms & Service to continue.');
        return;
      }
      if (termsModal) termsModal.setAttribute('aria-hidden', 'true');
      // allow application to continue (user pressed Next after terms)
      // Nothing more here — the flow continues when user clicks Next.
    });
  }

  // When user clicks Next on Part1: show modal and then if accepted, validate and submit form (via Formspree)
  const startBtn = document.getElementById('start-audition');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (termsModal) {
        termsModal.setAttribute('aria-hidden', 'false');
        // scroll to top of modal
        document.querySelector('body').style.overflow = 'hidden';
      } else {
        // No modal found — just proceed
        handlePart1Submit();
      }

      // After modal acceptance, the "terms-continue" button should trigger the submission logic:
      const cont = document.getElementById('terms-continue');
      if (cont) {
        cont.addEventListener('click', () => {
          // close modal UI
          if (termsModal) {
            termsModal.setAttribute('aria-hidden', 'true');
            document.querySelector('body').style.overflow = '';
          }
          handlePart1Submit();
        }, { once: true });
      }
    });
  }

  // Attach actual Part1 submission (inner function)
  function handlePart1Submit() {
    const form = document.getElementById('part1-form');
    if (!form) return;

    clearErrors(['childName','parentName','childEmail','parentEmail','dob','talent','permission']);

    const childName = document.getElementById('childName').value.trim();
    const parentName = document.getElementById('parentName').value.trim();
    const childEmail = document.getElementById('childEmail').value.trim();
    const parentEmail = document.getElementById('parentEmail').value.trim();
    const year = document.getElementById('dob-year').value;
    const month = document.getElementById('dob-month').value;
    const day = document.getElementById('dob-day').value;
    const talent = document.getElementById('talent').value;
    const permission = document.getElementById('permission').checked;

    let hasError = false;

    if (!childName) { showError('childName','Please enter your child\\'s full name.'); hasError = true; }
    if (!parentName) { showError('parentName','Please enter parent/guardian full name.'); hasError = true; }
    if (childEmail && !isValidEmail(childEmail)) { showError('childEmail','Please enter a valid child email address.'); hasError = true; }
    if (!parentEmail || !isValidEmail(parentEmail)) { showError('parentEmail','Please enter a valid parent email (required).'); hasError = true; }
    if (!year || !month || !day) { showError('dob','Please select a valid date of birth (year, month, day).'); hasError = true; }
    if (!talent) { showError('talent','Please select a primary talent.'); hasError = true; }
    if (!permission) { showError('permission','Parental permission is required to continue.'); hasError = true; }

    if (hasError) return;

    // Create application ID
    const appId = 'NA-' + Date.now();

    // Save locally for prefill
    const payload = { appId, childName, parentName, childEmail, parentEmail, dob: `${year}-${month}-${day}`, talent, permission: !!permission };
    localStorage.setItem('na-application', JSON.stringify(payload));

    // Build FormData for Formspree submission (Part1)
    const fd = new FormData();
    fd.append('form-name', 'part1-application');
    fd.append('appId', appId);
    fd.append('childName', childName);
    fd.append('parentName', parentName);
    fd.append('childEmail', childEmail);
    fd.append('parentEmail', parentEmail);
    fd.append('dob', `${year}-${month}-${day}`);
    fd.append('talent', talent);

    // Submit to Formspree
    fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: fd })
      .then(r => {
        // Formspree returns 200-299 on success
        if (r.ok) {
          // Redirect to Part2 (open in same tab)
          window.open('audition2.html', '_self');
        } else {
          return r.text().then(t => { throw new Error('Form submission failed'); });
        }
      })
      .catch(err => {
        alert('Submission failed. Please try again later.'); // generic friendly fallback
        console.error(err);
      });
  }

  // Part2 form handling (video)
  const p2 = document.getElementById('part2-form');
  if (p2) {
    const videoInput = document.getElementById('videoFile');
    const preview = document.getElementById('preview-player');
    const previewWrap = document.getElementById('video-preview');

    if (videoInput) {
      videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // client size limit for demo (200MB)
        if (file.size > 200 * 1024 * 1024) {
          showFieldError('video','File too large. Please use a smaller file (<200MB) or trim your clip.');
          videoInput.value = '';
          return;
        }
        // preview
        const url = URL.createObjectURL(file);
        if (preview) {
          preview.src = url;
          previewWrap.hidden = false;
        }
      });
    }

    p2.addEventListener('submit', (ev) => {
      ev.preventDefault();
      clearErrors(['appId','video']);
      const appId = document.getElementById('appId').value.trim();
      const file = document.getElementById('videoFile').files[0];

      let err = false;
      if (!appId) { showFieldError('appId','Please provide your Application ID or name.'); err = true; }
      if (!file) { showFieldError('video','Please choose a video file to upload.'); err = true; }
      if (err) return;

      const statusEl = document.getElementById('submit-status');
      statusEl.hidden = false;
      statusEl.textContent = 'Uploading... please wait';

      const fd = new FormData();
      fd.append('form-name', 'part2-video');
      fd.append('appId', appId);
      fd.append('video', file, file.name);

      fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: fd })
        .then(res => {
          if (res.ok) {
            statusEl.textContent = 'Thanks — your audition was submitted! Please wait 4 to 6 months for a response.';
            // clear form
            document.getElementById('part2-form').reset();
            const previewWrap = document.getElementById('video-preview');
            if (previewWrap) previewWrap.hidden = true;
          } else {
            throw new Error('Upload failed');
          }
        })
        .catch(e => {
          statusEl.textContent = 'Submission failed — please try again later.';
          console.error(e);
        });
    });
  }
}

/* ---------- Utilities ---------- */
function isValidEmail(em) {
  // simple regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
}

function showError(fieldId, msg) {
  const el = document.getElementById(`err-${fieldId}`);
  if (el) {
    el.textContent = msg;
    el.classList.add('show');
  } else {
    // fallback alert
    alert(msg);
  }
}

function showFieldError(name, msg) {
  // field-level mapping
  const idMap = {
    'video':'video',
    'appId':'appId',
  };
  const key = idMap[name] || name;
  const el = document.getElementById(`err-${key}`) || document.getElementById(`err-${name}`);
  if (el) {
    el.textContent = msg;
    el.classList.add('show');
  } else {
    alert(msg);
  }
}

function clearErrors(list) {
  list.forEach(k => {
    const el = document.getElementById(`err-${k}`);
    if (el) {
      el.textContent = '';
      el.classList.remove('show');
    }
  });
}
