/**
 * ML Odyssey — Main SPA Controller
 * ---------------------------------------------------------------------------
 * Ties together all modules (ProgressTracker, QuizEngine, CodePlayground,
 * Visualizations) and implements hash-based routing for the single-page app.
 *
 * Routes:
 *   #home                         — landing page (hero, stats, level overview)
 *   #levels                       — grid of all levels
 *   #level/{levelId}              — level detail page with topic list
 *   #topic/{levelId}/{topicId}    — topic detail with tabbed sections
 *   #progress                     — progress dashboard
 *
 * Exposed globally as `window.App` and `window.showToast`.
 * ---------------------------------------------------------------------------
 */

(function () {
    'use strict';

    // ------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------

    /** Parsed topics data from /api/topics (the full registry). */
    var topicsData = null;

    /** Flat lookup map: { "levelId:topicId" → { topic, level } } for fast access. */
    var topicMap = {};

    /** Total number of topics across all levels (for progress calculations). */
    var totalTopics = 0;

    /** Current active route name for nav highlighting. */
    var currentRoute = 'home';

    // ------------------------------------------------------------------
    // DOM references (cached on init)
    // ------------------------------------------------------------------
    var appContent = null;
    var loadingScreen = null;
    var toastContainer = null;

    // ------------------------------------------------------------------
    // Toast Notifications
    // ------------------------------------------------------------------

    /**
     * Show a toast notification.
     *
     * @param {string} message - Text to display.
     * @param {'success'|'error'|'info'|'warning'} [type='info']
     */
    function showToast(message, type) {
        type = type || 'info';
        if (!toastContainer) {
            console.warn('[App] Toast container not found:', message);
            return;
        }

        var icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

        var toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.innerHTML =
            '<span class="toast-icon">' + (icons[type] || 'ℹ') + '</span>' +
            '<span class="toast-message"></span>';
        toast.querySelector('.toast-message').textContent = message;

        toastContainer.appendChild(toast);

        // Auto-dismiss after 4s with CSS fade-out animation.
        setTimeout(function () {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', function () {
                toast.remove();
            });
        }, 4000);
    }

    // Expose globally so other modules can reuse the same implementation.
    window.showToast = showToast;

    // ------------------------------------------------------------------
    // Utility helpers
    // ------------------------------------------------------------------

    /**
     * Create a DOM element with optional class and content.
     *
     * @param {string} tag    - HTML tag name.
     * @param {string} [className] - CSS class(es) to apply.
     * @returns {HTMLElement}
     */
    function el(tag, className) {
        var node = document.createElement(tag);
        if (className) {
            node.className = className;
        }
        return node;
    }

    /**
     * Escape HTML special characters in a string to prevent XSS.
     *
     * @param {string} text
     * @returns {string}
     */
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    /**
     * Check if a line is a markdown table separator row, e.g. |---|---| or |:---:|---:|
     *
     * @param {string} line
     * @returns {boolean}
     */
    function isSeparatorRow(line) {
        var trimmed = (line || '').trim();
        return /^[\s|\-:]+$/.test(trimmed) && trimmed.indexOf('|') !== -1 && trimmed.indexOf('-') !== -1;
    }

    /**
     * Check if a table starts at lines[idx].
     * A table requires line idx to contain '|' and line idx+1 to be a separator row.
     *
     * @param {string[]} lines
     * @param {number} idx
     * @returns {boolean}
     */
    function isTableStart(lines, idx) {
        if (idx + 1 >= lines.length) return false;
        var line = lines[idx];
        var nextLine = lines[idx + 1];
        return /\|/.test(line) && isSeparatorRow(nextLine);
    }

    /**
     * Render a LaTeX string using KaTeX if available, or a clean readable unicode fallback.
     *
     * @param {string} latex - Raw LaTeX string without delimiters.
     * @param {boolean} displayMode - True for display/block math, false for inline math.
     * @returns {string} HTML string.
     */
    function renderMathToString(latex, displayMode) {
        var trimmed = (latex || '').trim();
        if (!trimmed) return '';

        // If KaTeX is loaded, render to crisp HTML
        if (typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function') {
            try {
                return window.katex.renderToString(trimmed, {
                    displayMode: displayMode,
                    throwOnError: false
                });
            } catch (err) {
                console.warn('KaTeX render error:', err);
            }
        }

        // Clean fallback: format common LaTeX into beautiful readable unicode math
        var clean = trimmed
            .replace(/\\text\{([^}]+)\}/g, '$1')
            .replace(/\\mathbf\{([^}]+)\}/g, '<strong>$1</strong>')
            .replace(/\\mathit\{([^}]+)\}/g, '<em>$1</em>')
            .replace(/\\mathbb\{R\}/g, 'ℝ')
            .replace(/\\longrightarrow|\\rightarrow/g, ' ➔ ')
            .replace(/\\longleftarrow|\\leftarrow/g, ' ⬅ ')
            .replace(/\\times/g, ' × ')
            .replace(/\\approx/g, ' ≈ ')
            .replace(/\\le|\\leq/g, ' ≤ ')
            .replace(/\\ge|\\geq/g, ' ≥ ')
            .replace(/\\pm/g, ' ± ')
            .replace(/\\neq/g, ' ≠ ')
            .replace(/\\infty/g, '∞')
            .replace(/\\pi/g, 'π')
            .replace(/\\sigma/g, 'σ')
            .replace(/\\mu/g, 'μ')
            .replace(/\\alpha/g, 'α')
            .replace(/\\beta/g, 'β')
            .replace(/\\epsilon/g, 'ε')
            .replace(/\\theta/g, 'θ')
            .replace(/\\lambda/g, 'λ')
            .replace(/\\sum/g, '∑')
            .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');

        if (displayMode) {
            return '<div class="math-display-fallback">' + clean + '</div>';
        } else {
            return '<span class="math-inline-fallback">' + clean + '</span>';
        }
    }

    /**
     * Extract display ($$...$$) and inline ($...$) math from markdown content.
     * Prevents currency like $300,000 from being mangled.
     *
     * @param {string} content
     * @returns {{text: string, tokens: Array}}
     */
    function extractMath(content) {
        var mathTokens = [];
        if (!content) return { text: '', tokens: mathTokens };

        // 1. Display math: $$ ... $$
        var text = content.replace(/\$\$([\s\S]+?)\$\$/g, function (match, math) {
            var token = '@@MATH_DISPLAY_' + mathTokens.length + '@@';
            mathTokens.push({ type: 'display', math: math });
            return '\n' + token + '\n';
        });

        // 2. Inline math: $ ... $ (excluding currency like $300,000 or $450)
        text = text.replace(/(^|[^\$])\$([^\$\s](?:[^\$\n]*?[^\$\s])?)\$(?!\$)/g, function (match, prefix, math) {
            if (/^\d[\d,]*(\.\d+)?$/.test(math.trim())) {
                return match; // currency
            }
            var token = '@@MATH_INLINE_' + mathTokens.length + '@@';
            mathTokens.push({ type: 'inline', math: math });
            return prefix + token;
        });

        return { text: text, tokens: mathTokens };
    }

    /**
     * Restore and render extracted math tokens in the generated HTML.
     *
     * @param {string} html
     * @param {Array} mathTokens
     * @returns {string}
     */
    function restoreMath(html, mathTokens) {
        if (!html || !mathTokens || !mathTokens.length) return html || '';
        return html.replace(/@@MATH_(DISPLAY|INLINE)_(\d+)@@/g, function (match, kind, idx) {
            var token = mathTokens[parseInt(idx, 10)];
            if (!token) return match;
            return renderMathToString(token.math, token.type === 'display');
        });
    }

    /**
     * Auto-render math inside an element using KaTeX if available.
     *
     * @param {HTMLElement} [elem]
     */
    function renderMath(elem) {
        var target = elem || document.getElementById('app-content');
        if (!target) return;
        if (typeof window !== 'undefined' && window.renderMathInElement) {
            try {
                window.renderMathInElement(target, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
                    throwOnError: false
                });
            } catch (err) {
                console.warn('Auto-render math error:', err);
            }
        }
    }

    /**
     * Parse simple markdown-like formatting into safe HTML.
     * Supports: tables, lists (- or numbered), code blocks, bold, italic, code, and paragraphs.
     * Does NOT support raw HTML — all user content is escaped first.
     *
     * @param {string} content - Raw text from topics.json.
     * @returns {string} Safe HTML string.
     */
    function parseMarkdown(content) {
        if (!content) return '';

        var extracted = extractMath(content);
        var text = extracted.text;
        var mathTokens = extracted.tokens;

        var lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        var html = [];
        var i = 0;

        while (i < lines.length) {
            var line = lines[i];

            // 1. Skip blank lines
            if (line.trim() === '') {
                i++;
                continue;
            }

            // 2. Display math placeholder on its own line
            if (/^\s*@@MATH_DISPLAY_\d+@@\s*$/.test(line)) {
                html.push(restoreMath(line.trim(), mathTokens));
                i++;
                continue;
            }

            // 3. Detect markdown table
            if (isTableStart(lines, i)) {
                var tableLines = [];
                while (i < lines.length && /\|/.test(lines[i])) {
                    tableLines.push(lines[i]);
                    i++;
                }
                html.push(restoreMath(parseTable(tableLines), mathTokens));
                continue;
            }

            // 4. Detect code block (```)
            if (/^\s*```/.test(line)) {
                var codeLines = [];
                i++;
                while (i < lines.length && !/^\s*```/.test(lines[i])) {
                    codeLines.push(lines[i]);
                    i++;
                }
                if (i < lines.length) i++;
                html.push('<pre class="md-code-block"><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
                continue;
            }

            // 5. Detect unordered list (- or *)
            if (/^\s*[-*]\s+/.test(line)) {
                var listItems = [];
                while (i < lines.length) {
                    if (/^\s*[-*]\s+/.test(lines[i])) {
                        var itemLines = [lines[i].replace(/^\s*[-*]\s+/, '')];
                        i++;
                        // Collect continuation/indented lines
                        while (i < lines.length && /^\s{2,}/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])) {
                            itemLines.push(lines[i].trim());
                            i++;
                        }
                        var itemHtml = itemLines.map(function (il) {
                            return formatInline(escapeHtml(il));
                        }).join('<br>');
                        listItems.push('<li>' + restoreMath(itemHtml, mathTokens) + '</li>');
                    } else {
                        break;
                    }
                }
                html.push('<ul>' + listItems.join('') + '</ul>');
                continue;
            }

            // 6. Detect ordered list (1. 2. etc.)
            if (/^\s*\d+\.\s+/.test(line)) {
                var ordItems = [];
                while (i < lines.length) {
                    if (/^\s*\d+\.\s+/.test(lines[i])) {
                        var oLines = [lines[i].replace(/^\s*\d+\.\s+/, '')];
                        i++;
                        while (i < lines.length && /^\s{2,}/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i])) {
                            oLines.push(lines[i].trim());
                            i++;
                        }
                        var oHtml = oLines.map(function (ol) {
                            return formatInline(escapeHtml(ol));
                        }).join('<br>');
                        ordItems.push('<li>' + restoreMath(oHtml, mathTokens) + '</li>');
                    } else {
                        break;
                    }
                }
                html.push('<ol>' + ordItems.join('') + '</ol>');
                continue;
            }

            // 7. Regular paragraph
            var paraLines = [];
            while (i < lines.length) {
                var cur = lines[i];
                if (cur.trim() === '') break;
                if (/^\s*@@MATH_DISPLAY_\d+@@\s*$/.test(cur)) break;
                if (isTableStart(lines, i)) break;
                if (/^\s*```/.test(cur) || /^\s*[-*]\s+/.test(cur) || /^\s*\d+\.\s+/.test(cur)) {
                    break;
                }
                paraLines.push(cur);
                i++;
            }

            if (paraLines.length > 0) {
                var paraHtml = paraLines.map(function (l) {
                    return formatInline(escapeHtml(l));
                }).join('<br>');
                html.push('<p>' + restoreMath(paraHtml, mathTokens) + '</p>');
            }
        }

        return html.join('');
    }

    /**
     * Parse a markdown table block into an HTML <table>.
     *
     * Expected format:
     *   | Header1 | Header2 |
     *   |---|---|
     *   | Cell1   | Cell2   |
     *
     * @param {string[]} lines - Lines of the table block.
     * @returns {string} HTML <table> string.
     */
    function parseTable(lines) {
        if (!lines || lines.length < 2) return '';

        // Extract header cells from line 0.
        var headerCells = splitTableRow(lines[0]);

        // Skip line 1 (separator row).
        // Extract body rows from line 2 onward.
        var bodyRows = [];
        for (var i = 2; i < lines.length; i++) {
            var cells = splitTableRow(lines[i]);
            if (cells.length > 0 && cells.some(function (c) { return c !== ''; })) {
                bodyRows.push(cells);
            }
        }

        var html = '<div class="md-table-wrap"><table class="md-table">';

        // Header row.
        html += '<thead><tr>';
        headerCells.forEach(function (cell) {
            html += '<th>' + formatInline(escapeHtml(cell)) + '</th>';
        });
        html += '</tr></thead>';

        // Body rows.
        if (bodyRows.length > 0) {
            html += '<tbody>';
            bodyRows.forEach(function (row) {
                html += '<tr>';
                for (var c = 0; c < headerCells.length; c++) {
                    var cellText = (c < row.length) ? row[c] : '';
                    html += '<td>' + formatInline(escapeHtml(cellText)) + '</td>';
                }
                html += '</tr>';
            });
            html += '</tbody>';
        }

        html += '</table></div>';
        return html;
    }

    /**
     * Split a markdown table row into cell values.
     * Handles leading/trailing pipes and whitespace trimming.
     *
     * @param {string} line - e.g. "| A | B |" or "A | B"
     * @returns {string[]} Array of cell strings.
     */
    function splitTableRow(line) {
        var trimmed = (line || '').trim();
        // Remove leading/trailing pipes.
        if (trimmed.charAt(0) === '|') trimmed = trimmed.substring(1);
        if (trimmed.charAt(trimmed.length - 1) === '|') trimmed = trimmed.substring(0, trimmed.length - 1);
        return trimmed.split('|').map(function (c) {
            return c.trim();
        });
    }

    /**
     * Apply inline formatting (`code`, **bold**, *italic*) to already-escaped text.
     * Called after escapeHtml so the markers survive escaping.
     *
     * @param {string} text - Already-escaped text.
     * @returns {string}
     */
    function formatInline(text) {
        if (!text) return '';
        // Inline code: `code` → <code class="inline-code">code</code>
        text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        // Bold: **text** → <strong>text</strong>
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic: *text* (when not inside bold)
        text = text.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, '$1<em>$2</em>$3');
        return text;
    }

    /**
     * Format text: parse markdown safely.
     *
     * @param {string} text
     * @returns {string}
     */
    function formatText(text) {
        return parseMarkdown(text);
    }

    /**
     * Scroll to top of the page (used on route change).
     */
    function scrollTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Show the loading screen.
     */
    function showLoading() {
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    /**
     * Hide the loading screen.
     */
    function hideLoading() {
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    /**
     * Show an error message in the main content area.
     *
     * @param {string} message
     */
    function showError(message) {
        if (!appContent) return;
        appContent.innerHTML =
            '<div class="topic-detail" style="text-align:center;padding:4rem 1rem;">' +
            '<div style="font-size:3rem;margin-bottom:1rem;">😕</div>' +
            '<h2 style="color:var(--text-primary);margin-bottom:0.75rem;">Something went wrong</h2>' +
            '<p style="color:var(--text-secondary);margin-bottom:1.5rem;">' +
            escapeHtml(message) + '</p>' +
            '<button class="btn btn-primary" onclick="location.hash=\'#home\'">' +
            'Back to Home</button></div>';
    }

    // ------------------------------------------------------------------
    // Data loading
    // ------------------------------------------------------------------

    /**
     * Fetch the topics registry from the API and build the lookup map.
     *
     * @returns {Promise<void>}
     */
    function loadTopics() {
        return fetch('/api/topics')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Failed to load topics (status ' + response.status + ')');
                }
                return response.json();
            })
            .then(function (data) {
                topicsData = data;
                topicMap = {};
                totalTopics = 0;

                (data.levels || []).forEach(function (level) {
                    (level.topics || []).forEach(function (topic) {
                        var key = level.id + ':' + topic.id;
                        topicMap[key] = { topic: topic, level: level };
                        totalTopics++;
                    });
                });

                // Update the nav progress bar now that we know total topics.
                if (window.ProgressTracker) {
                    ProgressTracker.updateNavProgress(totalTopics);
                }
            })
            .catch(function (err) {
                console.error('[App] Failed to load topics:', err);
                throw err;
            });
    }

    /**
     * Fetch a single topic's full content from the API.
     * (The /api/topics endpoint already returns full content, but the
     * dedicated endpoint ensures we always have complete data.)
     *
     * @param {string} levelId
     * @param {string} topicId
     * @returns {Promise<object>}
     */
    function fetchTopic(levelId, topicId) {
        return fetch('/api/topic/' + levelId + '/' + topicId)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Topic not found');
                }
                return response.json();
            });
    }

    // ------------------------------------------------------------------
    // Navigation
    // ------------------------------------------------------------------

    /**
     * Update the active state of nav links based on the current route.
     *
     * @param {string} route - The base route name (home, levels, progress).
     */
    function updateNavActive(route) {
        currentRoute = route;
        var links = document.querySelectorAll('.nav-link');
        links.forEach(function (link) {
            var linkRoute = link.getAttribute('data-route');
            if (linkRoute === route) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Navigate to a route by setting the hash.
     *
     * @param {string} hash - e.g. "home", "levels", "level/novice", "topic/novice/what-is-ml"
     */
    function navigate(hash) {
        if (hash.charAt(0) === '#') {
            hash = hash.substring(1);
        }
        location.hash = '#' + hash;
    }

    /**
     * Parse the current location hash into route segments.
     *
     * @returns {{ route: string, params: string[] }}
     */
    function parseHash() {
        var hash = location.hash.replace(/^#/, '');

        // Default to home.
        if (!hash) {
            return { route: 'home', params: [] };
        }

        var parts = hash.split('/');
        return {
            route: parts[0],
            params: parts.slice(1)
        };
    }

    // ------------------------------------------------------------------
    // Route handlers
    // ------------------------------------------------------------------

    /**
     * Master router — called on every hash change.
     */
    function router() {
        var parsed = parseHash();
        var route = parsed.route;
        var params = parsed.params;

        // Map route to nav highlight.
        var navMap = {
            'home': 'home',
            'levels': 'levels',
            'level': 'levels',
            'topic': 'levels',  // topic view is under Levels nav
            'progress': 'progress'
        };
        updateNavActive(navMap[route] || 'home');

        scrollTop();

        switch (route) {
            case 'home':
                renderHome();
                break;
            case 'levels':
                renderLevels();
                break;
            case 'level':
                if (params.length >= 1) {
                    renderLevelDetail(params[0]);
                } else {
                    navigate('levels');
                }
                break;
            case 'topic':
                if (params.length >= 2) {
                    renderTopicDetail(params[0], params[1]);
                } else {
                    navigate('levels');
                }
                break;
            case 'progress':
                renderProgress();
                break;
            default:
                renderHome();
        }
    }

    // ------------------------------------------------------------------
    // Home page
    // ------------------------------------------------------------------

    function renderHome() {
        if (!topicsData) {
            showError('Topics data not loaded. Please refresh the page.');
            return;
        }

        var levels = topicsData.levels || [];
        var overall = window.ProgressTracker
            ? ProgressTracker.getOverallProgress(totalTopics)
            : { completed: 0, total: totalTopics, percentage: 0 };

        var html = '';

        // Hero section.
        html += '<section class="hero-section fade-in">';
        html +=   '<h1 class="hero-title">ML Odyssey</h1>';
        html +=   '<p class="hero-subtitle">Master machine learning from novice to professional ' +
                  'through interactive lessons, code playgrounds, visualizations, and quizzes.</p>';
        html +=   '<div>';
        html +=     '<button class="btn btn-primary btn-large" data-nav="levels">Start Learning →</button>';
        html +=     '<button class="btn btn-secondary btn-large" data-nav="progress">View Progress</button>';
        html +=   '</div>';
        html += '</section>';

        // Stats grid.
        html += '<div class="stats-grid fade-in">';
        html +=   '<div class="stat-card"><div style="font-size:2rem;font-weight:700;color:var(--primary);">' +
                  totalTopics + '</div><div style="font-size:0.85rem;color:var(--text-muted);">Topics</div></div>';
        html +=   '<div class="stat-card"><div style="font-size:2rem;font-weight:700;color:var(--secondary);">' +
                  levels.length + '</div><div style="font-size:0.85rem;color:var(--text-muted);">Levels</div></div>';
        html +=   '<div class="stat-card"><div style="font-size:2rem;font-weight:700;color:var(--level-intermediate);">' +
                  overall.percentage + '%</div><div style="font-size:0.85rem;color:var(--text-muted);">Completed</div></div>';
        html +=   '<div class="stat-card"><div style="font-size:2rem;font-weight:700;color:var(--level-beginner);">' +
                  overall.completed + '/' + overall.total + '</div><div style="font-size:0.85rem;color:var(--text-muted);">Topics Done</div></div>';
        html += '</div>';

        // Level overview cards.
        html += '<h2 class="section-title fade-in" style="text-align:center;margin-top:2rem;">Learning Path</h2>';
        html += '<div class="level-grid fade-in">';
        levels.forEach(function (level) {
            var topicCount = (level.topics || []).length;
            var progress = window.ProgressTracker
                ? ProgressTracker.getLevelProgress(level.id, topicCount)
                : { completed: 0, total: topicCount, percentage: 0 };

            html += '<div class="level-card" data-level="' + level.id + '" data-nav="level/' + level.id + '">';
            html +=   '<div class="level-card-header">';
            html +=     '<span class="level-icon">' + (level.icon || '📦') + '</span>';
            html +=     '<div>';
            html +=       '<div class="level-name">' + escapeHtml(level.name) + '</div>';
            html +=       '<div class="level-subtitle">' + escapeHtml(level.subtitle || '') + '</div>';
            html +=     '</div>';
            html +=     '<span class="level-topics-count">' + topicCount + ' topics</span>';
            html +=   '</div>';
            html +=   '<div class="level-card-body">';
            html +=     '<p class="level-description">' + escapeHtml(level.description || '') + '</p>';
            html +=   '</div>';
            html +=   '<div class="level-card-footer">';
            html +=     '<div class="level-progress-text">';
            html +=       '<span>' + progress.completed + ' / ' + progress.total + ' completed</span>';
            html +=       '<span>' + progress.percentage + '%</span>';
            html +=     '</div>';
            html +=     '<div class="level-progress-bar"><div style="width:' + progress.percentage + '%"></div></div>';
            html +=   '</div>';
            html += '</div>';
        });
        html += '</div>';

        appContent.innerHTML = html;
        attachNavClicks();
    }

    // ------------------------------------------------------------------
    // Levels page
    // ------------------------------------------------------------------

    function renderLevels() {
        if (!topicsData) {
            showError('Topics data not loaded. Please refresh the page.');
            return;
        }

        var levels = topicsData.levels || [];
        var html = '';

        html += '<div class="fade-in" style="max-width:900px;margin:0 auto;">';
        html +=   '<h1 class="section-title" style="font-size:2rem;margin-bottom:0.5rem;">Learning Levels</h1>';
        html +=   '<p style="color:var(--text-secondary);margin-bottom:2rem;">Choose a level to explore its topics. ' +
                  'Progress through them in order or jump to any topic that interests you.</p>';
        html += '</div>';

        html += '<div class="level-grid fade-in">';
        levels.forEach(function (level) {
            var topicCount = (level.topics || []).length;
            var progress = window.ProgressTracker
                ? ProgressTracker.getLevelProgress(level.id, topicCount)
                : { completed: 0, total: topicCount, percentage: 0 };

            html += '<div class="level-card" data-level="' + level.id + '" data-nav="level/' + level.id + '">';
            html +=   '<div class="level-card-header">';
            html +=     '<span class="level-icon">' + (level.icon || '📦') + '</span>';
            html +=     '<div>';
            html +=       '<div class="level-name">' + escapeHtml(level.name) + '</div>';
            html +=       '<div class="level-subtitle">' + escapeHtml(level.subtitle || '') + '</div>';
            html +=     '</div>';
            html +=     '<span class="level-topics-count">' + topicCount + ' topics</span>';
            html +=   '</div>';
            html +=   '<div class="level-card-body">';
            html +=     '<p class="level-description">' + escapeHtml(level.description || '') + '</p>';
            html +=   '</div>';
            html +=   '<div class="level-card-footer">';
            html +=     '<div class="level-progress-text">';
            html +=       '<span>' + progress.completed + ' / ' + progress.total + ' completed</span>';
            html +=       '<span>' + progress.percentage + '%</span>';
            html +=     '</div>';
            html +=     '<div class="level-progress-bar"><div style="width:' + progress.percentage + '%"></div></div>';
            html +=   '</div>';
            html += '</div>';
        });
        html += '</div>';

        appContent.innerHTML = html;
        attachNavClicks();
    }

    // ------------------------------------------------------------------
    // Level detail page
    // ------------------------------------------------------------------

    function renderLevelDetail(levelId) {
        if (!topicsData) {
            showError('Topics data not loaded. Please refresh the page.');
            return;
        }

        var level = null;
        (topicsData.levels || []).forEach(function (l) {
            if (l.id === levelId) level = l;
        });

        if (!level) {
            showError('Level "' + escapeHtml(levelId) + '" not found.');
            return;
        }

        var topics = level.topics || [];
        var progress = window.ProgressTracker
            ? ProgressTracker.getLevelProgress(level.id, topics.length)
            : { completed: 0, total: topics.length, percentage: 0 };

        var html = '';

        // Breadcrumb.
        html += '<div class="breadcrumb fade-in">';
        html +=   '<a href="#" data-nav="home">Home</a>';
        html +=   '<span class="separator">›</span>';
        html +=   '<a href="#" data-nav="levels">Levels</a>';
        html +=   '<span class="separator">›</span>';
        html +=   '<span class="current">' + escapeHtml(level.name) + '</span>';
        html += '</div>';

        // Level header.
        html += '<div class="fade-in" style="margin-bottom:2rem;">';
        html +=   '<h1 style="font-size:2rem;font-weight:700;color:' + (level.color || 'var(--primary)') + ';">' +
                  (level.icon || '') + ' ' + escapeHtml(level.name) + '</h1>';
        html +=   '<p style="color:var(--text-secondary);font-size:1.05rem;margin-top:0.5rem;">' +
                  escapeHtml(level.description || '') + '</p>';
        html +=   '<div class="level-progress-text" style="margin-top:1rem;max-width:400px;">';
        html +=     '<span>' + progress.completed + ' / ' + progress.total + ' topics completed</span>';
        html +=     '<span>' + progress.percentage + '%</span>';
        html +=   '</div>';
        html +=   '<div class="level-progress-bar" style="max-width:400px;">' +
                  '<div style="width:' + progress.percentage + '%"></div></div>';
        html += '</div>';

        // Topic cards grid.
        html += '<div class="feature-grid fade-in">';
        topics.forEach(function (topic) {
            var isCompleted = window.ProgressTracker
                ? ProgressTracker.isTopicCompleted(level.id, topic.id)
                : false;
            var isStarted = window.ProgressTracker
                ? ProgressTracker.isTopicStarted(level.id, topic.id)
                : false;

            html += '<div class="topic-card" data-level="' + level.id + '" data-nav="topic/' + level.id + '/' + topic.id + '">';
            html +=   '<div class="topic-card-title">';
            html +=     '<span>' + escapeHtml(topic.title) + '</span>';
            html +=     '<span class="duration-badge">' + escapeHtml(topic.duration || '') + '</span>';
            html +=   '</div>';
            html +=   '<p class="topic-card-desc">' + escapeHtml(topic.description || '') + '</p>';

            // Feature badges.
            html +=   '<div class="topic-card-features">';
            (topic.features || []).forEach(function (feat) {
                var icons = {
                    'read': '📖',
                    'interactive': '🎮',
                    'code': '💻',
                    'visualization': '📊',
                    'quiz': '✅'
                };
                html += '<span class="feature-badge">' + (icons[feat] || '•') + ' ' + feat + '</span>';
            });
            html +=   '</div>';

            // Progress indicator.
            html +=   '<div class="topic-card-progress">';
            if (isCompleted) {
                html += '<div class="checkmark">✓</div>';
            } else if (isStarted) {
                html += '<div style="font-size:0.78rem;color:var(--warning);">In Progress</div>';
            }
            html +=   '</div>';
            html += '</div>';
        });
        html += '</div>';

        appContent.innerHTML = html;
        attachNavClicks();
    }

    // ------------------------------------------------------------------
    // Topic detail page
    // ------------------------------------------------------------------

    function renderTopicDetail(levelId, topicId) {
        if (!topicsData) {
            showError('Topics data not loaded. Please refresh the page.');
            return;
        }

        // Find the level for breadcrumb / styling.
        var level = null;
        var topic = null;
        (topicsData.levels || []).forEach(function (l) {
            if (l.id === levelId) {
                (l.topics || []).forEach(function (t) {
                    if (t.id === topicId) {
                        level = l;
                        topic = t;
                    }
                });
            }
        });

        if (!topic) {
            showError('Topic not found.');
            return;
        }

        // Mark topic as started.
        if (window.ProgressTracker) {
            ProgressTracker.markTopicStarted(levelId, topicId);
        }

        // Fetch the full topic content from the dedicated endpoint
        // (ensures we have all fields even if the registry was partial).
        fetchTopic(levelId, topicId)
            .then(function (fullTopic) {
                renderTopicDetailContent(level, fullTopic);
            })
            .catch(function () {
                // Fall back to the topic data from the registry.
                renderTopicDetailContent(level, topic);
            });
    }

    /**
     * Render the topic detail page with content, using the provided data.
     *
     * @param {object} level - Level object (for breadcrumb, color).
     * @param {object} topic - Full topic object.
     */
    function renderTopicDetailContent(level, topic) {
        var levelId = level.id;
        var topicId = topic.id;
        var levelColor = level.color || 'var(--primary)';

        // Normalize code if present under other keys
        if (!topic.code && topic.content && topic.content.code_example) {
            topic.code = {
                description: topic.content.code_example.title || 'Python Interactive Code Playground',
                starter: topic.content.code_example.code || ''
            };
        } else if (!topic.code && topic.code_example) {
            topic.code = {
                description: topic.code_example.title || 'Python Interactive Code Playground',
                starter: topic.code_example.code || ''
            };
        } else if (typeof topic.code === 'string') {
            topic.code = {
                description: 'Python Interactive Code Playground',
                starter: topic.code
            };
        }

        // Normalize interactive if present under content
        if (!topic.interactive && topic.content && topic.content.interactive) {
            topic.interactive = topic.content.interactive;
        }

        // Determine available tabs from features.
        var features = topic.features || [];
        var hasInteractive = !!topic.interactive;
        var hasCode = !!topic.code;
        var hasQuiz = Array.isArray(topic.quiz) && topic.quiz.length > 0;

        // Build the tab list.
        var tabs = [{ id: 'content', label: '📖 Content', alwaysShow: true }];

        if (hasInteractive) {
            tabs.push({ id: 'interactive', label: '🎮 Interactive' });
        }
        if (hasCode) {
            tabs.push({ id: 'code', label: '💻 Code' });
        }
        if (hasQuiz) {
            tabs.push({ id: 'quiz', label: '✅ Quiz' });
        }

        var html = '';

        // Breadcrumb.
        html += '<div class="topic-detail fade-in">';
        html +=   '<div class="breadcrumb">';
        html +=     '<a href="#" data-nav="home">Home</a>';
        html +=     '<span class="separator">›</span>';
        html +=     '<a href="#" data-nav="levels">Levels</a>';
        html +=     '<span class="separator">›</span>';
        html +=     '<a href="#" data-nav="level/' + levelId + '">' + escapeHtml(level.name) + '</a>';
        html +=     '<span class="separator">›</span>';
        html +=     '<span class="current">' + escapeHtml(topic.title) + '</span>';
        html +=   '</div>';

        // Topic header.
        html +=   '<div class="topic-header">';
        html +=     '<h1 class="topic-title">' + escapeHtml(topic.title) + '</h1>';
        html +=     '<p class="topic-desc">' + escapeHtml(topic.description || '') + '</p>';
        html +=     '<div class="topic-card-features">';
        if (topic.duration) {
            html +=   '<span class="duration-badge">⏱ ' + escapeHtml(topic.duration) + '</span>';
        }
        (features).forEach(function (feat) {
            var icons = {
                'read': '📖 Read',
                'interactive': '🎮 Interactive',
                'code': '💻 Code',
                'visualization': '📊 Visualization',
                'quiz': '✅ Quiz'
            };
            html += '<span class="feature-badge">' + (icons[feat] || feat) + '</span>';
        });
        html +=     '</div>';
        html +=   '</div>';

        // Tab navigation (sticky).
        html +=   '<div class="topic-nav" id="topic-nav">';
        tabs.forEach(function (tab, idx) {
            html += '<div class="topic-nav-tab' + (idx === 0 ? ' active' : '') +
                    '" data-tab="' + tab.id + '">' + tab.label + '</div>';
        });
        html +=   '</div>';

        // Tab content containers.
        html +=   '<div class="topic-content" id="topic-content">';

        // Content tab.
        html +=     '<div class="tab-pane" data-pane="content" style="display:block;">';
        html +=       renderContentSections(topic);
        html +=     '</div>';

        // Interactive tab.
        if (hasInteractive) {
            html +=   '<div class="tab-pane" data-pane="interactive" style="display:none;">';
            html +=     '<div id="interactive-container"></div>';
            html +=   '</div>';
        }

        // Code tab.
        if (hasCode) {
            html +=   '<div class="tab-pane" data-pane="code" style="display:none;">';
            html +=     '<div id="code-container"></div>';
            html +=   '</div>';
        }

        // Quiz tab.
        if (hasQuiz) {
            html +=   '<div class="tab-pane" data-pane="quiz" style="display:none;">';
            html +=     '<div id="quiz-container"></div>';
            html +=   '</div>';
        }

        html +=   '</div>'; // .topic-content

        // Prev/Next topic navigation.
        html +=   renderTopicNavFooter(level, topic);

        html += '</div>'; // .topic-detail

        appContent.innerHTML = html;
        attachNavClicks();
        attachTabHandlers(level, topic);
        renderMath(appContent);
    }

    /**
     * Render all content sections for a topic.
     *
     * @param {object} topic
     * @returns {string} HTML string.
     */
    function renderContentSections(topic) {
        var sections = (topic.content && topic.content.sections) || [];
        var html = '';

        sections.forEach(function (section) {
            switch (section.type) {
                case 'hero':
                    html += renderHeroBlock(section);
                    break;
                case 'text':
                    html += renderTextSection(section);
                    break;
                case 'callout':
                    html += renderCallout(section);
                    break;
                case 'table':
                    html += renderTableSection(section);
                    break;
                case 'visualization':
                    html += renderVisualizationBlock(section);
                    break;
                default:
                    if (section.headers && section.rows) {
                        html += renderTableSection(section);
                    } else {
                        html += renderTextSection(section);
                    }
            }
        });

        return html;
    }

    /**
     * Render a hero block section (large title at the top of content).
     */
    function renderHeroBlock(section) {
        var html = '<div class="hero-block">';
        html +=   '<h2 class="hero-block-title">' + escapeHtml(section.title || '') + '</h2>';
        if (section.subtitle) {
            html += '<p class="hero-block-subtitle">' + escapeHtml(section.subtitle) + '</p>';
        }
        html += '</div>';
        return html;
    }

    /**
     * Render a text section with markdown-like parsing.
     */
    function renderTextSection(section) {
        var html = '<div class="content-section">';
        if (section.title) {
            html += '<h3 class="section-title">' + escapeHtml(section.title) + '</h3>';
        }
        var text = section.content || section.text || section.body || '';
        if (text) {
            html += '<div class="section-text">' + parseMarkdown(text) + '</div>';
        }
        html += '</div>';
        return html;
    }

    /**
     * Render a callout box with style-specific colors.
     */
    function renderCallout(section) {
        var style = section.style || 'info';
        var html = '<div class="callout ' + style + '">';
        if (section.title) {
            html += '<div class="callout-title">' + escapeHtml(section.title) + '</div>';
        }
        var text = section.content || section.text || section.body || '';
        if (text) {
            html += '<div class="callout-body">' + parseMarkdown(text) + '</div>';
        }
        html += '</div>';
        return html;
    }

    /**
     * Render a table section.
     */
    function renderTableSection(section) {
        var html = '<div class="content-section">';
        if (section.title) {
            html += '<h3 class="section-title">' + escapeHtml(section.title) + '</h3>';
        }
        var headers = section.headers || [];
        var rows = section.rows || [];
        html += '<div class="table-container"><table class="data-table"><thead><tr>';
        headers.forEach(function (h) {
            html += '<th>' + formatInline(escapeHtml(h)) + '</th>';
        });
        html += '</tr></thead><tbody>';
        rows.forEach(function (row) {
            html += '<tr>';
            row.forEach(function (cell) {
                html += '<td>' + formatInline(escapeHtml(cell)) + '</td>';
            });
            html += '</tr>';
        });
        html += '</tbody></table></div></div>';
        return html;
    }

    /**
     * Render a visualization block with a container for the canvas.
     * The actual rendering is deferred until the tab is shown (lazy init).
     */
    function renderVisualizationBlock(section) {
        var vizId = section.id || '';
        var html = '<div class="visualization-block" data-viz-id="' + escapeHtml(vizId) + '">';
        if (section.title) {
            html += '<h3 class="viz-title">' + escapeHtml(section.title) + '</h3>';
        }
        if (section.description) {
            html += '<p class="section-text" style="font-size:0.9rem;color:var(--text-muted);margin-bottom:1rem;">' +
                    escapeHtml(section.description) + '</p>';
        }
        html +=   '<div class="viz-canvas-container"></div>';
        html += '</div>';
        return html;
    }

    /**
     * Render prev/next topic navigation links at the bottom of the topic page.
     */
    function renderTopicNavFooter(level, currentTopic) {
        var topics = level.topics || [];
        var currentIdx = -1;
        topics.forEach(function (t, idx) {
            if (t.id === currentTopic.id) currentIdx = idx;
        });

        var prevTopic = currentIdx > 0 ? topics[currentIdx - 1] : null;
        var nextTopic = currentIdx < topics.length - 1 ? topics[currentIdx + 1] : null;

        var html = '<div class="topic-nav-footer" style="display:flex;justify-content:space-between;' +
                    'gap:1rem;margin-top:3rem;padding-top:2rem;border-top:1px solid var(--border-color);">';

        // Previous.
        if (prevTopic) {
            html += '<button class="btn btn-secondary" data-nav="topic/' + level.id + '/' + prevTopic.id + '">' +
                    '← ' + escapeHtml(prevTopic.title) + '</button>';
        } else {
            html += '<span></span>';
        }

        // Next.
        if (nextTopic) {
            html += '<button class="btn btn-primary" data-nav="topic/' + level.id + '/' + nextTopic.id + '">' +
                    escapeHtml(nextTopic.title) + ' →</button>';
        } else {
            html += '<span></span>';
        }

        html += '</div>';
        return html;
    }

    // ------------------------------------------------------------------
    // Tab handling for topic detail
    // ------------------------------------------------------------------

    /**
     * Wire up tab switching and lazy-init interactive/code/quiz panels.
     *
     * @param {object} level
     * @param {object} topic
     */
    function attachTabHandlers(level, topic) {
        var nav = document.getElementById('topic-nav');
        if (!nav) return;

        var tabBtns = nav.querySelectorAll('.topic-nav-tab');
        var panes = document.querySelectorAll('.tab-pane');

        // Track which tabs have been initialized (lazy init).
        var initialized = {};

        // Render visualizations immediately (they're in the Content tab).
        initVisualizations();

        tabBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tabId = btn.getAttribute('data-tab');

                // Update active state.
                tabBtns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');

                // Show the matching pane, hide others.
                panes.forEach(function (pane) {
                    if (pane.getAttribute('data-pane') === tabId) {
                        pane.style.display = 'block';
                    } else {
                        pane.style.display = 'none';
                    }
                });

                // Lazy-init the tab content on first view.
                if (!initialized[tabId]) {
                    initialized[tabId] = true;
                    initTab(tabId, level, topic);
                }

                // If switching to code tab, refresh the CodeMirror editor
                // (it needs a visible container to measure correctly).
                if (tabId === 'code') {
                    setTimeout(function () {
                        var ta = document.querySelector('#code-container textarea');
                        if (ta && ta.CodeMirror) {
                            ta.CodeMirror.refresh();
                        }
                    }, 10);
                }
            });
        });

        // If the Content tab is the first tab (default), render visualizations.
        // Visualizations are already rendered above, so just mark content as initialized.
        initialized['content'] = true;
    }

    /**
     * Render all visualization blocks in the Content tab.
     */
    function initVisualizations() {
        var vizBlocks = document.querySelectorAll('.visualization-block[data-viz-id]');
        vizBlocks.forEach(function (block) {
            var vizId = block.getAttribute('data-viz-id');
            var container = block.querySelector('.viz-canvas-container');
            if (container && window.Visualizations) {
                Visualizations.render(vizId, container);
            }
        });
    }

    /**
     * Initialize a specific tab's content on first view.
     *
     * @param {string} tabId  - 'interactive', 'code', or 'quiz'.
     * @param {object} level
     * @param {object} topic
     */
    function initTab(tabId, level, topic) {
        switch (tabId) {
            case 'interactive':
                initInteractive(level, topic);
                break;
            case 'code':
                initCode(level, topic);
                break;
            case 'quiz':
                initQuiz(level, topic);
                break;
        }
    }

    /**
     * Initialize the interactive exercise tab.
     */
    function initInteractive(level, topic) {
        var container = document.getElementById('interactive-container');
        if (!container || !topic.interactive) return;

        if (window.Visualizations) {
            Visualizations.renderInteractive(
                topic.interactive,
                container,
                function onComplete() {
                    if (window.ProgressTracker) {
                        ProgressTracker.markInteractiveCompleted(level.id, topic.id);
                        checkTopicCompletion(level, topic);
                        showToast('Interactive exercise completed! 🎉', 'success');
                    }
                }
            );
        }
    }

    /**
     * Initialize the code playground tab.
     */
    function initCode(level, topic) {
        var container = document.getElementById('code-container');
        if (!container || !topic.code) return;

        if (window.CodePlayground) {
            CodePlayground.init(
                topic.code,
                container,
                function onComplete() {
                    if (window.ProgressTracker) {
                        ProgressTracker.markCodeCompleted(level.id, topic.id);
                        checkTopicCompletion(level, topic);
                        showToast('Code exercise completed! 💻', 'success');
                    }
                }
            );
        }
    }

    /**
     * Initialize the quiz tab.
     */
    function initQuiz(level, topic) {
        var container = document.getElementById('quiz-container');
        if (!container || !topic.quiz) return;

        if (window.QuizEngine) {
            QuizEngine.renderQuiz(
                topic,
                container,
                function onComplete(percentage) {
                    if (window.ProgressTracker) {
                        // Save quiz result.
                        var total = (topic.quiz || []).length;
                        var score = Math.round((percentage / 100) * total);
                        ProgressTracker.saveQuizResult(level.id, topic.id, score, total, percentage);
                        checkTopicCompletion(level, topic);

                        if (percentage >= 80) {
                            showToast('Quiz passed with ' + percentage + '%! 🎉', 'success');
                        } else {
                            showToast('Quiz completed: ' + percentage + '%. Review and try again!', 'info');
                        }

                        // Update nav progress bar.
                        ProgressTracker.updateNavProgress(totalTopics);
                    }
                }
            );
        }
    }

    /**
     * Check whether all activities in a topic are completed.
     * If so, mark the topic as completed and show a toast.
     *
     * @param {object} level
     * @param {object} topic
     */
    function checkTopicCompletion(level, topic) {
        if (!window.ProgressTracker) return;

        var levelId = level.id;
        var topicId = topic.id;

        // Already completed? Don't re-fire.
        if (ProgressTracker.isTopicCompleted(levelId, topicId)) return;

        // Check each activity that exists for this topic.
        var allDone = true;

        if (topic.quiz && topic.quiz.length > 0) {
            var quizResult = ProgressTracker.getQuizResult(levelId, topicId);
            if (!quizResult) allDone = false;
        }

        if (topic.code) {
            if (!ProgressTracker.isCodeCompleted(levelId, topicId)) allDone = false;
        }

        if (topic.interactive) {
            if (!ProgressTracker.isInteractiveCompleted(levelId, topicId)) allDone = false;
        }

        // If topic has no activities (just reading), mark as completed
        // once the content has been viewed (which it has, since we're here).
        if (!topic.quiz && !topic.code && !topic.interactive) {
            allDone = true;
        }

        if (allDone) {
            ProgressTracker.markTopicCompleted(levelId, topicId);
            showToast('Topic completed! 🏆', 'success');
            ProgressTracker.updateNavProgress(totalTopics);
        }
    }

    // ------------------------------------------------------------------
    // Progress page
    // ------------------------------------------------------------------

    function renderProgress() {
        if (!topicsData) {
            showError('Topics data not loaded. Please refresh the page.');
            return;
        }

        if (!window.ProgressTracker) {
            showError('Progress tracking not available.');
            return;
        }

        var detail = ProgressTracker.getDetailedProgress(topicsData.levels);
        var overall = detail.overall;
        var levels = detail.levels;

        var html = '';

        html += '<div class="progress-page fade-in">';

        // Overview card.
        html +=   '<div class="progress-overview">';
        html +=     '<h2 class="progress-overview-title">Your Progress</h2>';
        html +=     renderCircularProgress(overall.percentage);
        html +=     '<p style="font-size:1.1rem;color:var(--text-secondary);">' +
                    overall.completed + ' of ' + overall.total + ' topics completed</p>';
        html +=   '</div>';

        // Per-level breakdown.
        html +=   '<div class="progress-levels">';

        levels.forEach(function (level) {
            var levelData = (topicsData.levels || []).find(function (l) {
                return l.id === level.id;
            });
            var levelColor = (levelData && levelData.color) || 'var(--primary)';
            var levelIcon = (levelData && levelData.icon) || '📦';

            html += '<div class="progress-level-card" data-level="' + level.id + '" style="border-left-color:' + levelColor + ';">';
            html +=   '<div class="level-card-header">';
            html +=     '<span class="level-icon">' + levelIcon + '</span>';
            html +=     '<div>';
            html +=       '<span class="level-name" style="color:' + levelColor + ';">' + escapeHtml(level.name) + '</span>';
            html +=       '<span style="font-size:0.8rem;color:var(--text-muted);margin-left:0.5rem;">' +
                    level.completed + '/' + level.total + ' (' + level.percentage + '%)</span>';
            html +=     '</div>';
            html +=   '</div>';

            // Per-topic items.
            html +=   '<div style="margin-top:0.5rem;">';
            level.topics.forEach(function (tp) {
                var statusIcon = '○';
                var statusClass = 'not-started';
                if (tp.completed) {
                    statusIcon = '✓';
                    statusClass = 'complete';
                } else if (ProgressTracker.isTopicStarted(level.id, tp.id)) {
                    statusIcon = '◐';
                    statusClass = 'in-progress';
                }

                html += '<div class="progress-topic-item">';
                html +=   '<span class="topic-status ' + statusClass + '">' + statusIcon + '</span>';
                html +=   '<span class="topic-name">' + escapeHtml(tp.title) + '</span>';

                // Show activity completion badges.
                var badges = [];
                if (tp.quizScore) {
                    badges.push('Quiz: ' + tp.quizScore.percentage + '%');
                }
                if (tp.codeCompleted) {
                    badges.push('Code ✓');
                }
                if (tp.interactiveCompleted) {
                    badges.push('Interactive ✓');
                }
                if (badges.length) {
                    html += '<span class="topic-progress-mini-text">' + badges.join(' · ') + '</span>';
                }

                html += '</div>';
            });
            html +=   '</div>';

            // Level progress bar.
            html +=   '<div class="level-progress-text" style="margin-top:0.75rem;">';
            html +=     '<span>' + level.completed + ' / ' + level.total + '</span>';
            html +=     '<span>' + level.percentage + '%</span>';
            html +=   '</div>';
            html +=   '<div class="level-progress-bar" style="border-left-color:' + levelColor + ';">' +
                      '<div style="width:' + level.percentage + '%;background:' + levelColor + ';"></div></div>';

            html += '</div>';
        });

        html +=   '</div>'; // .progress-levels

        // Reset button.
        html +=   '<button class="progress-reset-btn" id="reset-progress-btn">🗑 Reset All Progress</button>';

        html += '</div>'; // .progress-page

        appContent.innerHTML = html;

        // Wire up the reset button.
        var resetBtn = document.getElementById('reset-progress-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
                    ProgressTracker.resetProgress();
                    ProgressTracker.updateNavProgress(totalTopics);
                    showToast('Progress reset.', 'info');
                    renderProgress(); // Re-render.
                }
            });
        }
    }

    /**
     * Render a circular progress indicator using SVG.
     *
     * @param {number} percentage - 0-100.
     * @returns {string} HTML string.
     */
    function renderCircularProgress(percentage) {
        var pct = Math.max(0, Math.min(100, percentage));
        var radius = 70;
        var circumference = 2 * Math.PI * radius;
        var offset = circumference * (1 - pct / 100);

        var color = '#00d4aa';
        if (pct < 60) color = '#ff5757';
        else if (pct < 80) color = '#ffd43b';

        return '<div class="circular-progress">' +
               '<svg viewBox="0 0 160 160" width="140" height="140" class="circular-progress-svg">' +
               '  <circle cx="80" cy="80" r="' + radius + '" fill="none" ' +
               '    stroke="rgba(255,255,255,0.08)" stroke-width="12"/>' +
               '  <circle cx="80" cy="80" r="' + radius + '" fill="none" ' +
               '    stroke="' + color + '" stroke-width="12" stroke-linecap="round" ' +
               '    stroke-dasharray="' + circumference + '" ' +
               '    stroke-dashoffset="' + offset + '" ' +
               '    style="transition:stroke-dashoffset 0.9s ease;"/>' +
               '</svg>' +
               '<span style="position:absolute;font-size:1.75rem;font-weight:700;color:' + color + ';">' +
               pct + '%</span>' +
               '</div>';
    }

    // ------------------------------------------------------------------
    // Event delegation for navigation clicks
    // ------------------------------------------------------------------

    /**
     * Attach click handlers to all elements with data-nav attributes.
     * This handles level cards, topic cards, breadcrumb links, and buttons.
     */
    function attachNavClicks() {
        var navElements = document.querySelectorAll('[data-nav]');
        navElements.forEach(function (elem) {
            elem.addEventListener('click', function (e) {
                e.preventDefault();
                var target = elem.getAttribute('data-nav');
                if (target) {
                    navigate(target);
                }
            });
        });
    }

    // ------------------------------------------------------------------
    // Nav link handlers (top navigation bar)
    // ------------------------------------------------------------------

    /**
     * Wire up the top nav links and logo.
     */
    function attachMainNavHandlers() {
        // Nav links (Home, Levels, Progress).
        var navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                var route = link.getAttribute('data-route');
                if (route) {
                    navigate(route);
                }
            });
        });

        // Logo → home.
        var logo = document.getElementById('nav-logo');
        if (logo) {
            logo.addEventListener('click', function (e) {
                e.preventDefault();
                navigate('home');
            });
        }
    }

    // ------------------------------------------------------------------
    // Initialization
    // ------------------------------------------------------------------

    /**
     * Initialize the SPA.
     * Called on DOMContentLoaded.
     */
    function init() {
        // Cache DOM references.
        appContent = document.getElementById('app-content');
        loadingScreen = document.getElementById('loading-screen');
        toastContainer = document.getElementById('toast-container');

        if (!appContent) {
            console.error('[App] #app-content not found.');
            return;
        }

        // Wire up top nav.
        attachMainNavHandlers();

        // Load topics data, then start the router.
        loadTopics()
            .then(function () {
                hideLoading();

                // Listen for hash changes.
                window.addEventListener('hashchange', router);

                // Initial route.
                if (!location.hash) {
                    location.hash = '#home';
                } else {
                    router();
                }
            })
            .catch(function (err) {
                hideLoading();
                showError(
                    'Could not load course content. ' +
                    (err && err.message ? err.message : 'Please check your connection and refresh.')
                );
            });
    }

    // Start when the DOM is ready.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose public API (for integration and debugging).
    window.renderMath = renderMath;
    window.App = {
        navigate: navigate,
        showToast: showToast,
        parseMarkdown: parseMarkdown,
        renderMath: renderMath,
        getTopicsData: function () { return topicsData; }
    };
})();
