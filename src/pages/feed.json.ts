import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'

/** /feed.json — JSON Feed 1.1, the format blog.oriz.in served at this path. */
export async function GET(context: APIContext): Promise<Response> {
  const posts = (await getCollection('blog'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, 40)

  const base = (context.site ?? new URL('https://oriz.in')).toString().replace(/\/$/, '')

  const body = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Blog — oriz',
    home_page_url: `${base}/blog/`,
    feed_url: `${base}/feed.json`,
    description: 'Long-form writing on engineering, finance, and books.',
    authors: [{ name: 'Chirag Singhal' }],
    items: posts.map((post) => ({
      id: `${base}/blog/${post.id}/`,
      url: `${base}/blog/${post.id}/`,
      title: post.data.title,
      summary: post.data.description ?? '',
      date_published: post.data.pubDate.toISOString(),
      tags: post.data.tags,
    })),
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'content-type': 'application/feed+json; charset=utf-8' },
  })
}
