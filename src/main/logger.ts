import log from 'electron-log/main'
import { app } from 'electron'
import { join } from 'path'
import { APPDATA_DIR, APPDATA_LOGS_DIR, APPDATA_LOG_FILE } from '@shared/constants'

// resolvePathFn is called lazily on the first write — app.getPath() is safe here
log.transports.file.resolvePathFn = (): string =>
  join(app.getPath('appData'), APPDATA_DIR, APPDATA_LOGS_DIR, APPDATA_LOG_FILE)

log.transports.file.level = 'info'
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
log.transports.file.maxSize = 10 * 1024 * 1024 // 10 MB before rotation

// More verbose in console during development
log.transports.console.level = 'debug'

// Enable IPC bridge so renderer process can forward logs to the main logger
log.initialize()

export default log
