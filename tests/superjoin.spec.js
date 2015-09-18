describe('Superjoin', function() {
    'use strict';

    var path = require('path'),
        fs = require('fs');

    var grunt = require('grunt');

    var Superjoin = require('../superjoin'),
        testPaths = [
        { base: './index.js', from: './foo.js', to: './foo.js'},
        { base: './index.js', from: 'foo.js', to: './foo.js'},
        { base: './bar/index.js', from: '../foo.js', to: './foo.js'},
        { base: './index.js', from: 'mymodule', to: '$npm/mymodule', npmDir: 'node_modules'},
        { base: './index.js', from: 'mymodule.js', to: '$npm/mymodule.js', noFile: true, npmDir: 'node_modules'},
        { base: './index.js', from: '$npm/mymodule', to: '$npm/mymodule', npmDir: 'node_modules'},
        { base: '$npm/mymodule', from: './foo/blub', to: '$npm/mymodule/foo/blub', noFile: true, npmDir: 'node_modules'},
        { base: './index.js', from: '$bower/mymodule', to: '$bwr/mymodule', bwrDir: 'bower_module'},
        { base: './index.js', from: '$lib/mymodule', to: '$lib/mymodule', libDir: 'libs'}
    ];

    describe('resolve', function() {
        var superjoin;
        beforeEach(function() {
            superjoin = new Superjoin();
            superjoin.root = '/srv/supertest';
        });

        afterEach(function() {

        });

        testPaths.forEach(function(p) {
            it('Should resolve a path from ' + p.from + ' to ' + p.to, function() {
                var root = path.join('/srv/supertest', p.to);
                var loadModuleStub;
                var hasStub;
                var prefix;
                    
                superjoin.npmDir = null;
                superjoin.bwrDir = null;
                superjoin.libDir = null;

                if (p.npmDir) {
                    hasStub = p.npmDir;
                    superjoin.npmDir = path.join('/srv/superjoin', p.npmDir);
                    root = path.join('/srv/supertest', p.npmDir, p.to);
                    prefix = '$npm';
                }

                if (p.bwrDir) {
                    hasStub = p.bwrDir;
                    superjoin.bwrDir = path.join('/srv/superjoin', p.bwrDir);
                    root = path.join('/srv/supertest', p.bwrDir, p.to);
                    prefix = '$bwr';
                }

                if (p.libDir) {
                    hasStub = p.libDir;
                    superjoin.libDir = path.join('/srv/superjoin', p.libDir);
                    root = path.join('/srv/supertest', p.libDir, p.to);
                    prefix = '$lib';
                }

                if (hasStub) {
                    loadModuleStub = sinon.stub(superjoin, 'loadModule');
                    loadModuleStub.returns({
                        path: path.join('/srv/supertest', hasStub, p.to),
                        name: p.to,
                        prefix: prefix
                    });
                }

                var fileExistsStub;
                    fileExistsStub = sinon.stub(grunt.file, 'exists');
                    fileExistsStub.returns(!p.noFile);
                
                var resolved = superjoin.resolve(p.base, p.from);
                expect(resolved).to.eql({
                    name: p.to,
                    path: root
                });

                if (hasStub) {
                    loadModuleStub.restore();
                }

                fileExistsStub.restore();
            });
        });
    });

    describe('getConf', function() {
        var superjoin;

        it('Should read superjoin conf file', function() {
            process.chdir(path.join(__dirname, './fixtures/'));
            superjoin = new Superjoin();

            expect(superjoin.getConf()).to.be.an('object');
            expect(superjoin.getConf()).to.eql({
                name: 'superjoin',
                root: 'public/',
                files: ['./modules/module1/index.js', 'module2', 'module3']
            });
        });

        it('Should read superjoin conf from package.json', function() {
            process.chdir(path.join(__dirname, './fixtures-pkg/'));
            superjoin = new Superjoin();

            expect(superjoin.getConf()).to.be.an('object');
            expect(superjoin.getConf()).to.eql({
                name: 'superjoin-pkg',
                root: './public/',
                files: ['a.js','b.js']
            });
        });

        it('Should try to read superjoin conf', function() {
            process.chdir(path.join(__dirname, '.'));
            superjoin = new Superjoin();

            expect(superjoin.getConf()).to.be.an('object');
            expect(superjoin.getConf()).to.eql({
               
            });
        });
    });

    describe('addModule', function() {
        var superjoin,
            resolveStub,
            readFileStub;

        beforeEach(function() {
            superjoin = new Superjoin();
            superjoin.root = '/srv/supertest';

            resolveStub = sinon.stub(superjoin, 'resolve');
            readFileStub = sinon.stub(superjoin, 'readFile');
            
        });

        afterEach(function() {
            readFileStub.restore();
            resolveStub.restore();
                
        });

        it('Should add a local module', function() {
            resolveStub.returns({
                name: './test/module.js',
                path: '/srv/supertest/test/module.js',
                isNodeModule: false
            });

            superjoin.addModule('./test/module');
            expect(superjoin.modules).to.eql(['/srv/supertest/test/module.js']);
        });

        it('Should add a module from node_modules', function() {
            resolveStub.returns({
                name: 'test',
                path: '/srv/supertest/node_modules/test/index.js',
                isNodeModule: false
            });

            superjoin.addModule('test');
            expect(superjoin.modules).to.eql(['/srv/supertest/node_modules/test/index.js']);
        });

        it('Should add a module from node_modules and all its submodules', function() {
            resolveStub.withArgs('/srv/supertest', 'test').returns({
                name: 'test',
                path: '/srv/supertest/node_modules/test/index.js',
                dir: '/srv/supertest/node_modules/test',
                isNodeModule: true
            });

            resolveStub.withArgs('/srv/supertest', 'test/lib/test.js').returns({
                name: 'test/lib/test.js',
                path: '/srv/supertest/node_modules/test/lib/test.js',
                dir: '/srv/supertest/node_modules/test',
                isNodeModule: true
            });

            resolveStub.withArgs('/srv/supertest', 'test/lib/test2.js').returns({
                name: 'test/lib/test2.js',
                path: '/srv/supertest/node_modules/test/lib/test2.js',
                dir: '/srv/supertest/node_modules/test',
                isNodeModule: true
            });

            var grepSubmodulesStub = sinon.spy(superjoin, 'grepSubmodules');
            readFileStub.withArgs('/srv/supertest/node_modules/test/index.js').returns('var test1 = require("./lib/test.js");');
            readFileStub.withArgs('/srv/supertest/node_modules/test/lib/test.js').returns('var test2 = require("./test2.js");');
            readFileStub.withArgs('/srv/supertest/node_modules/test/lib/test2.js').returns('console.log("Test 2");');
            
            superjoin.addModule('test');

            expect(grepSubmodulesStub).to.be.calledThrice();
            expect(grepSubmodulesStub).to.be.calledWith({
                name: 'test',
                path: '/srv/supertest/node_modules/test/index.js',
                dir: '/srv/supertest/node_modules/test',
                isNodeModule: true
            }, 'var test1 = require("./lib/test.js");');

            expect(grepSubmodulesStub).to.be.calledWith({
                name: 'test/lib/test.js',
                path: '/srv/supertest/node_modules/test/lib/test.js',
                dir: '/srv/supertest/node_modules/test',
                isNodeModule: true
            }, 'var test2 = require("./test2.js");');

            expect(grepSubmodulesStub).to.be.calledWith({
                name: 'test/lib/test2.js',
                path: '/srv/supertest/node_modules/test/lib/test2.js',
                dir: '/srv/supertest/node_modules/test',
                isNodeModule: true
            }, 'console.log("Test 2");');

            expect(superjoin.modules).to.eql([
                '/srv/supertest/node_modules/test/index.js',
                '/srv/supertest/node_modules/test/lib/test.js',
                '/srv/supertest/node_modules/test/lib/test2.js'
            ]);
            
            grepSubmodulesStub.restore();
        });
    });

    describe.skip('join', function() {
        var superjoin;

        beforeEach(function() {
            process.chdir(path.join(__dirname, './fixtures/'));
            superjoin = new Superjoin();
        });

        it('Should build a superjoin bundle', function() {
            var expected = fs.readFileSync('../fixtures-build/build.js', { encoding: 'utf8' });
            superjoin.root = 'public';
            
            var res = superjoin.join([
                "./modules/module1/index.js",
                "module2",
                "module3"
            ]);

            grunt.file.write('tmp/bundle.js', res);
            expect(res).to.eql(expected);


        });
    });
});