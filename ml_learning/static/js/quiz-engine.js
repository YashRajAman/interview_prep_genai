/**
 * ML Odyssey — Quiz Engine Module (Enhanced for 30-50 Question Banks)
 * ---------------------------------------------------------------------------
 * Renders multiple-choice questions with a Question Navigator Palette,
 * quick-jump to unanswered questions, real-time progress indicators,
 * instant submission grading via `/api/check-quiz`, detailed explanations,
 * and post-quiz filtering (Review All / Incorrect Only / Correct Only).
 *
 * Exposed globally as `window.QuizEngine.renderQuiz(topic, container, onComplete)`.
 * ---------------------------------------------------------------------------
 */

(function () {
    'use strict';

    /**
     * Convert a 0-based index into a letter prefix (A, B, C, ...).
     */
    function indexToLetter(index) {
        return String.fromCharCode(65 + index);
    }

    /**
     * Build the markup for a single quiz question card with header and badge.
     */
    function buildQuestion(question, qIndex, total) {
        var qText = (question && question.question) || '';
        var options = Array.isArray(question && question.options) ? question.options : [];

        var card = document.createElement('div');
        card.className = 'quiz-question';
        card.id = 'quiz-q-' + qIndex;
        card.dataset.question = String(qIndex);

        // Header with question index and status pill
        var headerEl = document.createElement('div');
        headerEl.className = 'quiz-question-header';

        var badge = document.createElement('span');
        badge.className = 'quiz-question-badge';
        badge.textContent = 'Question ' + (qIndex + 1) + ' of ' + total;
        headerEl.appendChild(badge);

        var statusPill = document.createElement('span');
        statusPill.className = 'quiz-status-pill';
        statusPill.textContent = 'Unanswered';
        headerEl.appendChild(statusPill);

        card.appendChild(headerEl);

        // Question text
        var textEl = document.createElement('p');
        textEl.className = 'quiz-question-text';
        textEl.textContent = qText;
        card.appendChild(textEl);

        // Options list
        var optionsEl = document.createElement('div');
        optionsEl.className = 'quiz-options';

        options.forEach(function (option, oIndex) {
            var optEl = document.createElement('div');
            optEl.className = 'quiz-option';
            optEl.dataset.option = String(oIndex);
            optEl.setAttribute('role', 'radio');
            optEl.setAttribute('tabindex', '0');
            optEl.setAttribute('aria-checked', 'false');

            var label = document.createElement('span');
            label.className = 'quiz-option-label';
            label.textContent = indexToLetter(oIndex) + '. ' + option;
            optEl.appendChild(label);

            optionsEl.appendChild(optEl);
        });

        card.appendChild(optionsEl);
        return card;
    }

    /**
     * Build the SVG score circle.
     */
    function buildScoreCircle(percentage) {
        var radius = 60;
        var circumference = 2 * Math.PI * radius;
        var pct = Math.max(0, Math.min(100, percentage));
        var offset = circumference * (1 - pct / 100);

        var color = '#00d4aa';
        if (pct < 60) {
            color = '#ff5757';
        } else if (pct < 80) {
            color = '#ff8c42';
        }

        var wrap = document.createElement('div');
        wrap.className = 'quiz-score-circle';
        wrap.innerHTML =
            '<svg viewBox="0 0 140 140" width="140" height="140">' +
            '  <circle cx="70" cy="70" r="' + radius + '" ' +
            '    fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10"/>' +
            '  <circle cx="70" cy="70" r="' + radius + '" ' +
            '    fill="none" stroke="' + color + '" stroke-width="10" ' +
            '    stroke-linecap="round" ' +
            '    stroke-dasharray="' + circumference + '" ' +
            '    stroke-dashoffset="' + circumference + '" ' +
            '    transform="rotate(-90 70 70)" class="quiz-score-arc"/>' +
            '</svg>' +
            '<span class="quiz-score-percent">' + Math.round(pct) + '%</span>';

        var arc = wrap.querySelector('.quiz-score-arc');
        if (arc) {
            requestAnimationFrame(function () {
                arc.style.transition = 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)';
                arc.style.strokeDashoffset = String(offset);
            });
        }
        return wrap;
    }

    function scoreMessage(percentage) {
        if (percentage >= 100) return 'Flawless Mastery! You nailed every question! 🏆';
        if (percentage >= 85) return 'Outstanding! You have a deep understanding of this topic! 🌟';
        if (percentage >= 70) return 'Great job! Solid grasp of concepts and formulas. 👍';
        if (percentage >= 50) return 'Good start! Review the explanations to reinforce weaker spots. 📚';
        return 'Keep practicing! Review the reading sections and try again. 💪';
    }

    function buildResults(score, total, percentage, onRetry, onFilter) {
        var wrap = document.createElement('div');
        wrap.className = 'quiz-results';

        wrap.appendChild(buildScoreCircle(percentage));

        var msgEl = document.createElement('div');
        msgEl.className = 'quiz-results-message';
        msgEl.textContent = scoreMessage(percentage);
        wrap.appendChild(msgEl);

        var breakdown = document.createElement('div');
        breakdown.className = 'quiz-breakdown';
        breakdown.innerHTML =
            '<div class="quiz-breakdown-item">' +
            '  <span class="quiz-breakdown-label">Correct</span>' +
            '  <span class="quiz-breakdown-value correct">' + score + '</span>' +
            '</div>' +
            '<div class="quiz-breakdown-divider"></div>' +
            '<div class="quiz-breakdown-item">' +
            '  <span class="quiz-breakdown-label">Incorrect</span>' +
            '  <span class="quiz-breakdown-value incorrect">' + (total - score) + '</span>' +
            '</div>' +
            '<div class="quiz-breakdown-divider"></div>' +
            '<div class="quiz-breakdown-item">' +
            '  <span class="quiz-breakdown-label">Total Questions</span>' +
            '  <span class="quiz-breakdown-value">' + total + '</span>' +
            '</div>';
        wrap.appendChild(breakdown);

        // Filter tabs for review
        var filterGroup = document.createElement('div');
        filterGroup.className = 'quiz-filter-group';
        filterGroup.innerHTML =
            '<button type="button" class="quiz-filter-btn active" data-filter="all">All Questions (' + total + ')</button>' +
            '<button type="button" class="quiz-filter-btn" data-filter="incorrect">Incorrect Only (' + (total - score) + ')</button>' +
            '<button type="button" class="quiz-filter-btn" data-filter="correct">Correct Only (' + score + ')</button>';

        var filterBtns = filterGroup.querySelectorAll('.quiz-filter-btn');
        filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterBtns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                if (typeof onFilter === 'function') {
                    onFilter(btn.dataset.filter);
                }
            });
        });
        wrap.appendChild(filterGroup);

        var retryBtn = document.createElement('button');
        retryBtn.className = 'btn btn-primary quiz-retry-btn';
        retryBtn.type = 'button';
        retryBtn.textContent = '↻ Retake Quiz';
        retryBtn.addEventListener('click', onRetry);
        wrap.appendChild(retryBtn);

        return wrap;
    }

    /**
     * Render the quiz into container.
     */
    function renderQuiz(topic, container, onComplete) {
        if (!container) return;

        topic = topic || {};
        var topicId = topic.id || '';
        var quiz = Array.isArray(topic.quiz) ? topic.quiz : [];

        if (quiz.length === 0) {
            container.innerHTML =
                '<div class="quiz-container">' +
                '<p class="quiz-question-text">No quiz questions are available for this topic yet.</p></div>';
            return;
        }

        var answers = {};
        var submitted = false;
        var questionCards = [];
        var paletteBtns = [];

        container.innerHTML = '';
        var quizWrap = document.createElement('div');
        quizWrap.className = 'quiz-container';

        // --- Sticky Question Navigator Palette ---
        var paletteHeader = document.createElement('div');
        paletteHeader.className = 'quiz-palette-header';

        var paletteMeta = document.createElement('div');
        paletteMeta.className = 'quiz-palette-meta';

        var countText = document.createElement('span');
        countText.innerHTML = 'Progress: <strong class="ans-count">0</strong> / ' + quiz.length +
            ' (<span class="ans-pct">0%</span>)';
        paletteMeta.appendChild(countText);

        var jumpBtn = document.createElement('button');
        jumpBtn.type = 'button';
        jumpBtn.className = 'btn btn-sm btn-outline quiz-jump-btn';
        jumpBtn.textContent = 'Next Unanswered ➔';
        paletteMeta.appendChild(jumpBtn);

        paletteHeader.appendChild(paletteMeta);

        var paletteGrid = document.createElement('div');
        paletteGrid.className = 'quiz-palette-grid';

        for (var i = 0; i < quiz.length; i++) {
            (function (idx) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'palette-btn';
                btn.textContent = String(idx + 1);
                btn.title = 'Jump to Question ' + (idx + 1);
                btn.addEventListener('click', function () {
                    var target = questionCards[idx];
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        target.style.transition = 'box-shadow 0.3s ease';
                        target.style.boxShadow = '0 0 0 2px var(--primary)';
                        setTimeout(function () { target.style.boxShadow = ''; }, 1200);
                    }
                });
                paletteGrid.appendChild(btn);
                paletteBtns.push(btn);
            })(i);
        }
        paletteHeader.appendChild(paletteGrid);
        quizWrap.appendChild(paletteHeader);

        // Jump to next unanswered handler
        function jumpToNextUnanswered() {
            for (var j = 0; j < quiz.length; j++) {
                if (answers[j] === undefined) {
                    var card = questionCards[j];
                    if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        card.style.transition = 'box-shadow 0.3s ease';
                        card.style.boxShadow = '0 0 0 2px var(--warning)';
                        setTimeout(function () { card.style.boxShadow = ''; }, 1200);
                    }
                    return;
                }
            }
        }
        jumpBtn.addEventListener('click', jumpToNextUnanswered);

        // Function to update progress across UI
        function updateProgressUI() {
            var answeredCount = Object.keys(answers).length;
            var pct = Math.round((answeredCount / quiz.length) * 100);

            var ansCountEl = paletteHeader.querySelector('.ans-count');
            var ansPctEl = paletteHeader.querySelector('.ans-pct');
            if (ansCountEl) ansCountEl.textContent = String(answeredCount);
            if (ansPctEl) ansPctEl.textContent = pct + '%';

            if (counterEl) {
                counterEl.textContent = 'Answered ' + answeredCount + ' of ' + quiz.length + ' questions (' + pct + '%)';
            }

            var allAnswered = answeredCount >= quiz.length;
            if (allAnswered) {
                submitBtn.disabled = false;
                submitBtn.classList.add('ready');
                submitBtn.textContent = 'Submit All ' + quiz.length + ' Answers';
            } else {
                submitBtn.disabled = false; // keep clickable so clicking jumps to next unanswered
                submitBtn.classList.remove('ready');
                submitBtn.textContent = 'Submit Quiz (' + (quiz.length - answeredCount) + ' remaining)';
            }
        }

        // --- Build Question Cards ---
        quiz.forEach(function (question, qIndex) {
            var card = buildQuestion(question, qIndex, quiz.length);
            quizWrap.appendChild(card);

            var statusPill = card.querySelector('.quiz-status-pill');
            var optionsEl = card.querySelector('.quiz-options');
            var optionEls = optionsEl ? Array.prototype.slice.call(optionsEl.querySelectorAll('.quiz-option')) : [];

            optionEls.forEach(function (optEl, oIndex) {
                var handleSelect = function () {
                    if (submitted) return;

                    optionEls.forEach(function (el) {
                        el.classList.remove('selected');
                        el.setAttribute('aria-checked', 'false');
                    });
                    optEl.classList.add('selected');
                    optEl.setAttribute('aria-checked', 'true');

                    answers[qIndex] = oIndex;

                    card.classList.add('answered');
                    if (statusPill) {
                        statusPill.textContent = 'Answered';
                        statusPill.classList.add('status-answered');
                    }

                    if (paletteBtns[qIndex]) {
                        paletteBtns[qIndex].classList.add('palette-answered');
                    }

                    updateProgressUI();
                };

                optEl.addEventListener('click', handleSelect);
                optEl.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect();
                    }
                });
            });

            questionCards.push(card);
        });

        // --- Submit Bar ---
        var submitBar = document.createElement('div');
        submitBar.className = 'quiz-submit-bar';

        var counterEl = document.createElement('span');
        counterEl.className = 'quiz-progress';
        counterEl.textContent = 'Answered 0 of ' + quiz.length + ' questions (0%)';
        submitBar.appendChild(counterEl);

        var submitBtn = document.createElement('button');
        submitBtn.className = 'btn btn-primary quiz-submit-btn';
        submitBtn.type = 'button';
        submitBtn.textContent = 'Submit Quiz (' + quiz.length + ' remaining)';
        submitBar.appendChild(submitBtn);

        quizWrap.appendChild(submitBar);
        container.appendChild(quizWrap);
        if (window.renderMath) window.renderMath(quizWrap);

        // --- Submit Handler ---
        submitBtn.addEventListener('click', function () {
            if (submitted) return;

            var answeredCount = Object.keys(answers).length;
            if (answeredCount < quiz.length) {
                // Friendly guide to unanswered questions
                if (window.showToast) {
                    window.showToast('Please answer all questions before submitting (' + (quiz.length - answeredCount) + ' remaining).', 'warning');
                }
                jumpToNextUnanswered();
                return;
            }

            submitted = true;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Grading Answers...';

            var payload = {
                topic_id: topicId,
                answers: answers
            };

            fetch('/api/check-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('Server error (' + response.status + ')');
                    }
                    return response.json();
                })
                .then(function (data) {
                    handleResults(data || {});
                })
                .catch(function (err) {
                    submitted = false;
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit All ' + quiz.length + ' Answers';

                    var errEl = document.createElement('div');
                    errEl.className = 'quiz-error';
                    errEl.style.color = 'var(--error)';
                    errEl.style.fontSize = '0.85rem';
                    errEl.textContent = '⚠ ' + (err && err.message ? err.message : 'Network error — could not reach server.');
                    submitBar.insertBefore(errEl, submitBtn);
                    setTimeout(function () { if (errEl.parentNode) errEl.remove(); }, 6000);
                });
        });

        // --- Handle Grading Results ---
        function handleResults(data) {
            var results = data.results || {};
            var score = typeof data.score === 'number' ? data.score : 0;
            var total = typeof data.total === 'number' ? data.total : quiz.length;
            var percentage = typeof data.percentage === 'number' ? data.percentage : 0;

            jumpBtn.style.display = 'none';

            quiz.forEach(function (question, qIndex) {
                var card = questionCards[qIndex];
                if (!card) return;

                var qResult = results[String(qIndex)] || results['q' + qIndex] || {};
                var isCorrect = !!qResult.correct;
                var correctAnswer = (typeof qResult.correct_answer === 'number')
                    ? qResult.correct_answer
                    : (question && question.correct);
                var explanation = qResult.explanation || (question && question.explanation) || '';

                card.dataset.correct = isCorrect ? 'true' : 'false';

                // Update palette pill
                if (paletteBtns[qIndex]) {
                    paletteBtns[qIndex].classList.remove('palette-answered');
                    paletteBtns[qIndex].classList.add(isCorrect ? 'palette-correct' : 'palette-incorrect');
                }

                // Update question header pill
                var pill = card.querySelector('.quiz-status-pill');
                if (pill) {
                    pill.textContent = isCorrect ? '✓ Correct' : '✕ Incorrect';
                    pill.style.background = isCorrect ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 87, 87, 0.15)';
                    pill.style.color = isCorrect ? 'var(--success)' : 'var(--error)';
                }

                var optionsEl = card.querySelector('.quiz-options');
                var optionEls = optionsEl ? Array.prototype.slice.call(optionsEl.querySelectorAll('.quiz-option')) : [];

                optionEls.forEach(function (optEl, oIndex) {
                    optEl.classList.add('disabled');
                    optEl.setAttribute('tabindex', '-1');

                    var selected = answers[qIndex] === oIndex;
                    var isCorrectOption = correctAnswer === oIndex;

                    if (selected && isCorrect) {
                        optEl.classList.add('correct');
                    } else if (selected && !isCorrect) {
                        optEl.classList.add('incorrect');
                    }

                    if (isCorrectOption && !isCorrect) {
                        optEl.classList.add('show-correct');
                    }
                });

                card.classList.remove('answered');

                if (explanation) {
                    var expEl = document.createElement('div');
                    expEl.className = 'quiz-explanation';
                    expEl.innerHTML = '<strong>Explanation:</strong> <span>' + escapeHtml(explanation) + '</span>';
                    card.appendChild(expEl);
                }
            });

            // Filtering questions by result
            function filterQuestions(filterType) {
                questionCards.forEach(function (card) {
                    if (filterType === 'all') {
                        card.style.display = 'block';
                    } else if (filterType === 'correct') {
                        card.style.display = (card.dataset.correct === 'true') ? 'block' : 'none';
                    } else if (filterType === 'incorrect') {
                        card.style.display = (card.dataset.correct === 'false') ? 'block' : 'none';
                    }
                });
            }

            var resultsEl = buildResults(
                score,
                total,
                percentage,
                function retry() {
                    renderQuiz(topic, container, onComplete);
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                },
                filterQuestions
            );

            submitBar.replaceWith(resultsEl);
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (window.renderMath) window.renderMath(quizWrap);

            if (typeof onComplete === 'function') {
                try {
                    onComplete(percentage);
                } catch (e) {
                    console.error('[QuizEngine] onComplete error:', e);
                }
            }
        }
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    window.QuizEngine = {
        renderQuiz: renderQuiz
    };
})();
