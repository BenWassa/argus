(() => {
  'use strict';

  const NATO = {
    A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot',
    G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima',
    M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo',
    S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray',
    Y: 'Yankee', Z: 'Zulu'
  };
  const NATO_REVERSE = Object.fromEntries(
    Object.entries(NATO).map(([letter, word]) => [normaliseNato(word), letter])
  );

  let queued = false;
  let bypass = false;
  const observer = new MutationObserver(schedule);

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      observer.disconnect();
      enhance();
      observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    });
  }

  function normaliseNato(value = '') {
    return String(value).trim().toLowerCase().replace(/[–—]/g, '-').replace(/[^a-z-]/g, '');
  }

  function escapeSelector(value) {
    return globalThis.CSS?.escape ? CSS.escape(value) : String(value).replace(/["\\]/g, '\\$&');
  }

  function clickThrough(element) {
    if (!element) return;
    bypass = true;
    element.click();
    bypass = false;
  }

  function enhanceEntryPoints() {
    const heroAction = document.getElementById('heroPracticeBtn');
    if (heroAction) heroAction.textContent = 'Start due recall';
    const heroCopy = document.getElementById('heroDueCopy');
    if (heroCopy) {
      const ready = Number(document.getElementById('heroDueCount')?.textContent || 0);
      heroCopy.textContent = ready
        ? `${ready} prompt${ready === 1 ? ' is' : 's are'} ready. Five cards, two taps each.`
        : 'Nothing is due. Run a five-card recall set or choose a topic below.';
    }

    const practiceIntro = document.querySelector('#practiceView .page-intro p');
    if (practiceIntro) practiceIntro.textContent = 'Fast retrieval with no typing unless the drill requires it.';

    const length = document.getElementById('sessionLength');
    if (length && !length.dataset.fastDefault) {
      length.value = '5';
      length.dataset.fastDefault = 'true';
    }

    const mixed = document.querySelector('[data-practice-mode="mixed"]');
    if (mixed) {
      mixed.querySelector('strong').textContent = 'Random drill';
      mixed.querySelector('span').textContent = 'Chooses one available drill type';
    }
    const recall = document.querySelector('[data-practice-mode="recall"]');
    if (recall) {
      recall.querySelector('strong').textContent = 'Rapid recall';
      recall.querySelector('span').textContent = 'Tap to reveal, then Got it or Didn’t';
    }

    const modes = document.getElementById('practiceModes');
    const lengthRow = length?.closest('.form-row');
    const begin = document.getElementById('beginSessionBtn');
    if (begin) begin.textContent = 'Start selected session';
    if (modes && lengthRow && !document.querySelector('#practiceIntro .session-options')) {
      const details = document.createElement('details');
      details.className = 'session-options';
      const summary = document.createElement('summary');
      summary.textContent = 'Session options';
      details.append(summary, modes, lengthRow);
      begin?.before(details);
    }
  }

  function enhanceTopicActions() {
    document.querySelectorAll('#topicGrid > .topic-card').forEach(card => {
      const row = document.createElement('div');
      row.className = 'topic-action-row';
      card.before(row);
      row.append(card);

      const quick = document.createElement('button');
      quick.type = 'button';
      quick.className = 'topic-quick-practice';
      quick.dataset.fastPractice = card.dataset.topicId;
      const title = card.querySelector('.topic-title')?.textContent.trim() || 'topic';
      quick.setAttribute('aria-label', `Practise ${title}`);
      quick.title = `Practise ${title}`;
      quick.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7.5v9l7-4.5-7-4.5Z" fill="currentColor"/></svg>';
      row.append(quick);

      if (/NATO phonetic alphabet/i.test(title)) {
        const scope = card.querySelector('.topic-scope');
        if (scope) scope.textContent = '26 letters, always prompted letter first.';
      }
    });
  }

  function getFeedbackAnswer(feedback) {
    if (!feedback) return '';
    const clone = feedback.cloneNode(true);
    clone.querySelector('strong')?.remove();
    clone.querySelectorAll('div').forEach(node => node.remove());
    clone.querySelectorAll('br').forEach(node => node.replaceWith('\n'));
    return clone.textContent.split('\n').map(part => part.trim()).find(Boolean) || '';
  }

  function getNatoPair(topicName, prompt, expected) {
    if (!/NATO phonetic alphabet/i.test(topicName)) return null;
    const promptValue = String(prompt).trim();
    const expectedValue = String(expected).trim();
    let letter = /^[A-Z]$/i.test(promptValue) ? promptValue.toUpperCase() : NATO_REVERSE[normaliseNato(promptValue)];
    if (!letter) letter = /^[A-Z]$/i.test(expectedValue) ? expectedValue.toUpperCase() : NATO_REVERSE[normaliseNato(expectedValue)];
    return letter && NATO[letter] ? { front: letter, back: NATO[letter] } : null;
  }

  function enhanceRecall() {
    const stage = document.getElementById('recallStage');
    if (!stage?.classList.contains('active') || stage.querySelector('.rapid-recall')) return;
    const promptElement = stage.querySelector('.prompt-text');
    const form = stage.querySelector('#recallForm');
    const feedback = stage.querySelector('#answerFeedback');
    const rating = stage.querySelector('#ratingRow');
    if (!promptElement || !form || !feedback || !rating) return;

    const topicName = stage.querySelector('.session-top .context-label, .session-top .eyebrow')?.textContent.trim() || 'Recall';
    const originalPrompt = promptElement.textContent.trim();
    const initialNato = getNatoPair(topicName, originalPrompt, '');
    const front = initialNato?.front || originalPrompt;

    [stage.querySelector('.prompt-label'), promptElement, form, feedback, rating].forEach(element => {
      if (!element) return;
      element.classList.add('rapid-recall-source');
      element.setAttribute('aria-hidden', 'true');
    });

    const shell = document.createElement('div');
    shell.className = 'rapid-recall';
    shell.classList.toggle('long-prompt', front.length > 12);
    shell.innerHTML = `
      <button class="recall-flip-card" type="button" aria-label="Reveal answer" aria-expanded="false">
        <span class="recall-flip-inner">
          <span class="recall-face recall-front">
            <span class="recall-instruction">Tap to reveal</span>
            <strong>${front}</strong>
          </span>
          <span class="recall-face recall-back" aria-live="polite">
            <span class="recall-instruction">Answer</span>
            <strong></strong>
          </span>
        </span>
      </button>
      <div class="recall-score-row" aria-label="Score your recall">
        <button class="recall-score miss" type="button" data-quality="1">Didn’t get it</button>
        <button class="recall-score got" type="button" data-quality="4">Got it</button>
      </div>
      <p class="recall-shortcuts">Tap card · swipe left/right · or use ←/→</p>`;

    stage.querySelector('.session-progress')?.after(shell);
    const card = shell.querySelector('.recall-flip-card');
    const back = shell.querySelector('.recall-back strong');
    const scoreRow = shell.querySelector('.recall-score-row');
    let revealed = false;
    let pointerStart = null;

    function reveal() {
      if (revealed) return;
      revealed = true;
      form.requestSubmit();
      const expected = getFeedbackAnswer(feedback);
      const nato = getNatoPair(topicName, originalPrompt, expected);
      back.textContent = nato?.back || expected || 'Review the reference answer';
      shell.classList.toggle('long-answer', back.textContent.length > 24);
      card.classList.add('revealed');
      card.setAttribute('aria-label', `Answer: ${back.textContent}`);
      card.setAttribute('aria-expanded', 'true');
      scoreRow.classList.add('show');
      navigator.vibrate?.(8);
      setTimeout(() => scoreRow.querySelector('.got')?.focus({ preventScroll: true }), 180);
    }

    card.addEventListener('click', reveal);
    card.addEventListener('pointerdown', event => { pointerStart = event.clientX; });
    card.addEventListener('pointerup', event => {
      if (!revealed || pointerStart === null) return;
      const delta = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(delta) < 60) return;
      shell.querySelector(delta > 0 ? '.recall-score.got' : '.recall-score.miss')?.click();
    });
    setTimeout(() => card.focus({ preventScroll: true }), 80);
  }

  function enhanceNatoDetail() {
    const detail = document.querySelector('#topicDetailModal.open');
    const title = detail?.querySelector('.sheet-head h2, .sheet-head h3')?.textContent || '';
    if (!/NATO phonetic alphabet/i.test(title)) return;
    const scope = detail.querySelector('.detail-scope');
    if (scope) scope.textContent = '26 letters, always prompted letter first. Tap each card to reveal the code word.';
  }

  function launchTopic(topicId) {
    const card = document.querySelector(`.topic-card[data-topic-id="${escapeSelector(topicId)}"]`);
    if (!card) return;
    clickThrough(card);
    clickThrough(document.querySelector(`[data-practice-topic="${escapeSelector(topicId)}"]`));
  }

  function startQuickRecall() {
    const practiceViewActive = document.getElementById('practiceView')?.classList.contains('active');
    const activeStage = document.querySelector('#practiceView .practice-stage.active');
    if (practiceViewActive && activeStage && activeStage.id !== 'practiceIntro') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    clickThrough(document.querySelector('[data-nav="practice"]'));
    clickThrough(document.querySelector('[data-practice-mode="recall"]'));
    const length = document.getElementById('sessionLength');
    if (length) length.value = '5';
    clickThrough(document.getElementById('beginSessionBtn'));
  }

  function enhance() {
    enhanceEntryPoints();
    enhanceTopicActions();
    enhanceRecall();
    enhanceNatoDetail();
  }

  document.addEventListener('click', event => {
    if (bypass) return;

    const quick = event.target.closest('[data-fast-practice]');
    if (quick) {
      event.preventDefault();
      event.stopImmediatePropagation();
      launchTopic(quick.dataset.fastPractice);
      return;
    }

    if (event.target.closest('#heroPracticeBtn, [data-nav="practice"]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      startQuickRecall();
      return;
    }

    const score = event.target.closest('.recall-score');
    if (score) navigator.vibrate?.(score.classList.contains('got') ? 12 : [12, 30, 12]);
    schedule();
  }, true);

  document.addEventListener('keydown', event => {
    const rapid = document.querySelector('#recallStage.active .rapid-recall');
    if (!rapid || event.target.matches('input,textarea,select')) return;
    const card = rapid.querySelector('.recall-flip-card');
    const revealed = card?.classList.contains('revealed');
    if (!revealed && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault();
      card.click();
    } else if (revealed && (event.key === 'ArrowLeft' || event.key === '1')) {
      event.preventDefault();
      rapid.querySelector('.recall-score.miss')?.click();
    } else if (revealed && (event.key === 'ArrowRight' || event.key === '2')) {
      event.preventDefault();
      rapid.querySelector('.recall-score.got')?.click();
    }
  });

  enhance();
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
})();
