# tcx2webvtt

Convert a [TCX] workout file to [WebVTT] with JSON metadata

[tcx]: https://en.wikipedia.org/wiki/Training_Center_XML
[webvtt]: https://en.wikipedia.org/wiki/WebVTT

## Requirements

A system with [Node.js] v20 or higher.

[Node.js]: https://nodejs.org/

## Usage

Install globally, or run without installing using `npx`.

```sh
npm install -g tcx2webvtt
```

Convert a TCX workout file to WebVTT.

```sh
tcx2webvtt my-workout.tcx > my-track.vtt
```

### Using With Final Cut Pro

You can use an export of a Final Cut Pro project to extract the relevant parts of the TCX
workout file and produce a synchronized WebVTT file.

To create an export of your project, first [create a metadata view] in Final Cut Pro named
`tcx2webvtt`. Add the “Content Created” metadata field to this view. Then select “Export
XML…” from the “File” menu. Choose the `tcx2webvtt` metadata view and XML version 1.13 or
higher. (Older versions may work fine, but they are untested.)

[create a metadata view]: https://support.apple.com/guide/final-cut-pro/modify-metadata-views-ver397297af/11.1/mac/14.6

Now that you have an export, run `tcx2webvtt` with the `--fcp` option:

```sh
tcx2webvtt --fcp 'My Project Export.fcpxmld' my-workout.tcx > my-track.vtt
```

#### Best Practices for Timestamp Synchronization

For the most reliable synchronization, ensure that the "Content Created" timestamps in your Final Cut Pro project match the actual recording times of your workout clips. This creates a canonical source of timing that makes your project reproducible and easier to maintain.

If you cannot modify the source project timestamps, use the `--clip-offset` option as a fallback to correct timing discrepancies:

```sh
tcx2webvtt --fcp project.fcpxmld --clip-offset GX010163,2.5 workout.tcx
```

You can also apply the same offset to all clips using the wildcard `*`:

```sh
tcx2webvtt --fcp project.fcpxmld --clip-offset '*,-1.0' workout.tcx
```

However, fixing timestamps at the source (in Final Cut Pro) is preferred over applying corrections downstream, as it ensures consistency across all exports and eliminates the need for manual offset calculations.

### HTTP Live Streaming

For streaming applications or web players that require segmented media, use the `--hls` option to generate segmented WebVTT output:

```sh
tcx2webvtt --hls ./output-directory my-workout.tcx
```

This creates multiple `.vtt` files and an `index.m3u8` manifest file in the specified directory, each segment containing workout data for a specific time range. This format is compatible with HLS video streams.
