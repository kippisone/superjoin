describe('Browser require module', function() {
    'use strict';

    var testPaths = [
        { from: './index.js', to: './foo.js', res: './foo.js'},
        { from: './index.js', to: 'foo.js', res: './foo.js'},
        { from: './bar/index.js', to: '../foo.js', res: './foo.js'},
        { from: './foo/bar/bla/blubb.js', to: '../../../index.js', res: './index.js'},
        { from: './index.js', to: 'mymodule', res: 'mymodule'},
        { from: './index.js', to: 'mymodule.js', res: 'mymodule.js', noFile: true},
        { from: './index.js', to: 'mymodule.js/lib/mymodule.js', res: 'mymodule.js/lib/mymodule.js', noFile: true},
        { from: 'mymodule', to: './lib/bla', res: 'mymodule/lib/bla.js'},
        { from: 'mymodule', to: 'othermodule', res: 'othermodule', noFile: true},
        { from: 'mymodule', to: 'othermodule/bla.js', res: 'othermodule/bla.js', noFile: true},
    ];
    
    global.window = {};
    global.location = {
        pathname: '/web_modules/'
    };

    before(function() {
        require('../public/require.js');
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
        testPaths.forEach(function(p) {
            it('Should resolve a path from ' + p.to + ' to ' + p.res, function() {
                var moduleExistsStub = sinon.stub(window.require, 'moduleExists');
                moduleExistsStub.returns(!!p.noFile);
                moduleExistsStub.withArgs('.').returns(false);
                expect(window.require.resolve(p.from, p.to)).to.eql(p.res);
                moduleExistsStub.restore();
            });
        });
    });
});