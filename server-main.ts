import type * as z from "zod";
import type { Subscription } from 'meteor/meteor';
import type { Mongo } from 'meteor/mongo';
import type { CreateMethodPipeline, CreatePubPipeline, SubscriptionCallbacks } from './types'

const Subscribe = Symbol('zodern:relay:subscribe');

function isThenable(possiblePromise: any): possiblePromise is Promise<any> {
  return possiblePromise && typeof possiblePromise.then === 'function';
}

export function createMethod <S extends z.ZodTypeAny, T > (
  config: { name: string, schema: S, rateLimit ?: { interval: number, limit: number }, run: (this: Meteor.MethodThisType, args: z.output<S>) => T }
): (...args: S extends z.ZodUndefined ? [] : [z.input<S>]) => Promise<T>
export function createMethod <S extends z.ZodTypeAny>(
  config: { name: string, schema: S, rateLimit ?: { interval: number, limit: number } }
) : { pipeline: CreateMethodPipeline<z.output<S>> }
export function createMethod<S extends z.ZodUndefined | z.ZodTypeAny, T>(config: {
  name: string;
  schema: S,
  rateLimit?: {
    interval: number,
    limit: number
  },
  run?: ((this: Meteor.MethodThisType, args: z.output<S>) => T)
}): any {
  let pipeline: any = [];

  if (typeof config.run === 'function') {
    pipeline = [config.run];
  }

  Meteor.methods({
    [config.name](data) {
      if (pipeline.length === 0) {
        throw new Error(`Pipeline or run function for ${config.name} never configured`);
      }

      let parsed: z.output<S> = config.schema.parse(data);
      let self = this;

      async function run() {
        let input: any = parsed;

        for (const func of pipeline) {
          input = func.call(self, input);
          if (isThenable(input)) {
            input = await input;
          }
        }

        return input;
      }

      let result = run();
      return (Promise as any).await(result);
    }
  });

  if (config.rateLimit) {
    DDPRateLimiter.addRule({
      type: 'method',
      name: config.name,
      clientAddress() { return true },
      connectionId() { return true },
      userId() { return true },
    }, config.rateLimit.limit, config.rateLimit.interval);
  }

  function call(args?: z.input<S>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      Meteor.call(config.name, args, (err: null | Meteor.Error, result: T) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  call.config = config;

  if (config.run) {
    return call;
  }

  return {
    pipeline(..._pipeline: any[]) {
      pipeline = _pipeline;
      return call;
    }
  };
}

export function createPublication<S extends z.ZodTypeAny, T>(config: { name: string | null, schema: S, rateLimit?: { interval: number, limit: number }, run: (this: Subscription, args: z.output<S>) => T }): (...args: z.output<S> extends undefined ? [SubscriptionCallbacks?] : [z.output<S>, SubscriptionCallbacks?]) => Meteor.SubscriptionHandle
export function createPublication<S extends z.ZodTypeAny, R1,> (config: { name: string | null, schema: S, rateLimit ?: { interval: number, limit: number } }): { pipeline: CreatePubPipeline<z.output<S>> }
export function createPublication<S extends z.ZodTypeAny, T>(
  config: { name: string | null, schema: S, rateLimit?: { interval: number, limit: number }, run?: ((this: Subscription, args: z.output<S>) => T) }
): any {
  let pipeline: any = config.run;

  if (typeof config.run === 'function') {
    pipeline = [config.run];
  }

  Meteor.publish(config.name, function (data: z.input<S>) {
    if (pipeline.length === 0) {
      throw new Error(`Pipeline or run function never configured for ${config.name} publication`);
    }

    let self = this;
    let parsed: z.output<S> = config.schema.parse(data);
    let stopPipelineSubscriptions: (() => void)[] = [];
    let handles: Meteor.LiveQueryHandle[] = [];

    let publishedData: {
      [key: string]: Map<string, any>
    } = {};
    function publishCursors(cursors: Mongo.Cursor<any>[]) {
      handles.forEach(handle => handle.stop());

      // Make sure no more than one per collection
      let colls = new Set();
      cursors.forEach(cursor => {
        let coll = (cursor as any)._cursorDescription.collectionName;
        if (colls.has(coll)) {
          throw new Error(`Publishing more than one cursor for the collection: ${coll}`);
        }

        colls.add(coll);
      });

      let previouslyPublished = publishedData;
      publishedData = {};
      // TODO: check if the cursors changed. If a cursor is the same, we could
      // reuse the old handle
      cursors.forEach(cursor => {
        let coll = (cursor as any)._cursorDescription.collectionName;

        let previousData = previouslyPublished[coll] || new Map();
        let data = publishedData[coll] = new Map();

        let handle = cursor.observeChanges({
          added(id, fields) {
            if (previousData.has(id)) {
              // Some fields might no longer be part of the new cursor
              // Set all old fields to undefined, and then override any
              // that still exist with the new value
              // Fields that are still undefined will be removed by Meteor
              let prevFields = Object.keys(previousData.get(id))
                .reduce<{[key: string]: undefined}>((result, field) => {
                  result[field] = undefined;
                  return result;
                }, {});
              self.changed(coll, id, Object.assign(prevFields, fields));
              previousData.delete(id);
              return;
            }

            self.added(coll, id, fields);
            data.set(id, fields);
          },
          changed(id, fields) {
            self.changed(coll, id, fields);
            let oldFields = data.get(id);
            // TODO: do we need to clone oldFields?
            data.set(id, Object.assign({}, oldFields, fields));
          },
          removed(id) {
            self.removed(coll, id);
            data.delete(id);
          }
        });

        // Remove docs that are no longer found by the new cursor
        for(const id of previousData.keys()) {
          self.removed(coll, id);
        }

        handles.push(handle);
      });

      // TODO: remove docs for collections that are no longer being published
    }

    let scheduled = false;
    function scheduleRun() {
      if (scheduled) {
        return;
      }

      Meteor.defer(() => {
        scheduled = false;
        run();
      });
    }

    let dirty: boolean[] = [true];
    // TODO: do we need to store inputs?
    let inputs: any[] = [parsed];
    let needsRun = false;
    let isRunning = false;
    let subStopped = false;

    this.onStop(() => {
      subStopped = true;

      // If the pipeline is running, let it finish first
      if (!isRunning) {
        stop();
      }
    });

    function stop() {
      stopPipelineSubscriptions.forEach((func) => func && func());
      handles.forEach(handle => handle.stop());
    }

    async function run() {
      if (isRunning) {
        console.log('zodern:relay Tried to run pipeline while it is already running??');
        return;
      }
      isRunning = true;
      let start = dirty.findIndex(d => d);
      if (start === -1) {
        // TODO: remove this log after checking this doesn't happen more often than it should
        console.log('zodern:relay Tried to run pipeline when no steps are dirty??');
        return;
      }
      for (let index = start; index < pipeline.length; index++) {
        const func = pipeline[index];

        let stopPrevious = stopPipelineSubscriptions[index];
        if (stopPrevious) stopPrevious();

        let result = func.call(self, inputs[index]);
        if (isThenable(result)) {
          result = await result;
        }

        inputs[index + 1] = result;
        dirty[index] = false;

        if (result && result[Subscribe]) {
          let stopSubscription = result[Subscribe]((newResult: any) => {
            inputs[index + 1] = newResult;
            dirty[index + 1] = true;

            if (isRunning) {
              needsRun = true;
            } else {
              scheduleRun();
            }
          });

          stopPipelineSubscriptions[index] = stopSubscription;
        }
      }

      isRunning = false;

      if (subStopped) {
        stop();

        return;
      }

      if (needsRun) {
        needsRun = false;
        scheduleRun();
      }

      if (stopPipelineSubscriptions.length > 0) {
        // The pipeline is reactive
        // We have to handle publishing cursors ourselves

        let output = inputs[pipeline.length];

        // Meteor checks for _publishedCursor to identify cursors
        if (output && !Array.isArray(output) && output._publishCursor) {
          publishCursors([output]);
        } else if (Array.isArray(output) && output.every(c => c._publishCursor)) {
          publishCursors(inputs[pipeline.length]);
        }
      } else {
        return inputs[pipeline.length];
      }
    }

    return (Promise as any).await(run());
  });

  if (config.rateLimit) {
    if (config.name === null) {
      throw new Error('Cannot add rate limit for null publication');
    }

    DDPRateLimiter.addRule({
      type: 'subscription',
      name: config.name,
      clientAddress() { return true },
      connectionId() { return true },
      userId() { return true },
    }, config.rateLimit.limit, config.rateLimit.interval)
  }

  function subscribe(...args: S extends z.ZodUndefined ? [SubscriptionCallbacks?] : [z.input<S>, SubscriptionCallbacks?]): Meteor.SubscriptionHandle {
    if (config.name === null) {
      throw new Error('Cannot directly subscribe to null publication');
    }
    return Meteor.subscribe(config.name, args);
  }

  subscribe.config = config;

  if (config.run) {
    return subscribe;
  }

  return {
    pipeline(..._pipeline: any[]) {
      pipeline = _pipeline;
      return subscribe;
    }
  };
}

export function withCursors<I extends object, T extends Record<string, Mongo.Cursor<any>>> (input: I, cursors: T):
  I & { [K in keyof T]: T[K] extends Mongo.Cursor<infer X> ? X[] : never }
{
  let hasUpdate = false;
  let updateInput = () => { hasUpdate = true };
  let handles: Meteor.LiveQueryHandle[] = [];
  let docs: {
    [K in keyof T]: T[K] extends Mongo.Cursor<infer X> ? X[] : never
  } = Object.entries(cursors).reduce((result: any, [name, cursor]) => {
    result[name] = [];
    let initialAdd = true;

    let handle = cursor.observe({  
      addedAt(document, index) {
        result[name].splice(index, 0, document);
        if (!initialAdd) {
          updateInput();
        }
      },
      changedAt(doc, _old, index) {
        result[name][index] = doc;
        updateInput();
      },
      removedAt(_doc, index) {
        result[name].splice(index, 1);
        updateInput();
      },
      movedTo(_doc, fromIndex, toIndex) {
        let [doc] = result[name].splice(fromIndex, 1);
        // toIndex already accounted for removing the doc at fromIndex
        // could change the toIndex
        result[name].splice(toIndex, 0, doc);
        updateInput();
      }
    });
    
    initialAdd = false;
    handles.push(handle);

    return result;
  }, {});

  function createOutput() {
    return Object.assign({}, input, docs);
  }

  let initialOutput = createOutput();
  (initialOutput as any)[Subscribe] = function (_updateInput: (data: any) => void) {
    updateInput = () => _updateInput(createOutput());
    if (hasUpdate) {
      updateInput();
      hasUpdate = false;
    }

    return function stop() {
      handles.forEach(handle => handle.stop());
    }
  }

  return initialOutput;
}
