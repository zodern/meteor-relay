export function _createClientMethod(name: string) {
  function call(args: any) {
    return new Promise((resolve, reject) => {
      Meteor.call(name, args, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  call.config = { name };

  return call;
}

export function _createClientPublication(name: string | null) {
  function subscribe(...args: any) {
    if (name === null) {
      throw new Error('Cannot directly subscribe to null publication');
    }

    return Meteor.subscribe(name, ...args);
  }

  subscribe.config = { name };

  return subscribe;
}
