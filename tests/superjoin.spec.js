describe('Superjoin', function() {
    'use strict';

    var path = require('path'),
        fs = require('fs');

    var grunt = require('grunt');

    var Superjoin = require('../superjoin'),
        testPaths = [
        { from: '/srv/supertest/index.js', to: './foo.js', res: './foo.js' },
        { from: '/srv/supertest/index.js', to: './foo', res: './foo.js' },
        { from: '/srv/supertest/index.js', to: 'foo.js', res : './foo.js' },
        { from: '/srv/supertest/foo/bar.js', to: '../foo.js', res : './foo.js' },
        { from: '/srv/supertest/index.js', to: 'mymodule', res: 'mymodule', isNpm: true },
        { from: '/srv/supertest/index.js', to: 'mymodule.js', res: 'mymodule.js', isNpm: true, noFile:true },
        { from: '/srv/supertest/node_modules/mymodule/dist/index.js', to: '../mymodule.js', res: 'mymodule/mymodule.js', isNpm: true, noFile:true },
        { from: '/srv/supertest/node_modules/mymodule/dist/index.js', to: 'mymodule/dist/foo.js', res: 'mymodule/dist/foo.js', isNpm: true, noFile:true },
        { from: '/srv/supertest/index.js', to: '$npm/mymodule', res : 'mymodule', isNpm: true },
        { from: '/srv/supertest/index.js', to: '$npm/mymodule/foo.js', res : 'mymodule/foo.js', isNpm: true },
        { from: '/srv/supertest/index.js', to: '$bower/mymodule', res : 'mymodule', isBower: true },
        { from: '/srv/supertest/index.js', to: '$bower/mymodule/foo.js', res : 'mymodule/foo.js', isBower: true },
        { from: '/srv/supertest/index.js', to: '$lib/mymodule', res : 'mymodule', isLib: true },
        { from: '/srv/supertest/index.js', to: '$lib/mymodule/foo.js', res : 'mymodule/foo.js', isLib: true }
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
                var dir = path.join('/srv/supertest');
                var loadModuleStub;
                var hasStub;
                    
                superjoin.npmDir = null;
                superjoin.bwrDir = null;
                superjoin.libDir = null;

                var isModule = false;

                // var mod = p.base.split('/');
                // mod = mod[0];

                if (p.isNpm) {
                    hasStub = '/srv/supertest/node_modules';
                    superjoin.npmDir = '/srv/supertest/node_modules';
                    dir = superjoin.npmDir;
                    isModule = true;
                //     root = path.join('/srv/supertest', p.npmDir, p.to);
                //     superjoin.modulePaths[mod] = root;
                }

                if (p.isBower) {
                    hasStub = '/srv/supertest/bower_components';
                    superjoin.bwrDir = '/srv/supertest/bower_components';
                    dir = superjoin.bwrDir;
                    isModule = true;
                //     root = path.join('/srv/supertest', p.bwrDir, p.to);
                //     superjoin.modulePaths[mod] = root;
                }

                if (p.isLib) {
                    hasStub = '/srv/supertest/libs';
                    superjoin.libDir = '/srv/supertest/libs';
                    dir = superjoin.libDir;
                    isModule = true;
                //     root = path.join('/srv/supertest', p.libDir, p.to);
                //     superjoin.modulePaths[mod] = root;
                }

                if (hasStub) {
                    loadModuleStub = sinon.stub(superjoin, 'loadModule');
                    loadModuleStub.returns({
                        path: path.join(hasStub, p.to.replace(/^\$[a-z]+\//, '')),
                        name: p.res,
                        dir: dir,
                        isModule: isModule
                    });
                }

                var fileExistsStub;
                    fileExistsStub = sinon.stub(grunt.file, 'exists');
                    fileExistsStub.returns(!p.noFile);
                
                var alias;
                
                var resolved = superjoin.resolve(p.from, p.to);
                expect(resolved).to.eql({
                    path: path.join(dir, p.res),
                    dir: dir,
                    name: p.res,
                    isModule: isModule,
                    alias: alias
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
            readFileStub.returns('//Code');
            
        });

        afterEach(function() {
            readFileStub.restore();
            resolveStub.restore();
                
        });

        it('Should add a local module', function() {
            resolveStub.returns({
                path: '/srv/supertest/test/module.js',
                name: './test/module.js',
                dir: '/srv/supertest/',
                isModule: false
            });

            var res = superjoin.addModule('/srv/supertest/index.js', './test/module');
            expect(superjoin.modules).to.eql(['/srv/supertest/test/module.js']);

            expect(res).to.eql(
                'require.register(\'./test/module.js\', function(module, exports, require) {\n' +
                '//Code\n' +
                '});\n'
            );
        });

        it('Should add a module from node_modules', function() {
            resolveStub.returns({
                path: '/srv/supertest/node_modules/test/index.js',
                name: 'test',
                dir: '/srv/supertest/node_modules',
                isModule: true
            });

            var res = superjoin.addModule('/srv/supertest/index.js', 'test');
            expect(superjoin.modules).to.eql(['/srv/supertest/node_modules/test/index.js']);

            expect(res).to.eql(
                'require.register(\'test\', function(module, exports, require) {\n' +
                '//Code\n' +
                '});\n'
            );
        });

        it('Should add a module from node_modules and all its submodules', function() {
            resolveStub.withArgs('/srv/supertest/index.js', 'test').returns({
                name: 'test',
                path: '/srv/supertest/node_modules/test/index.js',
                dir: '/srv/supertest/node_modules/test',
                isModule: true
            });

            resolveStub.withArgs('/srv/supertest/node_modules/test/index.js', './lib/test.js').returns({
                name: 'test/lib/test.js',
                path: '/srv/supertest/node_modules/test/lib/test.js',
                dir: '/srv/supertest/node_modules/test',
                isModule: true
            });

            resolveStub.withArgs('/srv/supertest/node_modules/test/lib/test.js', './test2.js').returns({
                name: 'test/lib/test2.js',
                path: '/srv/supertest/node_modules/test/lib/test2.js',
                dir: '/srv/supertest/node_modules/test',
                isModule: true
            });

            var grepSubmodulesStub = sinon.spy(superjoin, 'grepSubmodules');
            readFileStub.withArgs('/srv/supertest/node_modules/test/index.js').returns('var test1 = require("./lib/test.js");');
            readFileStub.withArgs('/srv/supertest/node_modules/test/lib/test.js').returns('var test2 = require("./test2.js");');
            readFileStub.withArgs('/srv/supertest/node_modules/test/lib/test2.js').returns('console.log("Test 2");');
            
            var res = superjoin.addModule('/srv/supertest/index.js', 'test');

            expect(grepSubmodulesStub).to.be.calledThrice();
            expect(grepSubmodulesStub).to.be.calledWith({
                name: 'test',
                path: '/srv/supertest/node_modules/test/index.js',
                dir: '/srv/supertest/node_modules/test',
                isModule: true
            }, 'var test1 = require("./lib/test.js");');

            expect(grepSubmodulesStub).to.be.calledWith({
                name: 'test/lib/test.js',
                path: '/srv/supertest/node_modules/test/lib/test.js',
                dir: '/srv/supertest/node_modules/test',
                isModule: true
            }, 'var test2 = require("./test2.js");');

            expect(grepSubmodulesStub).to.be.calledWith({
                name: 'test/lib/test2.js',
                path: '/srv/supertest/node_modules/test/lib/test2.js',
                dir: '/srv/supertest/node_modules/test',
                isModule: true
            }, 'console.log("Test 2");');

            expect(superjoin.modules).to.eql([
                '/srv/supertest/node_modules/test/index.js',
                '/srv/supertest/node_modules/test/lib/test.js',
                '/srv/supertest/node_modules/test/lib/test2.js'
            ]);

            expect(res).to.eql(
                'require.register(\'test\', function(module, exports, require) {\n' +
                'var test1 = require("./lib/test.js");\n' +
                '});\n' +
                'require.register(\'test/lib/test.js\', function(module, exports, require) {\n' +
                'var test2 = require("./test2.js");\n' +
                '});\n' +
                'require.register(\'test/lib/test2.js\', function(module, exports, require) {\n' +
                'console.log("Test 2");\n' +
                '});\n'
            );
            
            grepSubmodulesStub.restore();
        });
    });

    describe('join', function() {
        var superjoin;

        beforeEach(function() {
            process.chdir(path.join(__dirname, './fixtures/'));
            superjoin = new Superjoin();
        });

        it('Should build a superjoin bundle', function() {
            var expected = fs.readFileSync('../fixtures-build/build.js', { encoding: 'utf8' });
            superjoin.root = 'public';
            
            var res = superjoin.join([
                "module2",
                "module3"
            ], './modules/module1/index.js');

            grunt.file.write('tmp/bundle.js', res);
            expect(res).to.eql(expected);
        });
    });
});