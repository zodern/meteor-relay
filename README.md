# zodern:relay - Type safe Meteor methods and publications

zodern:relay allows you to easily write methods and publications, and have typescript check the types of the args and result wherever you call the method or subscribe to a publication.

/imports/methods/projects.ts:
```ts
import { createMethod } from 'meteor/zodern:relay';
import { z } from 'zod';
import { Projects } from '/shared/collections';

export const createProject = createMethod({
  name: 'projects.create',
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    isPublic: z.boolean(),
  }),
  run({ name, description, isPublic }): string {
    let id = Projects.insert({
      name,

      // Type 'string | undefined' is not assignable to type 'string'.
      //   Type 'undefined' is not assignable to type 'string'.ts(2322)
      description,
      public: isPublic,
    });

    return id;
  },
});

```

`/client/exampleProject.ts`
```ts
import { createProject } from '/imports/methods/projects';

export async function createExampleProject() {
  // id has type of string
  const id = await createProject({
    // Property 'isPublic' is missing in type '{ name: string; }'
    // but required in type
    // '{ description?: string | undefined; name: string; isPublic: boolean; }'.ts(2345)
    name: 'Example',
  });
}

```

You might be wondering if this can expose server code on the client. None of the content of files in `methods` or `publications` directories are used on the client. If any of these files are imported on the client, their content is completely replaced. On the client, the files will export small functions for calling any methods or subscribing to any publications that were originally exported by the file.

## Getting started

1. Install `zodern:relay` and [`zod`](https://www.npmjs.com/package/zod)

```
meteor add zodern:relay
meteor npm install zod
```

2. Set up `@zodern/babel-plugin-meteor-relay`

```
meteor npm install @zodern/babel-plugin-meteor-relay
```

Create a `.babelrc` in the root of your Meteor app:

```json
{
  "plugins": [
    "@zodern/babel-plugin-meteor-relay"
  ]
}
```

3. Set up `zodern:types`

If you haven't already, add [`zodern:types`](https://atmospherejs.com/zodern/types) to your app so typescript can use the type definitions from `zodern:relay`.

## Methods

You can define methods in files in `methods` directories. The `methods` directories should not be inside a `client` or `server` folder so you can import the methods on both the client and server. The babel plugin will remove all server code from these files when imported on the client.

```ts
import { createMethod } from 'meteor/zodern:relay';
import { z } from 'zod';

export const add = createMethod({
  name: 'add',
  schema: z.number().array().length(2),
  run([a, b]) {
    return a + b;
  },
});
```

`schema` is always required, and must be a schema created from the `zod` npm package. If the method does not have any arguments, you can use `zod.never()` as the schema. If you do not want to check the arguments, you can use `zod.any()`.

The schema is used to provide types for for the `run` function's parameter, and to check the arguments when calling the method.

`createMethod` returns a function you can use to call the method. The function returns a promise that resolves with the result. The result will have the same type as the return value of the `run` function.

```ts
import { add } from '/imports/methods/add'

add([1, 2]).then(result => {
  console.log(result) // logs 3
});
```

The method name, schema, or run function, are available on the `config` property of the function returned by `createMethod`:

```ts
import { add } from '/imports/methods/add';


console.log(
  add.config.name,
  add.config.schema,
  add.config.run
)
```

On the client, only `config.name` is defined.

## Publications

You can define publicaitons in files in `publications` directories. The `publications` directories should not be inside a `client` or `server` folder so you can import the publications on both the client and server. The babel plugin will remove all server code from these files when imported on the client.

```ts
import { createPublication } from 'meteor/zodern:relay';
import { z } from 'zod';
import { Projects } from '/collections';

export const subscribeProject = createPublication({
  name: 'project',
  schema: z.object({
    id: z.string()
  }),
  run({ id }) {
    return Projects.find({ _id: id });
  },
});
```

`schema` is always required, and must be a schema created from the `zod` npm package. If the method does not have any arguments, you can use `zod.never()` as the schema. If you do not want to check the arguments, you can use `zod.any()`.

The schema is used to provide types for for the `run` function's parameter, and to check the arguments when subscribing to the publication.

`createPublication` returns a function you can use to subscribe to the publication. The function returns a [Subscription Handle](https://docs.meteor.com/api/pubsub.html#Meteor-subscribe), the same as `Meteor.subscribe` would.

```ts
import { subscribeProject } from '/imports/publications/projects'

const exampleId = 'example';
subscribeProject({ id: exampleId });

subscribeProject({ id: exampleId }, {
  onStop(err) {
    console.log('subscription stopped', err);
  },
  onReady() {
    console.log('subscription ready');
  }
});
```

Like with methods, the function returned by `createPublication` has a `config` property to access the name, schema, and run function. On the client, only the name is available.

## Blocking

By default, methods and publications will [block](https://guide.meteor.com/methods.html#methods-vs-rest), meaning each session will run one method or publication at a time, in the order the client calls or subscribes. In cases where you do not want this behavior for a specific method or subscription, you can call `this.unblock()`.

Meteor has a bug for methods and publications with an async function where they will always be unblocked, and there is no way to have them block. `zodern:relay` fixes this so async methods and publications are consistent with Meteor's normal behavior.

## Rate limiting

Both `createMethod` and `createPublication` support a `rateLimit` option:
```
export const add = createMethod({
  name: 'add',
  schema: z.number().array().length(2),
  rateLimit: {
    interval: 2000,
    limit: 10
  },
  run([a, b]) {
    return a + b;
  },
});
```

`interval` is the number of ms before the rate limit is reset. `limit` is the maximum number of method calls or created subscriptions allowed per time interval.
