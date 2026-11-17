# Changelog

## [Unreleased]

### Changed
- Browser Back and Forward navigate between the account list, selected account, and active player; removed the player × and the “เลือกบัญชี” back button. Escape remains available to close the player.

## [2.12.1] - 2026-11-18

### Changed
- Simplified the video player overlay by removing duplicate clip-navigation buttons and moving quality, autoplay, fullscreen, and clip details into a collapsible “เพิ่มเติม” panel while keeping existing actions available.

## [2.12.0] - 2026-11-17

### Added
- Added the @lxrvip1 source filter and 36 new unique video streams with verified post links and available metadata.

### Notes
- The public X Media results contained 46 video posts; 10 exact video URLs were already present and were not duplicated. Post text was not collected.

## [2.11.0] - 2026-11-17

### Added
- Added nine neutral cinematic artworks to the account cards, with optimized local WebP assets.

## [2.10.0] - 2026-11-17

### Added
- Added an account-first landing page with blank artwork cards, account video counts, and per-account favorites; existing favorites migrate into account buckets on first load.

### Fixed
- Kept video cards at their content height so thumbnails are no longer clipped in the account view.

## [2.9.1] - 2026-11-17

### Fixed
- Added the supplied thumbnail URLs to six existing duplicate-video records so their cards display covers without duplicating clips.

## [2.9.0] - 2026-11-16

### Added
- Added the @Ginan459 source filter and 849 unique video clips from the supplied CSV, including provided thumbnail URLs.

### Notes
- The CSV contains 855 account-owned rows; 6 media IDs were already represented in the catalogue and were not duplicated (4 exact URL matches and 2 alternate renditions). The CSV provides `mp4_url` but no separate high-resolution URL field, so the supplied video URLs were imported as-is; resolution varies by row.


## [2.8.0] - 2026-11-15

### Added
- Added the @thanhDO53161694 source filter and 245 new high-resolution MP4 URLs from the supplied CSV, including original posts and reposts.

### Notes
- The CSV contains 605 rows (136 original posts, 469 reposts); 360 items were already represented by a low- or high-resolution URL and were not duplicated. Captions containing gambling promotions and affiliate links were omitted. High-resolution streams may use more bandwidth and buffer on slower connections.


## [2.7.0] - 2026-11-15

### Added
- Added the @DeepakC92550200 source filter and 539 new high-resolution MP4 URLs from the supplied CSV, including both original posts and reposts.

### Notes
- The CSV contains 912 rows (192 original posts, 720 reposts); 373 items were already represented in the catalogue and were not duplicated (372 low URLs plus one high URL). Post captions were omitted because they contain gambling promotions and affiliate links. High-resolution URLs may use more bandwidth and buffer on slower connections.


## [2.5.0] - 2026-11-14

### Added
- Added the @NNNKII88 source filter and 11 account-owned clips from the supplied CSV, with post links and supplied date, duration, and view metadata.
- Added source-specific badge styling and parser support for `NK` records.

### Notes
- Post caption text was omitted because it contains gambling promotions and affiliate links; source post links are retained.


## [2.4.0] - 2026-11-14

### Added
- Added the @lietongheng source filter and imported 6 account-owned clips from the supplied package using its high-resolution video URLs and provided metadata.
- Added source-specific badge styling and parser support for `LT` records.

### Notes
- Imported only the package's 6 entries in `lietongheng_own_clips.csv`; excluded 503 reposted clips identified by the package as third-party works for private viewing only.

## [2.3.0] - 2026-11-14

### Added
- Added the @Subhash72782123 source filter and imported 654 unique video URLs from the user-provided CSV.
- Added source-specific card badge styling and parser support for `SU` records.

### Notes
- Excluded 224 CSV rows whose low-resolution media URLs already existed in the catalogue; distinct clips from the same post were retained.

## [2.2.1] - 2026-11-14

### Fixed
- Playlist now includes every item in the current result instead of stopping after the first 200.
- Added a dedicated Playlist search that matches source, date, text, post link, views, duration, or item number while retaining the original playback index.
- Kept the search control visible while the full playlist scrolls, including in the mobile drawer.

## [2.2.0] - 2026-11-14

### Added
- Added 158 unique videos from @CxllmeB64 (Rabbit Rayong), including the PDF's timestamps, durations, view counts, post links, and low-resolution MP4 URLs.
- Added @CxllmeB64 as a source filter and gave its cards a distinct badge style.

### Changed
- Catalogue duplicate validation now checks media URLs, so multiple distinct clips linked from one post are allowed.

## [2.1.0] - 2026-11-13

### Added
- Catalogue is loaded from `data/videos.txt` and validated through a repeatable script.
- Load-more pagination makes results beyond the first 300 cards accessible.
- Mobile users can open the playlist from the header.
- Node.js tests cover data parsing/filtering and Worker redirect/Range behavior.
- GitHub Actions checks syntax, tests, and catalogue validity.

### Security
- Video proxy follows redirects manually and rejects redirect targets outside `video.twimg.com`.
- Redirect count is bounded and upstream failures return a gateway error.

### Changed
- Catalogue records are normalized to a stable JavaScript schema.
- Playback controls use event listeners compatible with ES modules.

### Operational notes
- Worker deployment and production static-site publication must be verified against the actual Cloudflare and hosting account configuration.
- Configure Cloudflare rate limiting for the public Worker before broad exposure.
