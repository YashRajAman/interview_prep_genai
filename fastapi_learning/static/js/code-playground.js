/**
 * FastAPI Learning Platform — Code Playground Module
 * CodeMirror editor + backend execution with TestClient support.
 * Exposed globally as `window.CodePlayground`.
 */

(function () {
    'use strict';

    var editors = {};

    function createEditor(textarea, starterCode) {
        var cm = CodeMirror.fromTextArea(textarea, {
            mode: 'python',
            theme: 'material-darker',
            lineNumbers: true,
            indentUnit: 4,
            tabSize: 4,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentWithTabs: false,
            extraKeys: {
                'Ctrl-Enter': function () { runCode(cm); },
                'Cmd-Enter': function () { runCode(cm); }
            }
        });
        if (starterCode) cm.setValue(starterCode);
        return cm;
    }

    function runCode(cm) {
        var container = cm.getWrapperElement().closest('.playground-container');
        if (!container) return;

        var runBtn = container.querySelector('.btn-run');
        var code = cm.getValue();
        var testRequests = JSON.parse(container.dataset.testRequests || 'null');

        runBtn.classList.add('loading');
        runBtn.disabled = true;

        fetch('/api/run-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: code,
                timeout: 15,
                test_requests: testRequests
            })
        })
        .then(function (r) { return r.json(); })
        .then(function (result) {
            renderOutput(container, result);
        })
        .catch(function (err) {
            renderError(container, 'Network error: ' + err.message);
        })
        .finally(function () {
            runBtn.classList.remove('loading');
            runBtn.disabled = false;
        });
    }

    function renderOutput(container, result) {
        var outputArea = container.querySelector('.playground-output');
        if (!outputArea) {
            outputArea = document.createElement('div');
            outputArea.className = 'playground-output';
            container.appendChild(outputArea);
        }

        outputArea.innerHTML = '';

        // stdout
        if (result.stdout) {
            var stdoutEl = document.createElement('div');
            stdoutEl.className = 'output-stdout';
            var header = document.createElement('div');
            header.className = 'output-header';
            header.textContent = 'Output';
            stdoutEl.appendChild(header);
            var pre = document.createElement('pre');
            pre.textContent = result.stdout;
            stdoutEl.appendChild(pre);
            outputArea.appendChild(stdoutEl);
        }

        // stderr
        if (result.stderr) {
            var stderrEl = document.createElement('div');
            stderrEl.className = 'output-stderr';
            var errHeader = document.createElement('div');
            errHeader.className = 'output-header';
            errHeader.textContent = 'Error';
            stderrEl.appendChild(errHeader);
            var errPre = document.createElement('pre');
            errPre.textContent = result.stderr;
            stderrEl.appendChild(errPre);
            outputArea.appendChild(stderrEl);
        }

        // HTTP responses (TestClient)
        if (result.http_responses && result.http_responses.length > 0) {
            var httpHeader = document.createElement('div');
            httpHeader.className = 'output-header';
            httpHeader.textContent = 'HTTP Responses (TestClient)';
            httpHeader.style.marginTop = '16px';
            outputArea.appendChild(httpHeader);

            result.http_responses.forEach(function (resp) {
                outputArea.appendChild(renderHttpResponse(resp));
            });
        }

        // No output
        if (!result.stdout && !result.stderr && (!result.http_responses || result.http_responses.length === 0)) {
            var empty = document.createElement('div');
            empty.style.color = 'var(--text-muted)';
            empty.style.padding = '16px';
            empty.style.textAlign = 'center';
            empty.textContent = 'Code executed successfully (no output)';
            outputArea.appendChild(empty);
        }
    }

    function renderHttpResponse(resp) {
        var card = document.createElement('div');
        card.className = 'http-response-card';

        var header = document.createElement('div');
        header.className = 'http-response-header';

        var methodBadge = document.createElement('span');
        methodBadge.className = 'http-method-badge';
        methodBadge.textContent = resp.request.method;
        header.appendChild(methodBadge);

        var pathEl = document.createElement('span');
        pathEl.textContent = resp.request.path;
        header.appendChild(pathEl);

        var statusBadge = document.createElement('span');
        statusBadge.className = 'status-badge';
        var status = resp.status_code;
        if (status >= 200 && status < 300) {
            statusBadge.classList.add('success');
        } else if (status >= 300 && status < 400) {
            statusBadge.classList.add('redirect');
        } else {
            statusBadge.classList.add('error');
        }
        statusBadge.textContent = status;
        header.appendChild(statusBadge);

        card.appendChild(header);

        var bodyEl = document.createElement('div');
        bodyEl.className = 'http-response-body';
        if (typeof resp.body === 'object') {
            bodyEl.textContent = JSON.stringify(resp.body, null, 2);
        } else {
            bodyEl.textContent = String(resp.body);
        }
        card.appendChild(bodyEl);

        if (resp.headers && Object.keys(resp.headers).length > 0) {
            var headersEl = document.createElement('div');
            headersEl.className = 'http-response-headers';
            var headerText = Object.entries(resp.headers)
                .filter(function (e) { return e[0] !== 'content-length'; })
                .map(function (e) { return e[0] + ': ' + e[1]; })
                .join('\n');
            headersEl.textContent = headerText;
            card.appendChild(headersEl);
        }

        return card;
    }

    function renderError(container, msg) {
        var outputArea = container.querySelector('.playground-output');
        if (!outputArea) {
            outputArea = document.createElement('div');
            outputArea.className = 'playground-output';
            container.appendChild(outputArea);
        }
        outputArea.innerHTML = '<div class="output-stderr">' + msg + '</div>';
    }

    function init(container, challenge) {
        var html =
            '<div class="playground-container" data-test-requests=\'' + JSON.stringify(challenge.test_requests || []) + '\'>' +
                '<div class="playground-header">' +
                    '<div>' +
                        '<div class="playground-title">' + (challenge.title || 'Code Challenge') + '</div>' +
                        '<div class="playground-description">' + (challenge.description || '') + '</div>' +
                    '</div>' +
                    '<div class="playground-actions">' +
                        (challenge.hints && challenge.hints.length ? '<button class="btn-hint" type="button">💡 Hint</button>' : '') +
                        '<button class="btn-reset" type="button">Reset</button>' +
                        '<button class="btn-run" type="button"><span class="spinner"></span><span class="run-text">▶ Run</span></button>' +
                    '</div>' +
                '</div>' +
                '<div class="playground-editor">' +
                    '<textarea id="code-editor-' + Date.now() + '"></textarea>' +
                '</div>' +
                '<div class="playground-output"></div>' +
            '</div>';

        container.innerHTML = html;

        var textarea = container.querySelector('textarea');
        var cm = createEditor(textarea, challenge.starter_code || '');
        editors[container.id || 'default'] = cm;

        // Wire up buttons
        container.querySelector('.btn-run').addEventListener('click', function () { runCode(cm); });
        container.querySelector('.btn-reset').addEventListener('click', function () {
            cm.setValue(challenge.starter_code || '');
            container.querySelector('.playground-output').innerHTML = '';
        });

        var hintBtn = container.querySelector('.btn-hint');
        if (hintBtn && challenge.hints) {
            var hintIdx = 0;
            hintBtn.addEventListener('click', function () {
                if (hintIdx < challenge.hints.length) {
                    showToast('💡 ' + challenge.hints[hintIdx], 'info');
                    hintIdx++;
                } else {
                    showToast('No more hints available', 'info');
                }
            });
        }

        return cm;
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

    window.CodePlayground = {
        init: init,
        runCode: runCode,
        renderOutput: renderOutput,
        refreshEditors: function () {
            Object.keys(editors).forEach(function (k) {
                if (editors[k] && editors[k].refresh) editors[k].refresh();
            });
        }
    };
})();
