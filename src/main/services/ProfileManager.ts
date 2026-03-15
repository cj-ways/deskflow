import { app } from 'electron'
import { join } from 'path'
import { mkdir, readFile, writeFile, unlink, readdir } from 'fs/promises'
import { randomUUID } from 'crypto'
import log from '../logger'
import { APPDATA_DIR, APPDATA_PROFILES_DIR } from '@shared/constants'
import { profileSchema } from './profile.schema'
import type { Profile } from '@shared/types'

// ─── Path helpers ─────────────────────────────────────────────────────────────

function profilesDir(): string {
  return join(app.getPath('appData'), APPDATA_DIR, APPDATA_PROFILES_DIR)
}

function profilePath(id: string): string {
  return join(profilesDir(), `${id}.json`)
}

async function ensureDir(): Promise<void> {
  await mkdir(profilesDir(), { recursive: true })
}

// ─── ProfileManager ───────────────────────────────────────────────────────────

export const ProfileManager = {
  async getAll(): Promise<Profile[]> {
    await ensureDir()

    let files: string[]
    try {
      files = await readdir(profilesDir())
    } catch (err) {
      log.error('ProfileManager.getAll: failed to read profiles directory', err)
      return []
    }

    const profiles: Profile[] = []
    for (const file of files.filter((f) => f.endsWith('.json'))) {
      try {
        const raw = await readFile(join(profilesDir(), file), 'utf-8')
        const result = profileSchema.safeParse(JSON.parse(raw))
        if (result.success) {
          profiles.push(result.data as Profile)
        } else {
          log.warn(`ProfileManager.getAll: skipping invalid profile file "${file}"`, result.error.flatten())
        }
      } catch (err) {
        log.warn(`ProfileManager.getAll: skipping unreadable file "${file}"`, err)
      }
    }

    return profiles
  },

  async getById(id: string): Promise<Profile | null> {
    try {
      const raw = await readFile(profilePath(id), 'utf-8')
      const result = profileSchema.safeParse(JSON.parse(raw))
      if (result.success) return result.data as Profile
      log.warn(`ProfileManager.getById: profile "${id}" failed validation`, result.error.flatten())
      return null
    } catch {
      return null
    }
  },

  async save(profile: Profile): Promise<void> {
    await ensureDir()
    // Validate before writing — throws ZodError if invalid
    const validated = profileSchema.parse(profile)
    await writeFile(profilePath(validated.id), JSON.stringify(validated, null, 2), 'utf-8')
    log.info(`ProfileManager.save: saved "${validated.name}" (${validated.id})`)
  },

  async delete(id: string): Promise<void> {
    try {
      await unlink(profilePath(id))
      log.info(`ProfileManager.delete: deleted profile ${id}`)
    } catch (err) {
      log.warn(`ProfileManager.delete: profile "${id}" not found or already deleted`, err)
    }
  },

  async duplicate(id: string): Promise<Profile> {
    const original = await ProfileManager.getById(id)
    if (!original) {
      throw new Error(`ProfileManager.duplicate: profile "${id}" not found`)
    }

    const copy: Profile = {
      ...structuredClone(original),
      id: randomUUID(),
      name: `${original.name} (copy)`,
      createdAt: new Date().toISOString(),
      lastLaunchedAt: undefined,
    }

    await ProfileManager.save(copy)
    log.info(`ProfileManager.duplicate: created "${copy.name}" (${copy.id}) from "${original.name}"`)
    return copy
  },
}
