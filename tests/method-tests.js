const {
  schema,
  run,
  test1,
  rateLimited,
  errorMethod,
  wait100,
  fastMethod,
  configMethod
} = require('./methods/index.js');

Tinytest.addAsync('methods - basic', async (test) => {
  const result = await test1();
  test.equal(result, 5);
});

Tinytest.addAsync('methods - error', async (test) => {
  try {
    await errorMethod();
    test.equal('should never be reached', true);
  } catch (e) {
    test.equal(e.message, '[test error]');
  }
});

if (Meteor.isServer) {
  Tinytest.add('methods - config server', async (test) => {
    test.equal(configMethod.config.name, 'a');
    test.equal(configMethod.config.schema, schema);
    test.equal(configMethod.config.run, run);
  });
} else {
  Tinytest.add('methods - config client', async (test) => {
    test.equal(Object.keys(test1.config), ['name']);
    test.equal(test1.config.name, 'test1');
  });
}

if (Meteor.isClient) {
  Tinytest.addAsync('methods - rate limit', async (test) => {
    for (let i = 0; i < 5; i++) {
      await rateLimited();
    }

    try {
      await rateLimited();
      test.equal('should never be reached', true);
    } catch (e) {
      test.equal(e.error, 'too-many-requests');
    }
  });
}

Tinytest.addAsync('methods - async block by default', async (test) => {
  let order = [];

  await Promise.all([
    wait100().then(() => order.push('wait100')),
    fastMethod().then(() => order.push('fastMethod'))
  ]);

  test.equal(order, ['wait100', 'fastMethod']);
});

if (Meteor.isClient) {
  Tinytest.add('methods - error if created on client', (test) => {
    try {
      require('./methods.js');
      test.equal('should never be reached', true);
    } catch (e) {
      test.equal(e.message, 'createMethod should never be called on the client.\nEnsure you have @zodern/babel-plugin-meteor-reify configured, or\nyou are calling createMethod only in files inside a methods directory')
    }
  });
}
