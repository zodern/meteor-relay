import { createPublication } from 'meteor/zodern:relay';
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
