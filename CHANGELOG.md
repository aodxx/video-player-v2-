# Changelog

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
