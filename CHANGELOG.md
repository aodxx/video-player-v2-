# Changelog

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
