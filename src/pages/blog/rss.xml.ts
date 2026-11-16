import type { APIContext } from 'astro'
import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

/** The blog feed. Replaces blog.oriz.in/rss.xml, which the zone rule redirects here. */
export async function GET(context: APIContext) {
  const posts = (await getCollection('blog'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, 40)

  return rss({
    title: 'Blog — oriz',
    description: 'Long-form writing on engineering, finance, and books — by Chirag Singhal.',
    site: context.site ?? 'https://oriz.in',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? '',
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      author: post.data.author,
      categories: [post.data.category, ...post.data.tags].filter((v): v is string => Boolean(v)),
    })),
  })
}
