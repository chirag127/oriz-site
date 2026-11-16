/**
 * Vendors the blog content from chirag127/oriz-blog into content/blog.
 *
 * The blog used to be its own Astro site on blog.oriz.in. It now builds here as
 * the /blog route, so this script is the only link between the two repos: run it
 * to pull newer posts, and commit the result. Content is committed rather than
 * fetched at build time so a build works offline and a deploy cannot fail
 * because GitHub was slow.
 *
 *   node scripts/sync-blog.mjs            # pull and replace content/blog
 *   node scripts/sync-blog.mjs --dry-run  # report what would change
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, cpSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const REPO = 'chirag127/oriz-blog'
const BRANCH = 'main'
const DEST = 'content/blog'
const dryRun = process.argv.includes('--dry-run')

const countPosts = (dir) => {
  if (!existsSync(dir)) return 0
  let n = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) n += countPosts(full)
    else if (/\.mdx?$/.test(entry.name)) n += 1
  }
  return n
}

// Sparse clone rather than a tarball: on Windows the `tar` on PATH is GNU tar,
// which reads `C:\...` as a remote host and fails. git is already a dependency of
// every checkout here, and a blobless sparse clone fetches only the posts.
const work = join(tmpdir(), `oriz-blog-${Date.now()}`)
mkdirSync(work, { recursive: true })
const url = `https://github.com/${REPO}.git`

console.log(`↓ ${url} (sparse, ${BRANCH})`)
execFileSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--sparse', '--branch', BRANCH, url, work], {
  stdio: 'inherit',
})
execFileSync('git', ['-C', work, 'sparse-checkout', 'set', 'src/content/blog'], { stdio: 'inherit' })
const source = join(work, 'src/content/blog')
if (!existsSync(source)) {
  console.error('✗ src/content/blog not found in the clone')
  process.exit(1)
}

const before = countPosts(DEST)
const after = countPosts(source)
console.log(`  posts: ${before} → ${after}`)

if (dryRun) {
  rmSync(work, { recursive: true, force: true })
  console.log('  dry run — nothing written')
  process.exit(0)
}

rmSync(DEST, { recursive: true, force: true })
mkdirSync(DEST, { recursive: true })
cpSync(source, DEST, { recursive: true })
rmSync(work, { recursive: true, force: true })
console.log(`✓ ${DEST} replaced with ${after} posts`)
