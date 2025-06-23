/**
 * Logging utility for consistent logging throughout the app
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

// Set the minimum log level (change this in development/production)
const MIN_LOG_LEVEL = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

/**
 * Format log message with timestamp and log level
 */
const formatMessage = (level, message, data) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message: String(message),
    ...(data && { data }),
  };
  
  // Stringify for console logging
  return JSON.stringify(logEntry, null, __DEV__ ? 2 : 0);
};

/**
 * Log a debug message
 */
export const logDebug = (message, data) => {
  if (shouldLog(LOG_LEVELS.DEBUG)) {
    console.debug(formatMessage('DEBUG', message, data));
  }
};

/**
 * Log an info message
 */
export const logInfo = (message, data) => {
  if (shouldLog(LOG_LEVELS.INFO)) {
    console.log(formatMessage('INFO', message, data));
  }
};

/**
 * Log a warning message
 */
export const logWarn = (message, data) => {
  if (shouldLog(LOG_LEVELS.WARN)) {
    console.warn(formatMessage('WARN', message, data));
  }
};

/**
 * Log an error message
 */
export const logError = (message, error) => {
  if (shouldLog(LOG_LEVELS.ERROR)) {
    const errorData = error instanceof Error 
      ? { 
          message: error.message, 
          stack: error.stack,
          ...(error.response && { response: error.response }),
          ...(error.config && { config: error.config })
        }
      : error;
    
    console.error(formatMessage('ERROR', message, errorData));
  }
};

/**
 * Check if the log level should be logged
 */
const shouldLog = (level) => {
  const levels = Object.values(LOG_LEVELS);
  return levels.indexOf(level) >= levels.indexOf(MIN_LOG_LEVEL);
};

// Export log levels for external use
export { LOG_LEVELS };
