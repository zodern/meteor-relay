const assert = require('assert');

const transform = (str, filename = '/methods/index.js', arch = 'web.browser') => {
  return require('@babel/core').transform(str, {
    plugins: ['./plugin.js'],
    caller: {
      name: 'meteor',
      arch
    },
    filename
  }).code;
};

describe('Plugin', () => {
  it('should make file empty on client', () => {
    const code = 'const example = "Hello";';
    assert.equal(transform(code), '');
  });
  it('should ignore various types of exports', () => {
    const code = `
      export const a = true;
      export let b = true;
      export var c = true;
      export function d () {

      }

      let h = true;
      export { h };
    `;
    assert.equal(transform(code), '');
  });

  describe('methods', () => {
    it('should leave code as is on the server', () => {
      const code = `
import { createMethod } from 'meteor/zodern:relay';
export default createMethod({
  name: 'myMethod'
});
      `;
      assert.equal(transform(code, '/methods/index.js', 'os.osx.x86_64'), code.trim());
    });
    it('should handle default exports', () => {
      const code = `
        import { createMethod } from 'meteor/zodern:relay';
        export default createMethod({
          name: 'myMethod'
        });
      `;
      assert.equal(transform(code), `
import { _createClientMethod } from "meteor/zodern:relay/client";
export default _createClientMethod("myMethod");
      `.trim());
    });

    it('should handle named exports', () => {
      const code = `
        import { createMethod } from 'meteor/zodern:relay';
        export const myMethod = createMethod({ name: 'myMethod' });
      `;
      assert.equal(transform(code), `
import { _createClientMethod } from "meteor/zodern:relay/client";
export const myMethod = _createClientMethod("myMethod");
      `.trim());
    });
  });

  describe('subscriptions', () => {
    it('should handle default exports', () => {
      const code = `
        import { createPublication } from 'meteor/zodern:relay';
        export default createPublication({ name: 'myPublication' });
      `;
      assert.equal(transform(code, '/publications/index.js'), `
import { _createClientPublication } from "meteor/zodern:relay/client";
export default _createClientPublication("myPublication");
      `.trim());
    });

    it('should handle named exports', () => {
      const code = `
        import { createPublication } from 'meteor/zodern:relay';
        export const myPublication = createPublication({ name: 'myPublication' });
      `;
      assert.equal(transform(code, '/publications/index.js'), `
import { _createClientPublication } from "meteor/zodern:relay/client";
export const myPublication = _createClientPublication("myPublication");
      `.trim());
    });
  });

  describe('wrongFolder', () => {
    it('should handle unsupported export types', () => {
      const code = `
        export function a() {};
      `

      transform(code, '/index.js');
    })
    it('should leave methods as is outside of methods folder', () => {
      const code = `
import { createMethod } from 'meteor/zodern:relay';
export default createMethod({
  name: 'myMethod'
});
      `;
      assert.equal(transform(code, '/index.js'), code.trim());
    });
    it('should leave publications as is outside of publications folder', () => {
      const code = `
import { createPublication } from 'meteor/zodern:relay';
export default createPublication({
  name: 'myMethod'
});
      `;
      assert.equal(transform(code, '/index.js'), code.trim());
    });

    it('should ignore publications in methods folder', () => {
      const code = `
import { createPublication, createMethod } from 'meteor/zodern:relay';
export default createPublication({
  name: 'myPublication'
});
export const a = createMethod({
  name: 'other-method'
});
      `;
      assert.equal(transform(code, '/methods/index.js'), `
import { _createClientMethod } from "meteor/zodern:relay/client";
export const a = _createClientMethod("other-method");
`.trim());
    })

    it('should ignore methods in publications folder', () => {
      const code = `
import { createPublication, createMethod } from 'meteor/zodern:relay';
export default createPublication({
  name: 'myPub'
});
export const a = createMethod({
  name: 'other-method'
});
      `;
      assert.equal(transform(code, '/publications/index.js'), `
import { _createClientPublication } from "meteor/zodern:relay/client";
export default _createClientPublication("myPub");
`.trim());
    })
  });
});
