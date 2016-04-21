'use strict';

var Superjoin = require('../modules/superjoin');
var CoTasks = require('co-tasks');

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
});
