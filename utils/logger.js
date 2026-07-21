const LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
const CURRENT_LEVEL = LEVELS[process.env.LOG_LEVEL || 'INFO'];

function log(level, message, meta = {}) {
  if (LEVELS[level] > CURRENT_LEVEL) return;
  const entry = {
    ts: new Date().toISOString(),
    lvl: level,
    msg: message,
    ...meta
  };
  process.nextTick(() => {
    console.log(JSON.stringify(entry));
  });
}

module.exports = {
  error: (msg, meta) => log('ERROR', msg, meta),
  warn:  (msg, meta) => log('WARN', msg, meta),
  info:  (msg, meta) => log('INFO', msg, meta),
  debug: (msg, meta) => log('DEBUG', msg, meta),
};
