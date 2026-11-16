import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'

/**
 * /atom.xml — Atom 1.0, the format blog.oriz.in served at this path before the
 * move. @astrojs/rss is RSS-only, so this is written by hand against RFC 4287.
 */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export async function GET(context: APIContext): Promise<Response> {
  const posts = (await getCollection('blog'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, 40)

  const base = (context.site ?? new URL('https://oriz.in')).toString().replace(/\/$/, '')
  const updated = (posts[0]?.data.updatedDate ?? posts[0]?.data.pubDate ?? new Date()).toISOString()

  const entries = posts
    .map((post) => {
      const link = `${base}/blog/${post.id}/`
      return `  <entry>
    <title>${esc(post.data.title)}</title>
    <link href="${esc(link)}"/>
    <id>${esc(link)}</id>
    <published>${post.data.pubDate.toISOString()}</published>
    <updated>${(post.data.updatedDate ?? post.data.pubDate).toISOString()}</updated>
    ${post.data.description ? `<summary>${esc(post.data.description)}</summary>` : ''}
    ${post.data.tags.map((t) => `<category term="${esc(t)}"/>`).join('\n    ')}
  </entry>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Blog — oriz</title>
  <subtitle>Long-form writing on engineering, finance, and books.</subtitle>
  <link href="${base}/atom.xml" rel="self"/>
  <link href="${base}/blog/"/>
  <id>${base}/blog/</id>
  <updated>${updated}</updated>
  <author><name>Chirag Singhal</name></author>
${entries}
</feed>`

  return new Response(xml, { headers: { 'content-type': 'application/atom+xml; charset=utf-8' } })
}
