function getName(args) {
  if (args[0].type !== 'ObjectExpression') {
    return;
  }

  let obj = args[0];
  let nameProperty = obj.properties.find((property) => {
    if (property.key.type !== 'Identifier') {
      return false;
    }

    if (property.key.name !== 'name') {
      return false;
    }
    
    return property.value.type === 'StringLiteral';
  });
  
  if (nameProperty) {
    return nameProperty.value.value;
  }
  
  return undefined;
}

// If has a MemberExpression, returns the first call expression in its callee
// Otherwise, returns the call expression
function getFirstCallExpr(call) {
  if (call.callee.type === 'MemberExpression') {
    if (
      call.callee.object.type !== 'CallExpression'
    ) {
      return '';
    }

    return  call.callee.object;
  }

  return call;
}

module.exports = function (api) {
  let t = api.types;

  let caller;
  api.caller(function (c) {
    caller = c;
  });

  function createExport(exportName, callee, name) {
    const declaration = t.CallExpression(
      t.Identifier(callee),
      [
        t.StringLiteral(name)
      ]
    );

    if (exportName === null) {
      return t.ExportDefaultDeclaration(
        declaration
      );
    }

    return t.ExportNamedDeclaration(
      t.VariableDeclaration(
        'const',
        [t.VariableDeclarator(
          t.Identifier(exportName),
          declaration
        )]
      )
    )
  }

  let canHaveMethods = false;
  let canHavePublications = false;
  let createMethodName = null;
  let createPublicationName = null;
  let methods = [];
  let publications = [];
  return {
    visitor: {
      Program: {
        enter(path, state) {
          createMethodName = null;
          createPublicationName = null;
          methods = [];
          publications = [];
          canHaveMethods = state.filename.includes('/methods/');
          canHavePublications = state.filename.includes('/publications/');

          // Leave files as is on the server
          if (
            caller.arch.startsWith('os.') ||
            (!canHaveMethods && !canHavePublications)
          ) {
            return path.skip();
          }
        },
        exit(path) {
          if (!canHaveMethods && !canHavePublications) {
            return;
          }

          if (methods.length === 0 && publications.length === 0) {
            path.node.body = [];
            return;
          }

          let body = [];

          let importSpecifiers = [];
          if (methods.length > 0) {
            importSpecifiers.push(
              t.ImportSpecifier(t.Identifier('_createClientMethod'), t.Identifier('_createClientMethod'))
            );
          }
          if (publications.length > 0) {
            importSpecifiers.push(
              t.ImportSpecifier(t.Identifier('_createClientPublication'), t.Identifier('_createClientPublication'))
            )
          }

          let importDecl = t.ImportDeclaration(
            importSpecifiers,
            t.StringLiteral('meteor/zodern:relay/client'),
          );

          body.push(importDecl);

          methods.forEach(method => {
            body.push(
              createExport(method.export, '_createClientMethod', method.name)
            );
          });
          publications.forEach(publication => {
            body.push(
              createExport(publication.export, '_createClientPublication', publication.name)
            );
          });

          path.node.body = body;

          return;
        },
      },
      ImportDeclaration(path) {
        if (path.node.source.value !== 'meteor/zodern:relay') {
          return;
        }

        path.node.specifiers.forEach(specifier => {
          if (canHaveMethods && specifier.imported.name === 'createMethod') {
            createMethodName = specifier.local.name;
          }
          if (canHavePublications && specifier.imported.name === 'createPublication') {
            createPublicationName = specifier.local.name;
          }
        });
      },
      ExportDefaultDeclaration(path) {
        if (path.node.declaration.type !== 'CallExpression') {
          return;
        }

        let call = getFirstCallExpr(path.node.declaration);

        if (!call) {
          return;
        }

        if (
          call.callee.name === createMethodName
        ) {
          let name = getName(call.arguments);
          if (name === undefined) {
            throw new Error('Unable to find name for createMethod');
          }
          methods.push({
            name: name,
            export: null
          });
        }

        if (
         call.callee.name === createPublicationName
        ) {
          let name = getName(call.arguments);
          if (name === undefined) {
            throw new Error('Unable to find name for createMethod');
          }

          publications.push({
            name: name,
            export: null
          });
        }
      },
      ExportNamedDeclaration(path) {
        let declaration = path.node.declaration;

        if (
          // null when the code is something like "export { h };"
          declaration === null ||
          declaration.type === 'FunctionDeclaration'
        ) {
          return;
        }

        if (declaration.type !== 'VariableDeclaration') {
          throw new Error(`export declarations of type ${declaration.type} are not supported`);
        }

        declaration.declarations.forEach(vDeclaration => {
          if (vDeclaration.type !== 'VariableDeclarator') {
            throw new Error(`Unsupported declaration type in VariableDeclaration: ${vDeclaration.type}`);
          }

          if (vDeclaration.init.type !== 'CallExpression') {
            return;
          }

          let call = getFirstCallExpr(vDeclaration.init);
          
          if (!call) {
            return;
          }

          if (
            call.callee.name === createMethodName
          ) {
            let name = getName(call.arguments);
            if (name === undefined) {
              throw new Error('Unable to find name for createMethod');
            }
            methods.push({
              name: name,
              export: vDeclaration.id.name
            });
          }

          if (
            call.callee.name === createPublicationName
          ) {
            let name = getName(call.arguments);
            if (name === undefined) {
              throw new Error('Unable to find name for createMethod');
            }

            publications.push({
              name: name,
              export: vDeclaration.id.name
            });
          }
        })
      }
    }
  };
}
