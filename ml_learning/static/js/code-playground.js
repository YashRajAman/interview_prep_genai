/**
 * Code Playground Module — ML Odyssey
 * ------------------------------------------------------------------
 * Renders an interactive Python code editor (powered by CodeMirror) and
 * executes the code against the backend `/api/run-code` endpoint, then
 * displays stdout / stderr / matplotlib plots inline.
 *
 * Exposes a single global: `window.CodePlayground`
 *
 * Dependencies (loaded globally via CDN in index.html):
 *   - CodeMirror (window.CodeMirror) + python mode + material-darker theme
 */
(function () {
    'use strict';

    // ------------------------------------------------------------------
    // Module-level unique-ID counter.
    // A monotonic counter guarantees unique IDs across multiple
    // playground instances rendered on the same page, avoiding
    // collisions on the <textarea> element IDs.
    // ------------------------------------------------------------------
    let playgroundIdCounter = 0;

    /**
     * Show a toast notification in the global toast container.
     * Reuses a globally-defined `showToast` if another module already
     * provides one; otherwise falls back to a small local implementation
     * that targets `#toast-container`.
     *
     * @param {string} message - Text to display.
     * @param {'success'|'error'|'info'|'warning'} [type='info']
     */
    function showToast(message, type) {
        // Defer to a shared global implementation when available so toast
        // styling/behaviour stays consistent across modules.
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }

        type = type || 'info';
        const container = document.getElementById('toast-container');
        if (!container) {
            // No toast container available — fall back to console.
            console.warn('[CodePlayground]', message);
            return;
        }

        const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.innerHTML =
            '<span class="toast-icon">' + (icons[type] || 'ℹ') + '</span>' +
            '<span class="toast-message"></span>';
        toast.querySelector('.toast-message').textContent = message;

        container.appendChild(toast);

        // Auto-dismiss after 4s with the CSS fade-out animation.
        setTimeout(function () {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', function () {
                toast.remove();
            });
        }, 4000);
    }

    /**
     * Create the DOM markup for a playground instance.
     *
     * @param {number} id        - Unique playground id (used in textarea id).
     * @param {object} codeData   - { starter, description } from topics.json.
     * @returns {string} HTML string.
     */
    function buildPlaygroundHTML(id, codeData) {
        const description = (codeData && codeData.description) || '';
        const starter = (codeData && codeData.starter) || '';

        // Escape the starter code so it renders safely inside <textarea>.
        const escapedStarter = starter
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return [
            '<div class="code-playground">',
            '  <div class="code-playground-header">',
            '    <h3 class="section-title">Code Playground</h3>',
            '    <p></p>',
            '  </div>',
            '  <div class="code-editor-wrapper">',
            '    <textarea id="code-editor-' + id + '"></textarea>',
            '  </div>',
            '  <div class="code-toolbar">',
            '    <button class="btn btn-run">▶ Run Code</button>',
            '    <button class="btn btn-secondary btn-reset">↺ Reset</button>',
            '  </div>',
            '  <div class="code-output">',
            '    <div class="output-placeholder">Run your code to see output here</div>',
            '  </div>',
            '</div>'
        ].join('\n');
        // NOTE: description & starter are injected via textContent/setValue
        // below to avoid XSS from topic content. The <p> and <textarea>
        // are populated after insertion.
    }

    /**
     * Render the results of a run into the output area.
     *
     * @param {HTMLElement} outputEl - The `.code-output` container.
     * @param {object} result         - API response { success, stdout, stderr, plots }.
     */
    function renderOutput(outputEl, result) {
        // Clear previous content / placeholder.
        outputEl.innerHTML = '';

        const stdout = (result.stdout || '').trim();
        const stderr = (result.stderr || '').trim();
        const plots = Array.isArray(result.plots) ? result.plots : [];

        // Show stdout first (if any) under an "Output" label.
        if (stdout) {
            const stdoutLabel = document.createElement('div');
            stdoutLabel.className = 'output-label';
            stdoutLabel.textContent = 'Output';
            outputEl.appendChild(stdoutLabel);

            const stdoutEl = document.createElement('pre');
            stdoutEl.className = 'output-stdout';
            stdoutEl.textContent = stdout;
            outputEl.appendChild(stdoutEl);
        }

        // Then stderr (if any) under an "Errors" label.
        if (stderr) {
            const stderrLabel = document.createElement('div');
            stderrLabel.className = 'output-label';
            stderrLabel.textContent = 'Errors';
            outputEl.appendChild(stderrLabel);

            const stderrEl = document.createElement('pre');
            stderrEl.className = 'output-stderr';
            stderrEl.textContent = stderr;
            outputEl.appendChild(stderrEl);
        }

        // Finally, render any plots under a "Plots" label.
        if (plots.length) {
            const plotsLabel = document.createElement('div');
            plotsLabel.className = 'output-label';
            plotsLabel.textContent = 'Plots';
            outputEl.appendChild(plotsLabel);

            const plotWrap = document.createElement('div');
            plotWrap.className = 'output-plot';
            plots.forEach(function (b64) {
                const img = document.createElement('img');
                img.src = 'data:image/png;base64,' + b64;
                img.alt = 'Generated plot';
                plotWrap.appendChild(img);
            });
            outputEl.appendChild(plotWrap);
        }

        // If nothing was returned at all, show a friendly placeholder.
        if (!stdout && !stderr && plots.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'output-placeholder';
            empty.textContent = 'Code ran with no output.';
            outputEl.appendChild(empty);
        }
    }

    /**
     * Show the placeholder state in the output area.
     *
     * @param {HTMLElement} outputEl - The `.code-output` container.
     */
    function showPlaceholder(outputEl) {
        outputEl.innerHTML =
            '<div class="output-placeholder">Run your code to see output here</div>';
    }

    /**
     * Set the run button into / out of its "running" state.
     *
     * @param {HTMLButtonElement} btn
     * @param {boolean} running - true to enter running state, false to restore.
     */
    function setRunButtonState(btn, running) {
        if (running) {
            btn.classList.add('running');
            btn.disabled = true;
            btn.textContent = 'Running...';
        } else {
            btn.classList.remove('running');
            btn.disabled = false;
            btn.textContent = '▶ Run Code';
        }
    }

    /**
     * Initialize a code playground inside the given container.
     *
     * @param {object}   codeData   - The topic's `code` object from topics.json:
     *                                 { starter: "...", description: "..." }.
     * @param {HTMLElement} container - DOM element to render the playground into.
     * @param {function} [onComplete]  - Callback invoked once when code runs successfully.
     * @returns {object|null} playground handle or null on failure.
     */
    function init(codeData, container, onComplete) {
        // Guard against bad input.
        if (!container) {
            console.error('[CodePlayground] init: container is required.');
            return null;
        }

        // Defensive defaults for the code data.
        codeData = codeData || {};
        const starterCode = codeData.starter || '';
        const description = codeData.description || '';

        // Verify CodeMirror is available before doing anything else.
        if (typeof window.CodeMirror === 'undefined') {
            container.innerHTML =
                '<div class="code-playground">' +
                '<p class="output-placeholder" style="color:var(--error)">' +
                'Code editor failed to load (CodeMirror not available). ' +
                'Please refresh the page.</p></div>';
            showToast('Code editor library failed to load.', 'error');
            return null;
        }

        // Generate a unique id for this playground instance.
        const id = ++playgroundIdCounter;

        // Build and inject the markup.
        container.innerHTML = buildPlaygroundHTML(id, codeData);

        // Populate the description safely (textContent avoids HTML injection).
        const descEl = container.querySelector('.code-playground-header p');
        if (descEl) {
            descEl.textContent = description;
        }

        // Grab the key elements.
        const textarea = container.querySelector('#code-editor-' + id);
        const runBtn = container.querySelector('.btn-run');
        const resetBtn = container.querySelector('.btn-reset');
        const outputEl = container.querySelector('.code-output');

        // Set the starter code into the textarea (before CodeMirror wraps it).
        textarea.value = starterCode;

        // Initialize CodeMirror on the textarea.
        const editor = window.CodeMirror.fromTextArea(textarea, {
            mode: 'python',
            theme: 'material-darker',
            lineNumbers: true,
            indentUnit: 4,
            autoCloseBrackets: true,
            matchBrackets: true
        });

        // Track whether onComplete has already fired for this session,
        // so we only notify progress the first time code runs successfully.
        let completedFired = false;

        // ---- Run button handler -----------------------------------------
        runBtn.addEventListener('click', function () {
            const code = editor.getValue();

            if (!code.trim()) {
                showToast('Nothing to run — the editor is empty.', 'warning');
                return;
            }

            // Enter the running state (CSS shows the spinner via ::before).
            setRunButtonState(runBtn, true);

            fetch('/api/run-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code, timeout: 10 })
            })
                .then(function (response) {
                    if (!response.ok) {
                        // Non-2xx: surface the status text in the output area.
                        throw new Error(
                            'Server error (' + response.status + '): ' +
                            (response.statusText || 'request failed')
                        );
                    }
                    return response.json();
                })
                .then(function (result) {
                    // Render stdout / stderr / plots.
                    renderOutput(outputEl, result || {});

                    // Fire the completion callback once on success.
                    if (result && result.success && !completedFired) {
                        completedFired = true;
                        if (typeof onComplete === 'function') {
                            try {
                                onComplete();
                            } catch (e) {
                                console.error('[CodePlayground] onComplete error:', e);
                            }
                        }
                    }
                })
                .catch(function (err) {
                    // Network failure or non-OK response — show in output + toast.
                    renderOutput(outputEl, {});
                    const errEl = document.createElement('pre');
                    errEl.className = 'output-stderr';
                    errEl.textContent =
                        '⚠ ' + (err && err.message
                            ? err.message
                            : 'Network error — could not reach the server.');
                    outputEl.appendChild(errEl);
                    showToast('Failed to run code.', 'error');
                })
                .then(function () {
                    // Always restore the button, success or failure.
                    setRunButtonState(runBtn, false);
                });
        });

        // ---- Reset button handler ---------------------------------------
        resetBtn.addEventListener('click', function () {
            // Restore the original starter code and refresh the editor.
            editor.setValue(starterCode);
            editor.refresh();

            // Clear output and show the placeholder again.
            showPlaceholder(outputEl);
        });

        // Some browsers/layouts hide the container until shown; ensure the
        // editor measures correctly once it is visible. Using a microtask
        // gives the DOM a chance to lay out before refreshing.
        setTimeout(function () {
            editor.refresh();
        }, 0);

        // Return a small handle for advanced callers.
        return {
            editor: editor,
            run: function () { runBtn.click(); },
            reset: function () { resetBtn.click(); }
        };
    }

    // Expose the public API on `window`.
    window.CodePlayground = {
        init: init
    };
})();
