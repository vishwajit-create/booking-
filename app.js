'use strict';

// ─── Config ──────────────────────────────────────────────────────
const CONFIG = {
  GITHUB_USERNAME: 'vishwajit-create',
  GITHUB_BASE: 'https://api.github.com',
  TYPEWRITER_STRINGS: [
    'Student Developer 👨‍💻',
    'Python Bot Builder 🤖',
    'Web Developer 🌐',
    'SQL Enthusiast 🗄️',
    'Open Source Contributor 💡',
  ],
  LANG_COLORS: {
    Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#2b7489',
    HTML: '#e34c26', CSS: '#563d7c', 'Jupyter Notebook': '#DA5B0B',
    Shell: '#89e051', default: '#8b949e',
  },
  REPO_ICONS: {
    Python: '🐍', JavaScript: '⚡', TypeScript: '📘',
    HTML: '🌐', CSS: '🎨', 'Jupyter Notebook': '📊', default: '📁',
  },
};

const state = {
  repos: [], filteredRepos: [], filter: 'all',
  messages: JSON.parse(localStorage.getItem('vk_msgs') || '[]'),
};

// ─── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initIntro();
  initScrollProgress();
  initNavCanvas();
  initNavbar();
  initMobileMenu();
  initTypewriter();
  initReveal();
  initSkillRings();
  initProjectFilter();
  initContactForm();
  fetchGitHub();
});

// ─── INTRO ANIMATION ─────────────────────────────────────────────
function initIntro() {
  const overlay = document.getElementById('intro-overlay');
  const canvas = document.getElementById('intro-canvas');
  const skip = document.getElementById('skip-intro');
  if (!overlay || !canvas) return;

  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  let animId;

  // Particles for intro
  const pts = Array.from({ length: 80 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
    r: Math.random() * 2 + 0.5,
  }));

  function drawIntro() {
    ctx.clearRect(0, 0, W, H);

    // Draw connections
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(59,130,246,${0.15 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
      pts[i].x += pts[i].vx;
      pts[i].y += pts[i].vy;
      if (pts[i].x < 0 || pts[i].x > W) pts[i].vx *= -1;
      if (pts[i].y < 0 || pts[i].y > H) pts[i].vy *= -1;

      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59,130,246,0.5)';
      ctx.fill();
    }
    animId = requestAnimationFrame(drawIntro);
  }

  drawIntro();

  function dismiss() {
    cancelAnimationFrame(animId);
    overlay.classList.add('fade-out');
    setTimeout(() => { overlay.style.display = 'none'; }, 900);
  }

  skip.addEventListener('click', dismiss);
  setTimeout(dismiss, 3200);

  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });
}

// ─── NEURAL NETWORK BACKGROUND CANVAS ────────────────────────────
function initNavCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pts, animId;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    const count = Math.floor((W * H) / 15000);
    pts = Array.from({ length: Math.min(count, 100) }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));
  }

  resize();
  window.addEventListener('resize', resize);

  let mx = -9999, my = -9999;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];

      // Mouse repulsion
      const dmx = p.x - mx, dmy = p.y - my;
      const dm = Math.sqrt(dmx * dmx + dmy * dmy);
      if (dm < 100) {
        p.x += (dmx / dm) * 0.5;
        p.y += (dmy / dm) * 0.5;
      }

      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const alpha = 0.12 * (1 - dist / 150);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59,130,246,0.35)';
      ctx.fill();
    }
    animId = requestAnimationFrame(draw);
  }

  draw();
}

// ─── SCROLL PROGRESS BAR ─────────────────────────────────────────
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    bar.style.width = `${Math.min(pct * 100, 100)}%`;
  }, { passive: true });
}

// ─── NAVBAR ──────────────────────────────────────────────────────
function initNavbar() {
  const nav = document.getElementById('navbar');
  const links = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);

    let curr = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 100) curr = s.id;
    });
    links.forEach(l => {
      l.style.color = l.getAttribute('href') === `#${curr}` ? 'var(--blue)' : '';
    });
  }, { passive: true });

  links.forEach(l => l.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(l.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  }));

  // Theme toggle (placeholder – toggles a class)
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    document.body.classList.toggle('light');
  });
}

// ─── MOBILE MENU ─────────────────────────────────────────────────
function initMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const open = document.getElementById('hamburger');
  const close = document.getElementById('close-menu');
  if (!menu) return;
  open?.addEventListener('click', () => menu.classList.add('open'));
  close?.addEventListener('click', () => menu.classList.remove('open'));
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      menu.classList.remove('open');
      document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// ─── TYPEWRITER ──────────────────────────────────────────────────
function initTypewriter() {
  const el = document.getElementById('tw-text');
  if (!el) return;
  let si = 0, ci = 0, del = false;

  (function type() {
    const str = CONFIG.TYPEWRITER_STRINGS[si];
    el.textContent = del ? str.slice(0, ci - 1) : str.slice(0, ci + 1);
    del ? ci-- : ci++;
    let wait = del ? 55 : 95;
    if (!del && ci === str.length) { wait = 2200; del = true; }
    else if (del && ci === 0) { del = false; si = (si + 1) % CONFIG.TYPEWRITER_STRINGS.length; wait = 300; }
    setTimeout(type, wait);
  })();
}

// ─── SCROLL REVEAL ───────────────────────────────────────────────
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal-up').forEach(el => obs.observe(el));
}

// ─── SKILL RINGS ─────────────────────────────────────────────────
function initSkillRings() {
  const circum = 2 * Math.PI * 44; // r=44

  const gradMap = ['url(#grad0)','url(#grad1)','url(#grad2)','url(#grad3)','url(#grad4)','url(#grad5)'];

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const card = entry.target;
      const fills = card.querySelectorAll('.ring-fill');
      fills.forEach((fill, i) => {
        const pct = parseInt(fill.getAttribute('data-pct') || '0');
        const grad = gradMap[Array.from(card.closest('.skill-rings-grid')?.children || []).indexOf(card)] || gradMap[0];
        fill.style.stroke = grad;
        const offset = circum - (pct / 100) * circum;
        setTimeout(() => { fill.style.strokeDashoffset = offset; }, 100);
      });
      obs.unobserve(card);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.skill-ring-card').forEach(c => obs.observe(c));
}

// ─── PROJECT FILTER ──────────────────────────────────────────────
function initProjectFilter() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      state.filteredRepos = state.filter === 'all'
        ? state.repos
        : state.repos.filter(r => (r.language || '').toLowerCase().includes(state.filter));
      renderProjects();
    });
  });
}

// ─── GITHUB FETCH ────────────────────────────────────────────────
async function fetchGitHub() {
  try {
    const [uRes, rRes] = await Promise.all([
      fetch(`${CONFIG.GITHUB_BASE}/users/${CONFIG.GITHUB_USERNAME}`),
      fetch(`${CONFIG.GITHUB_BASE}/users/${CONFIG.GITHUB_USERNAME}/repos?sort=updated&per_page=30`),
    ]);

    if (uRes.ok) {
      const u = await uRes.json();
      populateProfile(u);
    }

    if (rRes.ok) {
      const repos = await rRes.json();
      const stars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
      setText('gh-stars', stars);
      state.repos = repos;
      state.filteredRepos = repos;
      renderProjects();
    } else {
      fallbackProjects();
    }
  } catch (e) {
    console.warn('GitHub fetch failed, showing fallback data');
    fallbackProjects();
  }
}

function populateProfile(u) {
  setText('gh-name', u.name || u.login || 'Vishwajit Kumar');
  setText('gh-bio', u.bio || 'Student Developer | Python | Web | SQL');
  setText('gh-repos', u.public_repos || 8);
  setText('about-repos', u.public_repos || 8);
  setText('gh-followers', u.followers || 0);
  setText('about-followers', u.followers || 0);
  setText('gh-following', u.following || 1);
  const ghLink = document.getElementById('gh-link');
  if (ghLink) ghLink.href = u.html_url;
  if (u.email) {
    const els = ['hero-email-link', 'contact-email-link'];
    els.forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.href = `mailto:${u.email}`; el.textContent = u.email; }
    });
  }
  if (u.avatar_url) {
    ['gh-avatar', 'gh-stats-avatar'].forEach(id => {
      const img = document.getElementById(id);
      if (img) { img.src = u.avatar_url; }
    });
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── RENDER PROJECTS ─────────────────────────────────────────────
function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const list = state.filteredRepos.filter(r => !r.fork);

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-emoji">🔍</div><p>No repos for this filter.</p></div>`;
    return;
  }

  list.slice(0, 9).forEach((repo, i) => {
    const card = makeCard(repo, i);
    grid.appendChild(card);
  });
}

function makeCard(repo, idx) {
  const lang = repo.language || 'Unknown';
  const color = CONFIG.LANG_COLORS[lang] || CONFIG.LANG_COLORS.default;
  const icon = CONFIG.REPO_ICONS[lang] || CONFIG.REPO_ICONS.default;
  const desc = repo.description || 'No description provided.';
  const topics = repo.topics || [];

  const card = document.createElement('div');
  card.className = 'project-card';
  card.style.animationDelay = `${idx * 0.06}s`;

  card.innerHTML = `
    <div class="proj-header">
      <span class="proj-icon">${icon}</span>
      <div class="proj-links">
        <a href="${repo.html_url}" target="_blank" rel="noopener" class="proj-link" title="GitHub">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
        ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" rel="noopener" class="proj-link" title="Live Demo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>` : ''}
      </div>
    </div>
    <div class="proj-name">${esc(repo.name.replace(/[-_]/g, ' '))}</div>
    <div class="proj-desc">${esc(desc.slice(0, 120))}${desc.length > 120 ? '…' : ''}</div>
    <div class="proj-meta">
      ${lang !== 'Unknown' ? `<div class="proj-lang"><div class="lang-dot" style="background:${color}"></div>${lang}</div>` : ''}
      ${repo.stargazers_count ? `<div class="proj-stars"><svg viewBox="0 0 24 24" fill="#f59e0b" width="13" height="13"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${repo.stargazers_count}</div>` : ''}
    </div>
    ${topics.length ? `<div class="proj-tag-list">${topics.slice(0, 4).map(t => `<span class="proj-tag">${esc(t)}</span>`).join('')}</div>` : ''}
  `;

  return card;
}

// ─── FALLBACK PROJECTS ───────────────────────────────────────────
function fallbackProjects() {
  state.repos = [
    { name: 'Urban-hair-plaza-website', description: 'Urban Hair Plaza — full salon website with modern UI built with HTML/CSS/JS.', language: 'HTML', html_url: 'https://github.com/vishwajit-create/Urban-hair-plaza-website-', stargazers_count: 0, forks_count: 0, topics: ['html','css','salon'], homepage: null, fork: false },
    { name: 'urban-hairplaza', description: 'Urban Hair Plaza — responsive hair salon booking and services platform.', language: 'HTML', html_url: 'https://github.com/vishwajit-create/urban-hairplaza', stargazers_count: 0, forks_count: 0, topics: ['html','booking'], homepage: null, fork: false },
    { name: 'monitor-website', description: 'Python bot that pings websites to keep them alive on Railway or Render — prevents sleeping.', language: 'Python', html_url: 'https://github.com/vishwajit-create/monitor-website', stargazers_count: 0, forks_count: 0, topics: ['python','bot','automation'], homepage: null, fork: false },
    { name: 'kshitij-sonal-website', description: 'Personal academic website for Kshitij Sonal — Researcher & Economist. Built with Node.js + Express.', language: 'JavaScript', html_url: 'https://github.com/vishwajit-create/kshitij-sonal-website', stargazers_count: 0, forks_count: 0, topics: ['nodejs','express'], homepage: null, fork: false },
    { name: 'Blogspot', description: 'Blog web application with live demo deployed on Vercel.', language: 'HTML', html_url: 'https://github.com/vishwajit-create/Blogspot', stargazers_count: 0, forks_count: 0, topics: ['html','blog','vercel'], homepage: 'https://project-4tmsy.vercel.app', fork: false },
    { name: 'hairsalonapp', description: 'Full-featured hair salon booking application built with TypeScript, deployed on Vercel.', language: 'TypeScript', html_url: 'https://github.com/vishwajit-create/hairsalonapp', stargazers_count: 0, forks_count: 0, topics: ['typescript','booking','vercel'], homepage: 'https://hairsalonapp-puce.vercel.app', fork: false },
    { name: 'UHP-Project', description: 'Urban Hair Plaza project — core backend and business logic.', language: 'JavaScript', html_url: 'https://github.com/vishwajit-create/UHP-Project', stargazers_count: 0, forks_count: 0, topics: ['javascript'], homepage: null, fork: false },
  ];
  state.filteredRepos = state.repos;
  renderProjects();
}

// ─── CONTACT FORM ────────────────────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btnText = document.getElementById('send-text');
    const spin = document.getElementById('send-spin');
    const success = document.getElementById('form-success');

    btnText?.classList.add('hidden');
    spin?.classList.remove('hidden');

    setTimeout(() => {
      const msg = {
        id: Date.now(),
        name: form.name.value,
        email: form.email.value,
        subject: form.subject.value,
        message: form.message.value,
        timestamp: new Date().toISOString(),
      };
      state.messages.push(msg);
      localStorage.setItem('vk_msgs', JSON.stringify(state.messages));

      btnText?.classList.remove('hidden');
      spin?.classList.add('hidden');
      success?.classList.remove('hidden');
      form.reset();
      setTimeout(() => success?.classList.add('hidden'), 5000);
    }, 1000);
  });
}

// ─── UTILS ───────────────────────────────────────────────────────
function esc(s = '') {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
