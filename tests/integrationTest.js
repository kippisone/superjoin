'use strict';

var path = require('path');
var fl = require('node-fl');

var Superjoin = require('../modules/superjoin.js');

describe.skip('Integration test', function() {
    var modules = ['cjs-module', 'cjs-umd'];

    modules.forEach(function(testName) {
        describe('Test ' + testName, function() {
            it('Should run a ' + testName + ' build', function(done) {
                var superjoin = new Superjoin({
                    workingDir: path.join(__dirname, testName),
                    scriptFile: 'build.js'
                });

                superjoin.build().then(function(data) {
                    expect(superjoin.bundle).to.be.eql(fl.read(path.join(__dirname, testName, 'expected.js')));
                    done();
                }).catch(function(err) {
                    done(err);
                });
            });
        });
    });
});
