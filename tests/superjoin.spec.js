'use strict';

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
});
