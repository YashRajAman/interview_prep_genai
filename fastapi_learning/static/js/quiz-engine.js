/**
 * FastAPI Learning Platform — Quiz Engine Module
 * Renders multiple-choice questions, handles submission, grading.
 * Exposed globally as `window.QuizEngine.renderQuiz(topic, container, onComplete)`.
 */

(function () {
    'use strict';

    function indexToLetter(index) {
        return String.fromCharCode(65 + index);
    }

    function buildQuestion(question, qIndex, total) {
        var qText = (question && question.question) || '';
        var options = Array.isArray(question && question.options) ? question.options : [];

        var card = document.createElement('div');
        card.className = 'quiz-question';
        card.id = 'quiz-q-' + qIndex;
        card.dataset.question = String(qIndex);

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

        var textEl = document.createElement('div');
        textEl.className = 'quiz-question-text';
        textEl.textContent = qText;
        card.appendChild(textEl);

        options.forEach(function (opt, oIndex) {
            var optionEl = document.createElement('div');
            optionEl.className = 'quiz-option';
            optionEl.dataset.option = String(oIndex);
            optionEl.dataset.question = String(qIndex);

            var letter = document.createElement('span');
            letter.style.fontWeight = '600';
            letter.style.marginRight = '8px';
            letter.textContent = indexToLetter(oIndex) + '.';
            optionEl.appendChild(letter);

            var text = document.createElement('span');
            text.textContent = opt;
            optionEl.appendChild(text);

            optionEl.addEventListener('click', function () {
                if (card.dataset.submitted === 'true') return;
                card.querySelectorAll('.quiz-option').forEach(function (o) { o.classList.remove('selected'); });
                optionEl.classList.add('selected');
                card.dataset.selected = String(oIndex);
                statusPill.textContent = 'Answered';
                statusPill.style.color = 'var(--primary)';
            });

            card.appendChild(optionEl);
        });

        var explanation = document.createElement('div');
        explanation.className = 'quiz-explanation';
        explanation.id = 'quiz-explanation-' + qIndex;
        explanation.textContent = question.explanation || '';
        card.appendChild(explanation);

        return card;
    }

    function renderQuiz(topic, container, onComplete) {
        container.innerHTML = '';
        var quiz = topic.quiz || [];
        if (!quiz.length) {
            container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">No quiz available for this topic.</p>';
            return;
        }

        var total = quiz.length;
        var questionsContainer = document.createElement('div');
        questionsContainer.className = 'quiz-container';

        quiz.forEach(function (q, i) {
            questionsContainer.appendChild(buildQuestion(q, i, total));
        });

        var submitBtn = document.createElement('button');
        submitBtn.className = 'quiz-submit-btn';
        submitBtn.textContent = 'Submit Quiz';
        submitBtn.disabled = true;

        var scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'quiz-score-display hidden';

        questionsContainer.appendChild(submitBtn);
        questionsContainer.appendChild(scoreDisplay);
        container.appendChild(questionsContainer);

        // Enable submit when all answered
        function checkAllAnswered() {
            var answered = 0;
            questionsContainer.querySelectorAll('.quiz-question').forEach(function (card) {
                if (card.dataset.selected !== undefined) answered++;
            });
            submitBtn.disabled = answered < total;
        }

        questionsContainer.addEventListener('click', function () {
            setTimeout(checkAllAnswered, 10);
        });

        submitBtn.addEventListener('click', function () {
            var results = [];
            var correctCount = 0;

            quiz.forEach(function (q, i) {
                var card = questionsContainer.querySelector('#quiz-q-' + i);
                var selected = card.dataset.selected !== undefined ? parseInt(card.dataset.selected) : -1;
                var isCorrect = selected === q.correct;
                if (isCorrect) correctCount++;

                card.dataset.submitted = 'true';

                // Show correct/incorrect styling
                card.querySelectorAll('.quiz-option').forEach(function (opt, oIdx) {
                    opt.style.cursor = 'default';
                    if (oIdx === q.correct) {
                        opt.classList.add('correct');
                    } else if (oIdx === selected && !isCorrect) {
                        opt.classList.add('incorrect');
                    }
                });

                // Show explanation
                var exp = card.querySelector('#quiz-explanation-' + i);
                if (exp) exp.classList.add('visible');

                // Update status pill
                var pill = card.querySelector('.quiz-status-pill');
                pill.textContent = isCorrect ? '✓ Correct' : '✗ Incorrect';
                pill.style.color = isCorrect ? 'var(--success)' : 'var(--error)';

                results.push({ questionIndex: i, correct: isCorrect, selected: selected, correctAnswer: q.correct });
            });

            // Show score
            scoreDisplay.classList.remove('hidden');
            var percentage = Math.round((correctCount / total) * 100);
            scoreDisplay.innerHTML =
                '<div class="quiz-score-number">' + correctCount + '/' + total + '</div>' +
                '<div class="quiz-score-percentage">' + percentage + '%</div>' +
                '<div style="color:var(--text-muted);font-size:14px;margin-top:8px;">' +
                (percentage >= 80 ? 'Excellent work! 🎉' : percentage >= 60 ? 'Good effort! 👍' : 'Keep practicing! 📚') +
                '</div>';

            submitBtn.disabled = true;
            submitBtn.textContent = 'Quiz Submitted';

            if (onComplete) onComplete({ score: correctCount, total: total, percentage: percentage, results: results });
        });
    }

    window.QuizEngine = { renderQuiz: renderQuiz };
})();
