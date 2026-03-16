import { spawn } from 'child_process'
import log from '../../../logger'

const DEFAULT_TIMEOUT_MS = 10_000
const LOG_TRUNCATE = 200

export interface PsResult {
  stdout: string
  stderr: string
}

/**
 * Run a PowerShell script string in a child process.
 *
 * Resolves with { stdout, stderr } on exit code 0.
 * Rejects with a descriptive Error on non-zero exit, timeout, or spawn failure.
 */
export function runPS(script: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<PsResult> {
  return new Promise((resolve, reject) => {
    const preview =
      script.length > LOG_TRUNCATE ? script.slice(0, LOG_TRUNCATE) + '…' : script
    log.info(`[runPS] ${preview}`)

    const ps = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-NonInteractive',
      '-NoProfile',
      '-Command', script,
    ])

    let stdout = ''
    let stderr = ''

    ps.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    ps.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      ps.kill()
      reject(new Error(`runPS timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    ps.on('close', (code) => {
      clearTimeout(timer)
      if (timedOut) return
      log.info(`[runPS] exit ${code ?? '?'}`)
      if (code !== 0) {
        reject(
          new Error(
            `PowerShell exited with code ${code ?? '?'}: ${stderr.trim() || '(no stderr)'}`,
          ),
        )
        return
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() })
    })

    ps.on('error', (err) => {
      clearTimeout(timer)
      log.error('[runPS] spawn error', err)
      reject(err)
    })
  })
}
