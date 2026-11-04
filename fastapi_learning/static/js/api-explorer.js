/**
 * FastAPI Learning Platform — API Explorer Module
 * Interactive HTTP request builder for exploring API behavior.
 * Lets learners construct requests (method, path, headers, body) and see responses.
 * Exposed globally as `window.ApiExplorer`.
 */

(function () {
    'use strict';

    function init(container, config) {
        config = config || {};
        var endpoints = config.endpoints || [];

        var html =
            '<div class="interact-container">' +
                '<div class="interact-title">🔗 API Explorer</div>' +
                '<div class="interact-description">Construct HTTP requests and see how FastAPI handles them.</div>' +
                '<div class="api-explorer-form">' +
                    '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">' +
                        '<select class="api-method-select" style="padding:8px 12px;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);font-family:var(--font-code);font-size:14px;">' +
                            '<option value="GET">GET</option>' +
                            '<option value="POST">POST</option>' +
                            '<option value="PUT">PUT</option>' +
                            '<option value="PATCH">PATCH</option>' +
                            '<option value="DELETE">DELETE</option>' +
                        '</select>' +
                        '<input type="text" class="api-path-input" placeholder="/items/1" style="flex:1;min-width:200px;padding:8px 12px;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);font-family:var(--font-code);font-size:14px;">' +
                        '<button class="api-send-btn" style="padding:8px 20px;background:var(--primary);color:var(--bg-base);border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">Send</button>' +
                    '</div>' +
                    '<div style="margin-bottom:12px;">' +
                        '<label style="font-size:13px;color:var(--text-muted);display:block;margin-bottom:4px;">Request Body (JSON)</label>' +
                        '<textarea class="api-body-input" placeholder=\'{"name": "example", "price": 10.99}\' style="width:100%;min-height:80px;padding:8px 12px;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);font-family:var(--font-code);font-size:13px;resize:vertical;"></textarea>' +
                    '</div>' +
                    (endpoints.length > 0 ?
                        '<div style="margin-bottom:12px;">' +
                            '<label style="font-size:13px;color:var(--text-muted);display:block;margin-bottom:4px;">Quick Select</label>' +
                            '<select class="api-endpoint-select" style="width:100%;padding:8px 12px;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);font-size:14px;">' +
                                '<option value="">— Choose an endpoint —</option>' +
                                endpoints.map(function (e) {
                                    return '<option value="' + e.method + '|' + e.path + '">' + e.method + ' ' + e.path + '</option>';
                                }).join('') +
                            '</select>' +
                        '</div>'
                    : '') +
                '</div>' +
                '<div class="api-response-area" style="margin-top:16px;">' +
                    '<div class="output-header">Response</div>' +
                    '<div class="api-response-empty" style="color:var(--text-muted);padding:24px;text-align:center;">Send a request to see the response.</div>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;

        var methodSelect = container.querySelector('.api-method-select');
        var pathInput = container.querySelector('.api-path-input');
        var bodyInput = container.querySelector('.api-body-input');
        var sendBtn = container.querySelector('.api-send-btn');
        var responseArea = container.querySelector('.api-response-area');
        var endpointSelect = container.querySelector('.api-endpoint-select');

        // Quick select handler
        if (endpointSelect) {
            endpointSelect.addEventListener('change', function () {
                var val = endpointSelect.value;
                if (val) {
                    var parts = val.split('|');
                    methodSelect.value = parts[0];
                    pathInput.value = parts[1];
                }
            });
        }

        sendBtn.addEventListener('click', function () {
            var method = methodSelect.value;
            var path = pathInput.value.trim();
            if (!path) {
                showToast('Please enter a path', 'error');
                return;
            }

            var body = null;
            var bodyText = bodyInput.value.trim();
            if (bodyText) {
                try { body = JSON.parse(bodyText); }
                catch (e) {
                    showToast('Invalid JSON in request body', 'error');
                    return;
                }
            }

            // Execute via the code runner with test_requests
            // The topic's FastAPI app code is sent alongside the request
            var appCode = config.app_code || '';
            if (!appCode) {
                showToast('No app code configured for this explorer', 'error');
                return;
            }

            sendBtn.disabled = true;
            sendBtn.textContent = 'Sending...';

            fetch('/api/run-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: appCode,
                    timeout: 15,
                    test_requests: [{ method: method, path: path, json: body }]
                })
            })
            .then(function (r) { return r.json(); })
            .then(function (result) {
                renderApiResponse(responseArea, result);
            })
            .catch(function (err) {
                responseArea.innerHTML = '<div class="output-stderr">Network error: ' + err.message + '</div>';
            })
            .finally(function () {
                sendBtn.disabled = false;
                sendBtn.textContent = 'Send';
            });
        });
    }

    function renderApiResponse(container, result) {
        container.innerHTML = '<div class="output-header">Response</div>';

        if (result.stderr) {
            var errEl = document.createElement('div');
            errEl.className = 'output-stderr';
            errEl.textContent = result.stderr;
            container.appendChild(errEl);
        }

        if (result.http_responses && result.http_responses.length > 0) {
            result.http_responses.forEach(function (resp) {
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
                if (status >= 200 && status < 300) statusBadge.classList.add('success');
                else if (status >= 300 && status < 400) statusBadge.classList.add('redirect');
                else statusBadge.classList.add('error');
                statusBadge.textContent = status;
                header.appendChild(statusBadge);

                card.appendChild(header);

                var bodyEl = document.createElement('div');
                bodyEl.className = 'http-response-body';
                bodyEl.textContent = typeof resp.body === 'object' ? JSON.stringify(resp.body, null, 2) : String(resp.body);
                card.appendChild(bodyEl);

                container.appendChild(card);
            });
        } else if (!result.stderr) {
            var empty = document.createElement('div');
            empty.style.color = 'var(--text-muted)';
            empty.style.padding = '16px';
            empty.textContent = 'No response received';
            container.appendChild(empty);
        }
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

    window.ApiExplorer = { init: init };
})();
