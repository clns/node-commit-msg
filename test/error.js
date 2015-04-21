'use strict';

var assert = require('assert');
var Error = require('../lib/error');

describe('Error', function() {

    it('should initialize with message only', function() {
        var e = new Error('Error message');

        assert(e.is(Error.ERROR));
        assert.equal(e.toString(), 'error: Error message');
    });

    it('should initialize with message and type', function() {
        var e = new Error('Error message', Error.WARNING);

        assert(e.is(Error.WARNING));
        assert.equal(e.toString(), 'warning: Error message');
    });

    it('should initialize with message, type and line', function() {
        var e = new Error('Error message', Error.ERROR, [12]);

        assert(e.is(Error.ERROR));
        assert.equal(e.toString(), 'error (12): Error message');
    });

    it('should initialize with message, type, line and column', function() {
        var e = new Error('Error message', Error.ERROR, [12, 32]);

        assert(e.is(Error.ERROR));
        assert.equal(e.toString(), 'error (12,32): Error message');
    });

}); // end Error
