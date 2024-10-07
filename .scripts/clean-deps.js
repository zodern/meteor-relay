// Remove invalid json file from resolve dev dep
// which prevents Meteor 2.2 from running tests

const path = require('path');
const fs = require('fs');

const jsonPath = path.resolve(__dirname, '../node_modules/resolve/test/resolver/malformed_package_json/package.json');

console.log(`Removing ${jsonPath}`);
try {
fs.unlinkSync(jsonPath);
} catch (e) {
  if (e.code === 'ENOENT') {
    console.log('File already removed or does not exist');
  } else {
    throw e;
  }
}
