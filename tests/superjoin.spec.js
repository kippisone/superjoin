describe('Superjoin', function() {
    'use strict';

    var Superjoin = require('../superjoin');
    
    describe('resolve', function() {
        var superjoin;
        beforeEach(function() {
            superjoin = new Superjoin();
            superjoin.root = '/srv/supertest';
        });

        afterEach(function() {

        });

        it('Should resolve a relative filepath', function() {
            expect(superjoin.resolve('./test/module.js')).to.eql({
                name: './test/module.js',
                path: '/srv/supertest/test/module.js'
            });
        });

        it('Should resolve a relative filepath without a file ext', function() {
            expect(superjoin.resolve('./test/module')).to.eql({
                name: './test/module.js',
                path: '/srv/supertest/test/module.js'
            });
        });

        it('Should resolve a relative filepath of a json file', function() {
            expect(superjoin.resolve('./test/conf.json')).to.eql({
                name: './test/conf.json',
                path: '/srv/supertest/test/conf.json'
            });
        });

        it('Should resolve a relative filepath of a min file', function() {
            expect(superjoin.resolve('./test/conf.min')).to.eql({
                name: './test/conf.min.js',
                path: '/srv/supertest/test/conf.min.js'
            });
        });

        it('Should resolve an absolute filepath', function() {
            expect(superjoin.resolve('/srv/www/test/module.js')).to.eql({
                name: '/srv/www/test/module.js',
                path: '/srv/www/test/module.js'
            });
        });

        it('Should resolve an absolute filepath without ext', function() {
            expect(superjoin.resolve('/srv/www/test/module')).to.eql({
                name: '/srv/www/test/module.js',
                path: '/srv/www/test/module.js'
            });
        });

        it('Should resolve an absolute filepath of a json file', function() {
            expect(superjoin.resolve('/srv/www/test/conf.json')).to.eql({
                name: '/srv/www/test/conf.json',
                path: '/srv/www/test/conf.json'
            });
        });

        it('Should resolve a module using node_modules dir', function() {
            expect(superjoin.resolve('module')).to.eql({
                name: '/srv/supertest/node_modules/module/index.js',
                path: '/srv/supertest/node_modules/module/index.js'
            });
        });
    });
});