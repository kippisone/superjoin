describe('Require', function() {
    'use strict';
    
    global.window = {};
    global.location = {
        pathname: '/web_modules/'
    };

    before(function() {
        require('../require.js');
    });

    after(function() {
        delete global.window;
        delete global.location;
    });

    describe('require', function() {
        it('Should be a function', function() {
            expect(window.require).to.be.a('function');
        });
    });

    describe('resolve', function() {
        it('Should be a function', function() {
            expect(window.require.resolve).to.be.a('function');
        });

        it('Should resolve a module name', function() {
            expect(window.require.resolve('./module1.js')).to.be('./web_modules/module1.js');
        });

        it('Should resolve a module name, without ext', function() {
            expect(window.require.resolve('./module1')).to.be('./web_modules/module1.js');
        });

        it('Should resolve a module name, using a json file', function() {
            expect(window.require.resolve('./module1.json')).to.be('./web_modules/module1.json');
        });

        it('Should resolve a module name, using a node_module', function() {
            expect(window.require.resolve('module1')).to.be('module1');
        });
    });
});