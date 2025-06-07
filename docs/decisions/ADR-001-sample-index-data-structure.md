---
status: accepted
date: 2025-06-02
decision-makers: @limulus
---

# Sample Index Data Structure for Timeline Synchronization

## Context and Problem Statement

The tcx2webvtt tool needs to synchronize TCX workout data with video editor timeline exports from Final Cut Pro. The challenge is to efficiently map timestamped workout samples to video clips, where:

- Multiple TCX files may be involved (different clips from different workouts)
- Clips may span multiple workouts
- Workouts may overlap (e.g., multiple devices recording the same activity)
- Samples need to be extracted in sequential order for WebVTT output
- Only samples that correspond to actual video time should be included

How should we structure the sample data to enable efficient range queries and sequential output generation?

## Decision Drivers

- **Efficient range queries**: Need to quickly find all samples within a time range
- **Sequential access**: Must iterate through samples in chronological order for WebVTT generation
- **Multiple source handling**: Support samples from multiple TCX files with potential overlaps
- **Merge capability**: Handle conflicts when multiple workouts provide the same metric at the same time
- **Simplicity**: Keep the implementation straightforward and maintainable

## Considered Options

- **Heap-based structure**: Store all samples in a min-heap sorted by timestamp
- **Sorted array with binary search**: Maintain a sorted array of samples with binary search for range queries
- **Time-indexed map**: Use a Map keyed by timestamp with grouped samples

## Decision Outcome

Chosen option: "Sorted array with binary search", because it provides the best balance of query performance and implementation simplicity for our use case.

### Consequences

- Good, because binary search enables O(log n) lookup for range boundaries
- Good, because sorted arrays provide efficient sequential iteration
- Good, because the structure is simple to understand and maintain
- Bad, because insertions require re-sorting (but this happens only during initial load)

## Pros and Cons of the Options

### Heap-based structure

A min-heap that maintains samples in priority order by timestamp.

- Good, because efficient for extracting minimum element
- Bad, because cannot efficiently query ranges without extracting all elements
- Bad, because no support for random access to find samples at specific times
- Bad, because would require extracting and re-inserting elements for iteration

### Sorted array with binary search

Maintain all samples in a sorted array and use binary search for range queries.

```typescript
class SampleIndex {
  private samples: IndexedSample[] = []
  private sortedTimestamps: number[] = []

  addWorkout(filename: string, samples: Sample[], ignoredMetrics?: Set<SampleMetric>) {
    // Add samples and maintain sorted order
  }

  getSamplesInRange(start: Date, end: Date): Sample[] {
    // Binary search to find range boundaries
  }
}
```

- Good, because O(log n) time complexity for finding range boundaries
- Good, because simple sequential iteration through ranges
- Good, because memory-efficient (just arrays)
- Neutral, because requires sorting after bulk insertions
- Bad, because O(n) insertion time if adding samples incrementally (not an issue for our batch loading)

### Time-indexed map

Use a Map structure keyed by timestamp milliseconds with arrays of samples.

```typescript
private samplesByTime: Map<number, Map<SampleMetric, Sample[]>> = new Map()
```

- Good, because O(1) lookup for exact timestamps
- Good, because natural grouping of samples at the same time
- Bad, because requires additional index for sorted iteration
- Bad, because more complex data structure to maintain
- Bad, because higher memory overhead

## More Information

The implementation will include:

1. **Conflict Resolution**: When multiple workouts provide the same metric at the same timestamp, the tool will support:

   - Ignoring specific metrics from certain files via CLI options
   - Merging samples with appropriate conflict resolution

2. **Sample Structure**: The existing Sample class structure (one metric per Sample object) will be preserved:

   ```typescript
   export class Sample<T extends SampleMetric = SampleMetric> {
     constructor(
       public readonly time: Date,
       public readonly metric: T,
       public readonly value: SampleValue<T>
     ) {}
   }
   ```

3. **CLI Interface**: Support for specifying ignored metrics per file:
   ```bash
   tcx2webvtt --fcp project.fcpxmld \
     workout1.tcx \
     workout2.tcx:ignore=heartRate,cadence \
     workout3.tcx:ignore=location
   ```

This design prioritizes query performance and simplicity, which aligns with the tool's primary use case of sequentially processing video timeline clips and extracting corresponding workout samples.
