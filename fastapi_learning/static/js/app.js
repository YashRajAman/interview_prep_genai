/**
 * FastAPI Learning Platform — Main Application Controller
 * SPA routing, content rendering, topic navigation, and state management.
 */

(function () {
    'use strict';

    // ─── State ────────────────────────────────────────────────────
    var state = {
        topicsData: null,
        currentRoute: 'home',
        currentTopic: null,
        currentTab: 'read',
    };

    var LEVEL_META = {
        foundations: { icon: '🚀', color: 'var(--level-foundations)', title: 'Foundations' },
        data: { icon: '📦', color: 'var(--level-data)', title: 'Data Handling & Validation' },
        async: { icon: '⚡', color: 'var(--level-async)', title: 'Async & Architecture' },
        security: { icon: '🔒', color: 'var(--level-security)', title: 'Security & Database' },
        production: { icon: '🚢', color: 'var(--level-production)', title: 'Testing & Production' },
    };

    // ─── Init ─────────────────────────────────────────────────────
    function init() {
        setupNavigation();
        setupThemeSelector();
        setupContentDrawer();
        loadTopicsData().then(function () {
            updateNavProgress();
            navigateTo('home');
        });
    }

    // ─── Navigation ──────────────────────────────────────────────
    function setupNavigation() {
        var links = document.querySelectorAll('.nav-link[data-route]');
        links.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateTo(link.dataset.route);
            });
        });
    }

    function navigateTo(route, params) {
        state.currentRoute = route;
        document.querySelectorAll('.nav-link[data-route]').forEach(function (l) {
            l.classList.toggle('active', l.dataset.route === route);
        });

        switch (route) {
            case 'home': renderHome(); break;
            case 'levels': renderLevels(); break;
            case 'playground': renderPlayground(); break;
            case 'progress': renderProgress(); break;
            case 'topic': renderTopic(params || {}); break;
            default: renderHome();
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ─── Data Loading ────────────────────────────────────────────
    function loadTopicsData() {
        return fetch('/api/topics')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                state.topicsData = data;
                populateContentDrawer();
            })
            .catch(function (err) {
                console.error('Failed to load topics:', err);
            });
    }

    function loadTopicDetail(levelId, topicId) {
        return fetch('/api/topic/' + levelId + '/' + topicId)
            .then(function (r) { return r.json(); });
    }

    // ─── Home View ────────────────────────────────────────────────
    function renderHome() {
        var content = document.getElementById('app-content');
        var levels = state.topicsData ? state.topicsData.levels : [];
        var totalTopics = 0;
        levels.forEach(function (l) { totalTopics += (l.topics || []).length; });
        var completed = ProgressTracker.getCompletedCount();
        var progressPct = ProgressTracker.getOverallProgress(totalTopics);

        var levelsHtml = levels.map(function (level) {
            var meta = LEVEL_META[level.id] || { icon: '📚', color: 'var(--primary)', title: level.title };
            var topicCount = (level.topics || []).length;
            var completedInLevel = (level.topics || []).filter(function (t) { return ProgressTracker.isCompleted(t.id); }).length;
            return '' +
                '<div class="level-card" style="--level-color:' + meta.color + '" data-level="' + level.id + '">' +
                    '<div class="level-card-header">' +
                        '<span class="level-card-icon">' + meta.icon + '</span>' +
                        '<div class="level-card-title">' + level.title + '</div>' +
                    '</div>' +
                    '<p class="level-card-desc">' + (level.description || '') + '</p>' +
                    '<div class="level-card-meta">' +
                        '<span>📊 ' + topicCount + ' topics</span>' +
                        '<span>✓ ' + completedInLevel + '/' + topicCount + ' completed</span>' +
                    '</div>' +
                '</div>';
        }).join('');

        content.innerHTML = '' +
            '<div class="hero-section">' +
                '<div class="hero-badge"><span class="pulse-dot"></span> FastAPI Learning Platform</div>' +
                '<h1 class="hero-title">Master <span class="accent">FastAPI</span> Backend Development</h1>' +
                '<p class="hero-subtitle">From your first endpoint to production deployment — interactive lessons, live code execution, and quizzes.</p>' +
            '</div>' +
            '<div class="progress-overview" style="max-width:600px;margin:0 auto 40px;">' +
                '<div class="progress-stat-card"><div class="progress-stat-value">' + totalTopics + '</div><div class="progress-stat-label">Total Topics</div></div>' +
                '<div class="progress-stat-card"><div class="progress-stat-value">' + completed + '</div><div class="progress-stat-label">Completed</div></div>' +
                '<div class="progress-stat-card"><div class="progress-stat-value">' + progressPct + '%</div><div class="progress-stat-label">Progress</div></div>' +
            '</div>' +
            '<div class="levels-grid">' + levelsHtml + '</div>';

        // Wire level cards
        content.querySelectorAll('.level-card[data-level]').forEach(function (card) {
            card.addEventListener('click', function () {
                navigateTo('levels', { levelId: card.dataset.level });
            });
        });
    }

    // ─── Levels View ──────────────────────────────────────────────
    function renderLevels(params) {
        var content = document.getElementById('app-content');
        var levels = state.topicsData ? state.topicsData.levels : [];

        var targetLevelId = params && params.levelId ? params.levelId : null;

        var html = '';
        levels.forEach(function (level) {
            if (targetLevelId && level.id !== targetLevelId) return;
            var meta = LEVEL_META[level.id] || { icon: '📚', color: 'var(--primary)' };
            html += '<div style="margin-bottom:40px;">' +
                '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">' +
                    '<span style="font-size:32px;">' + meta.icon + '</span>' +
                    '<h2 style="font-family:var(--font-heading);font-size:28px;">' + level.title + '</h2>' +
                '</div>' +
                '<p style="color:var(--text-secondary);margin-bottom:20px;">' + (level.description || '') + '</p>' +
                '<div class="levels-grid">';

            (level.topics || []).forEach(function (topic) {
                var isCompleted = ProgressTracker.isCompleted(topic.id);
                var isVisited = ProgressTracker.isVisited(topic.id);
                html += '<div class="level-card" style="--level-color:' + meta.color + '" data-topic-id="' + topic.id + '" data-level-id="' + level.id + '">' +
                    '<div class="level-card-header">' +
                        '<span class="level-card-icon">' + (topic.icon || meta.icon) + '</span>' +
                        '<div class="level-card-title">' + topic.title + '</div>' +
                    '</div>' +
                    '<p class="level-card-desc">' + (topic.summary || '') + '</p>' +
                    '<div class="level-card-meta">' +
                        '<span>' + (isCompleted ? '✓ Completed' : isVisited ? '👁 Visited' : '◯ Not started') + '</span>' +
                        (topic.estimated_minutes ? '<span>⏱ ' + topic.estimated_minutes + ' min</span>' : '') +
                    '</div>' +
                '</div>';
            });

            html += '</div></div>';
        });

        if (!html) {
            html = '<div style="text-align:center;padding:60px;color:var(--text-muted);">No levels found.</div>';
        }

        content.innerHTML = '<h1 style="font-family:var(--font-heading);font-size:32px;margin-bottom:24px;">Curriculum</h1>' + html;

        // Wire topic cards
        content.querySelectorAll('.level-card[data-topic-id]').forEach(function (card) {
            card.addEventListener('click', function () {
                navigateTo('topic', { levelId: card.dataset.levelId, topicId: card.dataset.topicId });
            });
        });
    }

    // ─── Topic View ───────────────────────────────────────────────
    function renderTopic(params) {
        var content = document.getElementById('app-content');
        if (!params || !params.topicId) {
            content.innerHTML = '<p>Topic not found.</p>';
            return;
        }

        content.innerHTML = '<div class="loading-screen"><div class="loader"><div class="loader-icon">⚡</div><div class="loader-text">Loading topic...</div></div></div>';

        loadTopicDetail(params.levelId, params.topicId).then(function (topic) {
            if (!topic || topic.error) {
                content.innerHTML = '<p>Topic not found: ' + params.topicId + '</p>';
                return;
            }

            state.currentTopic = topic;
            ProgressTracker.markVisited(topic.id);
            updateNavProgress();

            var meta = LEVEL_META[topic.level] || { icon: '📚', color: 'var(--primary)' };

            // Build tabs
            var tabs = ['read', 'interact', 'code', 'quiz'];
            var tabLabels = { read: '📖 Read', interact: '🎮 Play', code: '💻 Code', quiz: '📝 Quiz' };
            var availableTabs = tabs.filter(function (t) {
                if (t === 'read') return topic.read && topic.read.sections;
                if (t === 'interact') return topic.interact;
                if (t === 'code') return topic.code_challenge;
                if (t === 'quiz') return topic.quiz && topic.quiz.length > 0;
                return false;
            });

            var tabsHtml = availableTabs.map(function (t, i) {
                return '<button class="topic-tab ' + (i === 0 ? 'active' : '') + '" data-tab="' + t + '">' + tabLabels[t] + '</button>';
            }).join('');

            var contentHtml = availableTabs.map(function (t, i) {
                return '<div class="tab-content ' + (i === 0 ? 'active' : '') + '" data-tab-content="' + t + '"></div>';
            }).join('');

            content.innerHTML = '' +
                '<div class="topic-view">' +
                    '<div class="topic-header">' +
                        '<div class="topic-breadcrumb">' +
                            '<a data-route="home">Home</a> <span>›</span> ' +
                            '<a data-route="levels" data-level-id="' + topic.level + '">' + (LEVEL_META[topic.level] || {}).title + '</a> <span>›</span> ' +
                            '<span>' + topic.title + '</span>' +
                        '</div>' +
                        '<h1 class="topic-title">' + topic.title + '</h1>' +
                        '<p class="topic-summary">' + (topic.summary || '') + '</p>' +
                        '<div class="topic-meta">' +
                            (topic.estimated_minutes ? '<span>⏱ ' + topic.estimated_minutes + ' min</span>' : '') +
                            '<span>📊 ' + topic.level + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="topic-tabs">' + tabsHtml + '</div>' +
                    contentHtml +
                '</div>';

            // Render each tab's content
            // Code tab is deferred — CodeMirror needs visible container
            availableTabs.forEach(function (tab) {
                var tabContent = content.querySelector('[data-tab-content="' + tab + '"]');
                if (tab === 'read') renderReadContent(topic, tabContent);
                if (tab === 'interact') renderInteractContent(topic, tabContent);
                if (tab === 'quiz') renderQuizContent(topic, tabContent);
                // Code tab: only render if it's the first visible tab; else defer
                if (tab === 'code' && availableTabs[0] === 'code') {
                    renderCodeContent(topic, tabContent);
                } else if (tab === 'code') {
                    tabContent.dataset.deferred = 'true';
                }
            });

            // Wire up tabs
            content.querySelectorAll('.topic-tab').forEach(function (tabBtn) {
                tabBtn.addEventListener('click', function () {
                    var tabName = tabBtn.dataset.tab;
                    content.querySelectorAll('.topic-tab').forEach(function (t) { t.classList.remove('active'); });
                    content.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
                    tabBtn.classList.add('active');
                    var tabContentEl = content.querySelector('[data-tab-content="' + tabName + '"]');
                    tabContentEl.classList.add('active');
                    state.currentTab = tabName;
                    // Render deferred code tab on first click
                    if (tabName === 'code' && tabContentEl.dataset.deferred === 'true' && state.currentTopic) {
                        tabContentEl.dataset.deferred = 'false';
                        renderCodeContent(state.currentTopic, tabContentEl);
                    }
                    // Refresh CodeMirror editors when code tab becomes visible
                    if (tabName === 'code' && window.CodePlayground) {
                        setTimeout(function () { CodePlayground.refreshEditors(); }, 50);
                    }
                });
            });

            // Wire breadcrumb links
            content.querySelectorAll('.topic-breadcrumb a[data-route]').forEach(function (a) {
                a.addEventListener('click', function (e) {
                    e.preventDefault();
                    var route = a.dataset.route;
                    var params = {};
                    if (a.dataset.levelId) params.levelId = a.dataset.levelId;
                    navigateTo(route, params);
                });
            });
        });
    }

    // ─── Read Content Renderer ────────────────────────────────────
    function renderReadContent(topic, container) {
        var sections = (topic.read && topic.read.sections) || [];
        if (!sections.length) {
            container.innerHTML = '<p style="color:var(--text-muted);">No reading content available.</p>';
            return;
        }

        container.innerHTML = sections.map(function (s) {
            switch (s.type) {
                case 'heading':
                    return '<h2 class="read-heading">' + escapeHtml(s.content) + '</h2>';
                case 'paragraph':
                    return '<p class="read-paragraph">' + escapeHtml(s.content) + '</p>';
                case 'code':
                    return '<div class="read-code-block"><code>' + escapeHtml(s.content) + '</code></div>';
                case 'callout':
                    return '<div class="read-callout ' + (s.variant || 'info') + '">' +
                        (s.title ? '<div class="read-callout-title">' + escapeHtml(s.title) + '</div>' : '') +
                        '<div class="read-callout-body">' + escapeHtml(s.content) + '</div></div>';
                case 'table':
                    return '<table class="read-table"><thead><tr>' +
                        s.headers.map(function (h) { return '<th>' + escapeHtml(h) + '</th>'; }).join('') +
                        '</tr></thead><tbody>' +
                        s.rows.map(function (row) {
                            return '<tr>' + row.map(function (c) { return '<td>' + escapeHtml(c) + '</td>'; }).join('') + '</tr>';
                        }).join('') +
                        '</tbody></table>';
                case 'list':
                    return '<ul style="margin-left:24px;margin-bottom:16px;">' +
                        s.items.map(function (i) { return '<li style="margin-bottom:4px;color:var(--text-primary);">' + escapeHtml(i) + '</li>'; }).join('') +
                        '</ul>';
                default:
                    return '<p>' + escapeHtml(s.content || '') + '</p>';
            }
        }).join('');
    }

    // ─── Interact Content Renderer ────────────────────────────────
    function renderInteractContent(topic, container) {
        var interact = topic.interact;
        if (!interact) {
            container.innerHTML = '<p style="color:var(--text-muted);">No interactive component available for this topic.</p>';
            return;
        }

        // Render based on interact type
        container.innerHTML = '<div class="interact-container">' +
            '<div class="interact-title">🎮 ' + escapeHtml(interact.title || 'Interactive Demo') + '</div>' +
            '<div class="interact-description">' + escapeHtml(interact.description || '') + '</div>' +
            '<div id="interact-render-area"></div>' +
        '</div>';

        var renderArea = container.querySelector('#interact-render-area');

        switch (interact.type) {
            case 'framework-comparison':
                renderFrameworkComparison(renderArea, interact.config || {});
                break;
            case 'http-method-explorer':
                renderHttpMethodExplorer(renderArea, interact.config || {});
                break;
            case 'status-codes':
                renderStatusCodeExplorer(renderArea, interact.config || {});
                break;
            case 'url-matcher':
                renderUrlMatcher(renderArea, interact.config || {});
                break;
            case 'query-builder':
                renderQueryBuilder(renderArea, interact.config || {});
                break;
            case 'json-builder':
                renderJsonBuilder(renderArea, interact.config || {});
                break;
            case 'event-loop-visualizer':
                renderEventLoopVisualizer(renderArea, interact.config || {});
                break;
            case 'dependency-graph':
                renderDependencyGraph(renderArea, interact.config || {});
                break;
            case 'jwt-inspector':
                renderJwtInspector(renderArea, interact.config || {});
                break;
            case 'production-checklist':
                renderProductionChecklist(renderArea, interact.config || {});
                break;
            default:
                renderStatusCodeExplorer(renderArea, interact.config || {});
        }
    }

    function renderFrameworkComparison(container, config) {
        var frameworks = config.frameworks || [
            { name: 'Flask', speed: 'Medium', types: 'No', docs: 'Manual', async: 'Limited' },
            { name: 'Django', speed: 'Medium', types: 'No', docs: 'Manual', async: 'Partial' },
            { name: 'FastAPI', speed: 'High', types: 'Yes', docs: 'Auto', async: 'Native' },
            { name: 'Express.js', speed: 'High', types: 'No', docs: 'Manual', async: 'Native' }
        ];
        var html = '<table class="read-table"><thead><tr><th>Framework</th><th>Speed</th><th>Type Hints</th><th>Auto Docs</th><th>Async</th></tr></thead><tbody>';
        frameworks.forEach(function (f) {
            var isFast = f.name === 'FastAPI';
            html += '<tr style="' + (isFast ? 'background:var(--primary-dim);' : '') + '">' +
                '<td style="font-weight:' + (isFast ? '700' : '400') + ';">' + f.name + '</td>' +
                '<td>' + f.speed + '</td><td>' + f.types + '</td><td>' + f.docs + '</td><td>' + f.async + '</td></tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    function renderHttpMethodExplorer(container, config) {
        var methods = [
            { method: 'GET', desc: 'Read/retrieve data', example: 'GET /items/1' },
            { method: 'POST', desc: 'Create new resource', example: 'POST /items' },
            { method: 'PUT', desc: 'Full replace resource', example: 'PUT /items/1' },
            { method: 'PATCH', desc: 'Partial update', example: 'PATCH /items/1' },
            { method: 'DELETE', desc: 'Delete resource', example: 'DELETE /items/1' }
        ];
        var html = methods.map(function (m) {
            return '<div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border-color);border-radius:8px;margin-bottom:8px;cursor:pointer;" data-method="' + m.method + '">' +
                '<span class="http-method-badge" style="min-width:60px;text-align:center;">' + m.method + '</span>' +
                '<div><div style="font-size:14px;color:var(--text-primary);">' + m.desc + '</div>' +
                '<code style="font-size:12px;color:var(--text-muted);">' + m.example + '</code></div></div>';
        }).join('');
        html += '<div id="method-detail" style="margin-top:16px;padding:16px;background:var(--bg-elevated);border-radius:8px;min-height:60px;color:var(--text-muted);">Click a method to learn more.</div>';
        container.innerHTML = html;

        container.querySelectorAll('[data-method]').forEach(function (el) {
            el.addEventListener('click', function () {
                var detail = container.querySelector('#method-detail');
                var method = el.dataset.method;
                var info = methods.find(function (m) { return m.method === method; });
                detail.innerHTML = '<strong style="color:var(--primary);">' + method + '</strong><br>' + info.desc + '<br><code>' + info.example + '</code>';
            });
        });
    }

    function renderStatusCodeExplorer(container, config) {
        var codes = [
            { code: 200, label: 'OK', cat: '2xx', color: 'var(--success)', desc: 'Standard success response', syntax: 'status.HTTP_200_OK' },
            { code: 201, label: 'Created', cat: '2xx', color: 'var(--success)', desc: 'Resource created successfully (POST)', syntax: 'status.HTTP_201_CREATED' },
            { code: 204, label: 'No Content', cat: '2xx', color: 'var(--success)', desc: 'Success, no response body (DELETE)', syntax: 'status.HTTP_204_NO_CONTENT' },
            { code: 301, label: 'Moved Permanently', cat: '3xx', color: 'var(--info)', desc: 'Resource permanently moved', syntax: 'status.HTTP_301_MOVED_PERMANENTLY' },
            { code: 307, label: 'Temporary Redirect', cat: '3xx', color: 'var(--info)', desc: 'Redirect keeping HTTP method', syntax: 'status.HTTP_307_TEMPORARY_REDIRECT' },
            { code: 400, label: 'Bad Request', cat: '4xx', color: 'var(--error)', desc: 'Malformed client request syntax', syntax: 'raise HTTPException(400, "Bad Request")' },
            { code: 401, label: 'Unauthorized', cat: '4xx', color: 'var(--error)', desc: 'Authentication credentials missing or invalid', syntax: 'raise HTTPException(401, "Invalid token")' },
            { code: 403, label: 'Forbidden', cat: '4xx', color: 'var(--error)', desc: 'Authenticated but insufficient permissions', syntax: 'raise HTTPException(403, "Not allowed")' },
            { code: 404, label: 'Not Found', cat: '4xx', color: 'var(--error)', desc: 'Requested resource does not exist', syntax: 'raise HTTPException(404, "Not found")' },
            { code: 422, label: 'Unprocessable Entity', cat: '4xx', color: 'var(--warning)', desc: 'FastAPI automatic schema validation error', syntax: 'Automatic 422 on type/field errors' },
            { code: 500, label: 'Internal Server Error', cat: '5xx', color: 'var(--error)', desc: 'Unhandled server exception occurred', syntax: 'Automatic on uncaught exception' }
        ];

        var html = '<div style="margin-bottom:14px;display:flex;gap:8px;flex-wrap:wrap;">' +
            '<button class="widget-pill active" data-filter="all">All</button>' +
            '<button class="widget-pill" data-filter="2xx">2xx Success</button>' +
            '<button class="widget-pill" data-filter="3xx">3xx Redirect</button>' +
            '<button class="widget-pill" data-filter="4xx">4xx Client Error</button>' +
            '<button class="widget-pill" data-filter="5xx">5xx Server Error</button>' +
        '</div>' +
        '<div id="status-code-list">';

        function renderList(filter) {
            var filtered = codes.filter(function (c) {
                return filter === 'all' || c.cat === filter;
            });
            return filtered.map(function (c) {
                return '<div class="widget-card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;">' +
                    '<div style="display:flex;align-items:center;gap:12px;">' +
                        '<span class="status-badge ' + (c.code < 300 ? 'success' : c.code < 400 ? 'redirect' : 'error') + '">' + c.code + '</span>' +
                        '<div>' +
                            '<div style="font-weight:600;font-size:14px;color:var(--text-primary);">' + c.label + '</div>' +
                            '<div style="font-size:12px;color:var(--text-muted);">' + c.desc + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<code style="font-size:11px;color:var(--primary);background:var(--bg-base);padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);">' + c.syntax + '</code>' +
                '</div>';
            }).join('');
        }

        html += renderList('all') + '</div>';
        container.innerHTML = html;

        container.querySelectorAll('[data-filter]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                container.querySelectorAll('[data-filter]').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                container.querySelector('#status-code-list').innerHTML = renderList(btn.dataset.filter);
            });
        });
    }

    // ─── Interactive: URL Path Matcher ────────────────────────────
    function renderUrlMatcher(container, config) {
        var routes = [
            { id: 1, method: 'GET', pattern: '/users/me', type: 'Static route', handler: 'read_current_user()' },
            { id: 2, method: 'GET', pattern: '/users/{user_id:int}', type: 'Path param (int >= 1)', handler: 'read_user(user_id: int)' },
            { id: 3, method: 'GET', pattern: '/models/{model_name:Enum}', type: 'Enum param (alexnet | resnet)', handler: 'get_model(model_name: ModelName)' },
            { id: 4, method: 'GET', pattern: '/files/{file_path:path}', type: 'Wildcard Path converter', handler: 'read_file(file_path: str)' }
        ];

        var html = '<div class="interactive-widget">' +
            '<div style="margin-bottom:14px;">' +
                '<label class="widget-label">Registered Route Order in FastAPI:</label>' +
                routes.map(function (r) {
                    return '<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;font-family:var(--font-code);">' +
                        r.id + '. <span class="http-method-badge" style="padding:2px 6px;font-size:10px;">' + r.method + '</span> ' +
                        '<strong style="color:var(--text-primary);">' + r.pattern + '</strong> &rarr; ' + r.handler + ' <span style="opacity:0.6;">(' + r.type + ')</span>' +
                    '</div>';
                }).join('') +
            '</div>' +
            '<div class="widget-row">' +
                '<div class="widget-col">' +
                    '<label class="widget-label">Enter test URL:</label>' +
                    '<input type="text" class="widget-input" id="url-test-input" value="/users/42" placeholder="/users/me, /users/42, /users/abc...">' +
                '</div>' +
            '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">' +
                '<span class="widget-pill" data-preset="/users/me">/users/me</span>' +
                '<span class="widget-pill" data-preset="/users/42">/users/42</span>' +
                '<span class="widget-pill" data-preset="/users/abc">/users/abc (invalid int)</span>' +
                '<span class="widget-pill" data-preset="/models/resnet">/models/resnet</span>' +
                '<span class="widget-pill" data-preset="/models/vgg">/models/vgg (invalid enum)</span>' +
                '<span class="widget-pill" data-preset="/files/var/log/app.log">/files/var/log/app.log</span>' +
            '</div>' +
            '<div id="url-match-result"></div>' +
        '</div>';

        container.innerHTML = html;

        var input = container.querySelector('#url-test-input');
        var resultArea = container.querySelector('#url-match-result');

        function evaluate(url) {
            url = url.trim();
            if (url === '/users/me') {
                resultArea.innerHTML = '<div class="widget-card highlight">' +
                    '<div style="color:var(--success);font-weight:700;margin-bottom:6px;">&check; Matched Route 1 (Static): /users/me</div>' +
                    '<div style="font-size:13px;color:var(--text-secondary);">Declared before <code>/users/{user_id}</code>, so it takes precedence!</div>' +
                    '<div class="widget-code-preview" style="margin-top:8px;">HTTP 200 OK &rarr; {"user_id": "current_authenticated_user"}</div>' +
                '</div>';
            } else if (/^\/users\/([^\/]+)$/.test(url)) {
                var val = url.match(/^\/users\/([^\/]+)$/)[1];
                if (/^\d+$/.test(val)) {
                    resultArea.innerHTML = '<div class="widget-card highlight">' +
                        '<div style="color:var(--success);font-weight:700;margin-bottom:6px;">&check; Matched Route 2: /users/{user_id:int}</div>' +
                        '<div style="font-size:13px;color:var(--text-secondary);">Extracted parameter: <code>user_id = ' + val + '</code> (cast to Python <code>int</code>)</div>' +
                        '<div class="widget-code-preview" style="margin-top:8px;">HTTP 200 OK &rarr; {"user_id": ' + val + '}</div>' +
                    '</div>';
                } else {
                    resultArea.innerHTML = '<div class="widget-card error">' +
                        '<div style="color:var(--error);font-weight:700;margin-bottom:6px;">&cross; Validation Error (HTTP 422 Unprocessable Entity)</div>' +
                        '<div style="font-size:13px;color:var(--text-secondary);">Value <code>"' + escapeHtml(val) + '"</code> failed <code>int</code> validation:</div>' +
                        '<div class="widget-code-preview" style="margin-top:8px;">[{"type": "int_parsing", "loc": ["path", "user_id"], "msg": "Input should be a valid integer, unable to parse string as an integer"}]</div>' +
                    '</div>';
                }
            } else if (/^\/models\/([^\/]+)$/.test(url)) {
                var m = url.match(/^\/models\/([^\/]+)$/)[1];
                if (m === 'alexnet' || m === 'resnet') {
                    resultArea.innerHTML = '<div class="widget-card highlight">' +
                        '<div style="color:var(--success);font-weight:700;margin-bottom:6px;">&check; Matched Route 3 (Enum): /models/{model_name}</div>' +
                        '<div style="font-size:13px;color:var(--text-secondary);">Valid enum member <code>ModelName.' + m + '</code></div>' +
                        '<div class="widget-code-preview" style="margin-top:8px;">HTTP 200 OK &rarr; {"model_name": "' + m + '"}</div>' +
                    '</div>';
                } else {
                    resultArea.innerHTML = '<div class="widget-card error">' +
                        '<div style="color:var(--error);font-weight:700;margin-bottom:6px;">&cross; Enum Validation Error (HTTP 422)</div>' +
                        '<div style="font-size:13px;color:var(--text-secondary);">Value <code>"' + escapeHtml(m) + '"</code> is not in enum [alexnet, resnet]:</div>' +
                        '<div class="widget-code-preview" style="margin-top:8px;">[{"type": "enum", "loc": ["path", "model_name"], "msg": "Input should be \'alexnet\' or \'resnet\'"}]</div>' +
                    '</div>';
                }
            } else if (/^\/files\/(.+)$/.test(url)) {
                var fpath = url.match(/^\/files\/(.+)$/)[1];
                resultArea.innerHTML = '<div class="widget-card highlight">' +
                    '<div style="color:var(--success);font-weight:700;margin-bottom:6px;">&check; Matched Route 4 (Path converter): /files/{file_path:path}</div>' +
                    '<div style="font-size:13px;color:var(--text-secondary);">Slashes preserved: <code>file_path = "' + escapeHtml(fpath) + '"</code></div>' +
                    '<div class="widget-code-preview" style="margin-top:8px;">HTTP 200 OK &rarr; {"file_path": "' + escapeHtml(fpath) + '"}</div>' +
                '</div>';
            } else {
                resultArea.innerHTML = '<div class="widget-card error">' +
                    '<div style="color:var(--error);font-weight:700;">HTTP 404 Not Found</div>' +
                    '<div style="font-size:13px;color:var(--text-secondary);">No route matches path <code>' + escapeHtml(url) + '</code>.</div>' +
                '</div>';
            }
        }

        input.addEventListener('input', function () { evaluate(input.value); });
        container.querySelectorAll('[data-preset]').forEach(function (p) {
            p.addEventListener('click', function () {
                input.value = p.dataset.preset;
                evaluate(input.value);
            });
        });
        evaluate(input.value);
    }

    // ─── Interactive: Query Parameter Builder ─────────────────────
    function renderQueryBuilder(container, config) {
        var html = '<div class="interactive-widget">' +
            '<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;font-family:var(--font-code);">' +
                '@app.get("/items/")<br>' +
                'def read_items(skip: int = 0, limit: int = 10, q: str | None = None, sort: str = "price"):' +
            '</div>' +
            '<div class="widget-row">' +
                '<div class="widget-col">' +
                    '<label class="widget-label">skip (int >= 0):</label>' +
                    '<input type="number" id="qb-skip" class="widget-input" value="0" min="0">' +
                '</div>' +
                '<div class="widget-col">' +
                    '<label class="widget-label">limit (1 - 100): <span id="qb-limit-val" style="color:var(--primary);">10</span></label>' +
                    '<input type="range" id="qb-limit" class="widget-input" value="10" min="1" max="100">' +
                '</div>' +
            '</div>' +
            '<div class="widget-row">' +
                '<div class="widget-col">' +
                    '<label class="widget-label">q (optional search string):</label>' +
                    '<input type="text" id="qb-q" class="widget-input" placeholder="e.g. laptop, phone..." value="fastapi">' +
                '</div>' +
                '<div class="widget-col">' +
                    '<label class="widget-label">sort (dropdown):</label>' +
                    '<select id="qb-sort" class="widget-select">' +
                        '<option value="price">price</option>' +
                        '<option value="rating">rating</option>' +
                        '<option value="created_at">created_at</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
            '<label class="widget-label">Constructed Request URL:</label>' +
            '<div class="widget-code-preview" id="qb-url-preview" style="color:var(--primary);margin-bottom:12px;"></div>' +
            '<label class="widget-label">FastAPI Injected Parameters Object:</label>' +
            '<div class="widget-code-preview" id="qb-json-preview"></div>' +
        '</div>';

        container.innerHTML = html;

        var skipInput = container.querySelector('#qb-skip');
        var limitInput = container.querySelector('#qb-limit');
        var limitVal = container.querySelector('#qb-limit-val');
        var qInput = container.querySelector('#qb-q');
        var sortInput = container.querySelector('#qb-sort');
        var urlPreview = container.querySelector('#qb-url-preview');
        var jsonPreview = container.querySelector('#qb-json-preview');

        function update() {
            var skip = parseInt(skipInput.value, 10) || 0;
            var limit = parseInt(limitInput.value, 10) || 10;
            limitVal.textContent = limit;
            var q = qInput.value.trim();
            var sort = sortInput.value;

            var params = [];
            if (skip !== 0) params.push('skip=' + skip);
            if (limit !== 10) params.push('limit=' + limit);
            if (q) params.push('q=' + encodeURIComponent(q));
            if (sort !== 'price') params.push('sort=' + encodeURIComponent(sort));

            var fullUrl = 'http://localhost:8001/items/' + (params.length ? '?' + params.join('&') : '');
            urlPreview.textContent = 'GET ' + fullUrl;

            jsonPreview.textContent = JSON.stringify({
                skip: skip,
                limit: limit,
                q: q || null,
                sort: sort
            }, null, 2);
        }

        [skipInput, limitInput, qInput, sortInput].forEach(function (el) {
            el.addEventListener('input', update);
        });
        update();
    }

    // ─── Interactive: JSON Request Body & Pydantic Builder ─────────
    function renderJsonBuilder(container, config) {
        var html = '<div class="interactive-widget">' +
            '<div style="display:flex;gap:12px;margin-bottom:16px;">' +
                '<div style="flex:1;">' +
                    '<label class="widget-label">Pydantic v2 Schema:</label>' +
                    '<div class="widget-code-preview" style="font-size:11px;">' +
                        'class Item(BaseModel):<br>' +
                        '&nbsp;&nbsp;&nbsp;&nbsp;name: str<br>' +
                        '&nbsp;&nbsp;&nbsp;&nbsp;price: float = Field(gt=0)<br>' +
                        '&nbsp;&nbsp;&nbsp;&nbsp;is_offer: bool = False<br>' +
                        '&nbsp;&nbsp;&nbsp;&nbsp;tags: list[str] = []' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="widget-row">' +
                '<div class="widget-col">' +
                    '<label class="widget-label">Item Name:</label>' +
                    '<input type="text" id="jb-name" class="widget-input" value="Mechanical Keyboard">' +
                '</div>' +
                '<div class="widget-col">' +
                    '<label class="widget-label">Price (&gt; 0):</label>' +
                    '<input type="number" id="jb-price" class="widget-input" value="129.99" step="0.01">' +
                '</div>' +
            '</div>' +
            '<div class="widget-row">' +
                '<div class="widget-col">' +
                    '<label class="widget-label">Is Special Offer?</label>' +
                    '<select id="jb-offer" class="widget-select">' +
                        '<option value="true">True</option>' +
                        '<option value="false" selected>False</option>' +
                    '</select>' +
                '</div>' +
                '<div class="widget-col">' +
                    '<label class="widget-label">Tags (comma-separated):</label>' +
                    '<input type="text" id="jb-tags" class="widget-input" value="electronics, gaming, hardware">' +
                '</div>' +
            '</div>' +
            '<button class="widget-btn" id="jb-validate-btn" style="width:100%;margin:8px 0 14px;">Validate with Pydantic v2</button>' +
            '<div id="jb-result"></div>' +
        '</div>';

        container.innerHTML = html;

        var nameInput = container.querySelector('#jb-name');
        var priceInput = container.querySelector('#jb-price');
        var offerInput = container.querySelector('#jb-offer');
        var tagsInput = container.querySelector('#jb-tags');
        var resultArea = container.querySelector('#jb-result');
        var btn = container.querySelector('#jb-validate-btn');

        function runValidate() {
            var name = nameInput.value.trim();
            var price = parseFloat(priceInput.value);
            var isOffer = offerInput.value === 'true';
            var tags = tagsInput.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean);

            var errors = [];
            if (!name) {
                errors.push({ loc: ['body', 'name'], msg: 'Field required', type: 'missing' });
            }
            if (isNaN(price) || price <= 0) {
                errors.push({ loc: ['body', 'price'], msg: 'Input should be greater than 0', type: 'greater_than' });
            }

            if (errors.length > 0) {
                resultArea.innerHTML = '<div class="widget-card error">' +
                    '<div style="color:var(--error);font-weight:700;margin-bottom:6px;">&cross; HTTP 422 Unprocessable Entity</div>' +
                    '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">FastAPI rejected invalid payload automatically:</div>' +
                    '<div class="widget-code-preview">' + JSON.stringify(errors, null, 2) + '</div>' +
                '</div>';
            } else {
                resultArea.innerHTML = '<div class="widget-card highlight">' +
                    '<div style="color:var(--success);font-weight:700;margin-bottom:6px;">&check; HTTP 200 OK — Validation Succeeded!</div>' +
                    '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">Validated Pydantic Item Instance:</div>' +
                    '<div class="widget-code-preview">' + JSON.stringify({
                        name: name,
                        price: price,
                        is_offer: isOffer,
                        tags: tags
                    }, null, 2) + '</div>' +
                '</div>';
            }
        }

        btn.addEventListener('click', runValidate);
        runValidate();
    }

    // ─── Interactive: Event Loop & Concurrency Visualizer ─────────
    function renderEventLoopVisualizer(container, config) {
        var html = '<div class="interactive-widget">' +
            '<div style="margin-bottom:14px;font-size:14px;color:var(--text-secondary);">' +
                'Compare how <strong>FastAPI Async (Event Loop)</strong> handles concurrent I/O requests versus <strong>Blocking Sync calls inside async def</strong>.' +
            '</div>' +
            '<div style="display:flex;gap:12px;margin-bottom:16px;">' +
                '<button class="widget-btn" id="sim-run-async">Run Async (Non-blocking I/O)</button>' +
                '<button class="widget-btn" id="sim-run-sync" style="background:var(--error);">Run Blocking Sync Anti-pattern</button>' +
            '</div>' +
            '<div class="sim-timeline" id="sim-timeline">' +
                '<div style="color:var(--text-muted);font-size:13px;padding-top:60px;text-align:center;">Click a button above to run the concurrency benchmark simulation.</div>' +
            '</div>' +
            '<div id="sim-stat" style="font-size:13px;color:var(--text-muted);"></div>' +
        '</div>';

        container.innerHTML = html;

        var timeline = container.querySelector('#sim-timeline');
        var stat = container.querySelector('#sim-stat');

        container.querySelector('#sim-run-async').addEventListener('click', function () {
            timeline.innerHTML = [1, 2, 3, 4].map(function (i) {
                return '<div style="font-size:11px;color:var(--text-secondary);margin-bottom:2px;">Request #' + i + ' (await httpx.get)</div>' +
                    '<div class="sim-bar" id="bar-' + i + '">Pending...</div>';
            }).join('');
            stat.innerHTML = '<span style="color:var(--primary);font-weight:600;">Simulating 4 concurrent async requests...</span>';

            setTimeout(function () {
                for (var i = 1; i <= 4; i++) {
                    var bar = timeline.querySelector('#bar-' + i);
                    bar.style.width = '100%';
                    bar.textContent = 'Completed (~1.0s parallel)';
                }
                stat.innerHTML = '<span style="color:var(--success);font-weight:700;">&check; Total Time: ~1.05s</span> &mdash; All 4 requests waited on network I/O concurrently on the single event loop thread without blocking!';
            }, 100);
        });

        container.querySelector('#sim-run-sync').addEventListener('click', function () {
            timeline.innerHTML = [1, 2, 3, 4].map(function (i) {
                return '<div style="font-size:11px;color:var(--text-secondary);margin-bottom:2px;">Request #' + i + ' (time.sleep inside async def)</div>' +
                    '<div class="sim-bar blocked" id="bar-' + i + '">Queued...</div>';
            }).join('');
            stat.innerHTML = '<span style="color:var(--error);font-weight:600;">Simulating blocked event loop (Serial execution)...</span>';

            var current = 1;
            function step() {
                if (current > 4) {
                    stat.innerHTML = '<span style="color:var(--error);font-weight:700;">&cross; Total Time: ~4.12s</span> &mdash; Because blocking code ran directly in <code>async def</code>, the entire event loop was locked, forcing requests to execute serially!';
                    return;
                }
                var bar = timeline.querySelector('#bar-' + current);
                bar.style.width = '100%';
                bar.textContent = 'Blocked & Executed sequentially (+' + current + 's)';
                current++;
                setTimeout(step, 400);
            }
            setTimeout(step, 200);
        });
    }

    // ─── Interactive: Dependency Graph ────────────────────────────
    function renderDependencyGraph(container, config) {
        var nodes = [
            { id: 'db', title: 'get_db()', role: 'Yields SQLAlchemy AsyncSession, auto-closes in finally block', code: 'async def get_db():\n    async with SessionLocal() as session:\n        yield session' },
            { id: 'oauth', title: 'oauth2_scheme', role: 'Extracts Bearer token from Authorization HTTP Header', code: 'oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")' },
            { id: 'user', title: 'get_current_user', role: 'Depends on oauth2_scheme & get_db(), validates JWT', code: 'async def get_current_user(\n    token: str = Depends(oauth2_scheme),\n    db: AsyncSession = Depends(get_db)\n):\n    return verify_and_fetch_user(token, db)' },
            { id: 'admin', title: 'get_current_admin_user', role: 'Depends on get_current_user(), checks role == "admin"', code: 'def get_current_admin_user(\n    current_user: User = Depends(get_current_user)\n):\n    if current_user.role != "admin": raise HTTPException(403)\n    return current_user' }
        ];

        var html = '<div class="interactive-widget">' +
            '<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">' +
                'Click each dependency node to inspect its function implementation and cache behavior (FastAPI shares instances across sub-dependencies by default via <code>use_cache=True</code>):' +
            '</div>' +
            '<div style="display:flex;gap:8px;flex-direction:column;margin-bottom:16px;">' +
                nodes.map(function (n) {
                    return '<div class="widget-card" style="cursor:pointer;" data-node="' + n.id + '">' +
                        '<div style="font-weight:700;color:var(--primary);font-family:var(--font-code);">' + n.title + '</div>' +
                        '<div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">' + n.role + '</div>' +
                    '</div>';
                }).join('') +
            '</div>' +
            '<label class="widget-label">Implementation Preview:</label>' +
            '<div class="widget-code-preview" id="dep-code-preview">Select a dependency node above.</div>' +
        '</div>';

        container.innerHTML = html;

        var codeArea = container.querySelector('#dep-code-preview');
        container.querySelectorAll('[data-node]').forEach(function (el) {
            el.addEventListener('click', function () {
                container.querySelectorAll('[data-node]').forEach(function (c) { c.classList.remove('highlight'); });
                el.classList.add('highlight');
                var n = nodes.find(function (item) { return item.id === el.dataset.node; });
                codeArea.textContent = n.code;
            });
        });

        // Select first by default
        var first = container.querySelector('[data-node]');
        if (first) first.click();
    }

    // ─── Interactive: JWT Inspector ───────────────────────────────
    function renderJwtInspector(container, config) {
        var html = '<div class="interactive-widget">' +
            '<div class="widget-row">' +
                '<div class="widget-col">' +
                    '<label class="widget-label">Subject / Username (sub):</label>' +
                    '<input type="text" id="jwt-sub" class="widget-input" value="alex@example.com">' +
                '</div>' +
                '<div class="widget-col">' +
                    '<label class="widget-label">Role:</label>' +
                    '<select id="jwt-role" class="widget-select">' +
                        '<option value="admin" selected>admin</option>' +
                        '<option value="engineer">engineer</option>' +
                        '<option value="viewer">viewer</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
            '<label class="widget-label">Encoded JWT Token (Header.Payload.Signature):</label>' +
            '<div class="widget-code-preview" id="jwt-encoded-token" style="word-break:break-all;color:var(--secondary);margin-bottom:12px;"></div>' +
            '<div class="widget-row">' +
                '<div class="widget-col">' +
                    '<label class="widget-label">Decoded Header (Algorithm & Type):</label>' +
                    '<div class="widget-code-preview" style="color:var(--error);font-size:12px;">{\n  "alg": "HS256",\n  "typ": "JWT"\n}</div>' +
                '</div>' +
                '<div class="widget-col">' +
                    '<label class="widget-label">Decoded Claims Payload:</label>' +
                    '<div class="widget-code-preview" id="jwt-decoded-payload" style="color:var(--primary);font-size:12px;"></div>' +
                '</div>' +
            '</div>' +
        '</div>';

        container.innerHTML = html;

        var subInput = container.querySelector('#jwt-sub');
        var roleInput = container.querySelector('#jwt-role');
        var encodedArea = container.querySelector('#jwt-encoded-token');
        var payloadArea = container.querySelector('#jwt-decoded-payload');

        function update() {
            var sub = subInput.value.trim() || 'user';
            var role = roleInput.value;
            var exp = Math.floor(Date.now() / 1000) + 1800; // 30 mins

            var payload = {
                sub: sub,
                role: role,
                exp: exp,
                iat: Math.floor(Date.now() / 1000)
            };

            payloadArea.textContent = JSON.stringify(payload, null, 2);

            var b64Header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, '');
            var b64Payload = btoa(JSON.stringify(payload)).replace(/=/g, '');
            var dummySig = btoa("signature_" + sub + "_" + role).replace(/=/g, '').substring(0, 32);

            encodedArea.innerHTML = '<span style="color:var(--error);">' + b64Header + '</span>.' +
                '<span style="color:var(--primary);">' + b64Payload + '</span>.' +
                '<span style="color:var(--secondary);">' + dummySig + '</span>';
        }

        subInput.addEventListener('input', update);
        roleInput.addEventListener('change', update);
        update();
    }

    // ─── Interactive: Production Readiness Checklist ──────────────
    function renderProductionChecklist(container, config) {
        var items = [
            { id: 'cors', cat: 'Security', text: 'CORS origins restricted to known frontend domains (no allow_origins=["*"])' },
            { id: 'secrets', cat: 'Security', text: 'All secret keys, JWT salts, and DB credentials loaded via pydantic_settings & .env' },
            { id: 'workers', cat: 'Performance', text: 'Uvicorn run with multi-worker process manager (Gunicorn -k uvicorn.workers.UvicornWorker)' },
            { id: 'gzip', cat: 'Performance', text: 'GZipMiddleware enabled for JSON responses > 1KB' },
            { id: 'pool', cat: 'Database', text: 'SQLAlchemy AsyncEngine configured with pool_size=20, max_overflow=10, pool_pre_ping=True' },
            { id: 'migrations', cat: 'Database', text: 'Alembic migrations executed as part of CI/CD pre-deploy container hook' },
            { id: 'testclient', cat: 'Quality', text: 'Comprehensive test suite using TestClient + pytest-asyncio covering 422, 401 & 200 routes' },
            { id: 'health', cat: 'Observability', text: 'Dedicated lightweight /health endpoint decoupled from database locks' },
            { id: 'docker', cat: 'Deployment', text: 'Docker container runs under unprivileged non-root user (USER appuser)' }
        ];

        var storageKey = 'fastapi_prod_checklist';
        var saved = {};
        try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (e) {}

        var html = '<div class="interactive-widget">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">' +
                '<div style="font-size:14px;color:var(--text-secondary);">Production Readiness Score:</div>' +
                '<div id="checklist-score" style="font-size:24px;font-weight:700;color:var(--primary);">0%</div>' +
            '</div>' +
            '<div id="checklist-items-container">' +
                items.map(function (item) {
                    var isChecked = !!saved[item.id];
                    return '<div class="checklist-item ' + (isChecked ? 'checked' : '') + '" data-check-id="' + item.id + '">' +
                        '<input type="checkbox" class="checklist-checkbox" ' + (isChecked ? 'checked' : '') + '>' +
                        '<div>' +
                            '<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:var(--bg-elevated);color:var(--text-muted);margin-right:6px;">' + item.cat + '</span>' +
                            '<span style="font-size:13px;color:var(--text-primary);">' + item.text + '</span>' +
                        '</div>' +
                    '</div>';
                }).join('') +
            '</div>' +
        '</div>';

        container.innerHTML = html;

        var scoreEl = container.querySelector('#checklist-score');

        function updateScore() {
            var checkedCount = 0;
            items.forEach(function (it) {
                if (saved[it.id]) checkedCount++;
            });
            var pct = Math.round((checkedCount / items.length) * 100);
            scoreEl.textContent = pct + '%';
            try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch (e) {}
        }

        container.querySelectorAll('[data-check-id]').forEach(function (row) {
            row.addEventListener('click', function (e) {
                var cb = row.querySelector('.checklist-checkbox');
                if (e.target !== cb) {
                    cb.checked = !cb.checked;
                }
                var id = row.dataset.checkId;
                saved[id] = cb.checked;
                row.classList.toggle('checked', cb.checked);
                updateScore();
            });
        });

        updateScore();
    }

    // ─── Code Content Renderer ────────────────────────────────────
    function renderCodeContent(topic, container) {
        var challenge = topic.code_challenge;
        if (!challenge) {
            container.innerHTML = '<p style="color:var(--text-muted);">No code challenge available for this topic.</p>';
            return;
        }
        // Use the CodePlayground module
        container.id = container.id || 'code-playground-' + topic.id;
        CodePlayground.init(container, challenge);
    }

    // ─── Quiz Content Renderer ────────────────────────────────────
    function renderQuizContent(topic, container) {
        if (!topic.quiz || !topic.quiz.length) {
            container.innerHTML = '<p style="color:var(--text-muted);">No quiz available for this topic.</p>';
            return;
        }
        QuizEngine.renderQuiz(topic, container, function (result) {
            ProgressTracker.saveQuizScore(topic.id, result.score, result.total);
            if (result.percentage >= 60) {
                ProgressTracker.markCompleted(topic.id);
                updateNavProgress();
                populateContentDrawer();
                showToast('🎉 Topic completed!', 'success');
            }
        });
    }

    // ─── Playground View (free coding) ───────────────────────────
    function renderPlayground() {
        var content = document.getElementById('app-content');
        content.innerHTML = '<h1 style="font-family:var(--font-heading);font-size:32px;margin-bottom:24px;">🧪 Code Playground</h1>' +
            '<p style="color:var(--text-secondary);margin-bottom:24px;">Write and test FastAPI code directly. Your code runs in a sandboxed environment with TestClient.</p>';

        var challenge = {
            title: 'Free Playground',
            description: 'Write any FastAPI code and run it. Define an `app` variable to test with TestClient.',
            starter_code: 'from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\ndef read_root():\n    return {"message": "Hello, FastAPI!"}\n\n@app.get("/items/{item_id}")\ndef read_item(item_id: int, q: str | None = None):\n    return {"item_id": item_id, "q": q}\n',
            test_requests: [
                { method: 'GET', path: '/' },
                { method: 'GET', path: '/items/42?q=hello' },
                { method: 'GET', path: '/items/abc' }
            ]
        };

        container.id = 'free-playground';
        CodePlayground.init(content, challenge);
    }

    // ─── Progress View ────────────────────────────────────────────
    function renderProgress() {
        var content = document.getElementById('app-content');
        var completed = ProgressTracker.getCompletedCount();
        var visited = ProgressTracker.getVisitedCount();
        var totalTopics = 0;
        if (state.topicsData) {
            state.topicsData.levels.forEach(function (l) { totalTopics += (l.topics || []).length; });
        }
        var pct = ProgressTracker.getOverallProgress(totalTopics);

        content.innerHTML = '<h1 style="font-family:var(--font-heading);font-size:32px;margin-bottom:24px;">📊 Your Progress</h1>' +
            '<div class="progress-overview">' +
                '<div class="progress-stat-card"><div class="progress-stat-value">' + totalTopics + '</div><div class="progress-stat-label">Total Topics</div></div>' +
                '<div class="progress-stat-card"><div class="progress-stat-value">' + visited + '</div><div class="progress-stat-label">Visited</div></div>' +
                '<div class="progress-stat-card"><div class="progress-stat-value">' + completed + '</div><div class="progress-stat-label">Completed</div></div>' +
                '<div class="progress-stat-card"><div class="progress-stat-value">' + pct + '%</div><div class="progress-stat-label">Overall</div></div>' +
            '</div>' +
            '<div style="margin-top:32px;">' +
                '<h2 style="font-family:var(--font-heading);font-size:22px;margin-bottom:16px;">Quiz Scores</h2>' +
                renderQuizScores() +
            '</div>' +
            '<div style="margin-top:32px;">' +
                '<button class="quiz-submit-btn" id="reset-progress-btn" style="width:auto;padding:8px 24px;background:var(--error);">Reset All Progress</button>' +
            '</div>';

        var resetBtn = document.getElementById('reset-progress-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                if (confirm('Reset all progress? This cannot be undone.')) {
                    ProgressTracker.reset();
                    updateNavProgress();
                    renderProgress();
                    showToast('Progress reset', 'info');
                }
            });
        }
    }

    function renderQuizScores() {
        var scores = ProgressTracker.data.quizScores;
        var keys = Object.keys(scores);
        if (!keys.length) return '<p style="color:var(--text-muted);">No quizzes taken yet.</p>';

        return '<table class="read-table"><thead><tr><th>Topic</th><th>Score</th><th>Percentage</th></tr></thead><tbody>' +
            keys.map(function (k) {
                var s = scores[k];
                return '<tr><td>' + k + '</td><td>' + s.best + '/' + s.total + '</td><td style="color:var(--primary);font-weight:600;">' + s.percentage + '%</td></tr>';
            }).join('') + '</tbody></table>';
    }

    // ─── Content Drawer ──────────────────────────────────────────
    function setupContentDrawer() {
        var drawer = document.getElementById('content-drawer');
        var backdrop = document.getElementById('content-drawer-backdrop');
        var closeBtn = document.getElementById('drawer-close-btn');
        var searchInput = document.getElementById('drawer-search-input');
        var searchClear = document.getElementById('drawer-search-clear');

        // Content button (we'll add it to nav dynamically)
        var navContentsBtn = document.createElement('button');
        navContentsBtn.className = 'nav-back-link';
        navContentsBtn.innerHTML = '📚 Contents';
        navContentsBtn.title = 'Browse Curriculum';
        navContentsBtn.addEventListener('click', function () {
            drawer.classList.add('open');
            backdrop.classList.add('open');
        });
        var navInner = document.querySelector('.nav-inner');
        if (navInner) navInner.insertBefore(navContentsBtn, navInner.firstChild);

        function close() {
            drawer.classList.remove('open');
            backdrop.classList.remove('open');
        }
        if (closeBtn) closeBtn.addEventListener('click', close);
        if (backdrop) backdrop.addEventListener('click', close);

        if (searchInput) {
            searchInput.addEventListener('input', function () {
                var val = searchInput.value.toLowerCase();
                searchClear.style.display = val ? 'block' : 'none';
                filterDrawer(val);
            });
        }
        if (searchClear) searchClear.addEventListener('click', function () {
            searchInput.value = '';
            searchClear.style.display = 'none';
            filterDrawer('');
        });
    }

    function populateContentDrawer() {
        if (!state.topicsData) return;
        var tree = document.getElementById('drawer-tree-container');
        if (!tree) return;

        var html = '';
        state.topicsData.levels.forEach(function (level) {
            var meta = LEVEL_META[level.id] || { icon: '📚' };
            var topics = level.topics || [];
            html += '<div class="drawer-level" data-level="' + level.id + '">' +
                '<div class="drawer-level-header" data-level-toggle="' + level.id + '">' +
                    '<span class="drawer-level-icon">' + meta.icon + '</span>' +
                    '<span class="drawer-level-title">' + level.title + '</span>' +
                    '<span class="drawer-level-count">' + topics.length + '</span>' +
                '</div>' +
                '<div class="drawer-level-topics">';

            topics.forEach(function (topic) {
                var isCompleted = ProgressTracker.isCompleted(topic.id);
                html += '<div class="drawer-topic-item' + (isCompleted ? ' completed' : '') + '" data-topic-id="' + topic.id + '" data-level-id="' + level.id + '">' +
                    '<span class="drawer-topic-check">' + (isCompleted ? '✓' : '◯') + '</span>' +
                    '<span>' + topic.title + '</span>' +
                '</div>';
            });

            html += '</div></div>';
        });

        tree.innerHTML = html;

        // Wire up level toggles
        tree.querySelectorAll('.drawer-level-header').forEach(function (header) {
            header.addEventListener('click', function () {
                var topics = header.nextElementSibling;
                topics.style.display = topics.style.display === 'none' ? 'block' : 'none';
            });
        });

        // Wire up topic items
        tree.querySelectorAll('.drawer-topic-item').forEach(function (item) {
            item.addEventListener('click', function () {
                navigateTo('topic', { levelId: item.dataset.levelId, topicId: item.dataset.topicId });
                document.getElementById('content-drawer').classList.remove('open');
                document.getElementById('content-drawer-backdrop').classList.remove('open');
            });
        });
    }

    function filterDrawer(query) {
        var tree = document.getElementById('drawer-tree-container');
        if (!tree) return;
        tree.querySelectorAll('.drawer-topic-item').forEach(function (item) {
            var text = item.textContent.toLowerCase();
            item.style.display = !query || text.indexOf(query) !== -1 ? 'flex' : 'none';
        });
        tree.querySelectorAll('.drawer-level').forEach(function (level) {
            var visible = level.querySelectorAll('.drawer-topic-item:not([style*="display: none"])').length;
            level.style.display = visible > 0 ? 'block' : 'none';
        });
    }

    // ─── Theme Selector ───────────────────────────────────────────
    function setupThemeSelector() {
        var btn = document.getElementById('theme-toggle-btn');
        var menu = document.getElementById('theme-dropdown-menu');
        if (!btn || !menu) return;

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            menu.classList.toggle('open');
        });

        document.addEventListener('click', function () { menu.classList.remove('open'); });

        menu.querySelectorAll('.theme-option').forEach(function (opt) {
            opt.addEventListener('click', function () {
                var theme = opt.dataset.theme;
                ProgressTracker.setTheme(theme);
                menu.querySelectorAll('.theme-option').forEach(function (o) { o.classList.remove('active'); });
                opt.classList.add('active');
                menu.classList.remove('open');
            });
        });
    }

    // ─── Nav Progress ─────────────────────────────────────────────
    function updateNavProgress() {
        var totalTopics = 0;
        if (state.topicsData) {
            state.topicsData.levels.forEach(function (l) { totalTopics += (l.topics || []).length; });
        }
        var pct = ProgressTracker.getOverallProgress(totalTopics);
        var fill = document.getElementById('nav-progress-fill');
        var text = document.getElementById('nav-progress-text');
        if (fill) fill.style.width = pct + '%';
        if (text) text.textContent = pct + '%';
    }

    // ─── Utilities ────────────────────────────────────────────────
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function showToast(msg, type) {
        var container = document.getElementById('toast-container');
        if (!container) return;
        var toast = document.createElement('div');
        toast.className = 'toast ' + (type || 'info');
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(function () { toast.remove(); }, 4000);
    }

    // ─── Boot ────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
