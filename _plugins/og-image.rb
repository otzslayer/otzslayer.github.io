#!/usr/bin/env ruby
#
# Point every post's share card (og:image) at a generated image.
#
# `tools/og-cards.mjs` renders one 1200x630 PNG per post into
# `assets/og/<post file name>.png` after the site is built. Setting `image` here
# lets jekyll-seo-tag emit og:image, twitter:image and the large twitter card
# without touching any front matter. A post that sets its own `image` keeps it.
#
# After the build the hook writes `.og-cache/posts.json`, the list the card
# script reads. `.og-cache` starts with a dot, so Jekyll neither reads nor
# publishes it.

require 'json'
require 'fileutils'

OG_CARD_DIR = '/assets/og'

# Front matter is loaded by :post_read, so the title is available here.
Jekyll::Hooks.register :site, :post_read do |site|
  site.posts.docs.each do |post|
    next if post.data['image']

    post.data['image'] = {
      'path' => "#{OG_CARD_DIR}/#{post.basename_without_ext}.png",
      'alt' => post.data['title']
    }
  end
end

Jekyll::Hooks.register :site, :post_write do |site|
  posts = site.posts.docs.map do |post|
    {
      'name' => post.basename_without_ext,
      'title' => post.data['title'].to_s,
      'url' => site.config['url'].to_s + post.url
    }
  end

  meta = {
    'title' => site.config['title'].to_s,
    'author' => site.config.dig('social', 'name').to_s,
    'avatar' => site.config['avatar'].to_s
  }

  dir = File.join(site.source, '.og-cache')
  FileUtils.mkdir_p(dir)
  File.write(File.join(dir, 'posts.json'), JSON.pretty_generate({ 'site' => meta, 'posts' => posts }))
end
