const { z } = require('zod');
import { createMethod } from 'meteor/zodern:relay';

export const test1 = createMethod({
  name: 'test1',
  schema: z.any(),
  run() {
    return 5;
  }
});

export const errorMethod = createMethod({
  name: 'errorMethod',
  schema: z.any(),
  run() {
    throw new Meteor.Error('test error');
  }
});

export const schema = z.any();
export function run() { };

export const configMethod = createMethod({
  name: 'a',
  schema,
  run
});

export const rateLimited = createMethod({
  name: 'rateLimited',
  schema: z.any(),
  rateLimit: {
    interval: 1000,
    limit: 5
  },
  run() {
    return true;
  }
});

export const wait100 = createMethod({
  name: 'wait100',
  schema: z.any(),
  async run() {
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }
});

export const fastMethod = createMethod({
  name: 'fast',
  schema: z.any(),
  async run() {
    return 5;
  }
})
