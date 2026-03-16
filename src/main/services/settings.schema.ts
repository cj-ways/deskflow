import { z } from 'zod'

export const settingsSchema = z.object({
  idePath: z.string(),
  browserPath: z.string(),
  terminalPath: z.string(),
  startWithWindows: z.boolean(),
  minimizeToTray: z.boolean(),
  globalLaunchDelayMs: z.number().nonnegative(),
  theme: z.enum(['system', 'light', 'dark']),
})
