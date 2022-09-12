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

export const methodUnblock = createMethod({
  name: 'methodUnblock',
  schema: z.number(),
  run(){
    this.unblock();
  }
})

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
});

export const simplePipeline =createMethod({
  name: 'simplePipeline',
  schema: z.number(),
  run: [
    (n) => n + 5,
    (n) => n - 1,
    (n) => n + 0.5 
  ]
});

export const asyncPipeline = createMethod({
  name: 'asyncPipeline',
  schema: z.number(),
  run: [
    async (n) => n + 5,
    (n) => Promise.resolve(n - 1),
    async (n) => n + 0.5
  ]
});
