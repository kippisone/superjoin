'use strict';

let path = require('path');
let fl = require('node-fl');

let Superjoin = require('../modules/superjoin');
let superjoin = new Superjoin({
  skipPlugins: true,
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
          alias: 'xjquery',
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

        inspect(superjoin.scripts[3]).isObject();
        inspect(superjoin.scripts[3]).hasProps({
          name: './lib/coffee/lib.coffee',
          path: path.join(__dirname, '../example/lib/coffee/lib.coffee'),
          ext: 'coffee'
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
  });

  describe('write', function() {
    it ('Should run a write task', function() {
      superjoin.outfile = 'test.js';
      let writeStub = sinon.stub(fl, 'write');

      return superjoin.run(['write'], superjoin)
      .then(res => {
        inspect(writeStub).wasCalledOnce();
        inspect(writeStub.firstCall.args[1]).doesContainOnce('require.register(\'./lib/foo/foo.js');
        inspect(writeStub.firstCall.args[1]).doesContainOnce('require.register(\'./lib/coffee/lib.coffee');
      });
    });
  });
});
