// script.js
// Handles intro animation fade, terms flow, form age validation, localStorage carry, and submit feedback.

// ----- Intro animation: SVG stroke draw + auto-fade after 4 seconds -----
document.addEventListener('DOMContentLoaded', () => {
  const intro = document.getElementById('intro');
  const main = document.getElementById('main');
  // Wait for the svg stroke animation to finish (we used ~3.8s). Add slight buffer.
  const introDurationMs = 4000;

  setTimeout(() => {
    // fade out intro, reveal main
    if (intro) {
      intro.style.opacity = 0;
      intro.style.visibility = 'hidden';
    }
    if (main) {
      main.classList.remove('hidden');
      // slight fade-in effect:
      main.style.opacity = 0;
      main.style.transition = 'opacity .6s ease';
      requestAnimationFrame(() => main.style.opacity = 1);
    }
  }, introDurationMs);
});

// ----- Terms agree logic on audition1 page -----
(function termsAndForm() {
  const agreeCheckbox = document.getElementById('agree-checkbox');
  const agreeBtn = document.getElementById('agree-btn');
  const termsSection = document.getElementById('terms');
  const form = document.getElementById('audition1-form');

  if (!agreeCheckbox || !agreeBtn || !termsSection) return;

  agreeCheckbox.addEventListener('change', () => {
    if (agreeCheckbox.checked) {
      agreeBtn.classList.remove('disabled');
      agreeBtn.removeAttribute('disabled');
    } else {
      agreeBtn.classList.add('disabled');
      agreeBtn.setAttribute('disabled', 'disabled');
    }
  });

  agreeBtn.addEventListener('click', () => {
    // hide terms and show form
    termsSection.classList.add('hidden');
    if (form) form.classList.remove('hidden');
    // populate birth year select
    populateBirthYears();
  });

  // Next button to step 2: validate and store data
  const toStep2 = document.getElementById('to-step2');
  if (toStep2) {
    toStep2.addEventListener('click', () => {
      const parentName = document.getElementById('parent-name')?.value?.trim();
      const parentPhone = document.getElementById('parent-phone')?.value?.trim();
      const parentEmail = document.getElementById('parent-email')?.value?.trim();
      const applicantName = document.getElementById('applicant-name')?.value?.trim();
      const birthYear = document.getElementById('birth-year')?.value;

      // Basic required check
      if (!parentName || !parentPhone || !parentEmail || !applicantName || !birthYear) {
        alert('Please complete all required fields before continuing.');
        return;
      }

      // Age check (12-14)
      const year = parseInt(birthYear, 10);
      const currentYear = new Date().getFullYear();
      const age = currentYear - year;
      if (age < 12 || age > 14) {
        alert('Applicant must be between 12 and 14 years old.');
        return;
      }

      // Save to localStorage so audition2 can pick it up
      const payload = {
        parent_name: parentName,
        parent_phone: parentPhone,
        parent_email: parentEmail,
        applicant_name: applicantName,
        birth_year: birthYear,
        applicant_email: document.getElementById('applicant-email')?.value?.trim() || ''
      };
      localStorage.setItem('newacademy_audition_step1', JSON.stringify(payload));
      // Open audition2 page in same tab or new tab? User wanted a new tab earlier.
      window.open('audition2.html', '_blank', 'noopener');
    });
  }

  // Populate birth-year select with allowed years (12-14)
  function populateBirthYears() {
    const sel = document.getElementById('birth-year');
    if (!sel) return;
    sel.innerHTML = '';
    const currentYear = new Date().getFullYear();
    // ages 12..14 => years currentYear - 12 .. currentYear - 14
    const years = [];
    for (let a = 12; a <= 14; a++) {
      years.push(currentYear - a);
    }
    // sort descending so most recent first
    years.sort((a,b)=>b-a).forEach(y => {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      sel.appendChild(opt);
    });
  }
})();

// ----- audition2 page: pick up fields from localStorage and inject hidden inputs -----
(function carryFieldsAndSubmit() {
  const carry = document.getElementById('carry-fields');
  const form2 = document.getElementById('audition2-form');
  const resultBox = document.getElementById('submission-result');

  if (!form2 || !carry) return;

  // Get step 1 from localStorage
  const s1 = localStorage.getItem('newacademy_audition_step1');
  if (!s1) {
    // If missing, ask user to go back
    const msg = document.createElement('div');
    msg.className = 'result-box';
    msg.innerHTML = '<p>No applicant data found. Please complete Step 1 first.</p><a class="btn" href="audition1.html">Go to Step 1</a>';
    carry.appendChild(msg);
    form2.querySelectorAll('input,select,button[type="submit"]').forEach(el => el.disabled = true);
    return;
  }
  const data = JSON.parse(s1);
  // create hidden inputs
  for (const key in data) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = data[key];
    carry.appendChild(input);
  }

  // After submit, show custom message and prevent default Formspree redirect (we still POST to Formspree)
  form2.addEventListener('submit', (ev) => {
    // Allow the form to submit to Formspree normally. For better UX, show message after submit attempt.
    // We will let it submit; but try to show message and prevent navigation by using fetch if desired.
    ev.preventDefault();

    const formData = new FormData(form2);
    // POST via fetch to Formspree endpoint
    fetch(form2.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    }).then(response => {
      if (response.ok) {
        // clear saved data
        localStorage.removeItem('newacademy_audition_step1');
        // hide form, show result
        form2.classList.add('hidden');
        if (resultBox) resultBox.classList.remove('hidden');
      } else {
        return response.json().then(data => {
          throw new Error(data?.error || 'Submission failed. Try again later.');
        });
      }
    }).catch(err => {
      alert('Submission error: ' + (err.message || err));
    });
  });
})();

