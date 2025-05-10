# tcx2webvtt Todo List

The end goal for this project is for a CLI utility that takes a TCX (Garmin Training Center)
XML file containing sensor/location data from a workout and generate a WebVTT file with the
same data as JSON metadata. Optional arguments can be specified (for example, a Final Cut
Pro XML export) to omit parts of the output and ensure synchronization with an edited video.

## Todos

- [x] Set up vitest browser testing that will enable testing of WebVTT output
- [x] Class to generate WebVTT file from array of `Sample`s
- [] Create a CLI Node.js executable that takes the XML file as an argument and outputs
  WebVTT.
- [] Parse timecode data from a Final Cut Pro XML export
- [] Create a class that uses the timecode info from the FCP XML and creates a list of
  datetime intervals that the video project includes
- [] Create a function or class that uses the time interval series to filter array of
  `Sample`s
- [] Add options to CLI to take Final Cut Pro XML export file and an initial datetime to
  sync timecode
- [] Create a JSON schema that WebVTT metadata will conform to, for consumers of WebVTT
  tracks to validate against and get TS types
