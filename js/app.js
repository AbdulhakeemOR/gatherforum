(() => {
  'use strict';
  const stored = GatherStorage.load();
  const state = {day:1, shortlist:new Set(stored.ids), storageAvailable:stored.available};
  const $ = selector => document.querySelector(selector);
  const dialog = $('#session-dialog');
  let activeSession, opener;
  function renderSchedule() {
    document.querySelectorAll('[role=tab]').forEach(tab => {
      const selected = Number(tab.dataset.day) === state.day;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    $('.tabs').classList.toggle('day-two', state.day === 2);
    for (const day of [1,2]) {
      const panel = $(`#panel-${day}`);
      panel.hidden = state.day !== day;
      panel.replaceChildren(...GATHER_SESSIONS.filter(s => s.day === day).map(session => {
        const button = document.createElement('button');
        button.className = 'session';
        button.innerHTML = `<time datetime="${session.time}">${session.time}</time><span><span class="session-title">${session.title}</span><span class="track">${session.track}</span></span><span class="session-arrow" aria-hidden="true">${state.shortlist.has(session.id) ? '✓' : '↗'}</span>`;
        button.addEventListener('click', () => openSession(session, button));
        return button;
      }));
    }
  }
  function renderShortlist() {
    $('#shortlist-count').textContent = state.shortlist.size;
    $('#empty-shortlist').hidden = state.shortlist.size > 0;
    $('#download').hidden = state.shortlist.size === 0;
    $('#storage-notice').textContent = state.storageAvailable ? 'Saved on this device. No account needed.' : 'Device storage is unavailable. Your shortlist lasts for this visit only.';
    $('#shortlist-items').replaceChildren(...GATHER_SESSIONS.filter(s => state.shortlist.has(s.id)).map(session => {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = session.title;
      const meta = document.createElement('small');
      meta.textContent = `Day ${session.day} · ${session.time}`;
      label.append(meta);
      const remove = document.createElement('button');
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove ${session.title} from shortlist`);
      remove.addEventListener('click', () => {
        const position = [...$('#shortlist-items').children].indexOf(li);
        toggle(session.id);
        const buttons = $('#shortlist-items').querySelectorAll('button');
        (buttons[Math.min(position,buttons.length-1)] || $('#tab-'+state.day)).focus();
      });
      li.append(label, remove);
      return li;
    }));
  }
  function toggle(id) {
    state.shortlist.has(id) ? state.shortlist.delete(id) : state.shortlist.add(id);
    state.storageAvailable = GatherStorage.save(state.shortlist);
    renderShortlist();
    // Keep the opening session button in the DOM so focus returns correctly.
    document.querySelectorAll('.session').forEach(button => {
      const session = GATHER_SESSIONS.find(s => s.title === button.querySelector('.session-title').textContent);
      button.querySelector('.session-arrow').textContent = state.shortlist.has(session.id) ? '✓' : '↗';
    });
    if (activeSession) updateDialogButton();
  }
  function updateDialogButton() {
    const added = state.shortlist.has(activeSession.id);
    $('#toggle-shortlist').textContent = added ? 'Remove from my shortlist' : 'Add to my shortlist';
    $('#toggle-shortlist').setAttribute('aria-pressed', String(added));
  }
  function openSession(session, button) {
    activeSession = session; opener = button;
    $('#dialog-meta').textContent = `DAY 0${session.day} / ${session.time} / ${session.track} / ${session.speaker}`;
    $('#dialog-title').textContent = session.title;
    $('#dialog-description').textContent = session.description;
    updateDialogButton(); dialog.showModal();
  }
  $('.tabs').addEventListener('click', event => {
    const tab = event.target.closest('[role=tab]');
    if (tab) {state.day = Number(tab.dataset.day); renderSchedule();}
  });
  $('.tabs').addEventListener('keydown', event => {
    if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
    event.preventDefault();
    state.day = event.key === 'Home' ? 1 : event.key === 'End' ? 2 : state.day === 1 ? 2 : 1;
    renderSchedule(); $(`#tab-${state.day}`).focus();
  });
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
  dialog.addEventListener('click', event => {if(event.target === dialog) {const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  $('#toggle-shortlist').addEventListener('click', () => toggle(activeSession.id));
  $('#interest-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.name;
    name.setCustomValidity(name.value.trim() ? '' : 'Please enter your name.');
    if (!form.reportValidity()) return;
    const preview = $('#interest-preview');
    preview.replaceChildren();
    const heading = document.createElement('h3'); heading.textContent = 'Your interest preview'; preview.append(heading);
    const selected = GATHER_SESSIONS.filter(s => state.shortlist.has(s.id));
    for (const text of [`${name.value.trim()} · ${form.elements.email.value.trim()}`,form.elements.note.value.trim(),`My shortlist: ${selected.length ? selected.map(s => s.title).join('; ') : 'Still exploring.'}`,'This is a demo. Nothing was sent and you are not registered.']) {
      if (text) {const p=document.createElement('p');p.textContent=text;preview.append(p);}
    }
    preview.hidden = false; preview.focus();
  });
  $('#interest-form').elements.name.addEventListener('input', event => event.target.setCustomValidity(''));
  $('#download').addEventListener('click', () => {
    const text = ['GATHER FORUM — MY SHORTLIST','Fictional workshop · Sample dates: October 1–2 · Venue TBA','',...GATHER_SESSIONS.filter(s => state.shortlist.has(s.id)).map(s => `Day ${s.day} | ${s.time} | ${s.title} | ${s.track}`),'','This is a demo itinerary. You are not registered.'].join('\n');
    const url = URL.createObjectURL(new Blob([text], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');link.href=url;link.download='gather-forum-shortlist.txt';document.body.append(link);link.click();link.remove();setTimeout(() => URL.revokeObjectURL(url),1000);
  });
  renderSchedule(); renderShortlist();
})();
