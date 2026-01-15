/**
 * Configurable Logger Module
 * Creates loggers that write to both console and specified log files
 * with timestamps and log level prefixes.
 *
 * Usage:
 *   const { createLogger } = require('./modules/logger');
 *   const logger = createLogger('/path/to/your/logfile.log');
 *   logger.log('This is an info message');
 *   logger.warning('This is a warning message');
 *   logger.error('This is an error message');
 */

const fs = require('fs');
const path = require('path');

/**
 * Create a logger instance that writes to the specified file
 * @param {string} logFilePath - Absolute or relative path to the log file
 * @returns {object} Logger object with log, warning, and error methods
 */
function createLogger(logFilePath) {
    // Resolve the path (handle relative paths)
    const resolvedPath = path.isAbsolute(logFilePath)
        ? logFilePath
        : path.resolve(process.cwd(), logFilePath);

    // Ensure the directory exists
    const logDir = path.dirname(resolvedPath);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // Ensure the log file exists
    if (!fs.existsSync(resolvedPath)) {
        fs.writeFileSync(resolvedPath, '', 'utf8');
    }

    /**
     * Write a message to both console and log file
     * @param {string} message - The message to log
     * @param {string} level - Log level (INFO, WARNING, ERROR)
     * @param {function} consoleFn - Console function to use (log, warn, error)
     */
    function writeLog(message, level, consoleFn) {
        const timestamp = new Date().toISOString();
        const prefix = level ? `${level}: ` : '';
        const logMessage = `[${timestamp}] ${prefix}${message}`;

        // Write to console
        consoleFn(message);

        // Write to log file
        try {
            fs.appendFileSync(resolvedPath, logMessage + '\n', 'utf8');
        } catch (error) {
            console.error(`Failed to write to log file (${resolvedPath}):`, error.message);
        }
    }

    return {
        /**
         * Log an info message
         * @param {string} message - The message to log
         */
        log: function(message) {
            writeLog(message, '', console.log);
        },

        /**
         * Log a warning message
         * @param {string} message - The warning message to log
         */
        warning: function(message) {
            writeLog(message, 'WARNING', console.warn);
        },

        /**
         * Log an error message
         * @param {string} message - The error message to log
         */
        error: function(message) {
            writeLog(message, 'ERROR', console.error);
        },

        /**
         * Get the path to the log file
         * @returns {string} The resolved log file path
         */
        getLogFilePath: function() {
            return resolvedPath;
        }
    };
}

module.exports = { createLogger };
