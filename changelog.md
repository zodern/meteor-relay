The changelog for the babel plugin is at [.babel-plugin/changelog.md](./.babel-plugin/changelog.md);
This is the changelog for the `zodern:relay` Meteor package.

## Next

- Breaking change: `withCursors` now returns a promise. If you use `withCursors` as documented, you do not need to do anything. This only affects apps that directly use the returned value.
- Add support for Meteor 3. Meteor 2.2 and newer is still supported
- Fix types for async methods or method pipelines so the returned value does not wrap the promise multiple times (now it is Promise<5> instead of Promise<Promise<5>>)
- Improve names of the arguments for calling a method or subscribing to a publication (for example, `input` instead of `argv_0`)
- Fix small memory leak with reactive publications
- Fix possible error for unblocked reactive publications if they are stopped before they are ready

## 1.1.1 - May 10, 2023

- Export PipelineContext type
- Fix types for Apps that do not use @types/meteor
