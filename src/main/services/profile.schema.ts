import { z } from 'zod'

// ─── Position ─────────────────────────────────────────────────────────────────

const positionSchema = z.enum([
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
  'left-half',
  'right-half',
  'full',
])

// ─── Shared entry base fields ─────────────────────────────────────────────────

const baseEntry = {
  id: z.string().min(1),
  position: positionSchema,
  delayMs: z.number().nonnegative(),
}

// ─── App entry schemas ────────────────────────────────────────────────────────

const ideEntrySchema = z.object({
  ...baseEntry,
  type: z.literal('ide'),
  folder: z.string().min(1),
})

const browserLocalSchema = z.object({
  ...baseEntry,
  type: z.literal('browser'),
  mode: z.literal('local'),
  port: z.number().int().min(1).max(65535),
})

const browserWebsiteSchema = z.object({
  ...baseEntry,
  type: z.literal('browser'),
  mode: z.literal('website'),
  url: z.string().url(),
})

const terminalCommandSchema = z.object({
  ...baseEntry,
  type: z.literal('terminal'),
  mode: z.literal('command'),
  workingDir: z.string().min(1),
  command: z.string().min(1),
})

const terminalScriptSchema = z.object({
  ...baseEntry,
  type: z.literal('terminal'),
  mode: z.literal('script'),
  scriptPath: z.string().min(1),
})

const genericAppEntrySchema = z.object({
  ...baseEntry,
  type: z.literal('app'),
  path: z.string().min(1),
  args: z.array(z.string()),
})

// z.union (not discriminatedUnion) because browser/terminal have inner mode discriminators
const appEntrySchema = z.union([
  ideEntrySchema,
  browserLocalSchema,
  browserWebsiteSchema,
  terminalCommandSchema,
  terminalScriptSchema,
  genericAppEntrySchema,
])

// ─── Desktop + Profile ────────────────────────────────────────────────────────

const desktopSchema = z.object({
  index: z.number().int().nonnegative(),
  name: z.string(),
  apps: z.array(appEntrySchema),
})

export const profileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
  lastLaunchedAt: z.string().datetime().optional(),
  desktops: z.array(desktopSchema),
})
