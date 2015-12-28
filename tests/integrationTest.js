'use strict';

var path = require('path');
var fl = require('node-fl');

var Superjoin = require('../modules/superjoin.js');

describe.only('Integration test', function() {
    var modules = ['cjs-module', 'cjs-umd'];

    modules.forEach(function(testName) {
        describe('Test ' + testName, function() {
            it('Should run a ' + testName + ' build', function(done) {
                var superjoin = new Superjoin({
                    workingDir: path.join(__dirname, testName),
                    scriptFile: 'build.js'
                });

                superjoin.map().then(function(data) {
                    console.log('DONE', data);
                    expect(superjoin.bundle).to.be.eql(fl.read(path.join(__dirname, testName, 'expected.js')));
                    done();
                }).catch(function(err) {
                    console.log('DONE', err);
                    done(err); 
                });
            });
        });
    });
});