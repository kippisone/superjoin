'use strict';

let vm = require('vm');
let fs = require('fs');
let path = require('path');

let inspect = require('inspect.js');
let sinon = require('sinon');
inspect.useSinon(sinon);

describe('Browser require module', function() {
  var testPaths = [
    { from: './index.js', to: './foo.js', res: './foo.js'},
    { from: './index.js', to: 'foo.js', res: './foo.js'},
    { from: './bar/index.js', to: '../foo.js', res: './foo.js'},
    { from: './foo/bar/bla/blubb.js', to: '../../../index.js', res: './index.js'},
    { from: './index.js', to: 'mymodule', res: 'mymodule'},
    { from: './index.js', to: 'mymodule.js', res: 'mymodule.js', noFile: true},
    { from: './index.js', to: 'mymodule.js/lib/mymodule.js', res: 'mymodule.js/lib/mymodule.js', noFile: true},
    { from: 'mymodule', to: './lib/bla', res: 'mymodule/lib/bla.js'},
    { from: 'mymodule', to: 'othermodule', res: 'othermodule', noFile: true},
    { from: 'mymodule', to: 'othermodule/bla.js', res: 'othermodule/bla.js', noFile: true}
  ];

  let fakeDom;

  before(function() {
    fakeDom = {
      isFakeDOM: true
    };

    fakeDom.location = {
      pathname: '/web_modules/'
    };

    fakeDom.window = {
      location: fakeDom.location
    };

    fakeDom.console = console;
    let mod = fs.readFileSync(path.join(__dirname, '../public/require.js'), { encoding: 'utf8' });
    vm.runInNewContext(mod, fakeDom);
  });

  describe('require', function() {
    it('Should be a function', function() {
      inspect(fakeDom.window.require).isFunction();
    });
  });

  describe('resolve', function() {
    testPaths.forEach(function(p) {
      it('Should resolve a path from ' + p.to + ' to ' + p.res, function() {
        var moduleExistsStub = sinon.stub(fakeDom.window.require, 'moduleExists');
        moduleExistsStub.returns(!!p.noFile);
        moduleExistsStub.withArgs('.').returns(false);
        inspect(fakeDom.window.require.resolve(p.from, p.to)).isEql(p.res);
        moduleExistsStub.restore();
      });
    });
  });
});
