/**
 * Controlled logger — debug messages are stripped in production builds.
 *
 * Usage:
 *   import logger from './logger';
 *   logger.log('...');   // only emits in dev
 *   logger.warn('...');  // always emits (non-fatal operational warnings)
 *   logger.error('...'); // always emits
 */
const isDev = import.meta.env.DEV;

const log   = isDev ? (...a) => console.log(...a)   : () => {};
const warn  = (...a) => console.warn(...a);
const error = (...a) => console.error(...a);

const logger = { log, warn, error };
export default logger;
