'use strict';

/* ---------- data ---------- */

const STD_NOTES = ['s', 'r', 'g', 'm', 'p', 'd', 'n', 'S'];

const STANDARD_PRACTISES = {
    'SV1. Simple ascent / descent': 's r g m p d n S S n d p m g r s',
    'SV2. Focus on R and N': 's r s r s r g m s r g m p d n S S n S n S n d p S n d p m g r s',
    'SV3 – Focus on G and D': 's r g s r g s r s r g m p d n S S n d S n d S n S n d p m g r s',
    'SV4 – Focus on M and P': 's r g m s r g m s r g m p d n s S n d p S n d p S n d p m g r s',
    'SV5 – Focus on P and M and R, N': 's r g m p s r s r g m p d n S S n d p m S n S n d p m g r s',
    'SV6 – Focus on G and D': 's r g m p d s r s r g m p d n S S n d p m g S n S n d p m g r s',
    'SV7 – Focus on N and R': 's r g m p d n , s r g m p d n S S n d p m g r , S n d p m g r s',
    'SV8 – Focus on “pmgr” and “mpdn”': 's r g m p m g r s r g m p d n S S n d p m p d n S n d p m g r s',
    'SV9 – Focus on “pmdp” and “mpgm”': 's r g m p m d p s r g m p d n S S n d p m p g m S n d p m g r s',
    'SV10 – Focus on P and b/w G, N': 's r g m p , g m p , , , p , , , g m p d n d p m g m p – g m g r s',
};

/* ---------- icons (Font Awesome 6 free, CC BY 4.0) ---------- */

const ICONS = {
    play: '<svg viewBox="0 0 384 512"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>',
    pause: '<svg viewBox="0 0 320 512"><path d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z"/></svg>',
    restart: '<svg viewBox="0 0 512 512"><path d="M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z"/></svg>',
    repeat: '<svg viewBox="0 0 512 512"><path d="M0 224c0 17.7 14.3 32 32 32s32-14.3 32-32c0-53 43-96 96-96H320v32c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-9.2-9.2-22.9-11.9-34.9-6.9S320 19.1 320 32V64H160C71.6 64 0 135.6 0 224zm512 64c0-17.7-14.3-32-32-32s-32 14.3-32 32c0 53-43 96-96 96H192V352c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V448H352c88.4 0 160-71.6 160-160z"/></svg>',
    close: '<svg viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/></svg>',
};

/* ---------- tiny DOM helper ---------- */

function el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') e.className = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v);
    }
    for (const c of children) e.append(c);
    return e;
}

const iconBtn = (cls, icon, title, onclick) =>
    el('button', { class: 'btn ' + cls, html: ICONS[icon], title, 'aria-label': title, onclick });

/* ---------- player ---------- */

const MIN_WAIT = 250, WAIT_STEP = 250;
let savedWait = 1000; // remembered across mode switches
const DELAYS = [0, 3, 5]; // start-delay choices, seconds
let savedDelay = 0;    // remembered across mode switches

/**
 * Creates a player for the given notes. An empty list means random notes forever.
 * Returns { root, destroy }.
 */
function createPlayer(notes) {
    const random = notes.length === 0;

    let idx = 0;          // index of the note currently shown
    let started = false;  // has the first note been shown?
    let timer = null;
    let countdown = null; // interval id while counting down to start
    let noteStart = 0;    // timestamp when current note began
    let elapsedOnPause = 0;
    let repeat = false;
    let finished = false; // reached the end of a non-repeating sequence
    let upcoming = random ? [randomNote(), randomNote()] : null;

    function randomNote() { return STD_NOTES[Math.floor(Math.random() * STD_NOTES.length)]; }
    function noteAt(i) {
        if (random) return upcoming[i - idx];
        return i < notes.length ? notes[i] : null;
    }

    // DOM
    const noteEl = el('div', { class: 'note' });
    const nextEl = el('b', { class: 'next' });
    const noteRow = el('div', { class: 'note-row' },
        noteEl, el('div', { class: 'next-box' }, el('small', {}, 'next'), nextEl));
    const bigPlay = iconBtn('big-btn', 'play', 'Play', play);
    const stage = el('div', { class: 'note-holder note-stage' }, bigPlay);

    const bar = el('div', { class: 'progress-bar' });
    const track = el('div', { class: 'progress-track' }, bar);

    const playPause = iconBtn('small-btn', 'play', 'Play', () => (timer || countdown ? pause() : play()));
    const restartBtn = iconBtn('small-btn', 'restart', 'Restart', restart);
    const repeatBtn = iconBtn('small-btn off', 'repeat', 'Repeat', () => {
        repeat = !repeat;
        repeatBtn.classList.toggle('off', !repeat);
    });
    if (random) repeatBtn.style.display = 'none';

    const waitEl = el('div', { class: 'waittime' });
    const timeSel = el('div', { class: 'timeselector' },
        waitEl,
        el('div', { class: 'time-controls' },
            el('button', { class: 'small-time-btn', title: 'Slower', onclick: () => changeWait(+WAIT_STEP) }, '+'),
            el('button', { class: 'small-time-btn', title: 'Faster', onclick: () => changeWait(-WAIT_STEP) }, '−')));

    const delayBtns = DELAYS.map(d => el('button', {
        class: 'delay-btn', title: d ? `Start after ${d}s` : 'Start immediately',
        onclick: () => { savedDelay = d; renderDelay(); },
    }, d ? d + 's' : 'Off'));
    const delaySel = el('div', { class: 'delayselector' },
        el('div', { class: 'waittime' }, 'Start after'),
        el('div', { class: 'delay-options' }, ...delayBtns));

    const countEl = el('div', { class: 'note countdown' });
    const countBox = el('div', { class: 'countdown-box' }, el('small', {}, 'get ready'), countEl);

    const controls = el('div', {},
        el('div', { class: 'button-row' }, playPause, restartBtn, repeatBtn), timeSel, delaySel);
    const controlsHolder = el('div', { class: 'note-holder controls-holder' }, controls);

    const root = el('div', { class: 'player' }, stage, track, controlsHolder);

    function renderWait() { waitEl.textContent = savedWait + 'ms'; }
    function renderDelay() {
        delayBtns.forEach((b, i) => b.classList.toggle('active', DELAYS[i] === savedDelay));
    }
    renderWait();
    renderDelay();

    function show() {
        noteEl.textContent = noteAt(idx);
        const nxt = noteAt(idx + 1);
        nextEl.textContent = nxt === null ? '–' : nxt;
    }

    function setPlayIcon(playing) {
        playPause.innerHTML = playing ? ICONS.pause : ICONS.play;
        playPause.title = playing ? 'Pause' : 'Play';
    }

    function advance() {
        idx++;
        if (random) { upcoming.shift(); upcoming.push(randomNote()); }
        if (noteAt(idx) === null) {
            if (repeat) { idx = 0; }
            else {
                // finished: stay on the last note, ready to play again from the top
                idx = notes.length - 1;
                pause();
                elapsedOnPause = 0;
                bar.style.width = '100%';
                finished = true;
                return;
            }
        }
        show();
    }

    function tick() {
        const now = performance.now();
        let elapsed = now - noteStart;
        if (elapsed >= savedWait) {
            noteStart = now;
            elapsed = 0;
            advance();
            if (!timer) return;
        }
        bar.style.width = (elapsed / savedWait * 100) + '%';
    }

    function play() {
        if (timer || countdown) return;
        if (savedDelay > 0) startCountdown(savedDelay); else begin();
    }

    // counts down `secs` seconds in the note area, then starts playing
    function startCountdown(secs) {
        let left = secs;
        countEl.textContent = left;
        stage.replaceChildren(countBox);
        bar.style.width = '0';
        setPlayIcon(true);
        countdown = setInterval(() => {
            if (--left > 0) { countEl.textContent = left; return; }
            clearInterval(countdown);
            countdown = null;
            begin();
        }, 1000);
    }

    function begin() {
        stage.replaceChildren(noteRow);
        if (!started || finished) {
            if (finished) idx = 0;
            started = true;
            finished = false;
            elapsedOnPause = 0;
            show();
        }
        noteStart = performance.now() - elapsedOnPause;
        timer = setInterval(tick, 20);
        setPlayIcon(true);
    }

    function pause() {
        if (countdown) {
            // cancel a pending start
            clearInterval(countdown);
            countdown = null;
            stage.replaceChildren(started ? noteRow : bigPlay);
            if (started) bar.style.width = (elapsedOnPause / savedWait * 100) + '%';
            setPlayIcon(false);
            return;
        }
        if (!timer) return;
        clearInterval(timer);
        timer = null;
        elapsedOnPause = performance.now() - noteStart;
        setPlayIcon(false);
    }

    function restart() {
        pause();
        idx = 0;
        if (random) upcoming = [randomNote(), randomNote()];
        started = false;
        finished = false;
        play();
    }

    function changeWait(delta) {
        savedWait = Math.max(MIN_WAIT, savedWait + delta);
        renderWait();
    }

    function destroy() {
        clearInterval(timer); clearInterval(countdown);
        timer = countdown = null;
    }

    return { root, destroy };
}

/* ---------- modes ---------- */

let activePlayer = null;
function mountPlayer(container, notes) {
    if (activePlayer) activePlayer.destroy();
    activePlayer = createPlayer(notes);
    container.replaceChildren(activePlayer.root);
}

function parseNotes(text) { return text.split(/\s+/).filter(Boolean); }

function standardMode() {
    const names = Object.keys(STANDARD_PRACTISES);
    const playerBox = el('div', { class: 'mode-view' });
    const select = el('select', {
        class: 'stdpicker', onchange: e => mountPlayer(playerBox, parseNotes(STANDARD_PRACTISES[e.target.value])),
    }, ...names.map(n => el('option', {}, n)));
    mountPlayer(playerBox, parseNotes(STANDARD_PRACTISES[names[0]]));
    return el('div', { class: 'mode-view' },
        el('label', { class: 'stdpicker-box' }, 'Pick a practise (varase):', select),
        playerBox);
}

function randomMode() {
    const box = el('div', { class: 'mode-view' });
    mountPlayer(box, []);
    return box;
}

let customText = '';
function customMode() {
    const view = el('div', { class: 'mode-view' });

    function editor() {
        if (activePlayer) { activePlayer.destroy(); activePlayer = null; }
        const ta = el('textarea', {
            class: 'noteinput', placeholder: 's r g m p d n S',
            oninput: e => { customText = e.target.value; },
        });
        ta.value = customText;
        const err = el('small', { style: 'color:crimson' });
        view.replaceChildren(el('div', { class: 'mode-view stdpicker-box', style: 'margin-top:10px' },
            el('label', { style: 'margin:10px 0' }, 'Paste your notes here (space separated):'),
            ta,
            err,
            el('button', {
                class: 'playbtn', onclick: () => {
                    const notes = parseNotes(customText);
                    if (!notes.length) { err.textContent = 'Enter at least one note.'; return; }
                    playing(notes);
                },
            }, 'Play')));
    }

    function playing(notes) {
        const box = el('div', { class: 'mode-view' });
        view.replaceChildren(box, iconBtn('close-btn', 'close', 'Back to editor', editor));
        mountPlayer(box, notes);
    }

    editor();
    return view;
}

/* ---------- app ---------- */

const MODES = { Standard: standardMode, Random: randomMode, Custom: customMode };

function pickMode(name) {
    document.querySelectorAll('.switch-btn').forEach(b =>
        b.classList.toggle('switch-btn-active', b.dataset.mode === name));
    if (activePlayer) { activePlayer.destroy(); activePlayer = null; }
    document.getElementById('mode-view').replaceChildren(MODES[name]());
}

const switchEl = document.getElementById('mode-switch');
for (const name of Object.keys(MODES)) {
    switchEl.append(el('button', { class: 'switch-btn', 'data-mode': name, title: name, onclick: () => pickMode(name) }, name));
}
pickMode('Standard');
