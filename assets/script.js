const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  mainNav?.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  mainNav.classList.toggle('is-open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
});

mainNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const slides = [...carousel.querySelectorAll('[data-slide]')];
  const dots = [...carousel.querySelectorAll('[data-dot]')];
  let activeIndex = 0;
  let timer;

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === activeIndex));
  }

  function restart() {
    window.clearInterval(timer);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timer = window.setInterval(() => showSlide(activeIndex + 1), 6500);
    }
  }

  carousel.querySelector('[data-prev]')?.addEventListener('click', () => { showSlide(activeIndex - 1); restart(); });
  carousel.querySelector('[data-next]')?.addEventListener('click', () => { showSlide(activeIndex + 1); restart(); });
  dots.forEach((dot) => dot.addEventListener('click', () => { showSlide(Number(dot.dataset.dot)); restart(); }));
  carousel.addEventListener('mouseenter', () => window.clearInterval(timer));
  carousel.addEventListener('mouseleave', restart);
  restart();
});

document.querySelectorAll('[data-tabs]').forEach((tabsRoot) => {
  const tabs = [...tabsRoot.querySelectorAll('[role="tab"]')];
  const panels = [...tabsRoot.querySelectorAll('[role="tabpanel"]')];

  function activateTab(nextTab) {
    tabs.forEach((tab) => {
      const active = tab === nextTab;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      const active = panel.dataset.panel === nextTab.dataset.target;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let targetIndex = index;
      if (event.key === 'Home') targetIndex = 0;
      else if (event.key === 'End') targetIndex = tabs.length - 1;
      else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') targetIndex = (index + 1) % tabs.length;
      else targetIndex = (index - 1 + tabs.length) % tabs.length;
      tabs[targetIndex].focus();
      activateTab(tabs[targetIndex]);
    });
  });
});

const lightbox = document.querySelector('#image-lightbox');
const lightboxImage = lightbox?.querySelector('img');
const lightboxCaption = lightbox?.querySelector('p');

document.querySelectorAll('[data-lightbox]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!lightbox || !lightboxImage || !lightboxCaption) return;
    lightboxImage.src = button.dataset.lightbox;
    lightboxImage.alt = button.querySelector('img')?.alt || '';
    lightboxCaption.textContent = button.dataset.caption || '';
    lightbox.showModal();
  });
});

lightbox?.querySelector('.lightbox-close')?.addEventListener('click', () => lightbox.close());
lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});

const revealItems = document.querySelectorAll('.reveal');
revealItems.forEach((item) => {
  if (item.dataset.delay) item.style.setProperty('--delay', `${item.dataset.delay}ms`);
});

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const consultationForm = document.querySelector('#consultation-form');
const formStatus = document.querySelector('#form-status');
const zaloAfterSubmit = document.querySelector('#zalo-after-submit');
const formStartedAt = consultationForm?.querySelector('[name="formStartedAt"]');
if (formStartedAt) formStartedAt.value = String(Date.now());

function setFormStatus(message, type = '') {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.className = `form-status${type ? ` is-${type}` : ''}`;
}

consultationForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!consultationForm.reportValidity()) return;

  const data = new FormData(consultationForm);
  if (data.get('website')) return;

  const config = window.TRAENCO_CONFIG || {};
  const submitButton = consultationForm.querySelector('.form-submit');
  const payload = {
    name: String(data.get('name') || '').trim(),
    email: String(data.get('email') || '').trim().toLowerCase(),
    phone: String(data.get('phone') || '').trim(),
    market: String(data.get('market') || '').trim(),
    message: String(data.get('message') || '').trim(),
    consent: data.get('consent') === 'on',
    formStartedAt: Number(data.get('formStartedAt') || 0),
    pageUrl: window.location.href
  };

  if (!/^0\d{9}$/.test(payload.phone.replace(/[ .-]/g, ''))) {
    setFormStatus('Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số.', 'error');
    return;
  }

  if (!/^[a-z0-9._%+-]+@gmail\.com$/i.test(payload.email)) {
    setFormStatus('Vui lòng nhập đúng địa chỉ Gmail, ví dụ tenban@gmail.com.', 'error');
    return;
  }

  const hasSheets = Boolean(config.GOOGLE_SHEETS_WEB_APP_URL);
  const hasSupabase = Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY);
  if (!hasSheets && !hasSupabase) {
    setFormStatus('Hệ thống đang chờ kết nối Google Sheets. Vui lòng nhắn Zalo hoặc gọi hotline để được tư vấn ngay.', 'warning');
    if (zaloAfterSubmit) zaloAfterSubmit.hidden = false;
    return;
  }

  submitButton.disabled = true;
  submitButton.classList.add('is-loading');
  setFormStatus('Đang lưu yêu cầu của bạn…');

  try {
    if (hasSheets) {
      await fetch(config.GOOGLE_SHEETS_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
    } else {
      const response = await fetch(`${config.SUPABASE_URL}/functions/v1/submit-consultation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${config.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Không thể gửi yêu cầu lúc này.');
    }

    setFormStatus('Đã lưu đăng ký thành công. TRAENCO Huế sẽ sớm liên hệ với bạn.', 'success');
    consultationForm.reset();
    if (formStartedAt) formStartedAt.value = String(Date.now());
    if (zaloAfterSubmit) {
      zaloAfterSubmit.href = config.ZALO_CHAT_URL || 'https://zalo.me/0935398669';
      zaloAfterSubmit.hidden = false;
      zaloAfterSubmit.focus({ preventScroll: true });
    }
  } catch (error) {
    setFormStatus(`${error.message} Bạn có thể nhắn Zalo hoặc gọi hotline 0941 945 386.`, 'error');
    if (zaloAfterSubmit) zaloAfterSubmit.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove('is-loading');
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();
