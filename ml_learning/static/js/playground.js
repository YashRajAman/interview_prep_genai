/**
 * ML Odyssey — Interactive Jupyter Playground
 * ---------------------------------------------------------------------------
 * Features:
 * - Real Jupyter-like multi-cell notebook environment in the browser.
 * - Code & Markdown cells with CodeMirror Python syntax highlighting.
 * - Native IPython engine: full support for %matplotlib inline, %time, !pip, !ls, ?help, and display().
 * - Inline rich outputs: stdout, stderr, Matplotlib PNG figures, and Pandas HTML tables.
 * - In-place cell output updates: CodeMirror editors remain 100% visible, active, and editable!
 * - Persistent execution state across cells.
 * - Isolated session environment created per notebook and completely wiped on session end.
 * - Import / Upload any .ipynb or .py file directly into the playground.
 * - Export / Download current notebook as official .ipynb (v4.5) or .py script.
 * - Pre-loaded ML Starter Templates.
 * ---------------------------------------------------------------------------
 */

(function () {
    'use strict';

    var sessionId = null;
    var environmentDir = null;
    var kernelStatus = 'idle'; // 'idle' | 'busy' | 'stopped' | 'error'
    var notebookTitle = 'ML_Odyssey_Playground';
    var cells = [];
    var cellCounter = 0;
    var activeCellIndex = 0;
    var executionCounter = 0;
    var heartbeatTimer = null;
    var containerElem = null;

    /**
     * Helper to create DOM elements with classes and text.
     */
    function el(tag, className, text) {
        var elem = document.createElement(tag);
        if (className) elem.className = className;
        if (text !== undefined && text !== null) elem.textContent = text;
        return elem;
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    /**
     * Show a transient toast message.
     */
    function showToast(msg, type) {
        var toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = el('div', 'toast-container');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        var toast = el('div', 'toast ' + (type || 'info'), msg);
        toastContainer.appendChild(toast);
        setTimeout(function () {
            toast.classList.add('fade-out');
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3200);
    }

    /**
     * Simple markdown + math rendering for markdown cells.
     */
    function renderMarkdownToHtml(src) {
        if (!src) return '<p style="color:#64748b;font-style:italic;">Empty markdown cell. Double click to edit.</p>';

        var lines = src.split('\n');
        var out = [];
        var inCode = false;
        var codeBuf = [];

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];

            if (line.trim().startsWith('```')) {
                if (inCode) {
                    out.push('<pre><code>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>');
                    codeBuf = [];
                    inCode = false;
                } else {
                    inCode = true;
                }
                continue;
            }

            if (inCode) {
                codeBuf.push(line);
                continue;
            }

            // Headings
            if (line.startsWith('# ')) {
                out.push('<h1 style="color:#f8fafc;margin:0.5rem 0 0.75rem;font-size:1.5rem;">' + parseInline(line.substring(2)) + '</h1>');
            } else if (line.startsWith('## ')) {
                out.push('<h2 style="color:#f8fafc;margin:0.5rem 0 0.6rem;font-size:1.3rem;">' + parseInline(line.substring(3)) + '</h2>');
            } else if (line.startsWith('### ')) {
                out.push('<h3 style="color:#f8fafc;margin:0.4rem 0 0.5rem;font-size:1.1rem;">' + parseInline(line.substring(4)) + '</h3>');
            } else if (line.startsWith('- ') || line.startsWith('* ')) {
                out.push('<li style="margin-left:1.5rem;color:#cbd5e1;line-height:1.6;">' + parseInline(line.substring(2)) + '</li>');
            } else if (line.trim() === '') {
                out.push('<div style="height:0.5rem;"></div>');
            } else {
                out.push('<p style="color:#cbd5e1;margin:0.35rem 0;line-height:1.6;">' + parseInline(line) + '</p>');
            }
        }

        if (inCode && codeBuf.length) {
            out.push('<pre><code>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>');
        }

        return out.join('');
    }

    function parseInline(text) {
        var str = escapeHtml(text);
        // Bold
        str = str.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f8fafc;">$1</strong>');
        // Inline code
        str = str.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;color:#38bdf8;font-family:monospace;">$1</code>');
        return str;
    }

    /**
     * Start a new isolated playground session and create environment directory.
     */
    function startSession(callback) {
        setKernelStatus('busy', 'Initializing kernel...');
        fetch('/api/playground/session/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                sessionId = data.session_id;
                environmentDir = data.environment_dir;
                setKernelStatus('idle', 'Idle');
                updateSessionInfo();
                startHeartbeat();
                if (typeof callback === 'function') callback();
            })
            .catch(function (err) {
                console.error('[Playground] Failed to start session:', err);
                setKernelStatus('error', 'Kernel Error');
                showToast('Failed to connect to Python kernel', 'error');
            });
    }

    /**
     * End active session, kill kernel, and wipe isolated environment directory.
     */
    function endSession(showNotification) {
        if (!sessionId) return;
        var sidToClose = sessionId;
        sessionId = null;
        environmentDir = null;
        stopHeartbeat();
        setKernelStatus('stopped', 'Session Ended');

        fetch('/api/playground/session/' + sidToClose, {
            method: 'DELETE'
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (showNotification !== false) {
                    showToast('Session ended. Environment directory permanently deleted.', 'info');
                    renderSessionEndedBanner();
                }
            })
            .catch(function (err) {
                console.error('[Playground] Error ending session:', err);
            });
    }

    /**
     * Heartbeat to prevent session idle timeout.
     */
    function startHeartbeat() {
        stopHeartbeat();
        heartbeatTimer = setInterval(function () {
            if (sessionId) {
                fetch('/api/playground/session/' + sessionId + '/heartbeat', { method: 'POST' })
                    .catch(function () {});
            }
        }, 60000); // every 60s
    }

    function stopHeartbeat() {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }
    }

    /**
     * Update kernel status indicator pill in header.
     */
    function setKernelStatus(status, label) {
        kernelStatus = status;
        var pill = document.getElementById('kernel-status-pill');
        if (!pill) return;
        pill.className = 'kernel-status-pill ' + status;
        pill.innerHTML = '<span class="status-dot"></span><span>' + (label || status.toUpperCase()) + '</span>';
    }

    /**
     * Update session ID and environment dir pill.
     */
    function updateSessionInfo() {
        var sidPill = document.getElementById('session-id-pill');
        if (sidPill) {
            sidPill.textContent = sessionId ? 'Session: ' + sessionId.substring(0, 8) + '...' : 'No session';
            sidPill.title = sessionId ? 'Isolated Session ID: ' + sessionId + '\nEnvironment: ' + (environmentDir || '') : '';
        }
    }

    /**
     * Default starter cells if notebook is blank.
     */
    function getDefaultCells() {
        return [
            {
                id: 'cell_' + (++cellCounter),
                cell_type: 'markdown',
                source: '# 🪐 ML Odyssey Interactive Playground\nWelcome to your isolated Python & ML experiment canvas!\n\n- Supports **all Python libraries**: NumPy, Pandas, Scikit-Learn, Matplotlib, Seaborn.\n- Native **IPython magic functions**: `%matplotlib inline`, `%time`, `%%time`, `!pip`, `!ls`.\n- State is **preserved across cells**.\n- Run any cell with `Shift + Enter` or click **▶ Run**.',
                execution_count: null,
                output: null,
                isEditing: false
            },
            {
                id: 'cell_' + (++cellCounter),
                cell_type: 'code',
                source: '# 1. Test IPython Magics & ML Libraries\n%matplotlib inline\n%time import numpy as np, pandas as pd, matplotlib.pyplot as plt\n\nprint("NumPy:", np.__version__)\nprint("Pandas:", pd.__version__)',
                execution_count: null,
                output: null
            },
            {
                id: 'cell_' + (++cellCounter),
                cell_type: 'code',
                source: '# 2. Generate and display a DataFrame (renders as interactive table)\ndf = pd.DataFrame({\n    "Model": ["Logistic Regression", "Random Forest", "Gradient Boosting", "MLP Neural Net"],\n    "Accuracy": [0.842, 0.925, 0.948, 0.931],\n    "Train_Time_s": [0.12, 1.45, 3.80, 5.20]\n})\ndf',
                execution_count: null,
                output: null
            },
            {
                id: 'cell_' + (++cellCounter),
                cell_type: 'code',
                source: '# 3. Generate an inline visualization\nplt.figure(figsize=(7, 3.5))\nplt.barh(df["Model"], df["Accuracy"], color="#7c5cff", edgecolor="white", alpha=0.9)\nplt.xlim(0.75, 1.0)\nplt.xlabel("Test Accuracy", fontsize=11)\nplt.title("Classifier Benchmark Comparison", fontsize=13, pad=10)\nplt.grid(axis="x", linestyle="--", alpha=0.4)\nplt.tight_layout()\nplt.show()',
                execution_count: null,
                output: null
            }
        ];
    }

    /**
     * Render the whole Playground UI into the container.
     */
    function renderPlayground(container) {
        containerElem = container;
        container.innerHTML = '';

        if (!cells.length) {
            cells = getDefaultCells();
        }

        var wrap = el('div', 'playground-container fade-in');

        // Header Section
        var header = el('div', 'playground-header');

        // Row 1: Title, Status, Session Info, End Session
        var titleRow = el('div', 'playground-title-row');

        var titleGroup = el('div', 'playground-title-group');
        var icon = el('span', 'playground-icon', '🪐');
        titleGroup.appendChild(icon);

        var titleInput = el('input', 'playground-title-input');
        titleInput.type = 'text';
        titleInput.value = notebookTitle;
        titleInput.title = 'Click to rename notebook';
        titleInput.addEventListener('change', function () {
            notebookTitle = titleInput.value.trim() || 'ML_Odyssey_Playground';
        });
        titleGroup.appendChild(titleInput);
        titleRow.appendChild(titleGroup);

        var rightStatusGroup = el('div', 'toolbar-group');

        // Session ID badge
        var sidPill = el('span', 'badge badge-outline');
        sidPill.id = 'session-id-pill';
        sidPill.style.fontFamily = 'monospace';
        sidPill.style.fontSize = '0.78rem';
        sidPill.style.cursor = 'help';
        sidPill.textContent = sessionId ? 'Session: ' + sessionId.substring(0, 8) + '...' : 'Connecting...';
        rightStatusGroup.appendChild(sidPill);

        // Kernel status pill
        var statusPill = el('div', 'kernel-status-pill ' + kernelStatus);
        statusPill.id = 'kernel-status-pill';
        statusPill.innerHTML = '<span class="status-dot"></span><span>' + (kernelStatus === 'idle' ? 'Idle' : 'Connecting...') + '</span>';
        rightStatusGroup.appendChild(statusPill);

        // End Session Button
        var btnEndSession = el('button', 'btn btn-sm btn-danger', '✕ End Session');
        btnEndSession.title = 'Terminate kernel process and permanently wipe the isolated environment directory';
        btnEndSession.addEventListener('click', function () {
            if (confirm('End this notebook session?\n\nThis will terminate the Python worker process and permanently delete your isolated environment directory from disk.')) {
                endSession(true);
            }
        });
        rightStatusGroup.appendChild(btnEndSession);

        titleRow.appendChild(rightStatusGroup);
        header.appendChild(titleRow);

        // Row 2: Toolbar Controls
        var toolbar = el('div', 'playground-toolbar');

        // Left controls: Add Code, Add Markdown, Run, Run All, Restart, Clear
        var leftGroup = el('div', 'toolbar-group');

        var btnAddCode = el('button', 'btn btn-sm btn-primary', '+ Code');
        btnAddCode.addEventListener('click', function () {
            addCell('code', activeCellIndex);
        });
        leftGroup.appendChild(btnAddCode);

        var btnAddMd = el('button', 'btn btn-sm btn-outline', '+ Markdown');
        btnAddMd.addEventListener('click', function () {
            addCell('markdown', activeCellIndex);
        });
        leftGroup.appendChild(btnAddMd);

        var btnRun = el('button', 'btn btn-sm btn-outline', '▶ Run Cell');
        btnRun.title = 'Execute selected cell (Shift+Enter)';
        btnRun.addEventListener('click', function () {
            if (activeCellIndex >= 0 && activeCellIndex < cells.length) {
                runCell(activeCellIndex, false);
            }
        });
        leftGroup.appendChild(btnRun);

        var btnRunAll = el('button', 'btn btn-sm btn-outline', '▶▶ Run All');
        btnRunAll.title = 'Execute all cells sequentially from top to bottom';
        btnRunAll.addEventListener('click', runAllCells);
        leftGroup.appendChild(btnRunAll);

        var btnRestart = el('button', 'btn btn-sm btn-outline', '🔄 Restart');
        btnRestart.title = 'Restart kernel and clear all execution state';
        btnRestart.addEventListener('click', restartKernel);
        leftGroup.appendChild(btnRestart);

        var btnClear = el('button', 'btn btn-sm btn-outline', '🗑️ Clear Outputs');
        btnClear.title = 'Clear all cell output displays';
        btnClear.addEventListener('click', clearAllOutputs);
        leftGroup.appendChild(btnClear);

        toolbar.appendChild(leftGroup);

        // Right controls: Upload, Download, Starter Templates
        var rightGroup = el('div', 'toolbar-group');

        // Hidden file upload input
        var fileInput = el('input');
        fileInput.type = 'file';
        fileInput.accept = '.ipynb,.py,application/json';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', handleFileUpload);
        document.body.appendChild(fileInput);

        var btnUpload = el('button', 'btn btn-sm btn-outline', '📁 Upload (.ipynb)');
        btnUpload.title = 'Upload any local Jupyter Notebook (.ipynb) or Python script (.py)';
        btnUpload.addEventListener('click', function () {
            fileInput.click();
        });
        rightGroup.appendChild(btnUpload);

        // Download Dropdown
        var downloadWrap = el('div', 'dropdown-wrap');
        var btnDownload = el('button', 'btn btn-sm btn-outline', '💾 Download ▾');
        var downloadMenu = el('div', 'dropdown-menu');

        var optIpynb = el('button', 'dropdown-item', '📓 Jupyter Notebook (.ipynb)');
        optIpynb.type = 'button';
        optIpynb.addEventListener('click', function () {
            downloadNotebook('ipynb');
            downloadMenu.classList.remove('show');
        });
        downloadMenu.appendChild(optIpynb);

        var optPy = el('button', 'dropdown-item', '🐍 Python Script (.py)');
        optPy.type = 'button';
        optPy.addEventListener('click', function () {
            downloadNotebook('py');
            downloadMenu.classList.remove('show');
        });
        downloadMenu.appendChild(optPy);

        btnDownload.addEventListener('click', function (e) {
            e.stopPropagation();
            downloadMenu.classList.toggle('show');
        });
        downloadWrap.appendChild(btnDownload);
        downloadWrap.appendChild(downloadMenu);
        rightGroup.appendChild(downloadWrap);

        // Templates Dropdown
        var templateSelect = el('select', 'playground-select');
        templateSelect.innerHTML =
            '<option value="">📚 Load Template...</option>' +
            '<option value="pandas-exploration">Pandas & Seaborn Exploration</option>' +
            '<option value="sklearn-classification">Scikit-Learn Classification (Iris)</option>' +
            '<option value="kmeans-clustering">K-Means Clustering & Elbow Method</option>' +
            '<option value="linear-regression">Linear Regression Playground</option>' +
            '<option value="blank">Blank Notebook</option>';
        templateSelect.addEventListener('change', function () {
            var val = templateSelect.value;
            if (val) {
                loadTemplate(val);
                templateSelect.value = '';
            }
        });
        rightGroup.appendChild(templateSelect);

        // Theme Selector
        var themeSelect = el('select', 'playground-select');
        themeSelect.id = 'playground-theme-select';
        themeSelect.innerHTML =
            '<option value="dark">🎨 Cosmos (Dark)</option>' +
            '<option value="light">☀️ Daylight (Light)</option>' +
            '<option value="cyberpunk">⚡ Cyberpunk Neon</option>' +
            '<option value="emerald">🌲 Forest Emerald</option>' +
            '<option value="sunset">🌅 Solar Sunset</option>' +
            '<option value="nord">❄️ Nordic Frost</option>';
        themeSelect.value = (window.ThemeManager ? window.ThemeManager.getCurrentTheme() : 'dark');
        themeSelect.addEventListener('change', function () {
            if (window.ThemeManager) {
                window.ThemeManager.applyTheme(themeSelect.value, true);
            }
        });
        rightGroup.appendChild(themeSelect);

        toolbar.appendChild(rightGroup);
        header.appendChild(toolbar);
        wrap.appendChild(header);

        // Notebook Cells Container
        var cellsContainer = el('div', 'notebook-cells');
        cellsContainer.id = 'notebook-cells-container';
        wrap.appendChild(cellsContainer);

        // Bottom Add Cell Bar
        var bottomBar = el('div', 'playground-bottom-bar');
        bottomBar.style.display = 'flex';
        bottomBar.style.justifyContent = 'center';
        bottomBar.style.gap = '0.75rem';
        bottomBar.style.padding = '1.5rem 0';

        var btnAddBottomCode = el('button', 'btn btn-outline', '+ Code Cell');
        btnAddBottomCode.addEventListener('click', function () {
            addCell('code', cells.length - 1);
        });
        bottomBar.appendChild(btnAddBottomCode);

        var btnAddBottomMd = el('button', 'btn btn-outline', '+ Markdown Cell');
        btnAddBottomMd.addEventListener('click', function () {
            addCell('markdown', cells.length - 1);
        });
        bottomBar.appendChild(btnAddBottomMd);

        wrap.appendChild(bottomBar);
        container.appendChild(wrap);

        // Close dropdown when clicking outside
        document.addEventListener('click', function () {
            downloadMenu.classList.remove('show');
        });

        // Initialize active session if not already running
        if (!sessionId) {
            startSession(function () {
                renderCells();
            });
        } else {
            renderCells();
        }
    }

    /**
     * Render banner when session has been closed.
     */
    function renderSessionEndedBanner() {
        var container = document.getElementById('notebook-cells-container');
        if (!container) return;

        var banner = el('div', 'card');
        banner.style.border = '1px solid rgba(239,68,68,0.3)';
        banner.style.background = '#1a1424';
        banner.style.padding = '1.5rem';
        banner.style.margin = '1rem 0';
        banner.style.textAlign = 'center';

        banner.innerHTML =
            '<h3 style="color:#f87171;margin:0 0 0.5rem;">Session Ended</h3>' +
            '<p style="color:#cbd5e1;font-size:0.92rem;margin:0 0 1rem;">' +
            'The Python kernel process has been terminated and the temporary environment folder has been completely wiped.' +
            '</p>';

        var btnRestartNew = el('button', 'btn btn-primary', '🚀 Start New Isolated Session');
        btnRestartNew.addEventListener('click', function () {
            startSession(function () {
                renderPlayground(containerElem);
            });
        });
        banner.appendChild(btnRestartNew);

        container.prepend(banner);
    }

    /**
     * Build the output DOM for a cell.
     */
    function buildOutputAreaDOM(cell) {
        var outputArea = el('div', 'cell-output-area');

        if (cell.isRunning) {
            var runningIndicator = el('div', 'cell-output-running');
            runningIndicator.innerHTML = '<span class="spinner-mini"></span><span>Executing in isolated kernel...</span>';
            outputArea.appendChild(runningIndicator);
            return outputArea;
        }

        if (!cell.output) return null;

        var out = cell.output;

        // 1. Standard Output
        if (out.stdout) {
            var stdoutPre = el('pre', 'cell-stdout', out.stdout);
            outputArea.appendChild(stdoutPre);
        }

        // 2. HTML Table Output (e.g. Pandas DataFrame)
        if (out.result_html) {
            var tableWrap = el('div', 'notebook-table-wrap');
            tableWrap.innerHTML = out.result_html;
            outputArea.appendChild(tableWrap);
        } else if (out.result && !out.stdout) {
            // Standard expression evaluation result
            var resDiv = el('div', 'cell-result-repr');
            resDiv.innerHTML = '<span class="cell-result-prefix">Out[' + (cell.execution_count || 1) + ']: </span><span class="cell-result-text">' + escapeHtml(out.result) + '</span>';
            outputArea.appendChild(resDiv);
        }

        // 3. Matplotlib Figures
        if (out.plots && out.plots.length) {
            var plotsContainer = el('div', 'cell-plots-container');
            plotsContainer.style.display = 'flex';
            plotsContainer.style.flexDirection = 'column';
            plotsContainer.style.gap = '1rem';
            plotsContainer.style.margin = '0.75rem 0';

            out.plots.forEach(function (base64Png) {
                var img = el('img');
                img.src = 'data:image/png;base64,' + base64Png;
                img.style.maxWidth = '100%';
                img.style.borderRadius = '6px';
                img.style.border = '1px solid rgba(255,255,255,0.1)';
                img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                img.title = 'Click to view full size';
                img.style.cursor = 'zoom-in';
                img.addEventListener('click', function () {
                    var w = window.open('');
                    w.document.write('<body style="margin:0;background:#0d1124;display:flex;justify-content:center;align-items:center;min-height:100vh;"><img src="' + img.src + '" style="max-width:95vw;max-height:95vh;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.6);" /></body>');
                });
                plotsContainer.appendChild(img);
            });
            outputArea.appendChild(plotsContainer);
        }

        // 4. Standard Error / Traceback
        if (out.stderr) {
            var stderrPre = el('pre', 'cell-stderr', out.stderr);
            outputArea.appendChild(stderrPre);
        }

        return outputArea;
    }

    /**
     * In-place update of a cell's prompt label and output area.
     * This keeps the CodeMirror editor completely intact and focused without destroying the DOM!
     */
    function updateCellStatusAndOutput(idx) {
        var cell = cells[idx];
        if (!cell) return;
        var cellWrap = document.getElementById('dom_' + cell.id);
        if (!cellWrap) return;

        // 1. Update Prompt Label
        var promptLabel = cellWrap.querySelector('.prompt-label');
        if (promptLabel && cell.cell_type === 'code') {
            if (cell.isRunning) {
                promptLabel.className = 'prompt-label running';
                promptLabel.textContent = '[*]:';
            } else if (cell.execution_count !== null && cell.execution_count !== undefined) {
                promptLabel.className = 'prompt-label';
                promptLabel.textContent = '[' + cell.execution_count + ']:';
            } else {
                promptLabel.className = 'prompt-label';
                promptLabel.textContent = '[ ]:';
            }
        }

        // 2. Update Output Area
        var body = cellWrap.querySelector('.cell-body');
        if (!body) return;

        var existingOutput = body.querySelector('.cell-output-area');
        if (existingOutput) {
            existingOutput.parentNode.removeChild(existingOutput);
        }

        if (cell.isRunning || cell.output) {
            var outputNode = buildOutputAreaDOM(cell);
            if (outputNode) {
                body.appendChild(outputNode);
            }
        }
    }

    /**
     * Render all cells into the notebook list (used for structural changes: add, delete, move, upload, template).
     */
    function renderCells() {
        var container = document.getElementById('notebook-cells-container');
        if (!container) return;

        // Synchronize source code from all active CodeMirror editors before clearing
        cells.forEach(function (c) {
            if (c.editor) {
                c.source = c.editor.getValue();
                c.editor = null; // Reset so fresh CodeMirror instances mount properly
            }
        });

        container.innerHTML = '';

        cells.forEach(function (cell, idx) {
            var cellNode = buildCellDOM(cell, idx);
            container.appendChild(cellNode);
        });

        // Trigger CodeMirror layout refresh to recalculate line heights, gutters and avoid overlaps
        function refreshAllEditors() {
            cells.forEach(function (c) {
                if (c.editor) {
                    c.editor.refresh();
                }
            });
        }

        // Run refresh across consecutive layout frames
        requestAnimationFrame(refreshAllEditors);
        setTimeout(refreshAllEditors, 30);
        setTimeout(refreshAllEditors, 150);

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(refreshAllEditors);
        }

        // Trigger math rendering for markdown cells if KaTeX is present
        if (typeof window.renderMathInElement === 'function') {
            try {
                window.renderMathInElement(container, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ]
                });
            } catch (e) {}
        }
    }

    /**
     * Build the DOM node for a single notebook cell.
     */
    function buildCellDOM(cell, idx) {
        var cellWrap = el('div', 'notebook-cell' + (idx === activeCellIndex ? ' active' : ''));
        cellWrap.id = 'dom_' + cell.id;

        cellWrap.addEventListener('click', function () {
            activeCellIndex = idx;
            document.querySelectorAll('.notebook-cell').forEach(function (c) {
                c.classList.remove('active');
            });
            cellWrap.classList.add('active');
        });

        // Prompt Margin
        var promptMargin = el('div', 'cell-prompt-margin');
        var promptLabel = el('div', 'prompt-label' + (cell.isRunning ? ' running' : ''));
        if (cell.cell_type === 'code') {
            if (cell.isRunning) {
                promptLabel.textContent = '[*]:';
            } else if (cell.execution_count !== null && cell.execution_count !== undefined) {
                promptLabel.textContent = '[' + cell.execution_count + ']:';
            } else {
                promptLabel.textContent = '[ ]:';
            }
        }
        promptMargin.appendChild(promptLabel);
        cellWrap.appendChild(promptMargin);

        // Cell Body
        var body = el('div', 'cell-body');

        // Header: Type badge & action buttons
        var header = el('div', 'cell-header');

        var typeBadge = el('span', 'cell-type-badge', cell.cell_type.toUpperCase());
        header.appendChild(typeBadge);

        var actions = el('div', 'cell-actions');

        if (cell.cell_type === 'code') {
            var btnRun = el('button', 'cell-btn cell-btn-run', '▶ Run');
            btnRun.title = 'Run cell (Shift+Enter)';
            btnRun.addEventListener('click', function (e) {
                e.stopPropagation();
                runCell(idx, false);
            });
            actions.appendChild(btnRun);
        }

        var btnAddAbove = el('button', 'cell-btn', '+⬆');
        btnAddAbove.title = 'Add code cell above';
        btnAddAbove.addEventListener('click', function (e) {
            e.stopPropagation();
            addCell('code', idx - 1);
        });
        actions.appendChild(btnAddAbove);

        var btnAddBelow = el('button', 'cell-btn', '+⬇');
        btnAddBelow.title = 'Add code cell below';
        btnAddBelow.addEventListener('click', function (e) {
            e.stopPropagation();
            addCell('code', idx);
        });
        actions.appendChild(btnAddBelow);

        var btnUp = el('button', 'cell-btn', '▲');
        btnUp.title = 'Move cell up';
        btnUp.disabled = idx === 0;
        btnUp.addEventListener('click', function (e) {
            e.stopPropagation();
            moveCell(idx, -1);
        });
        actions.appendChild(btnUp);

        var btnDown = el('button', 'cell-btn', '▼');
        btnDown.title = 'Move cell down';
        btnDown.disabled = idx === cells.length - 1;
        btnDown.addEventListener('click', function (e) {
            e.stopPropagation();
            moveCell(idx, 1);
        });
        actions.appendChild(btnDown);

        var btnDel = el('button', 'cell-btn cell-btn-del', '✕');
        btnDel.title = 'Delete cell';
        btnDel.addEventListener('click', function (e) {
            e.stopPropagation();
            deleteCell(idx);
        });
        actions.appendChild(btnDel);

        header.appendChild(actions);
        body.appendChild(header);

        // Editor or Markdown Renderer
        if (cell.cell_type === 'code') {
            var editorContainer = el('div', 'cell-editor-container');
            body.appendChild(editorContainer);

            // Mount CodeMirror synchronously
            if (window.CodeMirror) {
                cell.editor = CodeMirror(editorContainer, {
                    value: cell.source || '',
                    mode: 'python',
                    theme: 'material-darker',
                    lineNumbers: true,
                    viewportMargin: Infinity,
                    indentUnit: 4,
                    tabSize: 4,
                    indentWithTabs: false,
                    extraKeys: {
                        'Shift-Enter': function () {
                            runCell(idx, true);
                        },
                        'Ctrl-Enter': function () {
                            runCell(idx, false);
                        },
                        'Alt-Enter': function () {
                            runCell(idx, false);
                            addCell('code', idx);
                        }
                    }
                });

                cell.editor.on('change', function () {
                    cell.source = cell.editor.getValue();
                });

                cell.editor.on('focus', function () {
                    cell.editor.refresh();
                });
            }
        } else {
            // Markdown cell
            if (cell.isEditing) {
                var textarea = el('textarea', 'cell-markdown-textarea');
                textarea.value = cell.source || '';
                textarea.placeholder = 'Type Markdown with KaTeX math ($x^2$ or $$E=mc^2$$). Press Shift+Enter to render.';

                textarea.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' && e.shiftKey) {
                        e.preventDefault();
                        cell.source = textarea.value;
                        cell.isEditing = false;
                        renderCells();
                    }
                });

                textarea.addEventListener('blur', function () {
                    cell.source = textarea.value;
                    cell.isEditing = false;
                    renderCells();
                });

                body.appendChild(textarea);
                setTimeout(function () { textarea.focus(); }, 0);
            } else {
                var mdView = el('div', 'cell-markdown-rendered');
                mdView.innerHTML = renderMarkdownToHtml(cell.source);
                mdView.title = 'Double click to edit markdown';
                mdView.addEventListener('dblclick', function () {
                    cell.isEditing = true;
                    renderCells();
                });
                body.appendChild(mdView);
            }
        }

        // Output Area
        if (cell.isRunning || cell.output) {
            var outputNode = buildOutputAreaDOM(cell);
            if (outputNode) {
                body.appendChild(outputNode);
            }
        }

        cellWrap.appendChild(body);
        return cellWrap;
    }

    /**
     * Add a new cell of the given type.
     */
    function addCell(type, afterIndex) {
        var newCell = {
            id: 'cell_' + (++cellCounter),
            cell_type: type,
            source: type === 'code' ? '' : 'Type markdown here...',
            execution_count: null,
            output: null,
            isEditing: type === 'markdown'
        };

        if (afterIndex === undefined || afterIndex < 0 || afterIndex >= cells.length) {
            cells.push(newCell);
            activeCellIndex = cells.length - 1;
        } else {
            cells.splice(afterIndex + 1, 0, newCell);
            activeCellIndex = afterIndex + 1;
        }

        renderCells();

        // Focus the newly added cell's editor
        setTimeout(function () {
            var addedCell = cells[activeCellIndex];
            if (addedCell && addedCell.editor) {
                addedCell.editor.focus();
            }
        }, 50);
    }

    /**
     * Delete cell by index.
     */
    function deleteCell(index) {
        if (cells.length <= 1) {
            showToast('Notebook must have at least one cell.', 'info');
            return;
        }
        cells.splice(index, 1);
        if (activeCellIndex >= cells.length) {
            activeCellIndex = cells.length - 1;
        }
        renderCells();
    }

    /**
     * Move cell up (-1) or down (+1).
     */
    function moveCell(index, dir) {
        var target = index + dir;
        if (target < 0 || target >= cells.length) return;

        // Sync values
        if (cells[index].editor) cells[index].source = cells[index].editor.getValue();
        if (cells[target].editor) cells[target].source = cells[target].editor.getValue();

        var tmp = cells[index];
        cells[index] = cells[target];
        cells[target] = tmp;

        activeCellIndex = target;
        renderCells();
    }

    /**
     * Clear all output areas in-place without touching CodeMirror editors.
     */
    function clearAllOutputs() {
        cells.forEach(function (c, idx) {
            c.output = null;
            c.execution_count = null;
            c.isRunning = false;
            updateCellStatusAndOutput(idx);
        });
        showToast('All cell outputs cleared.', 'info');
    }

    /**
     * Execute a specific code cell in-place.
     * CodeMirror is never destroyed, so code never disappears!
     */
    function runCell(index, advanceToNext) {
        var cell = cells[index];
        if (!cell || cell.cell_type !== 'code') return;

        // Sync latest code from CodeMirror
        if (cell.editor) {
            cell.source = cell.editor.getValue();
        }

        if (!sessionId) {
            startSession(function () {
                runCell(index, advanceToNext);
            });
            return;
        }

        cell.isRunning = true;
        setKernelStatus('busy', 'Executing cell [' + (executionCounter + 1) + ']...');
        updateCellStatusAndOutput(index); // In-place DOM update!

        fetch('/api/playground/session/' + sessionId + '/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: cell.source,
                timeout: 45,
                theme: (window.ThemeManager ? window.ThemeManager.getCurrentTheme() : 'dark')
            })
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                cell.isRunning = false;
                executionCounter++;
                cell.execution_count = executionCounter;
                cell.output = data;
                setKernelStatus('idle', 'Idle');
                updateCellStatusAndOutput(index); // In-place DOM update!

                if (advanceToNext) {
                    if (index === cells.length - 1) {
                        addCell('code', index);
                    } else {
                        activeCellIndex = index + 1;
                        var nextWrap = document.getElementById('dom_' + cells[activeCellIndex].id);
                        if (nextWrap) {
                            document.querySelectorAll('.notebook-cell').forEach(function (c) {
                                c.classList.remove('active');
                            });
                            nextWrap.classList.add('active');
                            if (cells[activeCellIndex].editor) {
                                cells[activeCellIndex].editor.focus();
                            }
                        }
                    }
                }
            })
            .catch(function (err) {
                console.error('[Playground] Execution failed:', err);
                cell.isRunning = false;
                cell.output = {
                    success: false,
                    stdout: '',
                    stderr: 'Execution Error: ' + err.message,
                    result: null,
                    result_html: null,
                    plots: []
                };
                setKernelStatus('error', 'Execution Failed');
                updateCellStatusAndOutput(index);
            });
    }

    /**
     * Run all cells sequentially in-place.
     */
    function runAllCells() {
        var codeIndices = [];
        cells.forEach(function (c, idx) {
            if (c.cell_type === 'code') codeIndices.push(idx);
        });

        if (!codeIndices.length) return;

        function runNext(seqIdx) {
            if (seqIdx >= codeIndices.length) {
                setKernelStatus('idle', 'Idle');
                showToast('All cells executed.', 'success');
                return;
            }
            var cellIdx = codeIndices[seqIdx];
            var cell = cells[cellIdx];
            if (cell.editor) cell.source = cell.editor.getValue();

            cell.isRunning = true;
            setKernelStatus('busy', 'Running cell ' + (seqIdx + 1) + ' of ' + codeIndices.length + '...');
            updateCellStatusAndOutput(cellIdx); // In-place!

            fetch('/api/playground/session/' + sessionId + '/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: cell.source,
                    timeout: 45,
                    theme: (window.ThemeManager ? window.ThemeManager.getCurrentTheme() : 'dark')
                })
            })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    cell.isRunning = false;
                    executionCounter++;
                    cell.execution_count = executionCounter;
                    cell.output = data;
                    updateCellStatusAndOutput(cellIdx); // In-place!
                    runNext(seqIdx + 1);
                })
                .catch(function (err) {
                    cell.isRunning = false;
                    cell.output = { success: false, stderr: 'Execution stopped: ' + err.message };
                    setKernelStatus('error', 'Execution Error');
                    updateCellStatusAndOutput(cellIdx);
                });
        }

        runNext(0);
    }

    /**
     * Restart the session kernel.
     */
    function restartKernel() {
        if (!sessionId) return;
        setKernelStatus('busy', 'Restarting kernel...');

        fetch('/api/playground/session/' + sessionId + '/restart', { method: 'POST' })
            .then(function (res) { return res.json(); })
            .then(function () {
                executionCounter = 0;
                setKernelStatus('idle', 'Idle');
                showToast('Kernel restarted. Variables and execution state reset.', 'info');
            })
            .catch(function (err) {
                console.error('[Playground] Error restarting kernel:', err);
                setKernelStatus('error', 'Restart Failed');
            });
    }

    /**
     * Download current notebook as .ipynb or .py.
     */
    function downloadNotebook(format) {
        cells.forEach(function (c) {
            if (c.editor) c.source = c.editor.getValue();
        });

        var payload = {
            title: notebookTitle,
            format: format,
            cells: cells.map(function (c) {
                return {
                    cell_type: c.cell_type,
                    source: c.source,
                    execution_count: c.execution_count,
                    output: c.output
                };
            })
        };

        fetch('/api/playground/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (res) { return res.blob(); })
            .then(function (blob) {
                var url = window.URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = notebookTitle + '.' + format;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showToast('Downloaded ' + notebookTitle + '.' + format, 'success');
            })
            .catch(function (err) {
                console.error('[Playground] Download error:', err);
                showToast('Failed to download notebook', 'error');
            });
    }

    /**
     * Handle local file upload (.ipynb or .py).
     */
    function handleFileUpload(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;

        var formData = new FormData();
        formData.append('file', file);

        fetch('/api/playground/upload', {
            method: 'POST',
            body: formData
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.error) {
                    showToast('Upload error: ' + data.error, 'error');
                    return;
                }

                notebookTitle = data.title || file.name.replace(/\.[^/.]+$/, '');
                var titleInput = document.querySelector('.playground-title-input');
                if (titleInput) titleInput.value = notebookTitle;

                // Load uploaded cells
                cells = (data.cells || []).map(function (c) {
                    return {
                        id: 'cell_' + (++cellCounter),
                        cell_type: c.cell_type || 'code',
                        source: c.source || '',
                        execution_count: null,
                        output: null,
                        isEditing: false
                    };
                });

                if (!cells.length) {
                    cells = getDefaultCells();
                }

                activeCellIndex = 0;
                renderCells();
                showToast('Loaded notebook: ' + file.name + ' (' + cells.length + ' cells)', 'success');
            })
            .catch(function (err) {
                console.error('[Playground] Upload error:', err);
                showToast('Failed to parse uploaded notebook.', 'error');
            });

        // Reset input
        e.target.value = '';
    }

    /**
     * Load a starter notebook template from the backend.
     */
    function loadTemplate(templateId) {
        fetch('/api/playground/templates/' + templateId)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.error) {
                    showToast('Template not found', 'error');
                    return;
                }

                notebookTitle = data.title || 'ML_Template';
                var titleInput = document.querySelector('.playground-title-input');
                if (titleInput) titleInput.value = notebookTitle;

                cells = (data.cells || []).map(function (c) {
                    return {
                        id: 'cell_' + (++cellCounter),
                        cell_type: c.cell_type || 'code',
                        source: c.source || '',
                        execution_count: null,
                        output: null,
                        isEditing: false
                    };
                });

                activeCellIndex = 0;
                renderCells();
                showToast('Loaded template: ' + data.title, 'success');
            })
            .catch(function (err) {
                console.error('[Playground] Template load error:', err);
                showToast('Failed to load template', 'error');
            });
    }

    /**
     * Cleanup session environment if browser tab or window is closed.
     */
    window.addEventListener('beforeunload', function () {
        if (sessionId) {
            navigator.sendBeacon('/api/playground/session/' + sessionId);
        }
    });

    // Public API
    window.Playground = {
        render: renderPlayground,
        startSession: startSession,
        endSession: endSession,
        runCell: runCell,
        runAllCells: runAllCells,
        setTheme: function (themeId, notifyBackend) {
            var pgSelect = document.getElementById('playground-theme-select');
            if (pgSelect) pgSelect.value = themeId;
            if (notifyBackend && sessionId) {
                fetch('/api/playground/session/' + sessionId + '/theme', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ theme: themeId })
                }).catch(function () {});
            }
        }
    };

})();
