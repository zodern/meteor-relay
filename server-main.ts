import type * as z from "zod";
import type { Subscription } from 'meteor/meteor';
import type { CreateMethod, CreatePublication, SubscriptionCallbacks } from './types'

function isThenable(possiblePromise: any): possiblePromise is Promise<any> {
  return possiblePromise && typeof possiblePromise.then === 'function';
}

export const createMethod: CreateMethod = function createMethod<S extends z.ZodUndefined | z.ZodTypeAny, T>(config: {
  name: string;
  schema: S,
  rateLimit?: {
    interval: number,
    limit: number
  },
  run: ((args: any, context: any) => any)[] | ((this: Meteor.MethodThisType, args: z.output<S>) => T)
}) {
  let pipeline: any = config.run;

  if (typeof config.run === 'function') {
    pipeline = [config.run];
  }

  Meteor.methods({
    [config.name](data) {
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

  return call;
}

interface SubscriptionCallbacks {
  onStop?: (err?: any) => void,
  onReady?: () => void
}

export function createPublication<S extends z.ZodTypeAny, T>(config: {
  name: string | null;
  schema: S,
  rateLimit?: {
    interval: number,
    limit: number
  },
  run: (this: Subscription, args: z.output<S>) => T
}) {

  Meteor.publish(config.name, function (data: z.input<S>) {
    let parsed: z.output<S> = config.schema.parse(data);
    let result: T = config.run.call(this, parsed);

    if (isThenable(result)) {
      return (Promise as any).await(result);
    } else {
      return result;
    }
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

  function subscribe(...args: S extends z.ZodUndefined ? [SubscriptionCallbacks?] : [z.input<S>, SubscriptionCallbacks?]): Meteor.SubscriptionHandle
  function subscribe(args?: z.input<S> | SubscriptionCallbacks, callbacks?: SubscriptionCallbacks) {
    if (config.name === null) {
      throw new Error('Cannot directly subscribe to null publication');
    }
    return Meteor.subscribe(config.name, args);
  }

  subscribe.config = config;

  return subscribe;
}
