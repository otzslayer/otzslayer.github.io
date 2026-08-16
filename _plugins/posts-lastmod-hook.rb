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

Jekyll::Hooks.register :site, :post_read do |site|
  # `core.quotepath=false` keeps non-ASCII filenames from being octal-escaped,
  # which would silently break the path lookup below.
  log = `git -c core.quotepath=false log --format="%x00%ad" --date=iso --name-only --diff-merges=combined HEAD -- _posts`

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

    post.data['last_modified_at'] = last_commit_dates[path]
  end
end
