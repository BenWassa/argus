(() => {
  'use strict';

  let returnFocus = null;
  let queued = false;
  const observer = new MutationObserver(scheduleEnhance);

  function scheduleEnhance() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      observer.disconnect();
      enhance();
      observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    });
  }

  function replaceIntro(viewId, title, copy) {
    const view = document.getElementById(viewId);
    const old = view?.querySelector(':scope > .section-head');
    if (!old || old.dataset.impeccable) return;
    const intro = document.createElement('div');
    intro.className = 'page-intro';
    intro.dataset.impeccable = 'true';
    intro.innerHTML = `<h1>${title}</h1><p>${copy}</p>`;
    old.replaceWith(intro);
  }

  function enhanceHero() {
    const hero = document.querySelector('#libraryView .hero');
    if (!hero) return;
    if (!hero.dataset.impeccable) {
      hero.dataset.impeccable = 'true';
      hero.innerHTML = `
        <div class="hero-copy">
          <h1>Today’s practice</h1>
          <p id="heroDueCopy">Review what is due, then return to your day.</p>
          <div class="hero-actions">
            <button class="btn primary" id="heroPracticeBtn">Start practice</button>
            <button class="btn ghost" id="heroAddBtn">Create topic</button>
          </div>
        </div>
        <div class="hero-due" aria-live="polite"><strong id="heroDueCount">0</strong><span>ready</span></div>`;
    }
    const ready = Number(document.querySelector('#libraryStats .stat-card:nth-child(3) .value')?.textContent || 0);
    const count = document.getElementById('heroDueCount');
    const copy = document.getElementById('heroDueCopy');
    const action = document.getElementById('heroPracticeBtn');
    if (count) count.textContent = String(ready);
    if (copy) copy.textContent = ready
      ? `${ready} prompt${ready === 1 ? ' is' : 's are'} ready. A focused session takes less than five minutes.`
      : 'Nothing is due. Practise any topic or define the next finite skill.';
    if (action) action.textContent = ready ? 'Start due practice' : 'Choose practice';
  }

  function enhanceHeadings() {
    replaceIntro('practiceView', 'Practice', 'Short retrieval sessions built from what is due.');
    replaceIntro('progressView', 'Progress', 'Finished topics, delayed checks, and retention repair.');
    replaceIntro('dataView', 'Data', 'Local-first storage with a complete portable backup.');

    const libraryHead = document.querySelector('#libraryView .section-head > div');
    if (libraryHead && !libraryHead.dataset.impeccable) {
      libraryHead.dataset.impeccable = 'true';
      libraryHead.innerHTML = '<h2>Your competencies</h2>';
    }

    document.querySelectorAll('.session-top .eyebrow').forEach(label => {
      label.className = 'context-label';
      const heading = label.nextElementSibling;
      if (heading?.matches('h1,h2,h3')) heading.after(label);
    });
    document.querySelectorAll('.sheet-head .eyebrow').forEach(label => {
      label.className = 'context-label';
      const heading = label.nextElementSibling;
      if (heading?.matches('h1,h2,h3')) heading.after(label);
    });
  }

  function enhanceSemantics() {
    const brandCopy = document.querySelector('.brand-copy span');
    if (brandCopy) brandCopy.textContent = 'Closed-scope skill library';
    const add = document.getElementById('quickAddBtn');
    if (add) add.textContent = 'Create topic';

    const search = document.getElementById('topicSearch');
    if (search && !document.querySelector('label[for="topicSearch"]')) {
      const label = document.createElement('label');
      label.className = 'sr-only';
      label.htmlFor = 'topicSearch';
      label.textContent = 'Search topics';
      search.before(label);
    }

    document.querySelectorAll('[data-track-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    });
    document.querySelectorAll('[data-status-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    });
    document.querySelectorAll('[data-practice-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
      if (button.dataset.practiceMode === 'mixed') {
        button.querySelector('strong').textContent = 'Quick session';
        button.querySelector('span').textContent = 'Automatically selects a useful drill from what is available';
      }
    });
    document.querySelectorAll('[data-nav]').forEach(button => {
      if (button.classList.contains('active')) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    document.querySelectorAll('.close-btn').forEach(button => {
      const modal = button.closest('.modal-backdrop');
      button.setAttribute('aria-label', modal?.id === 'topicFormModal' ? 'Close topic editor' : 'Close topic details');
    });

    const empty = document.querySelector('#topicGrid .empty');
    if (empty && empty.textContent.trim() === 'No topics match these filters.') {
      empty.innerHTML = '<strong>No matching topics.</strong><br>Clear a filter or create a closed-scope topic.';
    }
  }

  function sortTopicIndex() {
    const grid = document.getElementById('topicGrid');
    if (!grid || grid.children.length < 2 || grid.querySelector('.empty')) return;
    const cards = [...grid.children];
    const rank = { decayed: 0, learning: 1, drilled: 2, unstarted: 3, completed: 4 };
    const sorted = [...cards].sort((a, b) => {
      const aStatus = [...a.querySelectorAll('.tag')].find(x => x.querySelector('.status-dot'))?.textContent.trim().toLowerCase() || 'unstarted';
      const bStatus = [...b.querySelectorAll('.tag')].find(x => x.querySelector('.status-dot'))?.textContent.trim().toLowerCase() || 'unstarted';
      return (rank[aStatus] ?? 9) - (rank[bStatus] ?? 9) || a.textContent.localeCompare(b.textContent);
    });
    if (sorted.some((node, index) => node !== cards[index])) sorted.forEach(node => grid.append(node));
  }

  function enhanceModals() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      const open = modal.classList.contains('open');
      if (open && modal.dataset.impeccableFocus !== 'true') {
        modal.dataset.impeccableFocus = 'true';
        setTimeout(() => modal.querySelector('button,input,select,textarea,[tabindex]:not([tabindex="-1"])')?.focus(), 0);
      }
      if (!open && modal.dataset.impeccableFocus === 'true') {
        delete modal.dataset.impeccableFocus;
        returnFocus?.focus?.();
        returnFocus = null;
      }
    });
  }

  function enhance() {
    enhanceHero();
    enhanceHeadings();
    enhanceSemantics();
    sortTopicIndex();
    enhanceModals();
  }

  document.addEventListener('click', event => {
    const opener = event.target.closest('#quickAddBtn,#heroAddBtn,[data-topic-id]');
    if (opener) returnFocus = opener;
    scheduleEnhance();
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') scheduleEnhance();
  });

  enhance();
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
})();
