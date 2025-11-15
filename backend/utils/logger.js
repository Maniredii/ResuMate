import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
// Handle both running from root and from backend directory
const cwd = process.cwd();
const logsDir = cwd.endsWith('backend') 
  ? path.join(cwd, 'logs')
  : path.join(cwd, 'backend', 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log(`Created logs directory at: ${logsDir}`);
}

// Log file paths
const errorLogPath = path.join(logsDir, 'error.log');
const apiLogPath = path.join(logsDir, 'api.log');
const automationLogPath = path.join(logsDir, 'automation.log');

/**
 * Format timestamp for log entries
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Write log entry to file
 */
function writeToFile(filePath, message) {
  try {
    const logEntry = `[${getTimestamp()}] ${message}\n`;
    fs.appendFileSync(filePath, logEntry, 'utf-8');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

/**
 * Log API errors with request details
 */
export function logApiError(error, req = null, additionalInfo = {}) {
  const errorDetails = {
    timestamp: getTimestamp(),
    type: 'API_ERROR',
    message: error.message,
    stack: error.stack,
    ...(req && {
      method: req.method,
      url: req.url,
      path: req.path,
      userId: req.user?.userId,
      ip: req.ip
    }),
    ...additionalInfo
  };

  // Console logging
  console.error('API Error:', errorDetails);

  // File logging
  writeToFile(errorLogPath, JSON.stringify(errorDetails));
  writeToFile(apiLogPath, JSON.stringify(errorDetails));
}

/**
 * Log Playwright automation failures with detailed context
 */
export function logAutomationError(error, context = {}) {
  const errorDetails = {
    timestamp: getTimestamp(),
    type: 'AUTOMATION_ERROR',
    message: error.message,
    stack: error.stack,
    platform: context.platform || 'unknown',
    jobUrl: context.jobUrl || 'N/A',
    userId: context.userId || 'N/A',
    step: context.step || 'unknown',
    ...context
  };

  // Console logging
  console.error('Automation Error:', errorDetails);

  // File logging
  writeToFile(errorLogPath, JSON.stringify(errorDetails));
  writeToFile(automationLogPath, JSON.stringify(errorDetails));
}

/**
 * Log AI service errors with provider information
 */
export function logAiError(error, provider = 'unknown', context = {}) {
  const errorDetails = {
    timestamp: getTimestamp(),
    type: 'AI_SERVICE_ERROR',
    message: error.message,
    stack: error.stack,
    provider: provider,
    model: context.model || 'N/A',
    operation: context.operation || 'unknown',
    userId: context.userId || 'N/A',
    ...context
  };

  // Console logging
  console.error(`AI Service Error [${provider}]:`, errorDetails);

  // File logging
  writeToFile(errorLogPath, JSON.stringify(errorDetails));
}

/**
 * Log general errors
 */
export function logError(error, context = {}) {
  const errorDetails = {
    timestamp: getTimestamp(),
    type: 'GENERAL_ERROR',
    message: error.message,
    stack: error.stack,
    ...context
  };

  // Console logging
  console.error('Error:', errorDetails);

  // File logging
  writeToFile(errorLogPath, JSON.stringify(errorDetails));
}

/**
 * Log info messages
 */
export function logInfo(message, context = {}) {
  const logDetails = {
    timestamp: getTimestamp(),
    type: 'INFO',
    message,
    ...context
  };

  // Console logging
  console.log('Info:', message, context);

  // File logging (optional, can be disabled for production)
  if (process.env.LOG_LEVEL === 'verbose') {
    writeToFile(apiLogPath, JSON.stringify(logDetails));
  }
}

/**
 * Log successful operations (optional)
 */
export function logSuccess(message, context = {}) {
  const logDetails = {
    timestamp: getTimestamp(),
    type: 'SUCCESS',
    message,
    ...context
  };

  // Console logging
  console.log('Success:', message, context);

  // File logging (optional)
  if (process.env.LOG_LEVEL === 'verbose') {
    writeToFile(apiLogPath, JSON.stringify(logDetails));
  }
}
