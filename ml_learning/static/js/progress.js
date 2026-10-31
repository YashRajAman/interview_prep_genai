/**
 * ML Odyssey — Progress Tracking Module
 * ---------------------------------------------------------------------------
 * Persists learner progress (started/completed topics, quiz results, code and
 * interactive exercises) to localStorage so progress survives page reloads.
 *
 * Exposed globally as `window.ProgressTracker`.
 * ---------------------------------------------------------------------------
 */

(function () {
    'use strict';

    /** localStorage key under which all progress data is stored. */
    var STORAGE_KEY = 'ml_odyssey_progress';

    /**
     * Build a composite key from a level id and topic id.
     * Used as the property name in the various progress maps.
     *
     * @param {string} levelId
     * @param {string} topicId
     * @returns {string} e.g. "novice:what-is-ml"
     */
    function makeKey(levelId, topicId) {
        return levelId + ':' + topicId;
    }

    /**
     * Return a fresh, empty progress data structure.
     * Used as the fallback when nothing is stored or parsing fails.
     *
     * @returns {Object}
     */
    function emptyData() {
        return {
            startedTopics: {},          // { "levelId:topicId": true, ... }
            completedTopics: {},       // { "levelId:topicId": true, ... }
            quizResults: {},            // { "levelId:topicId": { score, total, percentage, timestamp }, ... }
            codeCompleted: {},          // { "levelId:topicId": true, ... }
            interactiveCompleted: {}    // { "levelId:topicId": true, ... }
        };
    }

    /**
     * Retrieve all progress data from localStorage.
     * Returns an empty structure if storage is unavailable or the stored
     * data is corrupt / unparseable.
     *
     * @returns {Object}
     */
    function getData() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return emptyData();
            }
            var parsed = JSON.parse(raw);
            // Merge with empty data so missing keys never cause errors later.
            var base = emptyData();
            base.startedTopics = parsed.startedTopics || {};
            base.completedTopics = parsed.completedTopics || {};
            base.quizResults = parsed.quizResults || {};
            base.codeCompleted = parsed.codeCompleted || {};
            base.interactiveCompleted = parsed.interactiveCompleted || {};
            return base;
        } catch (err) {
            // localStorage unavailable (private mode, disabled, etc.) or bad JSON.
            return emptyData();
        }
    }

    /**
     * Persist all progress data to localStorage.
     *
     * @param {Object} data The full progress data structure.
     */
    function saveData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
            // Silently ignore write failures (quota exceeded, disabled, etc.).
            // Progress simply won't persist for this session.
            console.warn('ProgressTracker: unable to save progress to localStorage.', err);
        }
    }

    // -- Topic started / completed --------------------------------------------

    /**
     * Mark a topic as started (visited at least once).
     *
     * @param {string} levelId
     * @param {string} topicId
     */
    function markTopicStarted(levelId, topicId) {
        var data = getData();
        data.startedTopics[makeKey(levelId, topicId)] = true;
        saveData(data);
    }

    /**
     * Mark a topic as completed (all sections done).
     *
     * @param {string} levelId
     * @param {string} topicId
     */
    function markTopicCompleted(levelId, topicId) {
        var data = getData();
        data.completedTopics[makeKey(levelId, topicId)] = true;
        saveData(data);
    }

    /**
     * Check whether a topic has been completed.
     *
     * @param {string} levelId
     * @param {string} topicId
     * @returns {boolean}
     */
    function isTopicCompleted(levelId, topicId) {
        var data = getData();
        return !!data.completedTopics[makeKey(levelId, topicId)];
    }

    /**
     * Check whether a topic has been started (visited).
     *
     * @param {string} levelId
     * @param {string} topicId
     * @returns {boolean}
     */
    function isTopicStarted(levelId, topicId) {
        var data = getData();
        return !!data.startedTopics[makeKey(levelId, topicId)];
    }

    // -- Quiz results ---------------------------------------------------------

    /**
     * Save the quiz result for a topic.
     *
     * @param {string} levelId
     * @param {string} topicId
     * @param {number} score      Questions answered correctly.
     * @param {number} total      Total questions in the quiz.
     * @param {number} percentage Score as a percentage (0-100).
     */
    function saveQuizResult(levelId, topicId, score, total, percentage) {
        var data = getData();
        data.quizResults[makeKey(levelId, topicId)] = {
            score: score,
            total: total,
            percentage: percentage,
            timestamp: Date.now()
        };
        saveData(data);
    }

    /**
     * Get the saved quiz result for a topic, or null if none.
     *
     * @param {string} levelId
     * @param {string} topicId
     * @returns {Object|null} { score, total, percentage, timestamp }
     */
    function getQuizResult(levelId, topicId) {
        var data = getData();
        return data.quizResults[makeKey(levelId, topicId)] || null;
    }

    // -- Code exercises -------------------------------------------------------

    /**
     * Mark the code exercise for a topic as completed.
     *
     * @param {string} levelId
     * @param {string} topicId
     */
    function markCodeCompleted(levelId, topicId) {
        var data = getData();
        data.codeCompleted[makeKey(levelId, topicId)] = true;
        saveData(data);
    }

    /**
     * Check whether the code exercise for a topic has been completed.
     *
     * @param {string} levelId
     * @param {string} topicId
     * @returns {boolean}
     */
    function isCodeCompleted(levelId, topicId) {
        var data = getData();
        return !!data.codeCompleted[makeKey(levelId, topicId)];
    }

    // -- Interactive exercises ------------------------------------------------

    /**
     * Mark the interactive exercise for a topic as completed.
     *
     * @param {string} levelId
     * @param {string} topicId
     */
    function markInteractiveCompleted(levelId, topicId) {
        var data = getData();
        data.interactiveCompleted[makeKey(levelId, topicId)] = true;
        saveData(data);
    }

    /**
     * Check whether the interactive exercise for a topic has been completed.
     *
     * @param {string} levelId
     * @param {string} topicId
     * @returns {boolean}
     */
    function isInteractiveCompleted(levelId, topicId) {
        var data = getData();
        return !!data.interactiveCompleted[makeKey(levelId, topicId)];
    }

    // -- Aggregate progress ---------------------------------------------------

    /**
     * Compute progress for a single level.
     *
     * @param {string} levelId
     * @param {number} totalTopicsInLevel Total number of topics in the level.
     * @returns {Object} { completed, total, percentage }
     */
    function getLevelProgress(levelId, totalTopicsInLevel) {
        var data = getData();
        var total = totalTopicsInLevel || 0;
        var completed = 0;

        // Count completed topics whose key starts with this level id.
        var prefix = levelId + ':';
        Object.keys(data.completedTopics).forEach(function (key) {
            if (key.indexOf(prefix) === 0 && data.completedTopics[key]) {
                completed++;
            }
        });

        // Clamp completed so it never exceeds the declared total.
        if (completed > total) {
            completed = total;
        }

        var percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed: completed, total: total, percentage: percentage };
    }

    /**
     * Compute overall progress across the whole platform.
     *
     * @param {number} totalTopics Total number of topics across all levels.
     * @returns {Object} { completed, total, percentage }
     */
    function getOverallProgress(totalTopics) {
        var data = getData();
        var total = totalTopics || 0;
        var completed = Object.keys(data.completedTopics).filter(function (key) {
            return !!data.completedTopics[key];
        }).length;

        if (completed > total) {
            completed = total;
        }

        var percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed: completed, total: total, percentage: percentage };
    }

    /**
     * Build a detailed progress report for the progress page.
     *
     * @param {Array} allLevels Array of level objects, each with
     *                          `id`, `name`, and `topics` (array of
     *                          { id, title, ... }).
     * @returns {Object} { overall: { completed, total, percentage },
     *                     levels: [ { id, name, completed, total, percentage,
     *                                 topics: [ { id, title, completed, quizScore,
     *                                             codeCompleted, interactiveCompleted } ] } ] }
     */
    function getDetailedProgress(allLevels) {
        var data = getData();
        var totalCompleted = 0;
        var totalTopics = 0;
        var levelsOut = [];

        (allLevels || []).forEach(function (level) {
            var levelCompleted = 0;
            var topicsOut = [];

            (level.topics || []).forEach(function (topic) {
                var key = makeKey(level.id, topic.id);
                var completed = !!data.completedTopics[key];

                if (completed) {
                    levelCompleted++;
                }

                topicsOut.push({
                    id: topic.id,
                    title: topic.title,
                    completed: completed,
                    quizScore: data.quizResults[key] || null,
                    codeCompleted: !!data.codeCompleted[key],
                    interactiveCompleted: !!data.interactiveCompleted[key]
                });
            });

            var levelTotal = (level.topics || []).length;
            var levelPercentage = levelTotal > 0
                ? Math.round((levelCompleted / levelTotal) * 100)
                : 0;

            totalCompleted += levelCompleted;
            totalTopics += levelTotal;

            levelsOut.push({
                id: level.id,
                name: level.name,
                completed: levelCompleted,
                total: levelTotal,
                percentage: levelPercentage,
                topics: topicsOut
            });
        });

        var overallPercentage = totalTopics > 0
            ? Math.round((totalCompleted / totalTopics) * 100)
            : 0;

        return {
            overall: {
                completed: totalCompleted,
                total: totalTopics,
                percentage: overallPercentage
            },
            levels: levelsOut
        };
    }

    // -- Reset ----------------------------------------------------------------

    /**
     * Clear all stored progress data.
     */
    function resetProgress() {
        saveData(emptyData());
    }

    // -- UI helpers -----------------------------------------------------------

    /**
     * Update the mini progress bar in the navigation.
     * Sets the width of `#nav-progress-fill` and the text of `#nav-progress-text`.
     *
     * @param {number} totalTopics Total number of topics across all levels.
     */
    function updateNavProgress(totalTopics) {
        var progress = getOverallProgress(totalTopics);

        var fill = document.getElementById('nav-progress-fill');
        if (fill) {
            fill.style.width = progress.percentage + '%';
        }

        var text = document.getElementById('nav-progress-text');
        if (text) {
            text.textContent = progress.percentage + '%';
        }
    }

    // -- Flat set helper ------------------------------------------------------

    /**
     * Return a flat Set of completed topic ids across all levels.
     * The id stored is the full composite key ("levelId:topicId").
     *
     * @returns {Set<string>}
     */
    function getCompletedTopicIds() {
        var data = getData();
        var set = new Set();
        Object.keys(data.completedTopics).forEach(function (key) {
            if (data.completedTopics[key]) {
                set.add(key);
            }
        });
        return set;
    }

    // -- Public API -----------------------------------------------------------

    window.ProgressTracker = {
        STORAGE_KEY: STORAGE_KEY,

        getData: getData,
        saveData: saveData,

        markTopicStarted: markTopicStarted,
        markTopicCompleted: markTopicCompleted,
        isTopicCompleted: isTopicCompleted,
        isTopicStarted: isTopicStarted,

        saveQuizResult: saveQuizResult,
        getQuizResult: getQuizResult,

        markCodeCompleted: markCodeCompleted,
        isCodeCompleted: isCodeCompleted,

        markInteractiveCompleted: markInteractiveCompleted,
        isInteractiveCompleted: isInteractiveCompleted,

        getLevelProgress: getLevelProgress,
        getOverallProgress: getOverallProgress,
        getDetailedProgress: getDetailedProgress,

        resetProgress: resetProgress,
        updateNavProgress: updateNavProgress,
        getCompletedTopicIds: getCompletedTopicIds
    };
})();
