/* ================================================================
   Cache Access Pattern Visualizer — Application Logic
   Canvas-based cache grid + 2D array access heatmap
   ================================================================ */

// ── Cache Simulator (N-way set-associative, LRU) ────────────────

class CacheSimulator {
    constructor(cacheSize, lineWidth, nWay) {
        this.lineWidth = lineWidth;
        this.nWay = nWay;
        this.numSets = Math.max(1, Math.floor(cacheSize / (nWay * lineWidth)));
        this.sets = [];
        for (let i = 0; i < this.numSets; i++) {
            this.sets.push([]); // ordered: index 0 = LRU, last = MRU
        }
        this.hits = 0;
        this.misses = 0;
    }

    access(address) {
        const lineAddr = Math.floor(address / this.lineWidth);
        const setIndex = lineAddr % this.numSets;
        const tag = Math.floor(lineAddr / this.numSets);
        const set = this.sets[setIndex];

        const hitIdx = set.findIndex(e => e.tag === tag);
        if (hitIdx !== -1) {
            this.hits++;
            const entry = set.splice(hitIdx, 1)[0];
            set.push(entry);
            return { hit: true, setIndex, way: set.length - 1, tag, evictedTag: null };
        }

        this.misses++;
        let evictedTag = null;
        if (set.length >= this.nWay) {
            evictedTag = set.shift().tag;
        }
        set.push({ tag });
        return { hit: false, setIndex, way: set.length - 1, tag, evictedTag };
    }

    reset() {
        for (let i = 0; i < this.numSets; i++) this.sets[i] = [];
        this.hits = 0;
        this.misses = 0;
    }
}


// ── Zoomable/Pannable Canvas ────────────────────────────────────

class ZoomableCanvas {
    constructor(canvasId, wrapperId, zoomInId, zoomOutId, zoomFitId, zoomLabelId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.wrapper = document.getElementById(wrapperId);
        this.zoomLabel = document.getElementById(zoomLabelId);

        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.contentWidth = 100;
        this.contentHeight = 100;
        this.dragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        this.renderFn = null; // set externally

        // Zoom buttons
        document.getElementById(zoomInId).addEventListener('click', () => this.zoomBy(1.3));
        document.getElementById(zoomOutId).addEventListener('click', () => this.zoomBy(1 / 1.3));
        document.getElementById(zoomFitId).addEventListener('click', () => this.fitToView());

        // Mouse wheel zoom
        this.wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
            this.zoomBy(factor, e.offsetX, e.offsetY);
        }, { passive: false });

        // Pan
        this.wrapper.addEventListener('mousedown', (e) => {
            this.dragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.dragOffsetX = this.offsetX;
            this.dragOffsetY = this.offsetY;
        });
        window.addEventListener('mousemove', (e) => {
            if (!this.dragging) return;
            this.offsetX = this.dragOffsetX + (e.clientX - this.dragStartX);
            this.offsetY = this.dragOffsetY + (e.clientY - this.dragStartY);
            this.render();
        });
        window.addEventListener('mouseup', () => { this.dragging = false; });

        // Resize observer
        this.resizeObs = new ResizeObserver(() => this.resizeCanvas());
        this.resizeObs.observe(this.wrapper);
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const w = this.wrapper.clientWidth;
        const h = this.wrapper.clientHeight;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.render();
    }

    zoomBy(factor, pivotX, pivotY) {
        const prevScale = this.scale;
        this.scale = Math.max(0.05, Math.min(20, this.scale * factor));

        if (pivotX !== undefined) {
            // Zoom towards cursor
            this.offsetX = pivotX - (pivotX - this.offsetX) * (this.scale / prevScale);
            this.offsetY = pivotY - (pivotY - this.offsetY) * (this.scale / prevScale);
        }

        this.zoomLabel.textContent = Math.round(this.scale * 100) + '%';
        this.render();
    }

    fitToView() {
        const w = this.wrapper.clientWidth;
        const h = this.wrapper.clientHeight;
        const pad = 10;
        const sx = (w - pad * 2) / this.contentWidth;
        const sy = (h - pad * 2) / this.contentHeight;
        this.scale = Math.min(sx, sy, 3);
        this.offsetX = (w - this.contentWidth * this.scale) / 2;
        this.offsetY = (h - this.contentHeight * this.scale) / 2;
        this.zoomLabel.textContent = Math.round(this.scale * 100) + '%';
        this.render();
    }

    render() {
        if (this.renderFn) this.renderFn(this.ctx, this.scale, this.offsetX, this.offsetY);
    }
}


// ── DOM References ──────────────────────────────────────────────

const $id = (id) => document.getElementById(id);

const dom = {
    dimB: $id('dim-b'),
    dimCH: $id('dim-ch'),
    dimR: $id('dim-r'),
    dimC: $id('dim-c'),
    cacheSize: $id('cache-size'),
    lineWidth: $id('line-width'),
    nWay: $id('n-way'),
    elemSize: $id('elem-size'),
    codeEditor: $id('code-editor'),
    speedSlider: $id('speed-slider'),
    speedValue: $id('speed-value'),
    btnRun: $id('btn-run'),
    btnPause: $id('btn-pause'),
    btnStep: $id('btn-step'),
    btnReset: $id('btn-reset'),
    cacheInfo: $id('cache-info'),
    arrayInfo: $id('array-info'),
    indexViz: $id('index-viz'),
    statAccesses: $id('stat-accesses'),
    statHits: $id('stat-hits'),
    statMisses: $id('stat-misses'),
    statHitRate: $id('stat-hitrate'),
    statUntouched: $id('stat-untouched'),
    arrayMode: $id('array-mode'),
    cellSizeSlider: $id('cell-size-slider'),
    cellSizeValue: $id('cell-size-value'),
    flashPersistenceSlider: $id('flash-persistence-slider'),
    flashPersistenceValue: $id('flash-persistence-value'),
    progressBar: $id('progress-bar'),
    progressText: $id('progress-text'),
};


// ── State ───────────────────────────────────────────────────────

let state = {
    accesses: [],
    cache: null,
    cursor: 0,
    playing: false,
    animFrameId: null,
    speed: 200,
    dims: { B: 64, CH: 16, R: 28, C: 32 },
    arrayMode: 'heatmap',
    uniqueBytesTouched: 0,
    cellSize: 4,
    flashPersistence: 0.85,
};


// ── Colors ──────────────────────────────────────────────────────

const COLORS = {
    bg: '#0d1117',
    cellEmpty: '#161b22',
    cellBorder: '#21262d',
    cellOccupied: '#1e2530',
    cellOccupiedBorder: '#2d3748',
    hitBg: '#22543d',
    hitBorder: '#3fb950',
    missBg: '#5c1d1d',
    missBorder: '#f85149',
    text: '#8b949e',
    textLight: '#e6edf3',
    setLabel: '#484f58',
    accent: '#58a6ff',
};


// ── Canvas Instances ────────────────────────────────────────────

const cacheCanvas = new ZoomableCanvas(
    'cache-canvas', 'cache-canvas-wrapper',
    'cache-zoom-in', 'cache-zoom-out', 'cache-zoom-fit', 'cache-zoom-label'
);

const arrayCanvas = new ZoomableCanvas(
    'array-canvas', 'array-canvas-wrapper',
    'array-zoom-in', 'array-zoom-out', 'array-zoom-fit', 'array-zoom-label'
);


// ── Cache Grid Render State ─────────────────────────────────────

const CELL_W = 60;
const CELL_H = 18;
const LABEL_W = 40;
const CELL_PAD = 1;

let cacheFlash = null; // { setIndex, way, hit, ttl }

function renderCacheGrid(ctx, scale, ox, oy) {
    const w = cacheCanvas.wrapper.clientWidth;
    const h = cacheCanvas.wrapper.clientHeight;
    ctx.clearRect(0, 0, w, h);

    if (!state.cache) return;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    const numSets = state.cache.numSets;
    const nWay = state.cache.nWay;
    const font = '10px "JetBrains Mono", monospace';
    const smallFont = '8px "JetBrains Mono", monospace';

    // Header row
    ctx.font = smallFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.setLabel;
    for (let w2 = 0; w2 < nWay; w2++) {
        const x = LABEL_W + w2 * (CELL_W + CELL_PAD);
        ctx.fillText('Way ' + w2, x + CELL_W / 2, CELL_H / 2);
    }

    // Rows
    for (let s = 0; s < numSets; s++) {
        const y = (s + 1) * (CELL_H + CELL_PAD);
        const set = state.cache.sets[s];

        // Set label
        ctx.font = smallFont;
        ctx.fillStyle = COLORS.setLabel;
        ctx.textAlign = 'right';
        ctx.fillText('S' + s, LABEL_W - 4, y + CELL_H / 2);

        for (let w2 = 0; w2 < nWay; w2++) {
            const x = LABEL_W + w2 * (CELL_W + CELL_PAD);
            const entry = w2 < set.length ? set[w2] : null;

            let bg = entry ? COLORS.cellOccupied : COLORS.cellEmpty;
            let border = entry ? COLORS.cellOccupiedBorder : COLORS.cellBorder;
            let textColor = entry ? COLORS.textLight : COLORS.setLabel;

            // Flash highlight
            if (cacheFlash && cacheFlash.setIndex === s && cacheFlash.way === w2 && cacheFlash.ttl > 0) {
                if (cacheFlash.hit) {
                    bg = COLORS.hitBg;
                    border = COLORS.hitBorder;
                    textColor = COLORS.hitBorder;
                } else {
                    bg = COLORS.missBg;
                    border = COLORS.missBorder;
                    textColor = COLORS.missBorder;
                }
            }

            // Cell background
            ctx.fillStyle = bg;
            ctx.fillRect(x, y, CELL_W, CELL_H);

            // Cell border
            ctx.strokeStyle = border;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x + 0.25, y + 0.25, CELL_W - 0.5, CELL_H - 0.5);

            // Tag text
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.fillStyle = textColor;
            ctx.fillText(entry ? 'T' + entry.tag : '—', x + CELL_W / 2, y + CELL_H / 2 + 1);
        }
    }

    ctx.restore();
}

cacheCanvas.renderFn = renderCacheGrid;


// ── Array Access Heatmap ────────────────────────────────────────

// We map (b*CH+ch) → row, (r*C+c) → col to form a 2D map
// Each cell holds a heat value (access count) and a flash timer

let arrayHeat = null;      // Float32Array: heat values
let arrayFlash = null;     // Float32Array: flash timer (decays)
let arrayTouched = null;   // Uint8Array: binary bitmask of touched cells
let arrayRows = 0;
let arrayCols = 0;
// ARRAY_CELL is now state.cellSize

let maxHeat = 1;

function initArrayMap() {
    const { B, CH, R, C } = state.dims;
    arrayRows = B * CH;
    arrayCols = R * C;

    // Cap for very large arrays — show what fits
    const maxCells = 2_000_000;
    if (arrayRows * arrayCols > maxCells) {
        // Reduce to fit
        const ratio = Math.sqrt(maxCells / (arrayRows * arrayCols));
        arrayRows = Math.max(1, Math.floor(arrayRows * ratio));
        arrayCols = Math.max(1, Math.floor(arrayCols * ratio));
    }

    arrayHeat = new Float32Array(arrayRows * arrayCols);
    arrayFlash = new Float32Array(arrayRows * arrayCols);
    arrayTouched = new Uint8Array(arrayRows * arrayCols);
    maxHeat = 1;
    state.uniqueBytesTouched = 0;

    dom.arrayInfo.textContent = `${arrayRows} × ${arrayCols}`;

    // Content size in virtual pixels (each data cell = cellSize px)
    arrayCanvas.contentWidth = arrayCols * state.cellSize;
    arrayCanvas.contentHeight = arrayRows * state.cellSize;
}

function recordArrayAccess(b, ch, r, c) {
    const row = (b * state.dims.CH + ch) % arrayRows;
    const col = (r * state.dims.C + c) % arrayCols;
    const idx = row * arrayCols + col;

    if (idx >= 0 && idx < arrayHeat.length) {
        if (arrayTouched[idx] === 0) {
            arrayTouched[idx] = 1;
            state.uniqueBytesTouched += parseInt(dom.elemSize.value) || 4;
        }
        arrayHeat[idx]++;
        arrayFlash[idx] = 1.0; // Full brightness flash
        if (arrayHeat[idx] > maxHeat) maxHeat = arrayHeat[idx];
    }
}

function decayArrayFlash() {
    if (!arrayFlash) return;
    const factor = state.flashPersistence;
    for (let i = 0; i < arrayFlash.length; i++) {
        if (arrayFlash[i] > 0) {
            arrayFlash[i] *= factor; // Decay
            if (arrayFlash[i] < 0.01) arrayFlash[i] = 0;
        }
    }
}

// Off-screen buffer for array heatmap (much faster than drawing per-cell)
let arrayImageData = null;
let arrayOffCanvas = null;
let arrayOffCtx = null;

function ensureArrayBuffer() {
    if (!arrayOffCanvas || arrayOffCanvas.width !== arrayCols || arrayOffCanvas.height !== arrayRows) {
        arrayOffCanvas = document.createElement('canvas');
        arrayOffCanvas.width = arrayCols;
        arrayOffCanvas.height = arrayRows;
        arrayOffCtx = arrayOffCanvas.getContext('2d');
        arrayImageData = arrayOffCtx.createImageData(arrayCols, arrayRows);
    }
}

function renderArrayMap(ctx, scale, ox, oy) {
    const w = arrayCanvas.wrapper.clientWidth;
    const h = arrayCanvas.wrapper.clientHeight;
    ctx.clearRect(0, 0, w, h);

    if (!arrayHeat || arrayRows === 0) return;

    ensureArrayBuffer();

    const data = arrayImageData.data;
    const logMax = Math.log1p(maxHeat);

    for (let row = 0; row < arrayRows; row++) {
        for (let col = 0; col < arrayCols; col++) {
            const idx = row * arrayCols + col;
            const pIdx = idx * 4;
            const heat = arrayHeat[idx];
            const flash = arrayFlash[idx];
            const touched = arrayTouched[idx];

            if (state.arrayMode === 'touched') {
                if (touched) {
                    data[pIdx] = 88;  // R (Accent blue)
                    data[pIdx + 1] = 166; // G
                    data[pIdx + 2] = 255; // B
                } else {
                    data[pIdx] = 22;  // R
                    data[pIdx + 1] = 27;  // G
                    data[pIdx + 2] = 34;  // B
                }
                data[pIdx + 3] = 255;
            } else if (heat === 0 && flash === 0) {
                // Dark empty
                data[pIdx] = 22;  // R
                data[pIdx + 1] = 27;  // G
                data[pIdx + 2] = 34;  // B
                data[pIdx + 3] = 255; // A
            } else {
                // Heat: blue → cyan → orange → white
                const t = logMax > 0 ? Math.log1p(heat) / logMax : 0;

                let r, g, b2;
                if (t < 0.33) {
                    const s = t / 0.33;
                    r = 15 + s * 10;
                    g = 25 + s * 60;
                    b2 = 50 + s * 120;
                } else if (t < 0.66) {
                    const s = (t - 0.33) / 0.33;
                    r = 25 + s * 230;
                    g = 85 + s * 80;
                    b2 = 170 - s * 120;
                } else {
                    const s = (t - 0.66) / 0.34;
                    r = 255;
                    g = 165 + s * 90;
                    b2 = 50 + s * 200;
                }

                // Flash overlay: bright orange-white
                if (flash > 0) {
                    const f = flash;
                    r = r + (255 - r) * f;
                    g = g + (200 - g) * f * 0.7;
                    b2 = b2 * (1 - f * 0.5);
                }

                data[pIdx] = Math.min(255, r) | 0;
                data[pIdx + 1] = Math.min(255, g) | 0;
                data[pIdx + 2] = Math.min(255, b2) | 0;
                data[pIdx + 3] = 255;
            }
        }
    }

    arrayOffCtx.putImageData(arrayImageData, 0, 0);

    // Draw the 1-pixel-per-cell off-screen canvas scaled up
    // contentWidth = arrayCols * cellSize, and `scale` is relative to content size,
    // so total pixel scale = scale * cellSize
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;
    // Draw the off-screen buffer (arrayCols × arrayRows pixels) stretched to content size
    ctx.drawImage(arrayOffCanvas, 0, 0, arrayCols * state.cellSize, arrayRows * state.cellSize);
    ctx.restore();
}

arrayCanvas.renderFn = renderArrayMap;


// ── Access Pattern Generator ────────────────────────────────────

function generateAccesses() {
    const B_DIM = parseInt(dom.dimB.value) || 1;
    const CH_DIM = parseInt(dom.dimCH.value) || 1;
    const R_DIM = parseInt(dom.dimR.value) || 1;
    const C_DIM = parseInt(dom.dimC.value) || 1;
    const ELEM_SIZE = parseInt(dom.elemSize.value) || 4;

    state.dims = { B: B_DIM, CH: CH_DIM, R: R_DIM, C: C_DIM };

    const accesses = [];
    const MAX_ACCESSES = 5_000_000;

    const accessFn = (b, ch, r, c) => {
        if (accesses.length >= MAX_ACCESSES) return;
        const index = ((b * CH_DIM + ch) * R_DIM + r) * C_DIM + c;
        const address = index * ELEM_SIZE;
        accesses.push({ b, ch, r, c, address });
    };

    const code = dom.codeEditor.value;

    try {
        const fn = new Function('B_DIM', 'CH_DIM', 'R_DIM', 'C_DIM', 'access', code);
        fn(B_DIM, CH_DIM, R_DIM, C_DIM, accessFn);
    } catch (e) {
        alert('Error in access pattern code:\n' + e.message);
        return [];
    }

    return accesses;
}


// ── Build Index Visualization (DOM-based, stays small) ──────────

let indexCells = {};
let indexValueEls = {};

function buildIndexViz() {
    dom.indexViz.innerHTML = '';
    indexCells = {};
    indexValueEls = {};

    const dims = [
        { key: 'B', label: 'b', size: state.dims.B },
        { key: 'CH', label: 'ch', size: state.dims.CH },
        { key: 'R', label: 'r', size: state.dims.R },
        { key: 'C', label: 'c', size: state.dims.C },
    ];

    for (const dim of dims) {
        const container = document.createElement('div');
        container.className = 'index-dim';

        const labelEl = document.createElement('div');
        labelEl.className = 'index-dim-label';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${dim.label} [0..${dim.size - 1}]`;

        const valSpan = document.createElement('span');
        valSpan.className = 'idx-value';
        valSpan.textContent = '—';
        indexValueEls[dim.key] = valSpan;

        labelEl.appendChild(nameSpan);
        labelEl.appendChild(valSpan);
        container.appendChild(labelEl);

        const bar = document.createElement('div');
        bar.className = 'index-bar';

        const cells = [];
        const displaySize = Math.min(dim.size, 128);
        for (let i = 0; i < displaySize; i++) {
            const cell = document.createElement('div');
            cell.className = 'index-cell';
            bar.appendChild(cell);
            cells.push(cell);
        }
        indexCells[dim.key] = cells;

        container.appendChild(bar);
        dom.indexViz.appendChild(container);
    }
}


// ── Update Functions ────────────────────────────────────────────

let prevIndexHighlights = { B: -1, CH: -1, R: -1, C: -1 };

function updateIndexViz(entry) {
    const mapping = { B: entry.b, CH: entry.ch, R: entry.r, C: entry.c };
    for (const key of ['B', 'CH', 'R', 'C']) {
        const prev = prevIndexHighlights[key];
        const curr = mapping[key];
        if (prev !== curr) {
            if (prev >= 0 && prev < indexCells[key].length)
                indexCells[key][prev].classList.remove('active');
            if (curr >= 0 && curr < indexCells[key].length)
                indexCells[key][curr].classList.add('active');
            prevIndexHighlights[key] = curr;
        }
        indexValueEls[key].textContent = curr;
    }
}


function updateStats() {
    const total = state.cache.hits + state.cache.misses;
    dom.statAccesses.textContent = total.toLocaleString();
    dom.statHits.textContent = state.cache.hits.toLocaleString();
    dom.statMisses.textContent = state.cache.misses.toLocaleString();
    dom.statHitRate.textContent = total > 0
        ? (state.cache.hits / total * 100).toFixed(1) + '%'
        : '0%';
    dom.statUntouched.textContent = state.uniqueBytesTouched.toLocaleString();

    const pct = state.accesses.length > 0
        ? (state.cursor / state.accesses.length * 100)
        : 0;
    dom.progressBar.style.width = pct + '%';
    dom.progressText.textContent = `${state.cursor.toLocaleString()} / ${state.accesses.length.toLocaleString()}`;
}


// ── Animation Loop ──────────────────────────────────────────────

function animationStep() {
    if (!state.playing) return;

    const stepsThisFrame = state.speed;

    for (let s = 0; s < stepsThisFrame && state.cursor < state.accesses.length; s++) {
        const entry = state.accesses[state.cursor];
        const result = state.cache.access(entry.address);
        recordArrayAccess(entry.b, entry.ch, entry.r, entry.c);

        // Keep flash for last access of this frame
        if (s === stepsThisFrame - 1 || state.cursor === state.accesses.length - 1) {
            cacheFlash = { setIndex: result.setIndex, way: result.way, hit: result.hit, ttl: 1 };
            updateIndexViz(entry);
        }

        state.cursor++;
    }

    decayArrayFlash();
    cacheCanvas.render();
    arrayCanvas.render();
    updateStats();

    if (state.cursor >= state.accesses.length) {
        state.playing = false;
        dom.btnRun.textContent = '▶ Run';
        return;
    }

    state.animFrameId = requestAnimationFrame(animationStep);
}


function stepOnce() {
    if (state.cursor >= state.accesses.length) return;
    const entry = state.accesses[state.cursor];
    const result = state.cache.access(entry.address);
    recordArrayAccess(entry.b, entry.ch, entry.r, entry.c);
    cacheFlash = { setIndex: result.setIndex, way: result.way, hit: result.hit, ttl: 1 };
    updateIndexViz(entry);
    state.cursor++;
    decayArrayFlash();
    cacheCanvas.render();
    arrayCanvas.render();
    updateStats();
}


// ── Initialization & Reset ──────────────────────────────────────

function initialize() {
    state.playing = false;
    if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
    state.animFrameId = null;
    state.cursor = 0;
    cacheFlash = null;
    dom.btnRun.textContent = '▶ Run';

    const accesses = generateAccesses();
    if (accesses.length === 0) return;
    state.accesses = accesses;

    const cacheSize = parseInt(dom.cacheSize.value) || 65536;
    const lineWidth = parseInt(dom.lineWidth.value) || 64;
    const nWay = parseInt(dom.nWay.value) || 4;
    state.cache = new CacheSimulator(cacheSize, lineWidth, nWay);

    dom.cacheInfo.textContent = `${state.cache.numSets} sets × ${nWay} ways`;

    // Size the cache canvas content area
    cacheCanvas.contentWidth = LABEL_W + nWay * (CELL_W + CELL_PAD);
    cacheCanvas.contentHeight = (state.cache.numSets + 1) * (CELL_H + CELL_PAD);

    // Init array heatmap
    initArrayMap();

    // Build index viz
    buildIndexViz();
    prevIndexHighlights = { B: -1, CH: -1, R: -1, C: -1 };

    updateStats();

    // Fit both canvases on next frame
    requestAnimationFrame(() => {
        cacheCanvas.fitToView();
        arrayCanvas.fitToView();
    });
}


function runToCompletion() {
    if (!state.cache || state.accesses.length === 0) return;
    state.playing = false;
    if (state.animFrameId) cancelAnimationFrame(state.animFrameId);

    while (state.cursor < state.accesses.length) {
        const entry = state.accesses[state.cursor];
        state.cache.access(entry.address);
        recordArrayAccess(entry.b, entry.ch, entry.r, entry.c);
        state.cursor++;
    }

    cacheFlash = null;
    cacheCanvas.render();
    arrayCanvas.render();
    updateStats();
    dom.btnRun.textContent = '▶ Run';

    // Update index to last
    if (state.accesses.length > 0) {
        updateIndexViz(state.accesses[state.accesses.length - 1]);
    }
}


// ── Event Handlers ──────────────────────────────────────────────

dom.btnRun.addEventListener('click', () => {
    if (state.accesses.length === 0) {
        initialize();
        if (state.accesses.length === 0) return;
    }
    if (state.cursor >= state.accesses.length) initialize();

    if (state.playing) {
        runToCompletion();
        return;
    }

    state.playing = true;
    dom.btnRun.textContent = '⏩ Skip';
    state.animFrameId = requestAnimationFrame(animationStep);
});

dom.btnPause.addEventListener('click', () => {
    state.playing = false;
    if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
    dom.btnRun.textContent = '▶ Run';
});

dom.btnStep.addEventListener('click', () => {
    if (state.accesses.length === 0) {
        initialize();
        if (state.accesses.length === 0) return;
    }
    if (state.cursor >= state.accesses.length) initialize();
    state.playing = false;
    if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
    dom.btnRun.textContent = '▶ Run';
    stepOnce();
});

dom.btnReset.addEventListener('click', () => initialize());

dom.speedSlider.addEventListener('input', () => {
    state.speed = parseInt(dom.speedSlider.value);
    dom.speedValue.textContent = `${state.speed}/f`;
});

dom.codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = dom.codeEditor.selectionStart;
        const end = dom.codeEditor.selectionEnd;
        dom.codeEditor.value =
            dom.codeEditor.value.substring(0, start) + '  ' +
            dom.codeEditor.value.substring(end);
        dom.codeEditor.selectionStart = dom.codeEditor.selectionEnd = start + 2;
    }
});

dom.arrayMode.addEventListener('change', () => {
    state.arrayMode = dom.arrayMode.value;
    arrayCanvas.render();
});

dom.cellSizeSlider.addEventListener('input', () => {
    state.cellSize = parseInt(dom.cellSizeSlider.value);
    dom.cellSizeValue.textContent = `${state.cellSize}px`;
    // Update content size and re-fit or re-render
    arrayCanvas.contentWidth = arrayCols * state.cellSize;
    arrayCanvas.contentHeight = arrayRows * state.cellSize;
    arrayCanvas.render();
});

dom.flashPersistenceSlider.addEventListener('input', () => {
    state.flashPersistence = parseInt(dom.flashPersistenceSlider.value) / 100;
    dom.flashPersistenceValue.textContent = `${dom.flashPersistenceSlider.value}%`;
});


// ── Boot ────────────────────────────────────────────────────────

initialize();


// ── Resize Handle (drag to resize cache vs array split) ─────────

(function initResizeHandle() {
    const handle = document.getElementById('resize-handle');
    const panel = document.querySelector('.panel-center');
    const cacheSection = document.querySelector('.canvas-section');
    const arraySection = document.getElementById('array-section');

    if (!handle || !panel || !cacheSection || !arraySection) return;

    let dragging = false;
    let startY = 0;
    let startCacheH = 0;

    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        dragging = true;
        startY = e.clientY;
        startCacheH = cacheSection.getBoundingClientRect().height;
        handle.classList.add('active');
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const dy = e.clientY - startY;
        const panelH = panel.getBoundingClientRect().height;
        const handleH = handle.getBoundingClientRect().height;
        const newCacheH = Math.max(60, Math.min(panelH - handleH - 60, startCacheH + dy));
        const newArrayH = panelH - handleH - newCacheH;

        cacheSection.style.height = newCacheH + 'px';
        cacheSection.style.flex = 'none';
        arraySection.style.height = newArrayH + 'px';
        arraySection.style.flex = 'none';

        // Trigger canvas resize
        cacheCanvas.resizeCanvas();
        arrayCanvas.resizeCanvas();
    });

    window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        handle.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });

    // Initial 50/50 split
    function setInitialSplit() {
        const panelH = panel.getBoundingClientRect().height;
        if (panelH <= 0) {
            requestAnimationFrame(setInitialSplit);
            return;
        }
        const handleH = handle.getBoundingClientRect().height;
        const half = (panelH - handleH) / 2;
        cacheSection.style.height = half + 'px';
        cacheSection.style.flex = 'none';
        arraySection.style.height = half + 'px';
        arraySection.style.flex = 'none';
    }
    requestAnimationFrame(setInitialSplit);
})();
