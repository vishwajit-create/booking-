/* ==========================================
   VISHWAJIT KUMAR PORTFOLIO — app.js
   Dynamic GitHub API integration + UI Logic
   ========================================== */

'use strict';

// ─── Configuration ───────────────────────────────────────────────
const CONFIG = {
  GITHUB_USERNAME: 'vishwajit-create',
  LINKEDIN_URL: 'https://www.linkedin.com/in/vishwajit-kumar-b15285331',
  GITHUB_BASE: 'https://api.github.com',
  TYPEWRITER_STRINGS: [
    'Student Developer 👨‍💻',
    'Python Enthusiast 🐍',
    'Web Developer 🌐',
    'Bot Builder 🤖',
    'Problem Solver 💡',
  ],
  LANG_COLORS: {
    Python: '#3572A5',
    JavaScript: '#f1e05a',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Java: '#b07219',
    TypeScript: '#2b7489',
    'Jupyter Notebook': '#DA5B0B',
    Shell: '#89e051',
    C: '#555555',
    'C++': '#f34b7d',
    Rust: '#dea584',
    Go: '#00ADD8',
    PHP: '#4F5D95',
    Ruby: '#701516',
    default: '#8b949e',
  },
  REPO_ICONS: {
    Python: '🐍',
    JavaScript: '⚡',
    TypeScript: '📘',
    HTML: '🌐',
    CSS: '🎨',
    Java: '☕',
    'Jupyter Notebook': '📊',
    Shell: '🖥️',
    C: '⚙️',
    'C++': '🔧',
    default: '📁',
  },
};

// ─── State ───────────────────────────────────────────────────────
const state = {
  repos: [],
  filteredRepos: [],
  currentFilter: 'all',
  githubUser: null,
  messages: JSON.parse(localStorage.getItem('vk_messages') || '[]'),
};

// ─── DOM Ready ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavbar();
  initMobileMenu();
  initTypewriter();
  initScrollReveal();
  initSkillBars();
  initProjectFilter();
  initContactForm();
  fetchGitHubData();
  animateCounters();
});

// ─── Particles ───────────────────────────────────────────────────
function initParticles() {
  const container = document.getElementById('particles-container');
  if (!container) return;

  const count = window.innerWidth < 768 ? 15 : 30;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * -20;
    const left = Math.random() * 100;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      --duration: ${duration}s;
      --delay: ${delay}s;
      opacity: 0;
    `;
    container.appendChild(p);
  }
}

// ─── Navbar ──────────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    // Scroll class
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active link
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });

  // Smooth nav click
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ─── Mobile Menu ─────────────────────────────────────────────────
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  if (!hamburger) return;

  // Create mobile menu
  const mobileMenu = document.createElement('div');
  mobileMenu.className = 'mobile-menu';
  mobileMenu.innerHTML = `
    <button class="mobile-close" aria-label="Close menu" style="position:absolute;top:24px;right:32px;background:none;border:none;cursor:pointer;color:#94a3b8;font-size:1.5rem;">✕</button>
    <a href="#home">Home</a>
    <a href="#about">About</a>
    <a href="#skills">Skills</a>
    <a href="#projects">Projects</a>
    <a href="#github">GitHub</a>
    <a href="#contact">Contact</a>
  `;
  document.body.appendChild(mobileMenu);

  hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
  mobileMenu.querySelector('.mobile-close').addEventListener('click', () => mobileMenu.classList.remove('open'));

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      mobileMenu.classList.remove('open');
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// ─── Typewriter ──────────────────────────────────────────────────
function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;

  let strIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let isPaused = false;

  function type() {
    const current = CONFIG.TYPEWRITER_STRINGS[strIdx];

    if (isDeleting) {
      el.textContent = current.substring(0, charIdx - 1);
      charIdx--;
    } else {
      el.textContent = current.substring(0, charIdx + 1);
      charIdx++;
    }

    let delay = isDeleting ? 60 : 100;

    if (!isDeleting && charIdx === current.length) {
      delay = 2000;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      strIdx = (strIdx + 1) % CONFIG.TYPEWRITER_STRINGS.length;
      delay = 300;
    }

    setTimeout(type, delay);
  }

  type();
}

// ─── Scroll Reveal ───────────────────────────────────────────────
function initScrollReveal() {
  // Add reveal class to elements
  const targets = [
    '.about-card', '.skill-category', '.contact-card',
    '.contact-form-wrap', '.gh-stat-card', '.github-profile-card',
    '.section-header'
  ];

  targets.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 0.08}s`;
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ─── Skill Bars ──────────────────────────────────────────────────
function initSkillBars() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.skill-fill').forEach(bar => {
          const width = bar.getAttribute('data-width');
          setTimeout(() => {
            bar.style.width = `${width}%`;
          }, 200);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.skill-category').forEach(cat => observer.observe(cat));
}

// ─── Project Filter ──────────────────────────────────────────────
function initProjectFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentFilter = btn.dataset.filter;
      filterProjects();
    });
  });
}

function filterProjects() {
  const filter = state.currentFilter;
  if (filter === 'all') {
    state.filteredRepos = state.repos;
  } else {
    state.filteredRepos = state.repos.filter(repo => {
      const lang = (repo.language || '').toLowerCase();
      return lang.includes(filter);
    });
  }
  renderProjects();
}

// ─── GitHub API ──────────────────────────────────────────────────
async function fetchGitHubData() {
  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`${CONFIG.GITHUB_BASE}/users/${CONFIG.GITHUB_USERNAME}`),
      fetch(`${CONFIG.GITHUB_BASE}/users/${CONFIG.GITHUB_USERNAME}/repos?sort=updated&per_page=30`)
    ]);

    if (userRes.ok) {
      const user = await userRes.json();
      state.githubUser = user;
      updateGitHubProfile(user);
    } else {
      console.warn('GitHub user not found. Showing placeholder content.');
      showPlaceholderProjects();
    }

    if (reposRes.ok) {
      const repos = await reposRes.json();
      // Calculate total stars
      const totalStars = repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0);
      if (document.getElementById('gh-stars')) {
        document.getElementById('gh-stars').textContent = totalStars;
      }
      state.repos = repos;
      state.filteredRepos = repos;
      renderProjects();
    } else {
      showPlaceholderProjects();
    }
  } catch (err) {
    console.error('GitHub fetch error:', err);
    showPlaceholderProjects();
  }
}

function updateGitHubProfile(user) {
  // Hero stats
  animateNumber(document.querySelector('#stat-repos .stat-number'), user.public_repos || 0);
  animateNumber(document.querySelector('#stat-followers .stat-number'), user.followers || 0);

  // GitHub section
  const fields = {
    'gh-name': user.name || user.login || 'Vishwajit Kumar',
    'gh-bio': user.bio || 'Student Developer | Python | SQL | Web',
    'gh-repos': user.public_repos || 0,
    'gh-followers': user.followers || 0,
    'gh-following': user.following || 0,
  };

  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });

  const ghLink = document.getElementById('gh-link');
  if (ghLink) ghLink.href = user.html_url;

  // Avatars
  if (user.avatar_url) {
    loadAvatarImage('#github-avatar', '.avatar-placeholder', user.avatar_url);
    loadAvatarImage('#gh-profile-avatar', '.gh-avatar-placeholder', user.avatar_url);
  }

  // Email
  if (user.email) {
    const emailEl = document.getElementById('contact-email');
    if (emailEl) {
      emailEl.textContent = user.email;
      emailEl.href = `mailto:${user.email}`;
    }
  }
}

function loadAvatarImage(imgSelector, placeholderSelector, src) {
  const img = document.querySelector(imgSelector);
  if (!img) return;
  img.onload = () => {
    img.classList.add('loaded');
    const placeholder = document.querySelector(placeholderSelector);
    if (placeholder) placeholder.style.display = 'none';
  };
  img.onerror = () => {
    img.style.display = 'none';
  };
  img.src = src;
}

// ─── Render Projects ─────────────────────────────────────────────
function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const repos = state.filteredRepos.filter(r => !r.fork);

  if (repos.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p>No repositories found for this filter.</p>
      </div>`;
    return;
  }

  const display = repos.slice(0, 9);

  display.forEach((repo, idx) => {
    const card = createProjectCard(repo, idx);
    grid.appendChild(card);
  });
}

function createProjectCard(repo, idx) {
  const lang = repo.language || 'Unknown';
  const color = CONFIG.LANG_COLORS[lang] || CONFIG.LANG_COLORS.default;
  const icon = CONFIG.REPO_ICONS[lang] || CONFIG.REPO_ICONS.default;
  const desc = repo.description || 'No description provided.';
  const topics = repo.topics || [];

  const card = document.createElement('div');
  card.className = 'project-card';
  card.style.animationDelay = `${idx * 0.06}s`;
  card.dataset.lang = lang.toLowerCase();

  card.innerHTML = `
    <div class="project-header">
      <div class="project-icon">${icon}</div>
      <div class="project-links">
        <a href="${repo.html_url}" target="_blank" rel="noopener" class="project-link" title="GitHub Repository" aria-label="GitHub">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
        ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" rel="noopener" class="project-link" title="Live Demo" aria-label="Live Demo">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>` : ''}
      </div>
    </div>
    <div class="project-name">${escapeHTML(repo.name.replace(/-/g, ' ').replace(/_/g, ' '))}</div>
    <div class="project-desc">${escapeHTML(desc.substring(0, 120))}${desc.length > 120 ? '...' : ''}</div>
    <div class="project-meta">
      ${lang !== 'Unknown' ? `
        <div class="project-lang">
          <div class="lang-dot" style="background:${color}"></div>
          <span>${lang}</span>
        </div>` : ''}
      ${repo.stargazers_count > 0 ? `
        <div class="project-stars">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>${repo.stargazers_count}</span>
        </div>` : ''}
      ${repo.forks_count > 0 ? `
        <div class="project-forks">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
          <span>${repo.forks_count}</span>
        </div>` : ''}
    </div>
    ${topics.length > 0 ? `
    <div class="project-tags">
      ${topics.slice(0, 4).map(t => `<span class="project-tag">${escapeHTML(t)}</span>`).join('')}
    </div>` : ''}
  `;

  return card;
}

// ─── Placeholder Projects (when GitHub is unavailable) ───────────
function showPlaceholderProjects() {
  const placeholders = [
    {
      name: 'Urban-hair-plaza-website',
      description: 'Urban Hair Plaza — a full salon website with modern UI, built with HTML/CSS/JS.',
      language: 'HTML',
      html_url: 'https://github.com/vishwajit-create/Urban-hair-plaza-website-',
      stargazers_count: 0, forks_count: 0,
      topics: ['html', 'css', 'salon', 'website'], homepage: null, fork: false,
    },
    {
      name: 'urban-hairplaza',
      description: 'Urban Hair Plaza — a responsive hair salon booking and services platform.',
      language: 'HTML',
      html_url: 'https://github.com/vishwajit-create/urban-hairplaza',
      stargazers_count: 0, forks_count: 0,
      topics: ['html', 'css', 'booking'], homepage: null, fork: false,
    },
    {
      name: 'monitor-website',
      description: 'A Python bot which pings websites to keep them alive and stop from sleeping on Railway or Render.',
      language: 'Python',
      html_url: 'https://github.com/vishwajit-create/monitor-website',
      stargazers_count: 0, forks_count: 0,
      topics: ['python', 'bot', 'automation'], homepage: null, fork: false,
    },
    {
      name: 'kshitij-sonal-website',
      description: 'Personal academic website for Kshitij Sonal — Researcher & Economist. Built with Node.js + Express.',
      language: 'JavaScript',
      html_url: 'https://github.com/vishwajit-create/kshitij-sonal-website',
      stargazers_count: 0,
      forks_count: 0,
      topics: ['nodejs', 'express', 'website'],
      homepage: null,
      fork: false,
    },
    {
      name: 'Blogspot',
      description: 'A blog web application with a live demo deployed on Vercel.',
      language: 'HTML',
      html_url: 'https://github.com/vishwajit-create/Blogspot',
      stargazers_count: 0,
      forks_count: 0,
      topics: ['html', 'blog', 'vercel'],
      homepage: 'https://project-4tmsy.vercel.app',
      fork: false,
    },
    {
      name: 'hairsalonapp',
      description: 'A full-featured hair salon booking application built with TypeScript, deployed on Vercel.',
      language: 'TypeScript',
      html_url: 'https://github.com/vishwajit-create/hairsalonapp',
      stargazers_count: 0,
      forks_count: 0,
      topics: ['typescript', 'booking', 'vercel'],
      homepage: 'https://hairsalonapp-puce.vercel.app',
      fork: false,
    },
  ];

  state.repos = placeholders;
  state.filteredRepos = placeholders;
  renderProjects();
}

// ─── Animate Counters ────────────────────────────────────────────
function animateCounters() {
  // will be triggered by animateNumber when GitHub data loads
}

function animateNumber(el, target) {
  if (!el) return;
  const start = 0;
  const duration = 1500;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    el.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ─── Contact Form (localStorage as DB) ──────────────────────────
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btnText = document.getElementById('send-btn-text');
    const spinner = document.getElementById('send-spinner');
    const success = document.getElementById('form-success');

    // Show loading
    if (btnText) btnText.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');

    // Simulate async save
    setTimeout(() => {
      const message = {
        id: Date.now(),
        name: form.name.value,
        email: form.email.value,
        subject: form.subject.value,
        message: form.message.value,
        timestamp: new Date().toISOString(),
      };

      // Save to localStorage (acts as simple DB)
      state.messages.push(message);
      localStorage.setItem('vk_messages', JSON.stringify(state.messages));

      // Reset
      if (btnText) btnText.classList.remove('hidden');
      if (spinner) spinner.classList.add('hidden');
      if (success) success.classList.remove('hidden');
      form.reset();

      setTimeout(() => {
        if (success) success.classList.add('hidden');
      }, 5000);
    }, 1000);
  });
}

// ─── Utilities ───────────────────────────────────────────────────
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
