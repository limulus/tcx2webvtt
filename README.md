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
