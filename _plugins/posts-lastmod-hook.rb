#!/usr/bin/env ruby
#
# Check for changed posts
#
# Collect every post's commit count and last commit date with a single `git log`
# call instead of spawning two git processes per post.
#
# `--diff-merges=combined` makes merge commits report only the files that differ
# from all parents, which matches the history simplification that per-file
# `git log <path>` applies. Without it, conflict-resolving merges are missed and
# fast-forward-style merges are counted twice.
#
# Commits whose message contains `[skip lastmod]` are ignored, so bulk edits that
# readers should not see as updates (e.g. markup cleanup) keep the "Updated" date.
#
# Commits authored before LASTMOD_SINCE are not treated as updates either. No post
# had a real content update before that date, but bulk commits (front matter
# changes, the 2026 redesign) touched almost every post. The author date is used
# because it survives rebases.

require 'time'

LASTMOD_SINCE = Time.new(2026, 11, 28, 0, 0, 0, '+09:00')

Jekyll::Hooks.register :site, :post_read do |site|
  # `core.quotepath=false` keeps non-ASCII filenames from being octal-escaped,
  # which would silently break the path lookup below.
  log = `git -c core.quotepath=false log --format="%x00%ad" --date=iso --name-only --diff-merges=combined --invert-grep --fixed-strings --grep="[skip lastmod]" HEAD -- _posts`

  commit_counts = Hash.new(0)
  last_commit_dates = {}

  log.split("\0").each do |commit|
    lines = commit.split("\n")
    date = lines.shift
    next if date.nil? || date.strip.empty?

    lines.each do |path|
      path = path.strip
      next if path.empty?

      commit_counts[path] += 1
      # `git log` is reverse chronological, so the first hit is the latest commit.
      last_commit_dates[path] ||= date
    end
  end

  site.posts.docs.each do |post|
    path = post.relative_path
    next unless commit_counts[path] > 1
    next if Time.parse(last_commit_dates[path]) < LASTMOD_SINCE

    post.data['last_modified_at'] = last_commit_dates[path]
  end
end
