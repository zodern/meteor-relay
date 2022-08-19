import { expectError, expectType } from 'tsd';
import { z } from 'zod';
import { createMethod, createPublication } from '../server-main';

const undefinedMethod = createMethod({
  name: 'test',
  schema: z.undefined(),
  run() {
    return 5;
  }
});

const objMethod = createMethod({
  name: 'test2',
  schema: z.object({
    a: z.number(),
    b: z.string()
  }),
  run() {
    return true; 
  }
});

const stringMethod = createMethod({
  name: 'test3',
  schema: z.string(),
  run() {
    return 55;
  }
});

const anyMethod = createMethod({
  name: 'test4',
  schema: z.any(),
  run() {
    return 'abc';
  }
});

expectType<Promise<number>>(undefinedMethod());
expectError(undefinedMethod(5));

expectType<Promise<boolean>>(objMethod({ a: 5, b: 'abc' }));
expectError(objMethod());
expectError(objMethod(5));

expectType<Promise<number>>(stringMethod('fun'));
expectError(stringMethod());
expectError(stringMethod({ a: 20 }));

expectType<Promise<string>>(anyMethod('123'));
// TODO: fix this
// expectType<Promise<string>>(anyMethod());

const undefinedSubscribe = createPublication({
  name: 'test',
  schema: z.undefined(),
  run() {
  }
});

const objSubscribe = createPublication({
  name: 'test2',
  schema: z.object({
    a: z.number(),
    b: z.string()
  }),
  run() {
  }
});

const stringSubscribe = createPublication({
  name: 'test3',
  schema: z.string(),
  run() {
  }
});

const anySubscribe = createPublication({
  name: 'test4',
  schema: z.any(),
  run() {
  }
});

expectType<Meteor.SubscriptionHandle>(undefinedSubscribe());
expectError(undefinedSubscribe(5));

expectType<Meteor.SubscriptionHandle>(objSubscribe({ a: 5, b: 'abc' }));
expectError(objSubscribe());
expectError(objSubscribe(5));

expectType<Meteor.SubscriptionHandle>(stringSubscribe('fun'));
expectError(stringSubscribe());
expectError(stringSubscribe({ a: 20 }));

expectType<Meteor.SubscriptionHandle>(anySubscribe('123'));
// TODO: fix this
// expectType<Meteor.SubscriptionHandle>(anySubscribe());

expectType<Meteor.SubscriptionHandle>(stringSubscribe('fun2', {
  onStop(err: Error) {
    console.log(err);
  }
}));

expectType<Meteor.SubscriptionHandle>(stringSubscribe('fun3', {
  onReady() {
    console.log('ready');
  }
}));

expectType<Meteor.SubscriptionHandle>(undefinedSubscribe({
  onReady() {
    console.log('ready');
  }
}));

expectType<Meteor.SubscriptionHandle>(stringSubscribe('fun3', {}));
