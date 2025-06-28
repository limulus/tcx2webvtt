---
status: accepted
date: 2025-06-20
decision-makers: "@limulus"
---

# Add HLS Output Support with --hls Option

## Context and Problem Statement

Users need to output WebVTT files in HLS-compatible segmented format for HTTP Live Streaming, but tcx2webvtt currently only outputs single files to stdout. This prevents using the tool's output directly for HLS streaming scenarios where multiple segment files and a playlist are required.

## Decision Drivers

- Need for HLS streaming compatibility with Safari and HLS.js
- Current stdout-only output is insufficient for multi-file HLS format requirements
- Apple's `mediasubtitlesegmenter` tool (from HTTP Live Streaming Tools) fails with tcx2webvtt output due to inability to handle lines longer than ~200 characters (JSON metadata lines exceed this limit)
- Requirement for directory-based output to accommodate multiple HLS segment files
- Need for proper testing infrastructure for this functionality

## Considered Options

- Use `mediasubtitlesegmenter` as post-processing step
- Create separate HLS conversion tool in media-tools repo
- Implement custom HLS segmentation logic within tcx2webvtt

## Decision Outcome

Chosen option: "Implement custom HLS segmentation logic within tcx2webvtt", because it provides an integrated solution with proper testing infrastructure, avoids the line length limitations of `mediasubtitlesegmenter`, and feels like a natural extension of the tool's functionality.

### Consequences

- Good, because users get a complete HLS solution without needing external post-processing
- Good, because we can implement proper test coverage for the HLS functionality
- Good, because we avoid the line length limitations that prevent using Apple's segmentation tool
- Good, because the feature feels like a natural fit for tcx2webvtt's purpose
- Neutral, because this adds complexity to the tool but keeps it focused on WebVTT generation
- Bad, because we need to implement and maintain custom segmentation logic instead of using existing tools

### Confirmation

Implementation compliance will be confirmed through:
- Integration testing with HLS.js for browser compatibility verification
- Testing with Safari and other HLS-compatible browsers
- Unit tests covering segmentation logic and edge cases
- Validation that generated HLS streams work correctly with seeking and playback

## Pros and Cons of the Options

### Use `mediasubtitlesegmenter` as post-processing step

Apple's HTTP Live Streaming Tools include `mediasubtitlesegmenter` which is designed specifically for this purpose.

- Good, because it uses Apple's official HLS tooling
- Good, because it would require minimal changes to tcx2webvtt
- Bad, because it fails with tcx2webvtt output due to JSON metadata lines exceeding ~200 character limit
- Bad, because it requires users to have additional tools and processing steps

### Create separate HLS conversion tool in media-tools repo

A standalone tool could handle the conversion from tcx2webvtt output to HLS format.

- Good, because it separates concerns and keeps tcx2webvtt focused
- Good, because media-tools repo already has HLS-related scripts
- Neutral, because it would work for this specific use case
- Bad, because media-tools repo lacks testing infrastructure for this type of functionality
- Bad, because it creates an additional tool dependency for users
- Bad, because it would likely be used only for this specific case, unlike other Apple HLS tools

### Implement custom HLS segmentation logic within tcx2webvtt

Add `--hls <directory>` option to tcx2webvtt with custom segmentation.

- Good, because it provides an integrated solution for users
- Good, because we can implement proper test coverage
- Good, because we can handle the JSON metadata line length requirements
- Good, because the feature feels like a natural extension of WebVTT generation
- Neutral, because it adds complexity but keeps the tool focused on its core purpose
- Bad, because we need to implement and maintain custom segmentation logic

## More Information

The HLS implementation will need to:
- Generate 60-second WebVTT segments with proper HLS headers
- Create an `index.m3u8` playlist file
- Handle empty segments appropriately
- Work with Safari and HLS.js for broad compatibility
- Support the existing JSON metadata format without line length restrictions