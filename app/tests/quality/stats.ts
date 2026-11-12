// The footer's stats line comes from `siteStats` in content/profile.yml, the
// numbers of one measured run (D-039). The quality checks compare them with
// what they measure, so the footer never drifts far from the truth: more than
// `statsDrift` off, and the run fails until profile.yml is updated.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { profileSchema } from '../../shared/content/schemas'

const file = fileURLToPath(new URL('../../content/profile.yml', import.meta.url))

export const siteStats = profileSchema.parse(parse(readFileSync(file, 'utf8'))).siteStats

// Lighthouse points, or KB.
export const statsDrift = 5
