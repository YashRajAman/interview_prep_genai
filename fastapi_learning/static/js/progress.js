/**
 * FastAPI Learning Platform — Progress Tracking Module
 * Handles localStorage-based progress tracking for topics and quizzes.
 * Exposed globally as `window.ProgressTracker`.
 */

(function () {
    'use strict';

    var STORAGE_KEY = 'fastapi_learning_progress';
    var THEME_KEY = 'fastapi_learning_theme';

    function load() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : { completedTopics: [], quizScores: {}, visitedTopics: [] };
        } catch (e) {
            return { completedTopics: [], quizScores: {}, visitedTopics: [] };
        }
    }

    function save(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            // Storage might be full or unavailable
        }
    }

    var ProgressTracker = {
        data: load(),

        markVisited: function (topicId) {
            if (this.data.visitedTopics.indexOf(topicId) === -1) {
                this.data.visitedTopics.push(topicId);
                save(this.data);
            }
        },

        markCompleted: function (topicId) {
            if (this.data.completedTopics.indexOf(topicId) === -1) {
                this.data.completedTopics.push(topicId);
                save(this.data);
            }
        },

        unmarkCompleted: function (topicId) {
            var idx = this.data.completedTopics.indexOf(topicId);
            if (idx !== -1) {
                this.data.completedTopics.splice(idx, 1);
                save(this.data);
            }
        },

        isCompleted: function (topicId) {
            return this.data.completedTopics.indexOf(topicId) !== -1;
        },

        isVisited: function (topicId) {
            return this.data.visitedTopics.indexOf(topicId) !== -1;
        },

        saveQuizScore: function (topicId, score, total) {
            var existing = this.data.quizScores[topicId] || {};
            if (!existing.best || score > existing.best) {
                this.data.quizScores[topicId] = { best: score, total: total, percentage: Math.round((score / total) * 100) };
                save(this.data);
            }
        },

        getQuizScore: function (topicId) {
            return this.data.quizScores[topicId] || null;
        },

        getOverallProgress: function (totalTopics) {
            var completed = this.data.completedTopics.length;
            return totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;
        },

        getCompletedCount: function () {
            return this.data.completedTopics.length;
        },

        getVisitedCount: function () {
            return this.data.visitedTopics.length;
        },

        reset: function () {
            this.data = { completedTopics: [], quizScores: {}, visitedTopics: [] };
            save(this.data);
        },

        getTheme: function () {
            return localStorage.getItem(THEME_KEY) || 'dark';
        },

        setTheme: function (theme) {
            localStorage.setItem(THEME_KEY, theme);
            document.documentElement.setAttribute('data-theme', theme);
        }
    };

    window.ProgressTracker = ProgressTracker;
})();
