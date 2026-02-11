/**
 * Simple debug logging system for the frontend.
 *
 * Usage:
 *   import { logger } from './logger.js';
 *   logger.debug('This only shows in development');
 *   logger.info('Important information');
 *   logger.warn('Warning message');
 *   logger.error('Error message');
 *
 * Enable debug mode by setting localStorage.DEBUG = 'true' in the browser console,
 * or by adding ?debug=true to the URL.
 */

// Check if debug mode is enabled via localStorage or URL param
const urlParams = new URLSearchParams(window.location.search);
const DEBUG = localStorage.getItem('DEBUG') === 'true' || urlParams.get('debug') === 'true';

export const logger = {
    debug: (...args: any[]) => {
        if (DEBUG) {
            console.log('%c[DEBUG]', 'color: #6366f1; font-weight: bold', ...args);
        }
    },

    info: (...args: any[]) => {
        console.log('%c[INFO]', 'color: #10b981; font-weight: bold', ...args);
    },

    warn: (...args: any[]) => {
        console.warn('%c[WARN]', 'color: #f59e0b; font-weight: bold', ...args);
    },

    error: (...args: any[]) => {
        console.error('%c[ERROR]', 'color: #ef4444; font-weight: bold', ...args);
    },
};

// Log debug mode status on load
if (DEBUG) {
    logger.info('Debug mode enabled. Set localStorage.DEBUG = "false" to disable.');
}
