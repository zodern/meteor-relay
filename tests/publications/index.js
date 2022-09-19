import { createPublication, withCursors, partialPipeline } from 'meteor/zodern:relay';
import { recordEvent, resetEvents } from '../methods/index';
const { z } = require('zod');

export const subscribeBasic = createPublication({
  name: 'basic',
  schema: z.any(),
  run() {
    return []
  }
});


export const subscribeError = createPublication({
  name: 'error',
  schema: z.any(),
  run() {
    throw new Meteor.Error('pub err');
  }
});

export const subscribeRateLimited = createPublication({
  name: 'rateLimited',
  schema: z.any(),
  rateLimit: {
    interval: 1000,
    limit: 5
  },
  run() {
    return [];
  }
});

export const subscribeSlow = createPublication({
  name: 'slow',
  schema: z.any(),
  async run() {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  }
});


export const subscribeFast = createPublication({
  name: 'fast',
  schema: z.any(),
  async run() {
    return [];
  }
});

export const subscribePipeline = createPublication({
  name: 'pipeline',
  schema: z.number(),
  run: [
    (i) => {
      resetEvents();
      recordEvent(`input: ${i}`);
      return i
    },
    async (i) => i + 10,
    (i) => {
      recordEvent(`complete: ${i}`);
      return []
    }
  ]
});

const partial = partialPipeline(
  (i) => i + 10,
  (i) => i / 2
)

export const subscribePartial = createPublication({
  name: 'partial',
  schema: z.number()
}).pipeline(
  (i) => {
    resetEvents();
    return i;
  },
  partial,
  (i) => i.toFixed(1),
  (i) => recordEvent(`complete: ${i}`),
  () => []
);
