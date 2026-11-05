const levels = { INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' };

function timestamp() {
  return new Date().toISOString();
}

function log(level, message) {
  const line = `[${timestamp()}] [${level}] ${message}`;
  if (level === levels.ERROR) console.error(line);
  else if (level === levels.WARN) console.warn(line);
  else console.log(line);
}

export function info(msg) {
  log(levels.INFO, msg);
}

export function warn(msg) {
  log(levels.WARN, msg);
}

export function error(msg) {
  log(levels.ERROR, msg);
}
