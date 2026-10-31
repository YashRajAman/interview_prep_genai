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
     * Prevents currency like $300k, $280k, $150 from being mangled.
     *
     * @param {string} content
     * @returns {{text: string, tokens: Array}}
     */
    function extractMath(content) {
        var mathTokens = [];
        if (!content) return { text: '', tokens: mathTokens };

        var text = content;

        // 0. Protect literal escaped currency like \$300k or \$
        text = text.replace(/\\\$([0-9][0-9,]*(?:\.[0-9]+)?[kKmMbB]?\b)?/g, function (match, val) {
            var token = '@@MATH_CURRENCY_' + mathTokens.length + '@@';
            mathTokens.push({ type: 'currency', value: '$' + (val || '') });
            return token;
        });

        // 1. Protect currency amounts with k/m/b suffixes like $300k, $280k, $20k, $1.5M
        text = text.replace(/\$([0-9][0-9,]*(?:\.[0-9]+)?[kKmMbB])\b/g, function (match, val) {
            var token = '@@MATH_CURRENCY_' + mathTokens.length + '@@';
            mathTokens.push({ type: 'currency', value: '$' + val });
            return token;
        });

        // 2. Protect standalone prices like $500, $5,000, $150 followed by space/word/punctuation
        text = text.replace(/\$([0-9][0-9,]*(?:\.[0-9]+)?)(?=\s+(?:per|higher|lower|more|less|dollars|in|of|or|and|\/|month|year|epoch|GPU|budget|model)|[.,;:!?)]|\s*$)/gi, function (match, val) {
            var token = '@@MATH_CURRENCY_' + mathTokens.length + '@@';
            mathTokens.push({ type: 'currency', value: '$' + val });
            return token;
        });

        // 3. Display math: $$ ... $$
        text = text.replace(/\$\$([\s\S]+?)\$\$/g, function (match, math) {
            var token = '@@MATH_DISPLAY_' + mathTokens.length + '@@';
            mathTokens.push({ type: 'display', math: math });
            return '\n' + token + '\n';
        });

        // 4. Inline math: $ ... $ (closing delimiter cannot be followed by alphanumeric or $)
        text = text.replace(/(^|[^\$])\$([^\$\s](?:[^\$\n]*?[^\$\s])?)\$(?![0-9a-zA-Z\$])/g, function (match, prefix, math) {
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
        return html.replace(/@@MATH_(DISPLAY|INLINE|CURRENCY)_(\d+)@@/g, function (match, kind, idx) {
            var token = mathTokens[parseInt(idx, 10)];
            if (!token) return match;
            if (token.type === 'currency') {
                return '<span class="currency-amount">' + token.value + '</span>';
            }
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
                    ignoredClasses: ['katex-ignore', 'katex-html', 'currency-amount'],
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
            'playground': 'playground',
            'progress': 'progress'
        };
        updateNavActive(navMap[route] || 'home');

        if (window.CurriculumDrawer && CurriculumDrawer.isOpen) {
            CurriculumDrawer.renderTree();
        }

        scrollTop();

        switch (route) {
            case 'home':
                renderHome();
                break;
            case 'levels':
                renderLevels();
                break;
            case 'playground':
                renderPlayground();
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

    /**
     * Render the interactive Jupyter Playground page.
     */
    function renderPlayground() {
        if (window.Playground) {
            window.Playground.render(appContent);
        } else {
            appContent.innerHTML = '<div class="loading-screen"><div class="loader"><div class="loader-brain">📓</div><div class="loader-text">Loading Jupyter Playground...</div></div></div>';
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
        html +=     '<button class="btn btn-secondary btn-large" data-nav="playground" style="margin-left:0.75rem;">🧪 Interactive Playground</button>';
        html +=     '<button class="btn btn-outline btn-large" data-nav="progress" style="margin-left:0.75rem;">View Progress</button>';
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
        var tabs = [{ id: 'content', label: '📖 Read & Theory', alwaysShow: true }];

        if (hasInteractive) {
            tabs.push({ id: 'interactive', label: '🎮 Interactive' });
        }
        if (hasCode) {
            tabs.push({ id: 'code', label: '💻 Code Sandbox' });
        }
        if (hasQuiz) {
            tabs.push({ id: 'quiz', label: '✅ Quizzes' });
        }

        var html = '';

        // Breadcrumb.
        html += '<div class="topic-detail fade-in">';
        html +=   '<div class="breadcrumb" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">';
        html +=     '<div>';
        html +=       '<a href="#" data-nav="home">Home</a>';
        html +=       '<span class="separator">›</span>';
        html +=       '<a href="#" data-nav="levels">Levels</a>';
        html +=       '<span class="separator">›</span>';
        html +=       '<a href="#" data-nav="level/' + levelId + '">' + escapeHtml(level.name) + '</a>';
        html +=       '<span class="separator">›</span>';
        html +=       '<span class="current">' + escapeHtml(topic.title) + '</span>';
        html +=     '</div>';
        html +=     '<button type="button" class="btn btn-sm btn-outline" id="topic-curriculum-toggle" style="font-size:0.8rem;padding:0.25rem 0.65rem;">📚 Contents Tree</button>';
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
        html += '<a href="/api/notebook/' + levelId + '/' + topicId + '" class="feature-badge" download="' + topicId + '.ipynb" style="text-decoration:none;cursor:pointer;background:rgba(124,92,255,0.18);border-color:rgba(124,92,255,0.4);color:#c7d2fe;">📥 Download .ipynb</a>';
        html +=     '</div>';
        html +=   '</div>';

        // In-page search bar
        html +=   '<div class="inpage-search-bar" id="inpage-search-bar">';
        html +=     '<span class="inpage-search-icon">🔍</span>';
        html +=     '<input type="text" class="inpage-search-input" id="inpage-search-input" placeholder="Search in this page (text, code, math)...">';
        html +=     '<span class="inpage-search-count" id="inpage-search-count"></span>';
        html +=     '<div class="inpage-search-nav">';
        html +=       '<button type="button" class="inpage-nav-btn" id="inpage-search-prev" title="Previous match (Shift+Enter)" disabled>▲</button>';
        html +=       '<button type="button" class="inpage-nav-btn" id="inpage-search-next" title="Next match (Enter)" disabled>▼</button>';
        html +=       '<button type="button" class="inpage-nav-btn" id="inpage-search-clear" title="Clear search (Esc)" disabled>✕</button>';
        html +=     '</div>';
        html +=   '</div>';

        // Build Section TOC for Read tab
        var sectionsTocHtml = '';
        var sections = (topic.content && topic.content.sections) || [];
        sections.forEach(function (sec, sIdx) {
            var title = sec.title || (sec.subtitle ? sec.subtitle : (sec.type ? sec.type.charAt(0).toUpperCase() + sec.type.slice(1) : 'Section ' + (sIdx + 1)));
            sectionsTocHtml += '<a href="#section-' + sIdx + '" class="toc-anchor-link" data-target="section-' + sIdx + '">';
            sectionsTocHtml +=   '<span class="toc-bullet">§</span>';
            sectionsTocHtml +=   '<span class="toc-text">' + escapeHtml(title) + '</span>';
            sectionsTocHtml += '</a>';
        });

        // Layout: Main scrolling content + Fixed right sidebar
        html += '<div class="topic-detail-layout">';

        // Center column: page contents (scrolls)
        html +=   '<main class="topic-main-column">';
        html +=     '<div class="topic-content" id="topic-content">';

        // Content tab.
        html +=       '<div class="tab-pane" data-pane="content" style="display:block;">';
        html +=         renderContentSections(topic);
        html +=       '</div>';

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

        html +=     '</div>'; // .topic-content

        // Prev/Next topic navigation footer.
        html +=     renderTopicNavFooter(level, topic);
        html +=   '</main>'; // .topic-main-column

        // Right column: fixed activities & TOC
        html +=   '<aside class="topic-right-sidebar" id="topic-right-sidebar">';
        html +=     '<div class="topic-sidebar-panel">';
        html +=       '<div class="topic-sidebar-section">';
        html +=         '<div class="topic-sidebar-title">Activities</div>';
        html +=         '<div class="topic-nav topic-vertical-nav" id="topic-nav">';
        tabs.forEach(function (tab, idx) {
            html +=       '<button type="button" class="topic-nav-tab' + (idx === 0 ? ' active' : '') +
                          '" data-tab="' + tab.id + '">';
            html +=         '<span class="tab-badge-indicator"></span>';
            html +=         '<span class="tab-label-text">' + tab.label + '</span>';
            html +=       '</button>';
        });
        html +=         '</div>'; // .topic-nav
        html +=       '</div>'; // .topic-sidebar-section

        if (sections.length > 0) {
            html +=   '<div class="topic-toc-container" id="topic-toc-container">';
            html +=     '<div class="topic-sidebar-title">On This Page</div>';
            html +=     '<nav class="topic-toc-links">';
            html +=       sectionsTocHtml;
            html +=     '</nav>';
            html +=   '</div>';
        }

        html +=     '</div>'; // .topic-sidebar-panel
        html +=   '</aside>'; // .topic-right-sidebar

        html += '</div>'; // .topic-detail-layout
        html += '</div>'; // .topic-detail

        appContent.innerHTML = html;
        attachNavClicks();
        attachTabHandlers(level, topic);
        attachTocHandlers();
        renderMath(appContent);
        InPageSearch.init();

        var treeBtn = document.getElementById('topic-curriculum-toggle');
        if (treeBtn) {
            treeBtn.addEventListener('click', function () {
                CurriculumDrawer.open();
            });
        }

        // Check if there is a pending section scroll from the curriculum drawer
        var pendingScroll = sessionStorage.getItem('pending_scroll_section');
        if (pendingScroll) {
            sessionStorage.removeItem('pending_scroll_section');
            setTimeout(function () {
                var el = document.getElementById(pendingScroll);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    el.classList.add('section-highlight-pulse');
                    setTimeout(function () { el.classList.remove('section-highlight-pulse'); }, 1600);
                }
            }, 150);
        }
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

        sections.forEach(function (section, sIdx) {
            var secId = 'section-' + sIdx;
            switch (section.type) {
                case 'hero':
                    html += renderHeroBlock(section, secId);
                    break;
                case 'text':
                    html += renderTextSection(section, secId);
                    break;
                case 'callout':
                    html += renderCallout(section, secId);
                    break;
                case 'table':
                    html += renderTableSection(section, secId);
                    break;
                case 'visualization':
                    html += renderVisualizationBlock(section, secId);
                    break;
                default:
                    if (section.headers && section.rows) {
                        html += renderTableSection(section, secId);
                    } else {
                        html += renderTextSection(section, secId);
                    }
            }
        });

        return html;
    }

    /**
     * Render a hero block section (large title at the top of content).
     */
    function renderHeroBlock(section, secId) {
        var html = '<div class="hero-block"' + (secId ? ' id="' + secId + '"' : '') + '>';
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
    function renderTextSection(section, secId) {
        var html = '<div class="content-section"' + (secId ? ' id="' + secId + '"' : '') + '>';
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
    function renderCallout(section, secId) {
        var style = section.style || 'info';
        var html = '<div class="callout ' + style + '"' + (secId ? ' id="' + secId + '"' : '') + '>';
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
    function renderTableSection(section, secId) {
        var html = '<div class="content-section"' + (secId ? ' id="' + secId + '"' : '') + '>';
        if (section.title) {
            html += '<h3 class="section-title">' + escapeHtml(section.title) + '</h3>';
        }
        var headers = section.headers || [];
        var rows = section.rows || [];
        html += '<div class="table-container"><table class="data-table"><thead><tr>';
        headers.forEach(function (h) {
            var ext = extractMath(h);
            html += '<th>' + restoreMath(formatInline(escapeHtml(ext.text)), ext.tokens) + '</th>';
        });
        html += '</tr></thead><tbody>';
        rows.forEach(function (row) {
            html += '<tr>';
            row.forEach(function (cell) {
                var ext = extractMath(cell);
                html += '<td>' + restoreMath(formatInline(escapeHtml(ext.text)), ext.tokens) + '</td>';
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
    function renderVisualizationBlock(section, secId) {
        var vizId = section.id || '';
        var html = '<div class="visualization-block"' + (secId ? ' id="' + secId + '"' : '') + ' data-viz-id="' + escapeHtml(vizId) + '">';
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

                // Show/hide Section TOC: show on 'content' (Read & Theory), hide on other activities
                var tocContainer = document.getElementById('topic-toc-container');
                if (tocContainer) {
                    tocContainer.style.display = (tabId === 'content') ? 'block' : 'none';
                }

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
                    }, 30);
                }
            });
        });

        // If the Content tab is the first tab (default), render visualizations.
        // Visualizations are already rendered above, so just mark content as initialized.
        initialized['content'] = true;
    }

    /**
     * Attach click handlers and scrollspy to the in-page TOC in the fixed right sidebar.
     */
    function attachTocHandlers() {
        var links = document.querySelectorAll('.topic-toc-links .toc-anchor-link');
        if (!links || links.length === 0) return;

        links.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                var targetId = this.getAttribute('data-target');
                var el = document.getElementById(targetId);
                if (el) {
                    // Ensure 'content' tab is active
                    var contentTab = document.querySelector('.topic-nav-tab[data-tab="content"]');
                    if (contentTab && !contentTab.classList.contains('active')) {
                        contentTab.click();
                    }

                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    el.classList.add('section-highlight-pulse');
                    setTimeout(function () {
                        el.classList.remove('section-highlight-pulse');
                    }, 1600);

                    links.forEach(function (l) { l.classList.remove('active'); });
                    link.classList.add('active');
                }
            });
        });

        // IntersectionObserver ScrollSpy
        if (window.IntersectionObserver) {
            var sections = document.querySelectorAll('.topic-content .tab-pane[data-pane="content"] > [id^="section-"]');
            if (sections.length > 0) {
                var observer = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            var id = entry.target.id;
                            links.forEach(function (l) {
                                if (l.getAttribute('data-target') === id) {
                                    l.classList.add('active');
                                } else {
                                    l.classList.remove('active');
                                }
                            });
                        }
                    });
                }, {
                    rootMargin: '-70px 0px -65% 0px',
                    threshold: 0
                });

                sections.forEach(function (sec) {
                    observer.observe(sec);
                });
            }
        }
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
    // In-Page Content Search
    // ------------------------------------------------------------------
    var InPageSearch = {
        matches: [],
        currentIndex: -1,
        debounceTimer: null,

        init: function () {
            var self = this;
            self.matches = [];
            self.currentIndex = -1;

            var input = document.getElementById('inpage-search-input');
            var prevBtn = document.getElementById('inpage-search-prev');
            var nextBtn = document.getElementById('inpage-search-next');
            var clearBtn = document.getElementById('inpage-search-clear');

            if (!input) return;

            input.value = '';
            self.updateControls();

            input.addEventListener('input', function () {
                clearTimeout(self.debounceTimer);
                var val = this.value;
                self.debounceTimer = setTimeout(function () {
                    self.search(val);
                }, 120);
            });

            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        self.prev();
                    } else {
                        self.next();
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    self.clear();
                    input.blur();
                }
            });

            if (prevBtn) {
                prevBtn.addEventListener('click', function () {
                    self.prev();
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', function () {
                    self.next();
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', function () {
                    self.clear();
                    input.focus();
                });
            }
        },

        clearHighlights: function () {
            var marks = document.querySelectorAll('mark.inpage-search-match');
            marks.forEach(function (mark) {
                var parent = mark.parentNode;
                if (parent) {
                    parent.replaceChild(document.createTextNode(mark.textContent), mark);
                    parent.normalize();
                }
            });
            this.matches = [];
            this.currentIndex = -1;
        },

        search: function (query) {
            var self = this;
            self.clearHighlights();

            var trimmed = (query || '').trim();
            if (!trimmed || trimmed.length < 2) {
                self.updateControls();
                return;
            }

            var container = document.querySelector('.topic-detail') || appContent;
            if (!container) return;

            var textNodes = [];
            var walker = document.createTreeWalker(
                container,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function (node) {
                        if (!node.nodeValue || !node.nodeValue.trim()) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        var parent = node.parentElement;
                        if (!parent) return NodeFilter.FILTER_REJECT;

                        // Exclude inpage search bar itself and navigation controls
                        if (parent.closest('#inpage-search-bar') ||
                            parent.closest('.inpage-search-bar') ||
                            parent.closest('#topic-right-sidebar') ||
                            parent.closest('.topic-right-sidebar') ||
                            parent.closest('button') ||
                            parent.closest('nav') ||
                            parent.closest('.topic-nav') ||
                            parent.closest('.breadcrumb')) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        var tag = parent.tagName.toUpperCase();
                        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'INPUT' || tag === 'TEXTAREA') {
                            return NodeFilter.FILTER_REJECT;
                        }

                        return NodeFilter.FILTER_ACCEPT;
                    }
                },
                false
            );

            var currNode;
            while ((currNode = walker.nextNode())) {
                textNodes.push(currNode);
            }

            var escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            var regex = new RegExp(escaped, 'gi');

            textNodes.forEach(function (node) {
                var val = node.nodeValue;
                if (!val) return;
                regex.lastIndex = 0;
                if (!regex.test(val)) return;

                regex.lastIndex = 0;
                var frag = document.createDocumentFragment();
                var lastIdx = 0;
                var match;
                var matched = false;

                while ((match = regex.exec(val)) !== null) {
                    matched = true;
                    if (match.index > lastIdx) {
                        frag.appendChild(document.createTextNode(val.substring(lastIdx, match.index)));
                    }
                    var mark = document.createElement('mark');
                    mark.className = 'inpage-search-match';
                    mark.textContent = match[0];
                    frag.appendChild(mark);
                    self.matches.push(mark);
                    lastIdx = regex.lastIndex;
                }

                if (matched) {
                    if (lastIdx < val.length) {
                        frag.appendChild(document.createTextNode(val.substring(lastIdx)));
                    }
                    if (node.parentNode) {
                        node.parentNode.replaceChild(frag, node);
                    }
                }
            });

            if (self.matches.length > 0) {
                self.currentIndex = 0;
                self.highlightCurrent(true);
            } else {
                self.currentIndex = -1;
            }

            self.updateControls();
        },

        next: function () {
            if (this.matches.length === 0) return;
            this.currentIndex = (this.currentIndex + 1) % this.matches.length;
            this.highlightCurrent(true);
        },

        prev: function () {
            if (this.matches.length === 0) return;
            this.currentIndex = (this.currentIndex - 1 + this.matches.length) % this.matches.length;
            this.highlightCurrent(true);
        },

        highlightCurrent: function (scroll) {
            this.matches.forEach(function (m) {
                m.classList.remove('inpage-search-active');
            });

            if (this.currentIndex >= 0 && this.currentIndex < this.matches.length) {
                var active = this.matches[this.currentIndex];
                active.classList.add('inpage-search-active');

                // If match is inside a tab pane that is currently inactive, auto-switch to that tab
                var tabPane = active.closest('.tab-pane');
                if (tabPane && !tabPane.classList.contains('active')) {
                    var tabId = tabPane.getAttribute('data-tab');
                    var tabBtn = document.querySelector('.tab-btn[data-tab="' + tabId + '"]');
                    if (tabBtn) tabBtn.click();
                }

                if (scroll) {
                    active.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            this.updateControls();
        },

        clear: function () {
            this.clearHighlights();
            var input = document.getElementById('inpage-search-input');
            if (input) input.value = '';
            this.updateControls();
        },

        updateControls: function () {
            var countLabel = document.getElementById('inpage-search-count');
            var prevBtn = document.getElementById('inpage-search-prev');
            var nextBtn = document.getElementById('inpage-search-next');
            var clearBtn = document.getElementById('inpage-search-clear');
            var input = document.getElementById('inpage-search-input');

            var val = (input ? input.value : '').trim();
            var total = this.matches.length;

            if (countLabel) {
                if (!val || val.length < 2) {
                    countLabel.textContent = '';
                } else if (total === 0) {
                    countLabel.textContent = '0 matches';
                } else {
                    countLabel.textContent = (this.currentIndex + 1) + ' of ' + total;
                }
            }

            if (prevBtn) prevBtn.disabled = total === 0;
            if (nextBtn) nextBtn.disabled = total === 0;
            if (clearBtn) clearBtn.disabled = !val;
        }
    };

    // ------------------------------------------------------------------
    // Hierarchical Curriculum Drawer
    // ------------------------------------------------------------------
    var CurriculumDrawer = {
        isOpen: false,
        isPinned: false,
        expandedLevels: {},

        init: function () {
            var self = this;
            var navBtn = document.getElementById('nav-contents-btn');
            var closeBtn = document.getElementById('drawer-close-btn');
            var pinBtn = document.getElementById('drawer-pin-btn');
            var backdrop = document.getElementById('content-drawer-backdrop');
            var searchInput = document.getElementById('drawer-search-input');
            var clearBtn = document.getElementById('drawer-search-clear');

            if (navBtn) {
                navBtn.addEventListener('click', function () {
                    self.toggle();
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', function () {
                    if (self.isPinned) {
                        self.setPinned(false);
                    }
                    self.close();
                });
            }

            if (pinBtn) {
                pinBtn.addEventListener('click', function () {
                    self.togglePin();
                });
            }

            if (backdrop) {
                backdrop.addEventListener('click', function () {
                    self.close();
                });
            }

            // Restore saved pinned state if on desktop screen (>= 1024px)
            var savedPinned = localStorage.getItem('ml_odyssey_drawer_pinned') === 'true';
            if (savedPinned && window.innerWidth >= 1024) {
                self.setPinned(true);
            }

            // Handle window resize: auto-unpin if window is resized below 1024px
            window.addEventListener('resize', function () {
                if (self.isPinned && window.innerWidth < 1024) {
                    self.setPinned(false);
                    self.close();
                }
            });

            if (searchInput) {
                searchInput.addEventListener('input', function () {
                    var val = this.value;
                    if (clearBtn) {
                        clearBtn.style.display = val ? 'block' : 'none';
                    }
                    self.filterTree(val);
                });

                searchInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Escape') {
                        if (this.value) {
                            this.value = '';
                            if (clearBtn) clearBtn.style.display = 'none';
                            self.filterTree('');
                        } else if (!self.isPinned) {
                            self.close();
                        }
                    }
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', function () {
                    if (searchInput) {
                        searchInput.value = '';
                        searchInput.focus();
                    }
                    clearBtn.style.display = 'none';
                    self.filterTree('');
                });
            }

            // Global keyboard shortcuts: Ctrl+K for drawer, Ctrl+\ for pin, Ctrl+F for in-page search
            document.addEventListener('keydown', function (e) {
                if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
                    e.preventDefault();
                    self.toggle();
                } else if ((e.ctrlKey || e.metaKey) && (e.key === '\\' || e.code === 'Backslash')) {
                    e.preventDefault();
                    self.togglePin();
                } else if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
                    var inpageInput = document.getElementById('inpage-search-input');
                    if (inpageInput) {
                        e.preventDefault();
                        inpageInput.focus();
                        inpageInput.select();
                    }
                } else if (e.key === 'Escape') {
                    if (self.isOpen && !self.isPinned) {
                        self.close();
                    }
                }
            });
        },

        setPinned: function (pinned) {
            this.isPinned = !!pinned;
            localStorage.setItem('ml_odyssey_drawer_pinned', this.isPinned ? 'true' : 'false');

            var drawer = document.getElementById('content-drawer');
            var pinBtn = document.getElementById('drawer-pin-btn');
            var backdrop = document.getElementById('content-drawer-backdrop');

            if (this.isPinned) {
                document.body.classList.add('drawer-pinned');
                if (drawer) {
                    drawer.classList.add('pinned');
                    drawer.classList.add('show');
                }
                if (pinBtn) {
                    pinBtn.classList.add('active');
                    pinBtn.setAttribute('title', 'Unpin sidebar (Ctrl+\\)');
                }
                if (backdrop) {
                    backdrop.classList.remove('show');
                }
                this.isOpen = true;
                this.renderTree();
            } else {
                document.body.classList.remove('drawer-pinned');
                if (drawer) {
                    drawer.classList.remove('pinned');
                }
                if (pinBtn) {
                    pinBtn.classList.remove('active');
                    pinBtn.setAttribute('title', 'Pin sidebar to left (Ctrl+\\)');
                }
            }
        },

        togglePin: function () {
            this.setPinned(!this.isPinned);
        },

        open: function () {
            var drawer = document.getElementById('content-drawer');
            var backdrop = document.getElementById('content-drawer-backdrop');
            var searchInput = document.getElementById('drawer-search-input');

            if (!drawer) return;

            this.isOpen = true;
            drawer.classList.add('show');
            if (backdrop && !this.isPinned) {
                backdrop.classList.add('show');
            }

            this.renderTree();

            if (searchInput) {
                setTimeout(function () {
                    searchInput.focus();
                }, 100);
            }
        },

        close: function () {
            if (this.isPinned) return; // Do not close if pinned to left!

            var drawer = document.getElementById('content-drawer');
            var backdrop = document.getElementById('content-drawer-backdrop');

            this.isOpen = false;
            if (drawer) drawer.classList.remove('show');
            if (backdrop) backdrop.classList.remove('show');
        },

        toggle: function () {
            if (this.isPinned) {
                this.setPinned(false);
                this.close();
            } else if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },

        getActiveTopicInfo: function () {
            var hash = location.hash.replace(/^#/, '');
            var parts = hash.split('/');
            if (parts[0] === 'topic' && parts.length >= 3) {
                return { levelId: parts[1], topicId: parts[2] };
            }
            if (parts[0] === 'level' && parts.length >= 2) {
                return { levelId: parts[1], topicId: null };
            }
            return null;
        },

        renderTree: function (filterQuery) {
            var container = document.getElementById('drawer-tree-container');
            if (!container || !topicsData || !topicsData.levels) return;

            var active = this.getActiveTopicInfo();
            // Automatically expand active topic's level, or the first level by default
            if (active && active.levelId) {
                this.expandedLevels[active.levelId] = true;
            } else if (topicsData.levels[0]) {
                this.expandedLevels[topicsData.levels[0].id] = true;
            }

            var query = (filterQuery || '').trim().toLowerCase();
            var html = '';
            var totalMatches = 0;

            topicsData.levels.forEach(function (level) {
                var levelMatches = !query || (level.name && level.name.toLowerCase().indexOf(query) !== -1);
                var topics = level.topics || [];

                // Filter topics
                var filteredTopics = topics.filter(function (t) {
                    if (!query || levelMatches) return true;
                    if (t.title && t.title.toLowerCase().indexOf(query) !== -1) return true;
                    if (t.content && t.content.sections) {
                        return t.content.sections.some(function (sec) {
                            var title = sec.title || sec.subtitle || sec.type || '';
                            return title.toLowerCase().indexOf(query) !== -1;
                        });
                    }
                    return false;
                });

                if (query && !levelMatches && filteredTopics.length === 0) {
                    return;
                }

                totalMatches += filteredTopics.length;
                var isExpanded = query ? true : !!CurriculumDrawer.expandedLevels[level.id];

                var completedCount = 0;
                topics.forEach(function (t) {
                    if (window.ProgressTracker && ProgressTracker.isTopicCompleted(level.id, t.id)) {
                        completedCount++;
                    }
                });

                html += '<div class="tree-level-group ' + (isExpanded ? 'expanded' : '') + '" data-level="' + level.id + '">';
                html +=   '<div class="tree-level-header" data-toggle-level="' + level.id + '">';
                html +=     '<div class="tree-level-left">';
                html +=       '<span class="tree-level-dot" style="background:' + (level.color || 'var(--primary)') + '"></span>';
                html +=       '<span class="tree-level-title">' + escapeHtml(level.name) + '</span>';
                html +=     '</div>';
                html +=     '<div class="tree-level-meta">';
                html +=       '<span class="tree-level-badge">' + completedCount + '/' + topics.length + '</span>';
                html +=       '<span class="tree-level-caret">▶</span>';
                html +=     '</div>';
                html +=   '</div>';

                html +=   '<div class="tree-topics-list">';
                var topicsToRender = query ? filteredTopics : topics;

                topicsToRender.forEach(function (t) {
                    var isTopicActive = active && active.levelId === level.id && active.topicId === t.id;
                    var isCompleted = window.ProgressTracker ? ProgressTracker.isTopicCompleted(level.id, t.id) : false;
                    var isStarted = window.ProgressTracker ? ProgressTracker.isTopicStarted(level.id, t.id) : false;

                    var statusIcon = '○';
                    var statusClass = '';
                    if (isCompleted) {
                        statusIcon = '✓';
                        statusClass = 'completed';
                    } else if (isStarted) {
                        statusIcon = '◐';
                        statusClass = 'started';
                    }

                    var hasSections = t.content && t.content.sections && t.content.sections.length > 0;
                    var showSubtopics = isTopicActive || (query && hasSections);

                    html += '<div class="tree-topic-item ' + (isTopicActive ? 'active' : '') + (showSubtopics ? ' show-subtopics' : '') + '" data-topic-id="' + t.id + '" data-level-id="' + level.id + '">';
                    html +=   '<a href="#topic/' + level.id + '/' + t.id + '" class="tree-topic-link" data-level-id="' + level.id + '" data-topic-id="' + t.id + '">';
                    html +=     '<div class="tree-topic-title-group">';
                    html +=       '<span class="tree-topic-icon">' + (isTopicActive ? '📖' : '📄') + '</span>';
                    html +=       '<span class="tree-topic-title">' + escapeHtml(t.title) + '</span>';
                    html +=     '</div>';
                    html +=     '<span class="tree-topic-status ' + statusClass + '">' + statusIcon + '</span>';
                    html +=   '</a>';

                    // Subtopics / Sections in topic
                    if (hasSections) {
                        html += '<div class="tree-subtopics-list">';
                        t.content.sections.forEach(function (s, sIdx) {
                            var secTitle = s.title || (s.subtitle ? s.subtitle : (s.type ? s.type.charAt(0).toUpperCase() + s.type.slice(1) : 'Section ' + (sIdx + 1)));
                            html += '<a href="#topic/' + level.id + '/' + t.id + '" class="tree-subtopic-link" data-level-id="' + level.id + '" data-topic-id="' + t.id + '" data-section-id="section-' + sIdx + '">§ ' + escapeHtml(secTitle) + '</a>';
                        });
                        html += '</div>';
                    }

                    html += '</div>';
                });

                html +=   '</div>'; // .tree-topics-list
                html += '</div>'; // .tree-level-group
            });

            if (query && totalMatches === 0) {
                html = '<div class="drawer-empty-search"><p>🔍 No topics matching "<strong>' + escapeHtml(query) + '</strong>"</p></div>';
            }

            container.innerHTML = html;
            this.attachTreeEvents(container);
        },

        filterTree: function (query) {
            this.renderTree(query);
        },

        attachTreeEvents: function (container) {
            var self = this;

            // Level toggle
            container.querySelectorAll('.tree-level-header').forEach(function (header) {
                header.addEventListener('click', function () {
                    var group = this.closest('.tree-level-group');
                    var levelId = this.getAttribute('data-toggle-level');
                    if (group) {
                        var willExpand = !group.classList.contains('expanded');
                        group.classList.toggle('expanded');
                        if (levelId) {
                            self.expandedLevels[levelId] = willExpand;
                        }
                    }
                });
            });

            // Topic link click
            container.querySelectorAll('.tree-topic-link').forEach(function (link) {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    var lvlId = this.getAttribute('data-level-id');
                    var topId = this.getAttribute('data-topic-id');
                    if (!self.isPinned) {
                        self.close();
                    }
                    navigate('topic/' + lvlId + '/' + topId);
                });
            });

            // Subtopic link click (section jump)
            container.querySelectorAll('.tree-subtopic-link').forEach(function (link) {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    var lvlId = this.getAttribute('data-level-id');
                    var topId = this.getAttribute('data-topic-id');
                    var secId = this.getAttribute('data-section-id');

                    var currentHash = location.hash.replace(/^#/, '');
                    var targetRoute = 'topic/' + lvlId + '/' + topId;

                    if (!self.isPinned) {
                        self.close();
                    }

                    if (currentHash === targetRoute) {
                        var el = document.getElementById(secId);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            el.classList.add('section-highlight-pulse');
                            setTimeout(function () { el.classList.remove('section-highlight-pulse'); }, 1600);
                        }
                    } else {
                        sessionStorage.setItem('pending_scroll_section', secId);
                        navigate(targetRoute);
                    }
                });
            });
        }
    };

    window.InPageSearch = InPageSearch;
    window.CurriculumDrawer = CurriculumDrawer;

    // ------------------------------------------------------------------
    // Theme Manager
    // ------------------------------------------------------------------
    var THEME_LABELS = {
        'dark': '🌌 Cosmos',
        'light': '☀️ Daylight',
        'cyberpunk': '⚡ Cyberpunk',
        'emerald': '🌲 Emerald',
        'sunset': '🌅 Sunset',
        'nord': '❄️ Nord'
    };

    var ThemeManager = {
        init: function () {
            var current = localStorage.getItem('ml_odyssey_theme') || 'dark';
            ThemeManager.applyTheme(current, false);

            var toggleBtn = document.getElementById('theme-toggle-btn');
            var menu = document.getElementById('theme-dropdown-menu');

            if (toggleBtn && menu) {
                toggleBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    menu.classList.toggle('show');
                });

                document.addEventListener('click', function () {
                    menu.classList.remove('show');
                });

                menu.querySelectorAll('.theme-option').forEach(function (opt) {
                    opt.addEventListener('click', function () {
                        var chosenTheme = opt.getAttribute('data-theme');
                        ThemeManager.applyTheme(chosenTheme, true);
                        menu.classList.remove('show');
                    });
                });
            }
        },

        applyTheme: function (themeId, notifySession) {
            if (!THEME_LABELS[themeId]) themeId = 'dark';
            document.documentElement.setAttribute('data-theme', themeId);
            localStorage.setItem('ml_odyssey_theme', themeId);

            var btnLabel = document.getElementById('theme-btn-label');
            if (btnLabel) {
                btnLabel.textContent = (THEME_LABELS[themeId] || 'Theme') + ' ▾';
            }

            // Update active state in theme dropdown menu
            document.querySelectorAll('.theme-option').forEach(function (opt) {
                if (opt.getAttribute('data-theme') === themeId) {
                    opt.classList.add('active');
                } else {
                    opt.classList.remove('active');
                }
            });

            // Update playground theme selector if present
            var pgSelect = document.getElementById('playground-theme-select');
            if (pgSelect) {
                pgSelect.value = themeId;
            }

            // If CodeMirror editors exist, refresh layout
            if (window.CodeMirror) {
                setTimeout(function () {
                    document.querySelectorAll('.CodeMirror').forEach(function (cmEl) {
                        if (cmEl.CodeMirror) cmEl.CodeMirror.refresh();
                    });
                }, 50);
            }

            // Notify active playground session
            if (window.Playground && typeof window.Playground.setTheme === 'function') {
                window.Playground.setTheme(themeId, notifySession);
            }
        },

        getCurrentTheme: function () {
            return document.documentElement.getAttribute('data-theme') || localStorage.getItem('ml_odyssey_theme') || 'dark';
        }
    };

    window.ThemeManager = ThemeManager;

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
        ThemeManager.init();
        CurriculumDrawer.init();

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
        getTopicsData: function () { return topicsData; },
        CurriculumDrawer: CurriculumDrawer,
        InPageSearch: InPageSearch
    };
})();
