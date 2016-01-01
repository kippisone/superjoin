'use strict';

var path = require('path');

var Superjoin = require('../modules/superjoin');
var CoTasks = require('co-tasks');
var test = require('coffeebreak-expection');
var fl = require('node-fl');

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

    describe('configure', function() {
        it('Should configure superjoin', function(done) {
            var superjoin = new Superjoin();

            var conf = {

            };

            superjoin.configureTask(conf).then(function(conf) {
                test(superjoin).toHaveProps({
                    root: process.cwd(),
                    umd: false,
                    umdDependencies: false,
                    skipSubmodules: false,
                    confFiles: [
                        process.cwd() + '/superjoin.json',
                        process.cwd() + '/package.json'
                    ],
                    workingDir: process.cwd()
                });

                done();
            }).catch(function(err) {
                done(err);
            });
        });

        it('Should configure using a superjoin.json file', function(done) {
            var superjoin = new Superjoin();

            var conf = {
                workingDir: path.join(__dirname, 'fixtures')
            };

            superjoin.configureTask(conf).then(function(conf) {
                test(superjoin).toHaveProps({
                    root: path.join(__dirname, 'fixtures', 'public/'),
                    umd: false,
                    umdDependencies: false,
                    skipSubmodules: false,
                    confFiles: [
                        path.join(__dirname, 'fixtures') + '/superjoin.json',
                        path.join(__dirname, 'fixtures') + '/package.json'
                    ],
                    workingDir: path.join(__dirname, 'fixtures'),
                    files: [
                        './modules/module1/index.js',
                        'module2',
                        'module3'
                    ],
                    name: 'superjoin'
                });

                done();
            }).catch(function(err) {
                done(err);
            });
        });

        it('Should override configuration options', function(done) {
            var superjoin = new Superjoin();

            var initConf = {
                root: 'foo/bar',
                umd: true,
                umdDependencies: true,
                skipSubmodules: true,
                confFiles: ['/foo/bar.json'],
                workingDir: '/foo/bar'
            };

            superjoin.configureTask(initConf).then(function(conf) {
                 test(superjoin).toHaveProps({
                    root: path.join(initConf.workingDir, 'foo/bar'),
                    umd: true,
                    umdDependencies: true,
                    skipSubmodules: true,
                    confFiles: ['/foo/bar.json'],
                    workingDir: '/foo/bar'
                });

                done();
            }).catch(function(err) {
                done(err);
            });
        });
    });

    describe('collect', function() {
        it('Should collect modules', function(done) {
            var superjoin = new Superjoin({
                workingDir: path.join(__dirname + '/fixtures')
            });

            // required tasks
            superjoin.run(['configure', 'collect']).then(function(conf) {
                test(superjoin).toHaveProps({
                    root: path.join(__dirname, 'fixtures/public/'),
                    umd: false,
                    umdDependencies: false,
                    skipSubmodules: false,
                    confFiles: [
                        path.join(__dirname, 'fixtures') + '/superjoin.json',
                        path.join(__dirname, 'fixtures') + '/package.json'
                    ],
                    workingDir: path.join(__dirname, 'fixtures'),
                    files: [
                        './modules/module1/index.js',
                        'module2',
                        'module3'
                    ],
                    name: 'superjoin'
                });

                expect(superjoin.scripts).to.eql([{
                    path: './modules/module1/index.js',
                    source: 'require.register(\'./modules/module1/index.js\', function(module, exports, require) {\nmodule.exports = function() {\n    \'use strict\';\n    \n};\n});\n',
                    src: '/home/andi/Webprojects/superjoin/tests/fixtures/public/modules/module1/index.js'
                }, {
                  path: 'module2/index.js',
                  source: 'require.alias[\'module2\'] = \'module2/index.js\';\nrequire.register(\'module2/index.js\', function(module, exports, require) {\nmodule.exports = function() {\n    \'use strict\';\n    return \'Module 2\';  \n};\n});\n',
                  src: '/home/andi/Webprojects/superjoin/tests/fixtures/node_modules/module2/index.js'
                }, {
                  path: 'module3/browser.js',
                  source: 'require.alias[\'module3\'] = \'module3/browser.js\';\nrequire.register(\'module3/browser.js\', function(module, exports, require) {\nmodule.exports = function() {\n    \'use strict\';\n    return \'Module 3 browser\';  \n};\n});\n',
                  src: '/home/andi/Webprojects/superjoin/tests/fixtures/node_modules/module3/browser.js'
                }]);

                done();
            }).catch(function(err) {
                done(err);
            });
        });
    });

    describe('build', function() {
        it('Should build a bundle', function(done) {
            var superjoin = new Superjoin({
                workingDir: path.join(__dirname + '/fixtures')
            });

            // required tasks
            superjoin.run(['configure', 'collect', 'build']).then(function(conf) {
                expect(superjoin.bundle).to.eql(
                    fl.read(path.join(__dirname, '../public/require.js')) +
                    'require.register(\'./modules/module1/index.js\', function(module, exports, require) {\nmodule.exports = function() {\n    \'use strict\';\n    \n};\n});\n' +
                    'require.alias[\'module2\'] = \'module2/index.js\';\nrequire.register(\'module2/index.js\', function(module, exports, require) {\nmodule.exports = function() {\n    \'use strict\';\n    return \'Module 2\';  \n};\n});\n' +
                    'require.alias[\'module3\'] = \'module3/browser.js\';\nrequire.register(\'module3/browser.js\', function(module, exports, require) {\nmodule.exports = function() {\n    \'use strict\';\n    return \'Module 3 browser\';  \n};\n});\n'
                );

                done();
            }).catch(function(err) {
                done(err);
            });
        });
    });
});
