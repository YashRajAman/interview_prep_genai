/**
 * ML Odyssey — Visualizations & Interactive Exercises Module
 * ---------------------------------------------------------------------------
 * Creates interactive canvas-based visualizations for specific visualization
 * IDs found in topic content, and renders interactive exercises.
 *
 * Exposed globally as `window.Visualizations`:
 *
 *     Visualizations.render(vizId, container)
 *     Visualizations.renderInteractive(interactiveData, container, onComplete)
 *
 * All visualizations use vanilla JavaScript + the Canvas 2D API (no external
 * libraries). Animation loops are tracked and cleaned up on re-render to
 * avoid leaking frames. The matching CSS lives in static/css/style.css.
 * ---------------------------------------------------------------------------
 */

(function () {
    'use strict';

    // ------------------------------------------------------------------
    // Active animation frame IDs, keyed by the container element they
    // belong to. We cancel these before rendering a new visualization into
    // the same container so stale loops don't keep running / overlap.
    // ------------------------------------------------------------------
    var activeAnimations = new Map();

    /**
     * Cancel any animation loop currently running for the given container.
     *
     * @param {HTMLElement} container
     */
    function cancelAnimationFor(container) {
        if (activeAnimations.has(container)) {
            cancelAnimationFrame(activeAnimations.get(container));
            activeAnimations.delete(container);
        }
    }

    /**
     * Track an animation frame ID for a container so it can be cancelled
     * later (on re-render).
     *
     * @param {HTMLElement} container
     * @param {number} frameId
     */
    function trackAnimation(container, frameId) {
        activeAnimations.set(container, frameId);
    }

    // ------------------------------------------------------------------
    // Canvas DPI / responsiveness helpers
    // ------------------------------------------------------------------

    /**
     * Set up a canvas for crisp rendering on high-DPI displays and make it
     * responsive to its container width.
     *
     * The canvas is sized to `containerWidth × (containerWidth / aspect)`.
     * The backing store is multiplied by `devicePixelRatio` and the context
     * is scaled so drawing code can use CSS-pixel logical coordinates.
     *
     * Returns an object with the logical width/height to draw against.
     *
     * @param {HTMLCanvasElement} canvas
     * @param {HTMLElement} container
     * @param {number} aspect - width / height ratio (e.g. 700/300)
     * @returns {{width: number, height: number, ctx: CanvasRenderingContext2D, dpr: number}}
     */
    function setupCanvas(canvas, container, aspect) {
        var dpr = window.devicePixelRatio || 1;
        var cssWidth = container.clientWidth || canvas.width / dpr;
        // Clamp so very wide containers don't blow up; cap at a sensible max.
        var maxWidth = 800;
        if (cssWidth > maxWidth) cssWidth = maxWidth;
        var cssHeight = Math.round(cssWidth / aspect);

        canvas.style.width = cssWidth + 'px';
        canvas.style.height = cssHeight + 'px';
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);

        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale for crispness
        return { width: cssWidth, height: cssHeight, ctx: ctx, dpr: dpr };
    }

    /**
     * Convert a mouse/touch event into canvas logical coordinates
     * (accounting for DPI scaling handled in setupCanvas).
     *
     * @param {HTMLCanvasElement} canvas
     * @param {MouseEvent} evt
     * @returns {{x: number, y: number}}
     */
    function getCanvasCoords(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    // ------------------------------------------------------------------
    // Small DOM helpers
    // ------------------------------------------------------------------

    /**
     * Create an element with optional class and text content.
     *
     * @param {string} tag
     * @param {string} [cls]
     * @param {string} [text]
     * @returns {HTMLElement}
     */
    function el(tag, cls, text) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    /**
     * Capitalize the first letter of each word (for category headers).
     *
     * @param {string} s
     * @returns {string}
     */
    function capitalize(s) {
        return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }

    /**
     * Round a number to 2 decimal places (returns a number).
     *
     * @param {number} n
     * @returns {number}
     */
    function round2(n) {
        return Math.round(n * 100) / 100;
    }

    /**
     * Format a number for display: round to 2dp, return a string. Handles
     * integers (no trailing decimals shown) and NaN/Infinity gracefully.
     *
     * @param {number} n
     * @returns {string}
     */
    function fmt(n) {
        if (typeof n !== 'number' || !isFinite(n)) return '—';
        var r = round2(n);
        return Number.isInteger(r) ? String(r) : r.toFixed(2);
    }

    /**
     * Shuffle an array in place (Fisher–Yates) and return it.
     *
     * @param {Array} arr
     * @returns {Array}
     */
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return arr;
    }

    /**
     * Create a styled control button.
     *
     * @param {string} label
     * @param {Function} onClick
     * @returns {HTMLButtonElement}
     */
    function controlButton(label, onClick) {
        var btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.type = 'button';
        btn.textContent = label;
        btn.addEventListener('click', onClick);
        return btn;
    }

    // ==================================================================
    //
    //   VISUALIZATION 1 — traditional-vs-ml
    //
    // ==================================================================

    /**
     * Side-by-side animated diagram comparing Traditional Programming and
     * Machine Learning data flows, with boxes, arrows and animated flowing
     * dots along the arrow paths.
     */
    function renderTraditionalVsML(container) {
        container.innerHTML = '';

        var canvas = el('canvas', 'viz-canvas');
        container.appendChild(canvas);

        var view = setupCanvas(canvas, container, 700 / 300);
        var ctx = view.ctx, W = view.width, H = view.height;

        // Define the two flow rows. Each row is a list of boxes connected by
        // arrows; dots flow left→right along each arrow segment.
        var traditional = [
            { label: 'Data + Rules' },
            { label: 'Program' },
            { label: 'Answers' }
        ];
        var ml = [
            { label: 'Data + Answers' },
            { label: 'Model' },
            { label: 'Rules' }
        ];

        // Layout: top half = traditional, bottom half = ml.
        var topY = H * 0.30;
        var botY = H * 0.72;

        // Box geometry relative to canvas width.
        function boxGeom(rowY) {
            var padX = W * 0.05;
            var usable = W - padX * 2;
            var boxW = Math.min(usable / 3 * 0.72, 180);
            var gap = (usable - boxW * 3) / 2;
            var xs = [];
            for (var i = 0; i < 3; i++) {
                xs.push(padX + i * (boxW + gap));
            }
            return { xs: xs, w: boxW, h: Math.min(54, H * 0.18), y: rowY };
        }

        var topG = boxGeom(topY);
        var botG = boxGeom(botY);

        // Animated dots: one set per arrow segment (3 segments? no, 2 arrows
        // per row → 3 boxes means 2 arrows per row). We keep dots per segment.
        var dots = [];
        var startTime = performance.now();

        /**
         * Arrow segments for a row given its box geometry.
         * Returns list of {from:{x,y}, to:{x,y}}.
         */
        function arrowsFor(g) {
            var segs = [];
            for (var i = 0; i < 2; i++) {
                segs.push({
                    from: { x: g.xs[i] + g.w, y: g.y + g.h / 2 },
                    to: { x: g.xs[i + 1], y: g.y + g.h / 2 }
                });
            }
            return segs;
        }

        var topArrows = arrowsFor(topG);
        var botArrows = arrowsFor(botG);
        var allArrows = topArrows.concat(botArrows);

        // Two dots per arrow, offset in phase.
        for (var a = 0; a < allArrows.length; a++) {
            dots.push({ seg: a, t: 0.0 });
            dots.push({ seg: a, t: 0.5 });
        }

        /**
         * Draw a rounded rectangle.
         */
        function roundRect(x, y, w, h, r) {
            r = Math.min(r, w / 2, h / 2);
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        /**
         * Draw a labelled box.
         */
        function drawBox(x, y, w, h, label, color) {
            ctx.fillStyle = 'rgba(26,31,58,0.95)';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            roundRect(x, y, w, h, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#e0e0f0';
            ctx.font = '600 ' + Math.max(11, Math.round(h * 0.30)) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x + w / 2, y + h / 2);
        }

        /**
         * Draw an arrow between two points (with arrowhead).
         */
        function drawArrow(from, to, color) {
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();

            // arrowhead
            var angle = Math.atan2(to.y - from.y, to.x - from.x);
            var head = 9;
            ctx.beginPath();
            ctx.moveTo(to.x, to.y);
            ctx.lineTo(to.x - head * Math.cos(angle - 0.4),
                       to.y - head * Math.sin(angle - 0.4));
            ctx.lineTo(to.x - head * Math.cos(angle + 0.4),
                       to.y - head * Math.sin(angle + 0.4));
            ctx.closePath();
            ctx.fill();
        }

        var PRIMARY = '#00d4aa';
        var SECONDARY = '#7c5cff';

        function frame(now) {
            var elapsed = (now - startTime) / 1000;

            ctx.clearRect(0, 0, W, H);

            // Section titles
            ctx.fillStyle = '#9090b0';
            ctx.font = '600 13px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('Traditional Programming', 20, 14);
            ctx.fillStyle = SECONDARY;
            ctx.fillText('Machine Learning', 20, botY - 34);

            // Boxes
            for (var i = 0; i < 3; i++) {
                drawBox(topG.xs[i], topG.y, topG.w, topG.h, traditional[i].label, '#4dabf7');
                drawBox(botG.xs[i], botG.y, botG.w, botG.h, ml[i].label, SECONDARY);
            }

            // Arrows
            for (var a = 0; a < topArrows.length; a++) drawArrow(topArrows[a].from, topArrows[a].to, '#4dabf7');
            for (var a2 = 0; a2 < botArrows.length; a2++) drawArrow(botArrows[a2].from, botArrows[a2].to, SECONDARY);

            // Flowing dots — animate t from 0→1 repeatedly.
            for (var d = 0; d < dots.length; d++) {
                var seg = allArrows[dots[d].seg];
                dots[d].t = (elapsed * 0.6 + dots[d].startPhase) % 1;
                var t = dots[d].t;
                var x = seg.from.x + (seg.to.x - seg.from.x) * t;
                var y = seg.from.y + (seg.to.y - seg.from.y) * t;
                var color = dots[d].seg < 2 ? PRIMARY : '#00f0c0';
                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            trackAnimation(container, requestAnimationFrame(frame));
        }

        // Initialize start phases for the dots so they aren't all aligned.
        for (var d = 0; d < dots.length; d++) dots[d].startPhase = (d * 0.33) % 1;

        cancelAnimationFor(container);
        trackAnimation(container, requestAnimationFrame(frame));

        // Re-setup on resize (debounced via rAF check).
        var resizeRan = false;
        window.addEventListener('resize', function () {
            if (resizeRan) return;
            resizeRan = true;
            requestAnimationFrame(function () {
                resizeRan = false;
                var nv = setupCanvas(canvas, container, 700 / 300);
                W = nv.width; H = nv.height; ctx = nv.ctx;
                topY = H * 0.30; botY = H * 0.72;
                topG = boxGeom(topY); botG = boxGeom(botY);
                topArrows = arrowsFor(topG); botArrows = arrowsFor(botG);
                allArrows = topArrows.concat(botArrows);
            });
        });
    }

    // ==================================================================
    //
    //   VISUALIZATION 2 — linear-regression-fit
    //
    // ==================================================================

    /**
     * Interactive scatter plot: click to add points; the least-squares
     * regression line and R² update in real time.
     */
    function renderLinearRegression(container) {
        container.innerHTML = '';

        var canvas = el('canvas', 'viz-canvas');
        container.appendChild(canvas);

        var view = setupCanvas(canvas, container, 600 / 400);
        var ctx = view.ctx, W = view.width, H = view.height;

        // Plot data model: points stored in data coordinates [0..10] x [0..10].
        var points = [];
        var DATA_MAX = 10;

        // Plot padding
        var PAD = { l: 44, r: 16, t: 16, b: 36 };
        function plotW() { return W - PAD.l - PAD.r; }
        function plotH() { return H - PAD.t - PAD.b; }

        /** data x → pixel x */
        function px(dx) { return PAD.l + (dx / DATA_MAX) * plotW(); }
        /** data y → pixel y (inverted) */
        function py(dy) { return H - PAD.b - (dy / DATA_MAX) * plotH(); }
        /** pixel x → data x */
        function dx(pxv) { return ((pxv - PAD.l) / plotW()) * DATA_MAX; }
        /** pixel y → data y */
        function dy(pyv) { return ((H - PAD.b - pyv) / plotH()) * DATA_MAX; }

        /**
         * Compute least-squares regression line.
         * m = (nΣxy − ΣxΣy) / (nΣx² − (Σx)²)
         * b = (Σy − mΣx) / n
         * Returns {m, b, r2} or null if undefined.
         */
        function regression() {
            var n = points.length;
            if (n < 2) return null;
            var Sx = 0, Sy = 0, Sxy = 0, Sxx = 0, Syy = 0;
            for (var i = 0; i < n; i++) {
                Sx += points[i].x; Sy += points[i].y;
                Sxy += points[i].x * points[i].y;
                Sxx += points[i].x * points[i].x;
                Syy += points[i].y * points[i].y;
            }
            var denom = n * Sxx - Sx * Sx;
            if (Math.abs(denom) < 1e-9) return null; // vertical line / identical x
            var m = (n * Sxy - Sx * Sy) / denom;
            var b = (Sy - m * Sx) / n;

            // R² = (nΣxy − ΣxΣy)² / ((nΣx² − Σx²)(nΣy² − Σy²))
            var denomY = n * Syy - Sy * Sy;
            var r2;
            if (Math.abs(denomY) < 1e-9) r2 = 1; // all y identical
            else r2 = Math.pow(n * Sxy - Sx * Sy, 2) / (denom * denomY);
            return { m: m, b: b, r2: r2 };
        }

        function drawGrid() {
            // background
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(PAD.l, PAD.t, plotW(), plotH());

            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.font = '10px monospace';
            ctx.fillStyle = '#606080';
            // vertical grid + x labels
            for (var gx = 0; gx <= DATA_MAX; gx += 2) {
                var xpx = px(gx);
                ctx.beginPath();
                ctx.moveTo(xpx, PAD.t);
                ctx.lineTo(xpx, H - PAD.b);
                ctx.stroke();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(String(gx), xpx, H - PAD.b + 4);
            }
            // horizontal grid + y labels
            for (var gy = 0; gy <= DATA_MAX; gy += 2) {
                var ypx = py(gy);
                ctx.beginPath();
                ctx.moveTo(PAD.l, ypx);
                ctx.lineTo(W - PAD.r, ypx);
                ctx.stroke();
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(gy), PAD.l - 6, ypx);
            }
            // axes
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(PAD.l, PAD.t);
            ctx.lineTo(PAD.l, H - PAD.b);
            ctx.lineTo(W - PAD.r, H - PAD.b);
            ctx.stroke();
        }

        function drawLine(reg) {
            // line from x=0..DATA_MAX
            var x1 = 0, x2 = DATA_MAX;
            var y1 = reg.m * x1 + reg.b;
            var y2 = reg.m * x2 + reg.b;
            ctx.strokeStyle = '#00d4aa';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(px(x1), py(y1));
            ctx.lineTo(px(x2), py(y2));
            ctx.stroke();
        }

        function drawPoints() {
            for (var i = 0; i < points.length; i++) {
                var p = points[i];
                ctx.beginPath();
                ctx.fillStyle = '#7c5cff';
                ctx.strokeStyle = '#e0e0f0';
                ctx.lineWidth = 1.5;
                ctx.arc(px(p.x), py(p.y), 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }

        // Equation overlay DOM (kept above canvas)
        var info = el('div', 'viz-controls');
        info.style.justifyContent = 'space-between';

        var eqLabel = el('div');
        eqLabel.style.fontFamily = 'monospace';
        eqLabel.style.color = '#9090b0';
        eqLabel.style.fontSize = '0.9rem';
        eqLabel.textContent = 'Click on the plot to add points. Need 2+ points for a line.';
        info.appendChild(eqLabel);

        var clearBtn = controlButton('Clear Points', function () {
            points = [];
            redraw();
        });
        info.appendChild(clearBtn);
        container.appendChild(info);

        function redraw() {
            ctx.clearRect(0, 0, W, H);
            drawGrid();
            var reg = regression();
            if (reg) drawLine(reg);
            drawPoints();
            // update equation label
            if (reg) {
                // Normalize display of the sign on the intercept term.
                var mb = 'y = ' + fmt(reg.m) + 'x ' + (reg.b >= 0 ? '+ ' : '− ') + fmt(Math.abs(reg.b));
                eqLabel.textContent = mb + '   |   R² = ' + fmt(reg.r2) +
                    '   |   points: ' + points.length;
            } else {
                eqLabel.textContent = 'Click on the plot to add points. Need 2+ points for a line. (points: ' + points.length + ')';
            }
        }

        canvas.addEventListener('click', function (evt) {
            var c = getCanvasCoords(canvas, evt);
            // ignore clicks in padding area
            if (c.x < PAD.l || c.x > W - PAD.r || c.y < PAD.t || c.y > H - PAD.b) return;
            var ddx = dx(c.x), ddy = dy(c.y);
            // clamp to plot range
            ddx = Math.max(0, Math.min(DATA_MAX, ddx));
            ddy = Math.max(0, Math.min(DATA_MAX, ddy));
            points.push({ x: ddx, y: ddy });
            redraw();
        });

        redraw();

        // Resize handling
        var resizeRan = false;
        window.addEventListener('resize', function () {
            if (resizeRan) return;
            resizeRan = true;
            requestAnimationFrame(function () {
                resizeRan = false;
                var nv = setupCanvas(canvas, container, 600 / 400);
                W = nv.width; H = nv.height; ctx = nv.ctx;
                redraw();
            });
        });
    }

    // ==================================================================
    //
    //   VISUALIZATION 3 — gradient-descent-3d
    //
    // ==================================================================

    /**
     * Gradient descent on a 2D contour plot of f(x,y)=x²+y². A ball follows
     * the gradient downhill; user controls learning rate and play/pause.
     */
    function renderGradientDescent(container) {
        container.innerHTML = '';

        var canvas = el('canvas', 'viz-canvas');
        container.appendChild(canvas);

        var view = setupCanvas(canvas, container, 500 / 500);
        var ctx = view.ctx, W = view.width, H = view.height;

        // Function: f(x,y) = x^2 + y^2, gradient = (2x, 2y).
        // We map data coords [-5,5] x [-5,5] onto the square canvas.
        var RANGE = 5;
        function toPxX(dx) { return (dx + RANGE) / (2 * RANGE) * W; }
        function toPxY(dy) { return (dy + RANGE) / (2 * RANGE) * H; }
        function toDataX(pxv) { return (pxv / W) * (2 * RANGE) - RANGE; }
        function toDataY(pyv) { return (pyv / H) * (2 * RANGE) - RANGE; }

        var state = {
            x: (Math.random() * 8 - 4),   // start somewhere off-center
            y: (Math.random() * 8 - 4),
            lr: 0.05,
            running: false,
            step: 0,
            trail: []
        };

        function loss(x, y) { return x * x + y * y; }

        function drawContours() {
            // background
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(0, 0, W, H);

            // Concentric contour ellipses for f = r (so x²+y² = r → radius √r in
            // data units, drawn as circles since the function is isotropic).
            // We draw contours at loss = 1, 2, 4, 8, 16, 32, 50.
            var levels = [1, 2, 4, 8, 16, 32, 50];
            ctx.lineWidth = 1.2;
            for (var i = 0; i < levels.length; i++) {
                var lvl = levels[i];
                var rData = Math.sqrt(lvl);
                // color intensity: outer faint, inner brighter
                var alpha = 0.08 + (1 - i / levels.length) * 0.12;
                ctx.strokeStyle = 'rgba(124,92,255,' + alpha.toFixed(3) + ')';
                ctx.beginPath();
                ctx.arc(toPxX(0), toPxY(0), rData * (W / (2 * RANGE)), 0, Math.PI * 2);
                ctx.stroke();
            }

            // center marker (minimum)
            ctx.fillStyle = 'rgba(0,212,170,0.6)';
            ctx.beginPath();
            ctx.arc(toPxX(0), toPxY(0), 4, 0, Math.PI * 2);
            ctx.fill();

            // axes faint
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, toPxY(0)); ctx.lineTo(W, toPxY(0));
            ctx.moveTo(toPxX(0), 0); ctx.lineTo(toPxX(0), H);
            ctx.stroke();
        }

        function drawTrail() {
            if (state.trail.length < 2) return;
            ctx.strokeStyle = 'rgba(0,212,170,0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(toPxX(state.trail[0].x), toPxY(state.trail[0].y));
            for (var i = 1; i < state.trail.length; i++) {
                ctx.lineTo(toPxX(state.trail[i].x), toPxY(state.trail[i].y));
            }
            ctx.stroke();
        }

        function drawBall() {
            ctx.fillStyle = '#00f0c0';
            ctx.strokeStyle = '#e0e0f0';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(toPxX(state.x), toPxY(state.y), 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        function step() {
            // gradient step: x_new = x - lr * df/dx ; df/dx = 2x
            var nx = state.x - state.lr * (2 * state.x);
            var ny = state.y - state.lr * (2 * state.y);
            state.x = nx;
            state.y = ny;
            state.step++;
            state.trail.push({ x: nx, y: ny });
            // cap trail length
            if (state.trail.length > 400) state.trail.shift();
        }

        function redraw() {
            ctx.clearRect(0, 0, W, H);
            drawContours();
            drawTrail();
            drawBall();
            updateStats();
        }

        function updateStats() {
            if (statBox) {
                statBox.textContent = 'Step: ' + state.step +
                    '   Loss: ' + fmt(loss(state.x, state.y)) +
                    '   Position: (' + fmt(state.x) + ', ' + fmt(state.y) + ')';
            }
        }

        // Controls
        var controls = el('div', 'viz-controls');
        var playBtn = controlButton('▶ Play', function () {
            state.running = !state.running;
            playBtn.textContent = state.running ? '⏸ Pause' : '▶ Play';
            if (state.running) loop();
        });
        controls.appendChild(playBtn);

        var resetBtn = controlButton('↺ Reset', function () {
            state.x = Math.random() * 8 - 4;
            state.y = Math.random() * 8 - 4;
            state.step = 0;
            state.trail = [];
            state.running = false;
            playBtn.textContent = '▶ Play';
            redraw();
        });
        controls.appendChild(resetBtn);

        // learning rate slider
        var lrLabel = el('span', null, 'LR: 0.05');
        lrLabel.style.fontFamily = 'monospace';
        lrLabel.style.color = '#9090b0';
        lrLabel.style.fontSize = '0.85rem';
        var slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0.01'; slider.max = '1.0'; slider.step = '0.01'; slider.value = '0.05';
        slider.addEventListener('input', function () {
            state.lr = parseFloat(slider.value);
            lrLabel.textContent = 'LR: ' + state.lr.toFixed(2);
        });
        controls.appendChild(slider);
        controls.appendChild(lrLabel);

        container.appendChild(controls);

        var statBox = el('div');
        statBox.style.fontFamily = 'monospace';
        statBox.style.color = '#9090b0';
        statBox.style.fontSize = '0.85rem';
        statBox.style.marginTop = '0.5rem';
        container.appendChild(statBox);

        function loop() {
            if (!state.running) return;
            // a few sub-steps per frame for visible motion
            for (var s = 0; s < 3; s++) step();
            redraw();
            // stop when very close to the minimum
            if (loss(state.x, state.y) < 1e-4) {
                state.running = false;
                playBtn.textContent = '▶ Play';
                return;
            }
            trackAnimation(container, requestAnimationFrame(loop));
        }

        cancelAnimationFor(container);
        redraw();

        // Resize handling
        var resizeRan = false;
        window.addEventListener('resize', function () {
            if (resizeRan) return;
            resizeRan = true;
            requestAnimationFrame(function () {
                resizeRan = false;
                var nv = setupCanvas(canvas, container, 500 / 500);
                W = nv.width; H = nv.height; ctx = nv.ctx;
                redraw();
            });
        });
    }

    // ==================================================================
    //
    //   VISUALIZATION 4 — decision-boundary
    //
    // ==================================================================

    /**
     * Logistic regression decision boundary: plots two classes of points,
     * draws the sigmoid decision boundary, and shows the sigmoid curve on
     * the side. The boundary line converges from a random start to fixed
     * learned weights via a short animated fit.
     */
    function renderDecisionBoundary(container) {
        container.innerHTML = '';

        var canvas = el('canvas', 'viz-canvas');
        container.appendChild(canvas);

        var view = setupCanvas(canvas, container, 500 / 500);
        var ctx = view.ctx, W = view.width, H = view.height;

        // Data coordinate range [0,10] x [0,10].
        var DATA_MAX = 10;
        var PAD = { l: 36, r: 16, t: 16, b: 30 };
        function px(dx) { return PAD.l + (dx / DATA_MAX) * (W - PAD.l - PAD.r); }
        function py(dy) { return H - PAD.b - (dy / DATA_MAX) * (H - PAD.t - PAD.b); }

        // Fixed dataset: two separable clusters.
        var class0 = [
            { x: 1.5, y: 7.5 }, { x: 2, y: 8.5 }, { x: 1, y: 6.5 }, { x: 2.5, y: 9 },
            { x: 3, y: 7 }, { x: 1.2, y: 8 }, { x: 2.2, y: 6 }, { x: 0.8, y: 7.8 }
        ];
        var class1 = [
            { x: 7, y: 2.5 }, { x: 8, y: 1.5 }, { x: 6.5, y: 3 }, { x: 8.5, y: 2 },
            { x: 7.5, y: 3.5 }, { x: 9, y: 1 }, { x: 6.8, y: 2 }, { x: 8.2, y: 3.2 }
        ];

        // Target weights (learned-ish). The boundary y = -(w0 + w1 x)/w2.
        // This line separates the clusters nicely.
        var target = { w0: 6, w1: -1, w2: 1 }; // → y = 6 - x  (line from (0,6)->(10,-4))
        // current (animated) weights converge from random to target.
        var current = {
            w0: Math.random() * 4 - 2,
            w1: Math.random() * 4 - 2,
            w2: Math.random() * 4 - 2 || 1
        };

        var startedAt = performance.now();
        var converged = false;

        function lerp(a, b, t) { return a + (b - a) * t; }

        function drawAxes() {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(PAD.l, PAD.t, W - PAD.l - PAD.r, H - PAD.t - PAD.b);

            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 1;
            ctx.font = '9px monospace';
            ctx.fillStyle = '#606080';
            for (var gx = 0; gx <= DATA_MAX; gx += 2) {
                var xp = px(gx);
                ctx.beginPath(); ctx.moveTo(xp, PAD.t); ctx.lineTo(xp, H - PAD.b); ctx.stroke();
                ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                ctx.fillText(String(gx), xp, H - PAD.b + 3);
            }
            for (var gy = 0; gy <= DATA_MAX; gy += 2) {
                var yp = py(gy);
                ctx.beginPath(); ctx.moveTo(PAD.l, yp); ctx.lineTo(W - PAD.r, yp); ctx.stroke();
                ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
                ctx.fillText(String(gy), PAD.l - 5, yp);
            }
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, H - PAD.b); ctx.lineTo(W - PAD.r, H - PAD.b);
            ctx.stroke();
        }

        function drawRegionLabels(w) {
            // Label region above/below the boundary as Class 0 / Class 1.
            // Class 1 region: w0 + w1 x + w2 y > 0  (sigmoid > 0.5)
            // We'll just place labels in the cluster centers.
            ctx.font = '600 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255,87,87,0.65)';
            ctx.fillText('Class 1', px(7.7), py(8.7));
            ctx.fillStyle = 'rgba(77,171,247,0.7)';
            ctx.fillText('Class 0', px(1.7), py(1.7));
        }

        function drawPoints() {
            // class 0 — blue circles
            ctx.fillStyle = '#4dabf7';
            for (var i = 0; i < class0.length; i++) {
                ctx.beginPath();
                ctx.arc(px(class0[i].x), py(class0[i].y), 5, 0, Math.PI * 2);
                ctx.fill();
            }
            // class 1 — red squares
            ctx.fillStyle = '#ff5757';
            for (var j = 0; j < class1.length; j++) {
                var x = px(class1[j].x), y = py(class1[j].y);
                ctx.fillRect(x - 5, y - 5, 10, 10);
            }
        }

        function drawBoundary(w) {
            // boundary: w0 + w1 x + w2 y = 0  →  y = -(w0 + w1 x)/w2
            if (Math.abs(w.w2) < 1e-6) return;
            ctx.strokeStyle = '#00d4aa';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([]);
            ctx.beginPath();
            var x1 = 0, x2 = DATA_MAX;
            var y1 = -(w.w0 + w.w1 * x1) / w.w2;
            var y2 = -(w.w0 + w.w1 * x2) / w.w2;
            // clip to plot
            ctx.moveTo(px(x1), py(y1));
            ctx.lineTo(px(x2), py(y2));
            ctx.stroke();
        }

        function drawSigmoidSide() {
            // small sigmoid panel in the top-right corner area, drawn over
            // the canvas (overlay). Use a translucent panel.
            var panelX = W - 110, panelY = PAD.t + 6, panelW = 92, panelH = 70;
            ctx.fillStyle = 'rgba(13,14,26,0.85)';
            ctx.strokeStyle = '#2a2f4a';
            ctx.lineWidth = 1;
            ctx.fillRect(panelX, panelY, panelW, panelH);
            ctx.strokeRect(panelX, panelY, panelW, panelH);

            // sigmoid z in [-6,6]
            function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
            ctx.strokeStyle = '#7c5cff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (var k = 0; k <= panelW; k++) {
                var z = -6 + (k / panelW) * 12;
                var sy = sigmoid(z);
                var yy = panelY + panelH - sy * panelH;
                if (k === 0) ctx.moveTo(panelX + k, yy);
                else ctx.lineTo(panelX + k, yy);
            }
            ctx.stroke();
            // 0.5 line
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(panelX, panelY + panelH / 2);
            ctx.lineTo(panelX + panelW, panelY + panelH / 2);
            ctx.stroke();
            ctx.setLineDash([]);
            // label
            ctx.fillStyle = '#9090b0';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('sigmoid', panelX + panelW / 2, panelY - 11);
        }

        function frame(now) {
            // converge weights toward target over ~2.5s
            var t = Math.min(1, (now - startedAt) / 2500);
            // ease-out
            var e = 1 - Math.pow(1 - t, 3);
            // Capture the initial random weights once so we can lerp from
            // a fixed start toward the target across the animation.
            if (!frame._init0) {
                frame._init0 = { w0: current.w0, w1: current.w1, w2: current.w2 };
            }
            var w = {
                w0: lerp(frame._init0.w0, target.w0, e),
                w1: lerp(frame._init0.w1, target.w1, e),
                w2: lerp(frame._init0.w2, target.w2, e)
            };

            ctx.clearRect(0, 0, W, H);
            drawAxes();
            drawRegionLabels(w);
            drawPoints();
            drawBoundary(w);
            drawSigmoidSide();

            if (t < 1) {
                trackAnimation(container, requestAnimationFrame(frame));
            } else {
                converged = true;
            }
        }

        cancelAnimationFor(container);
        trackAnimation(container, requestAnimationFrame(frame));

        // Resize handling
        var resizeRan = false;
        window.addEventListener('resize', function () {
            if (resizeRan) return;
            resizeRan = true;
            requestAnimationFrame(function () {
                resizeRan = false;
                var nv = setupCanvas(canvas, container, 500 / 500);
                W = nv.width; H = nv.height; ctx = nv.ctx;
                // redraw static converged frame
                ctx.clearRect(0, 0, W, H);
                drawAxes(); drawRegionLabels(target); drawPoints(); drawBoundary(target); drawSigmoidSide();
            });
        });
    }

    // ==================================================================
    //
    //   INTERACTIVE EXERCISE 1 — sorting-exercise
    //
    // ==================================================================

    /**
     * Drag-and-drop (with click-to-place fallback) sorting exercise. Items
     * are shuffled at the top and placed into category drop zones. When all
     * items are placed, completion is reported.
     */
    function renderSortingExercise(data, container, onComplete) {
        container.innerHTML = '';

        var wrap = el('div', 'sorting-exercise');

        // Detect categories from items (preserve order of first appearance).
        var cats = [];
        (data.items || []).forEach(function (it) {
            if (cats.indexOf(it.category) === -1) cats.push(it.category);
        });

        // State: each item tracks its placed zone (null = still in the pool).
        var items = (data.items || []).map(function (it, idx) {
            return { text: it.text, category: it.category, idx: idx, placedZone: null };
        });
        shuffle(items);

        // Selected item for click-to-place fallback.
        var selectedItem = null;

        // Header / instructions
        if (data.title) {
            var t = el('h4', 'interactive-title', data.title);
            wrap.appendChild(t);
        }
        if (data.instructions) {
            wrap.appendChild(el('p', 'interactive-instructions', data.instructions));
        }

        // Progress counter
        var progress = el('div');
        progress.style.fontFamily = 'monospace';
        progress.style.color = '#9090b0';
        progress.style.fontSize = '0.85rem';
        progress.style.marginBottom = '0.25rem';
        wrap.appendChild(progress);

        // Item pool
        var pool = el('div', 'sort-items');
        wrap.appendChild(pool);

        // Zones container
        var zonesWrap = el('div', 'sort-zones');
        wrap.appendChild(zonesWrap);

        var zones = {};
        cats.forEach(function (cat) {
            var zone = el('div', 'sort-zone');
            zone.dataset.category = cat;
            var header = el('div', 'sort-zone-header', capitalize(cat));
            zone.appendChild(header);
            var itemsBox = el('div', 'sort-zone-items');
            zone.appendChild(itemsBox);
            zones[cat] = { zone: zone, itemsBox: itemsBox };

            // drag over / drop
            zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('drag-over'); });
            zone.addEventListener('dragleave', function () { zone.classList.remove('drag-over'); });
            zone.addEventListener('drop', function (e) {
                e.preventDefault();
                zone.classList.remove('drag-over');
                var idx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                placeItem(idx, cat);
            });

            // click-to-place fallback: clicking a zone places the selected item
            zone.addEventListener('click', function () {
                if (selectedItem !== null) {
                    placeItem(selectedItem, cat);
                    selectedItem = null;
                    updateSelectionHighlights();
                }
            });

            // Append the zone to the DOM so it's actually visible.
            zonesWrap.appendChild(zone);
        });

        container.appendChild(wrap);

        /**
         * Render the pool of unplaced items.
         */
        function renderPool() {
            pool.innerHTML = '';
            var unplaced = items.filter(function (it) { return it.placedZone === null; });
            if (unplaced.length === 0) {
                pool.appendChild(el('span', null, 'All items placed! 🎉'));
                pool.style.justifyContent = 'center';
                pool.style.color = '#00d4aa';
                return;
            }
            pool.style.color = '';
            unplaced.forEach(function (it) {
                var card = el('div', 'sort-item', it.text);
                card.draggable = true;
                card.dataset.idx = it.idx;
                card.addEventListener('dragstart', function (e) {
                    e.dataTransfer.setData('text/plain', String(it.idx));
                    e.dataTransfer.effectAllowed = 'move';
                    card.classList.add('dragging');
                });
                card.addEventListener('dragend', function () { card.classList.remove('dragging'); });
                // click to select (fallback)
                card.addEventListener('click', function () {
                    selectedItem = (selectedItem === it.idx) ? null : it.idx;
                    updateSelectionHighlights();
                });
                pool.appendChild(card);
            });
        }

        /**
         * Highlight currently selected item card.
         */
        function updateSelectionHighlights() {
            var cards = pool.querySelectorAll('.sort-item');
            cards.forEach(function (c) {
                if (parseInt(c.dataset.idx, 10) === selectedItem) c.classList.add('selected');
                else c.classList.remove('selected');
            });
        }

        /**
         * Place an item into a category zone and check correctness.
         */
        function placeItem(itemIdx, category) {
            var it = items.find(function (i) { return i.idx === itemIdx; });
            if (!it || it.placedZone !== null) return; // already placed
            it.placedZone = category;
            it.correct = (it.category === category);

            // build the placed card with checkmark / X
            var card = el('div', 'sort-item', it.text);
            card.dataset.idx = it.idx;
            if (it.correct) {
                card.classList.add('correct');
                card.appendChild(el('span', null, ' ✓'));
                card.style.borderColor = '#00d4aa';
                card.style.color = '#00d4aa';
            } else {
                card.classList.add('wrong');
                card.appendChild(el('span', null, ' ✗'));
                card.style.borderColor = '#ff5757';
                card.style.color = '#ff5757';
            }
            zones[category].itemsBox.appendChild(card);

            renderPool();
            updateProgress();
            checkComplete();
        }

        function updateProgress() {
            var correctCount = items.filter(function (it) { return it.placedZone !== null && it.correct; }).length;
            var total = items.length;
            progress.textContent = 'Correct: ' + correctCount + ' / ' + total;
        }

        var completedCalled = false;
        function checkComplete() {
            var allPlaced = items.every(function (it) { return it.placedZone !== null; });
            if (allPlaced && !completedCalled) {
                completedCalled = true;
                var correctCount = items.filter(function (it) { return it.correct; }).length;
                var msg = el('div');
                msg.style.textAlign = 'center';
                msg.style.marginTop = '0.75rem';
                msg.style.fontWeight = '600';
                if (correctCount === items.length) {
                    msg.style.color = '#00d4aa';
                    msg.textContent = '🎉 Perfect! All ' + correctCount + ' correct!';
                } else {
                    msg.style.color = '#ff8c42';
                    msg.textContent = 'Done! You got ' + correctCount + ' / ' + items.length + ' correct. Red items are in the wrong zone.';
                }
                wrap.appendChild(msg);
                if (typeof onComplete === 'function') onComplete();
            }
        }

        renderPool();
        updateProgress();
    }

    // ==================================================================
    //
    //   INTERACTIVE EXERCISE 2 — classification-game
    //
    // ==================================================================

    /**
     * Quiz-like classification game: present items one at a time, user picks
     * one of three categories, get immediate feedback, advance automatically.
     */
    function renderClassificationGame(data, container, onComplete) {
        container.innerHTML = '';

        var wrap = el('div', 'classification-game');
        if (data.title) wrap.appendChild(el('h4', 'interactive-title', data.title));
        if (data.instructions) wrap.appendChild(el('p', 'interactive-instructions', data.instructions));

        var items = (data.items || []).slice();
        var current = 0;
        var score = 0;
        var completedCalled = false;

        // progress dots
        var dotsWrap = el('div');
        dotsWrap.style.display = 'flex';
        dotsWrap.style.gap = '6px';
        dotsWrap.style.flexWrap = 'wrap';
        wrap.appendChild(dotsWrap);

        var scoreLabel = el('div');
        scoreLabel.style.fontFamily = 'monospace';
        scoreLabel.style.color = '#9090b0';
        scoreLabel.style.fontSize = '0.85rem';
        wrap.appendChild(scoreLabel);

        var itemBox = el('div', 'game-item');
        wrap.appendChild(itemBox);

        var optionsWrap = el('div', 'game-options');
        wrap.appendChild(optionsWrap);

        container.appendChild(wrap);

        var CATEGORIES = [
            { key: 'supervised', label: 'Supervised' },
            { key: 'unsupervised', label: 'Unsupervised' },
            { key: 'reinforcement', label: 'Reinforcement Learning' }
        ];

        function renderDots() {
            dotsWrap.innerHTML = '';
            for (var i = 0; i < items.length; i++) {
                var dot = el('span');
                dot.style.width = '10px';
                dot.style.height = '10px';
                dot.style.borderRadius = '50%';
                dot.style.display = 'inline-block';
                if (i < current) {
                    dot.style.background = '#00d4aa';
                } else if (i === current) {
                    dot.style.background = '#7c5cff';
                } else {
                    dot.style.background = '#2a2f4a';
                }
                dotsWrap.appendChild(dot);
            }
        }

        var locked = false;

        function renderItem() {
            renderDots();
            scoreLabel.textContent = 'Score: ' + score + ' / ' + items.length + '   (Item ' + (current + 1) + ' of ' + items.length + ')';
            itemBox.innerHTML = '';
            optionsWrap.innerHTML = '';

            if (current >= items.length) {
                finish();
                return;
            }

            var it = items[current];
            itemBox.appendChild(el('p', 'game-scenario', it.text));

            // disable interaction while advancing
            locked = false;

            CATEGORIES.forEach(function (cat) {
                var btn = el('button', 'game-option', cat.label);
                btn.addEventListener('click', function () {
                    if (locked) return;
                    locked = true;
                    handleAnswer(cat.key, btn);
                });
                optionsWrap.appendChild(btn);
            });
        }

        function handleAnswer(answerKey, btn) {
            var it = items[current];
            var correct = (answerKey === it.category);
            if (correct) {
                btn.classList.add('correct');
                score++;
            } else {
                btn.classList.add('wrong');
                // highlight the correct option
                var btns = optionsWrap.querySelectorAll('.game-option');
                var correctIdx = CATEGORIES.findIndex(function (c) { return c.key === it.category; });
                if (correctIdx >= 0 && btns[correctIdx]) btns[correctIdx].classList.add('correct');
                // show correct answer text
                var note = el('p');
                note.style.color = '#ff8c42';
                note.style.fontSize = '0.85rem';
                note.style.marginTop = '0.6rem';
                note.textContent = 'Correct answer: ' + capitalize(it.category) + ' Learning';
                itemBox.appendChild(note);
            }
            // advance after delay
            setTimeout(function () {
                current++;
                renderItem();
            }, 1500);
        }

        function finish() {
            renderDots();
            scoreLabel.textContent = 'Final Score: ' + score + ' / ' + items.length;
            itemBox.innerHTML = '';
            var finalMsg = el('p');
            finalMsg.style.textAlign = 'center';
            finalMsg.style.fontSize = '1.1rem';
            finalMsg.style.fontWeight = '600';
            var pct = items.length ? Math.round(score / items.length * 100) : 0;
            if (pct === 100) {
                finalMsg.style.color = '#00d4aa';
                finalMsg.textContent = '🏆 Perfect! ' + score + '/' + items.length;
            } else if (pct >= 60) {
                finalMsg.style.color = '#4dabf7';
                finalMsg.textContent = '👍 Good job! ' + score + '/' + items.length + ' (' + pct + '%)';
            } else {
                finalMsg.style.color = '#ff8c42';
                finalMsg.textContent = '📚 Keep practicing! ' + score + '/' + items.length + ' (' + pct + '%)';
            }
            itemBox.appendChild(finalMsg);
            optionsWrap.innerHTML = '';

            if (!completedCalled) {
                completedCalled = true;
                if (typeof onComplete === 'function') onComplete();
            }
        }

        renderItem();
    }

    // ==================================================================
    //
    //   INTERACTIVE EXERCISE 3 — statistics-calculator
    //
    // ==================================================================

    /**
     * Interactive statistics calculator: parses comma-separated numbers and
     * computes count, mean, median, mode, range, variance, std dev, min,
     * max, Q1, Q3, IQR — plus a simple bar chart on canvas.
     */
    function renderStatisticsCalculator(data, container, onComplete) {
        container.innerHTML = '';

        var wrap = el('div', 'statistics-calculator');
        if (data.title) wrap.appendChild(el('h4', 'interactive-title', data.title));
        if (data.instructions) wrap.appendChild(el('p', 'interactive-instructions', data.instructions));

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'stats-input';
        input.placeholder = 'Enter numbers separated by commas, e.g. 4, 8, 15, 16, 23, 42';
        wrap.appendChild(input);

        var results = el('div', 'stats-results');
        wrap.appendChild(results);

        // bar chart canvas
        var canvas = el('canvas', 'viz-canvas');
        canvas.style.maxWidth = '500px';
        canvas.style.height = '200px';
        wrap.appendChild(canvas);
        container.appendChild(wrap);

        var view = setupCanvas(canvas, container, 500 / 200);
        var ctx = view.ctx, W = view.width, H = view.height;

        /**
         * Parse the input string into an array of numbers (ignoring blanks
         * and non-numeric tokens).
         */
        function parseNumbers(str) {
            if (!str) return [];
            return str.split(',')
                .map(function (s) { return s.trim(); })
                .filter(function (s) { return s.length > 0; })
                .map(function (s) { return parseFloat(s); })
                .filter(function (n) { return !isNaN(n) && isFinite(n); });
        }

        /** Compute the median of a sorted copy. */
        function medianOf(sorted) {
            var n = sorted.length;
            if (n === 0) return NaN;
            if (n % 2 === 1) return sorted[(n - 1) / 2];
            return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
        }

        /** Quantile via linear interpolation (type 2 / Excel-like). */
        function quantile(sorted, q) {
            var n = sorted.length;
            if (n === 0) return NaN;
            if (n === 1) return sorted[0];
            var pos = (n - 1) * q;
            var lo = Math.floor(pos);
            var hi = Math.ceil(pos);
            if (lo === hi) return sorted[lo];
            return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
        }

        function computeStats(nums) {
            var n = nums.length;
            if (n === 0) return null;
            var sorted = nums.slice().sort(function (a, b) { return a - b; });
            var sum = sorted.reduce(function (a, b) { return a + b; }, 0);
            var mean = sum / n;
            var med = medianOf(sorted);
            var min = sorted[0];
            var max = sorted[n - 1];
            var range = max - min;
            // variance (population): Σ(x-μ)² / n
            var sqDiff = 0;
            for (var i = 0; i < n; i++) sqDiff += (sorted[i] - mean) * (sorted[i] - mean);
            var variance = sqDiff / n;
            var std = Math.sqrt(variance);
            var q1 = quantile(sorted, 0.25);
            var q3 = quantile(sorted, 0.75);
            var iqr = q3 - q1;

            // mode: most frequent value(s)
            var freq = {};
            var best = 0, modes = [];
            for (var k = 0; k < n; k++) {
                var v = sorted[k];
                freq[v] = (freq[v] || 0) + 1;
                if (freq[v] > best) best = freq[v];
            }
            for (var key in freq) {
                if (freq[key] === best) modes.push(parseFloat(key));
            }
            // if all values unique, no mode
            var mode = (best === 1) ? 'None' : modes.sort(function (a, b) { return a - b; }).join(', ');

            return {
                count: n, mean: mean, median: med, mode: mode, range: range,
                variance: variance, std: std, min: min, max: max,
                q1: q1, q3: q3, iqr: iqr
            };
        }

        function statCard(name, value) {
            var card = el('div', 'stat-result');
            card.appendChild(el('div', 'stat-name', name));
            card.appendChild(el('div', 'stat-value', value));
            return card;
        }

        function renderStats(stats) {
            results.innerHTML = '';
            if (!stats) {
                results.appendChild(statCard('Count', '0'));
                ['Mean', 'Median', 'Mode', 'Range', 'Variance', 'Std Dev', 'Min', 'Max', 'Q1', 'Q3', 'IQR']
                    .forEach(function (n) { results.appendChild(statCard(n, '—')); });
                return;
            }
            results.appendChild(statCard('Count', String(stats.count)));
            results.appendChild(statCard('Mean', fmt(stats.mean)));
            results.appendChild(statCard('Median', fmt(stats.median)));
            results.appendChild(statCard('Mode', stats.mode));
            results.appendChild(statCard('Range', fmt(stats.range)));
            results.appendChild(statCard('Variance', fmt(stats.variance)));
            results.appendChild(statCard('Std Dev', fmt(stats.std)));
            results.appendChild(statCard('Min', fmt(stats.min)));
            results.appendChild(statCard('Max', fmt(stats.max)));
            results.appendChild(statCard('Q1', fmt(stats.q1)));
            results.appendChild(statCard('Q3', fmt(stats.q3)));
            results.appendChild(statCard('IQR', fmt(stats.iqr)));
        }

        function drawBarChart(nums) {
            ctx.clearRect(0, 0, W, H);
            // background
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(0, 0, W, H);

            if (!nums.length) {
                ctx.fillStyle = '#606080';
                ctx.font = '13px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Enter numbers to see a bar chart', W / 2, H / 2);
                return;
            }
            if (nums.length === 1) {
                // single value
                drawBars(nums);
                return;
            }
            drawBars(nums);
        }

        function drawBars(nums) {
            var padL = 32, padR = 8, padT = 12, padB = 24;
            var plotW = W - padL - padR;
            var plotH = H - padT - padB;
            var min = Math.min.apply(null, nums);
            var max = Math.max.apply(null, nums);
            if (min === max) { min = min - 1; max = max + 1; }
            // include zero baseline if range straddles it
            var lo = Math.min(0, min);
            var hi = Math.max(0, max);
            var span = hi - lo || 1;

            function valY(v) {
                return padT + plotH - ((v - lo) / span) * plotH;
            }
            // zero line
            var zeroY = valY(0);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padL, zeroY); ctx.lineTo(W - padR, zeroY);
            ctx.stroke();

            // y-axis labels (min, mid, max)
            ctx.fillStyle = '#606080';
            ctx.font = '9px monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(fmt(hi), padL - 4, padT);
            ctx.fillText(fmt(lo), padL - 4, padT + plotH);

            var n = nums.length;
            var gap = 4;
            var bw = Math.max(2, (plotW - gap * (n - 1)) / n);
            for (var i = 0; i < n; i++) {
                var x = padL + i * (bw + gap);
                var y = valY(nums[i]);
                var h = zeroY - y;
                // color: positive green-ish, negative red-ish
                ctx.fillStyle = nums[i] >= 0 ? '#00d4aa' : '#ff5757';
                ctx.fillRect(x, Math.min(zeroY, y), bw, Math.abs(h));
                // value label above/below bar
                ctx.fillStyle = '#9090b0';
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = h >= 0 ? 'bottom' : 'top';
                ctx.fillText(fmt(nums[i]), x + bw / 2, h >= 0 ? y - 2 : y + 2);
            }
        }

        var completedCalled = false;
        function update() {
            var nums = parseNumbers(input.value);
            var stats = computeStats(nums);
            renderStats(stats);
            drawBarChart(nums);
            // mark complete once the user has entered at least 3 numbers
            if (nums.length >= 3 && !completedCalled) {
                completedCalled = true;
                if (typeof onComplete === 'function') onComplete();
            }
        }

        input.addEventListener('input', update);

        // initial render
        update();

        // resize
        var resizeRan = false;
        window.addEventListener('resize', function () {
            if (resizeRan) return;
            resizeRan = true;
            requestAnimationFrame(function () {
                resizeRan = false;
                var nv = setupCanvas(canvas, container, 500 / 200);
                W = nv.width; H = nv.height; ctx = nv.ctx;
                update();
            });
        });
    }

    // ==================================================================
    //
    //   INTERACTIVE EXERCISE 4 — coin-flip-simulator
    //
    // ==================================================================

    /**
     * Probability convergence simulator: flip a coin, track heads/tails and
     * the heads percentage, and plot its convergence toward 50% on a chart.
     */
    function renderCoinFlipSimulator(data, container, onComplete) {
        container.innerHTML = '';

        var wrap = el('div', 'coin-flip-simulator');
        if (data.title) wrap.appendChild(el('h4', 'interactive-title', data.title));
        if (data.instructions) wrap.appendChild(el('p', 'interactive-instructions', data.instructions));

        // coin display
        var coin = el('div', 'coin-display', '🪙');
        wrap.appendChild(coin);

        // controls
        var controls = el('div', 'coin-controls');
        var flipOnce = controlButton('Flip Once', function () { flip(1); });
        var flip10 = controlButton('Flip 10×', function () { flip(10); });
        var flip100 = controlButton('Flip 100×', function () { flip(100); });
        var resetBtn = controlButton('Reset', function () { reset(); });
        controls.appendChild(flipOnce);
        controls.appendChild(flip10);
        controls.appendChild(flip100);
        controls.appendChild(resetBtn);
        wrap.appendChild(controls);

        // stats
        var stats = el('div', 'coin-stats');
        function statItem(name, valId) {
            var item = el('div', 'coin-stat-item');
            item.appendChild(el('div', 'stat-name', name));
            item.appendChild(el('div', 'stat-value', '0'));
            item.dataset.id = valId;
            return item;
        }
        var totalEl = statItem('Total Flips', 'total');
        var headsEl = statItem('Heads', 'heads');
        var tailsEl = statItem('Tails', 'tails');
        var pctEl = statItem('Heads %', 'pct');
        stats.appendChild(totalEl);
        stats.appendChild(headsEl);
        stats.appendChild(tailsEl);
        stats.appendChild(pctEl);
        wrap.appendChild(stats);

        // convergence chart canvas
        var canvas = el('canvas', 'viz-canvas');
        canvas.style.maxWidth = '600px';
        canvas.style.height = '300px';
        wrap.appendChild(canvas);
        container.appendChild(wrap);

        var view = setupCanvas(canvas, container, 600 / 300);
        var ctx = view.ctx, W = view.width, H = view.height;

        var state = { total: 0, heads: 0, tails: 0, history: [] }; // history: heads% per flip count
        var completedCalled = false;

        function setStat(id, val) {
            var node = stats.querySelector('[data-id="' + id + '"] .stat-value');
            if (node) node.textContent = val;
        }

        function updateStats() {
            setStat('total', state.total);
            setStat('heads', state.heads);
            setStat('tails', state.tails);
            setStat('pct', state.total ? fmt((state.heads / state.total) * 100) + '%' : '0%');
        }

        function flip(count) {
            for (var i = 0; i < count; i++) {
                var isHead = Math.random() < 0.5;
                state.total++;
                if (isHead) state.heads++; else state.tails++;
                var pct = (state.heads / state.total) * 100;
                state.history.push(pct);
            }
            // Animate the coin briefly. Emoji can't show heads vs tails
            // distinctly, so we keep 🪙 and let the flip animation provide
            // the visual feedback.
            coin.classList.remove('flipping');
            // force reflow so the CSS animation restarts on rapid flips
            void coin.offsetWidth;
            coin.classList.add('flipping');
            coin.textContent = '🪙';

            updateStats();
            drawChart();

            // completion after 100+ flips
            if (state.total >= 100 && !completedCalled) {
                completedCalled = true;
                if (typeof onComplete === 'function') onComplete();
            }
        }

        function reset() {
            state = { total: 0, heads: 0, tails: 0, history: [] };
            completedCalled = false;
            updateStats();
            drawChart();
        }

        function drawChart() {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(0, 0, W, H);

            var padL = 44, padR = 12, padT = 12, padB = 28;
            var plotW = W - padL - padR;
            var plotH = H - padT - padB;

            // grid + y labels (0,25,50,75,100)
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.fillStyle = '#606080';
            ctx.font = '9px monospace';
            ctx.lineWidth = 1;
            for (var p = 0; p <= 100; p += 25) {
                var y = padT + plotH - (p / 100) * plotH;
                ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
                ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
                ctx.fillText(p + '%', padL - 4, y);
            }

            // x-axis label
            ctx.fillStyle = '#606080';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.font = '9px monospace';
            ctx.fillText('Number of flips', padL + plotW / 2, H - padB + 14);

            // dashed line at 50%
            var y50 = padT + plotH - (50 / 100) * plotH;
            ctx.strokeStyle = 'rgba(255,140,66,0.7)';
            ctx.setLineDash([5, 4]);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(padL, y50); ctx.lineTo(W - padR, y50);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ff8c42';
            ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
            ctx.fillText('50% (theoretical)', padL + 4, y50 - 2);

            // convergence line
            if (state.history.length > 1) {
                var n = state.history.length;
                ctx.strokeStyle = '#00d4aa';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (var i = 0; i < n; i++) {
                    var pxv = padL + (i / (n - 1)) * plotW;
                    var pyv = padT + plotH - (state.history[i] / 100) * plotH;
                    if (i === 0) ctx.moveTo(pxv, pyv);
                    else ctx.lineTo(pxv, pyv);
                }
                ctx.stroke();

                // current point marker
                var lastX = padL + plotW;
                var lastY = padT + plotH - (state.history[n - 1] / 100) * plotH;
                ctx.fillStyle = '#00f0c0';
                ctx.beginPath();
                ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (state.history.length === 1) {
                var sy = padT + plotH - (state.history[0] / 100) * plotH;
                ctx.fillStyle = '#00f0c0';
                ctx.beginPath();
                ctx.arc(padL, sy, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // axes
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(W - padR, padT + plotH);
            ctx.stroke();
        }

        // click the coin to flip once
        coin.addEventListener('click', function () { flip(1); });

        updateStats();
        drawChart();

        // resize
        var resizeRan = false;
        window.addEventListener('resize', function () {
            if (resizeRan) return;
            resizeRan = true;
            requestAnimationFrame(function () {
                resizeRan = false;
                var nv = setupCanvas(canvas, container, 600 / 300);
                W = nv.width; H = nv.height; ctx = nv.ctx;
                drawChart();
            });
        });
    }

    // ==================================================================
    //
    //   PUBLIC API
    //
    // ==================================================================

    /** Visualization renderers keyed by vizId. */
    var vizRenderers = {
        'traditional-vs-ml': renderTraditionalVsML,
        'linear-regression-fit': renderLinearRegression,
        'gradient-descent-3d': renderGradientDescent,
        'decision-boundary': renderDecisionBoundary
    };

    /** Interactive exercise renderers keyed by type. */
    var interactiveRenderers = {
        'sorting-exercise': renderSortingExercise,
        'classification-game': renderClassificationGame,
        'statistics-calculator': renderStatisticsCalculator,
        'coin-flip-simulator': renderCoinFlipSimulator
    };

    /**
     * Render a visualization into a container by its vizId.
     *
     * @param {string} vizId - The visualization section's 'id' field.
     * @param {HTMLElement} container - DOM element to render into.
     */
    function render(vizId, container) {
        if (!container) return;
        cancelAnimationFor(container);
        container.innerHTML = '';
        var renderer = vizRenderers[vizId];
        if (renderer) {
            renderer(container);
        } else {
            renderPlaceholder(container, 'Visualization coming soon: ' + vizId);
        }
    }

    /**
     * Render an interactive exercise into a container.
     *
     * @param {object} interactiveData - The topic's 'interactive' object.
     * @param {HTMLElement} container - DOM element to render into.
     * @param {Function} [onComplete] - Callback when the exercise is completed.
     */
    function renderInteractive(interactiveData, container, onComplete) {
        if (!container) return;
        cancelAnimationFor(container);
        container.innerHTML = '';
        var type = interactiveData && interactiveData.type;
        var renderer = interactiveRenderers[type];
        if (renderer) {
            renderer(interactiveData, container, onComplete);
        } else {
            renderPlaceholder(container, 'Interactive exercise coming soon: ' + (type || 'unknown'));
        }
    }

    /**
     * Render a placeholder message for unsupported viz/interactive ids.
     */
    function renderPlaceholder(container, message) {
        var box = el('div', 'viz-canvas');
        box.style.display = 'flex';
        box.style.alignItems = 'center';
        box.style.justifyContent = 'center';
        box.style.minHeight = '120px';
        box.style.color = '#9090b0';
        box.style.fontStyle = 'italic';
        box.textContent = message;
        container.appendChild(box);
    }

    // Expose the public API on window.Visualizations.
    window.Visualizations = {
        render: render,
        renderInteractive: renderInteractive
    };
})();
