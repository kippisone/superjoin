'use strict';

var fl = require('node-fl');

var Superjoin = require('../modules/superjoin');
var CoTasks = require('co-tasks');
var inspect = require('inspect.js');
var sinon = require('sinon');
inspect.useSinon(sinon);

describe('Superjoin', function() {
  describe('Constructor', function() {
    it('Should be a Superjoin class', function() {
      expect(Superjoin).to.be.a('function');
    });

    it('Should be an instance of Superjoin', function() {
      expect(new Superjoin()).to.be.a(Superjoin);
    });

    it('Should be extended byCoTasks', function() {
      expect(new Superjoin()).to.be.a(CoTasks);
    });
  });

  describe('grepSubmodules', function() {
    let superjoin;
    let addModuleStub;

    beforeEach(function() {
      superjoin = new Superjoin();
      addModuleStub = sinon.stub(superjoin, 'addModule');
    });

    afterEach(function() {
      addModuleStub.restore();
    });

    it('Should grep a js require statement', function() {
      superjoin.grepSubmodules({
        ext: 'js',
        source: 'var foo = require(\'./foo/bar.js\');',
        path: 'test.js'
      });

      inspect(addModuleStub).wasCalledOnce();
      inspect(addModuleStub).wasCalledWith('test.js', './foo/bar.js');
    });

    it('Should grep a js require statement with doublequotes', function() {
      superjoin.grepSubmodules({
        ext: 'js',
        source: 'var foo = require("./foo/bar.js");',
        path: 'test.js'
      });

      inspect(addModuleStub).wasCalledOnce();
      inspect(addModuleStub).wasCalledWith('test.js', './foo/bar.js');
    });

    it('Should grep a js require statement with space after statement', function() {
      superjoin.grepSubmodules({
        ext: 'js',
        source: 'var foo = require (\'./foo/bar.js\');',
        path: 'test.js'
      });

      inspect(addModuleStub).wasCalledOnce();
      inspect(addModuleStub).wasCalledWith('test.js', './foo/bar.js');
    });

    it('Should grep a js require statement using coffee syntax', function() {
      superjoin.grepSubmodules({
        ext: 'coffee',
        source: 'var foo = require \'./foo/bar.coffee\'',
        path: 'test.coffee'
      });

      inspect(addModuleStub).wasCalledOnce();
      inspect(addModuleStub).wasCalledWith('test.coffee', './foo/bar.coffee');
    });
  });

  describe('addModule', function() {
    let superjoin;
    let sandbox = sinon.sandbox.create();

    beforeEach(function() {
      superjoin = new Superjoin({
        npmDir: './tests/npm_modules'
      });
      sandbox.stub(superjoin, 'loadFile').returns('Test file');
      sandbox.stub(fl, 'exists').returns(true);
    });

    afterEach(function() {
      sandbox.restore();
    });

    it('Should add a module', function() {
      superjoin.addModule('index.js', './lib/test.js');

      inspect(superjoin.scripts[0]).hasProps({
        name: './lib/test.js',
        source: 'Test file'
      });
    });

    it('Should not add the same module twice', function() {
      superjoin.addModule('index.js', './lib/test.js');
      superjoin.addModule('index.js', './lib/test.js');

      inspect(superjoin.scripts[0]).hasProps({
        name: './lib/test.js',
        source: 'Test file'
      });

      inspect(superjoin.scripts).hasLength(1);
    });

    it('Should add a module without file extension', function() {
      superjoin.addModule('index.js', './lib/test');

      inspect(superjoin.scripts[0]).hasProps({
        name: './lib/test.js',
        source: 'Test file'
      });
    });

    it('Should not add the same module without file extension twice', function() {
      superjoin.addModule('index.js', './lib/test');
      superjoin.addModule('index.js', './lib/test');
      superjoin.addModule('index.js', './lib/test.js');

      inspect(superjoin.scripts[0]).hasProps({
        name: './lib/test.js',
        source: 'Test file'
      });

      inspect(superjoin.scripts).hasLength(1);
    });

    it('Should add a npm module', function() {
      superjoin.addModule('index.js', 'jquery');

      inspect(superjoin.scripts[0]).hasProps({
        name: 'jquery/dist/index.js',
        source: 'Test file'
      });
    });

    it('Should not add the same npm module twice', function() {
      superjoin.addModule('index.js', 'jquery');
      superjoin.addModule('index.js', 'jquery');

      inspect(superjoin.scripts[0]).hasProps({
        name: 'jquery/dist/index.js',
        source: 'Test file'
      });

      inspect(superjoin.scripts).hasLength(1);
    });
  });
});
