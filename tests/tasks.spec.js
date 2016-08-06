'use strict';

let path = require('path');
let fl = require('node-fl');

let Superjoin = require('../modules/superjoin');
let superjoin = new Superjoin({
  skipPlugins: false,
  workingDir: path.join(__dirname, '../example')
});

let inspect = require('inspect.js');
let sinon = require('sinon');
inspect.useSinon(sinon);

describe('Task', function() {
  describe('collect', function() {
    it('Should collect files', function() {
      return superjoin.run(['collect'], superjoin)
      .then(res => {
        inspect(superjoin.scripts).isArray();
        inspect(superjoin.scripts[0]).isObject();
        inspect(superjoin.scripts[0]).hasProps({
          alias: 'jquery',
          name: 'jquery/jquery.js',
          path: path.join(__dirname, '../example/node_modules/jquery/jquery.js'),
          ext: 'js'
        });

        inspect(superjoin.scripts[1]).isObject();
        inspect(superjoin.scripts[1]).hasProps({
          name: './lib/foo/foo.js',
          path: path.join(__dirname, '../example/lib/foo/foo.js'),
          ext: 'js'
        });

        inspect(superjoin.scripts[5]).isObject();
        inspect(superjoin.scripts[5]).hasProps({
          name: './lib/coffee/lib2.coffee',
          path: path.join(__dirname, '../example/lib/coffee/lib2.coffee'),
          ext: 'coffee'
        });

        inspect(superjoin.scripts[4]).isObject();
        inspect(superjoin.scripts[4]).hasProps({
          name: './lib/coffee/lib.coffee',
          path: path.join(__dirname, '../example/lib/coffee/lib.coffee'),
          ext: 'coffee'
        });
      });
    });
  });

  describe('precompile', function() {
    it ('Should run a precompile task', function() {
      return superjoin.run(['precompile'], superjoin)
      .then(res => {
        inspect(superjoin.scripts).isArray();
        inspect(superjoin.scripts[0]).isObject();
        inspect(superjoin.scripts[0]).hasProps({
          alias: 'jquery',
          name: 'jquery/jquery.js',
          path: path.join(__dirname, '../example/node_modules/jquery/jquery.js'),
          ext: 'js'
        });

        inspect(superjoin.scripts[1]).isObject();
        inspect(superjoin.scripts[1]).hasProps({
          name: './lib/foo/foo.js',
          path: path.join(__dirname, '../example/lib/foo/foo.js'),
          ext: 'js'
        });

        inspect(superjoin.scripts[5]).isObject();
        inspect(superjoin.scripts[5]).hasProps({
          name: './lib/coffee/lib2.coffee.js',
          path: path.join(__dirname, '../example/lib/coffee/lib2.coffee'),
          ext: 'js',
          hasPrecompilation: true,
          orig: {
            name: './lib/coffee/lib2.coffee',
            ext: 'coffee'
          }
        });

        inspect(superjoin.scripts[4]).isObject();
        inspect(superjoin.scripts[4]).hasProps({
          name: './lib/coffee/lib.coffee.js',
          path: path.join(__dirname, '../example/lib/coffee/lib.coffee'),
          ext: 'js',
          hasPrecompilation: true,
          orig: {
            name: './lib/coffee/lib.coffee',
            ext: 'coffee'
          }
        });
      });
    });
  });

  describe('build', function() {
    it ('Should run a build task', function() {
      return superjoin.run(['build'], superjoin)
      .then(res => {
        inspect(superjoin.bundle).isString();
      });
    });

    it('Build contains jquery module', function() {
      inspect(superjoin.bundle).doesContain([
        'require.alias[\'jquery\'] = \'jquery/jquery.js\';',
        'require.register(\'jquery/jquery.js\', function(module, exports, require) { module.exports = {',
        '  name: \'jquery\',',
        '  version: \'2.0.4\'',
        '};',
        '',
        '});'
      ].join('\n'));
    });

    it('Build contains main module', function() {
      inspect(superjoin.bundle).doesContain([
        'require.register(\'./index.js\', function(module, exports, require) { var foo = require(\'./lib/foo/foo\'),',
        '    bar = require(\'./lib/bar/bar\'),',
        '    coffee = require(\'./lib/coffee/lib.coffee\');',
        '',
        'console.log(foo());',
        'console.log(bar());',
        '',
        '});'
      ].join('\n'));
    });

    it('Build contains main loader', function() {
      inspect(superjoin.bundle).doesContain('require(\'index.js\');');
    });
  });

  describe('write', function() {
    it ('Should run a write task', function() {
      superjoin.outfile = 'test.js';
      let writeStub = sinon.stub(fl, 'write');

      return superjoin.run(['write'], superjoin)
      .then(res => {
        inspect(writeStub).wasCalledOnce();
        inspect(writeStub.firstCall.args[1]).doesContainOnce('require.register(\'./lib/foo/foo.js');
        inspect(writeStub.firstCall.args[1]).doesContainOnce('require.register(\'./lib/coffee/lib.coffee.js');
        inspect(writeStub.firstCall.args[1]).doesContainOnce('require.register(\'./lib/coffee/lib2.coffee.js');
      });
    });
  });
});
