'use strict';

var octo = require('../lib');
var expect = require('chai').expect;
var sinon = require('sinon');
var request = require('request');

describe('push', function() {
    var postStub;

    beforeEach(function(){
        postStub = sinon.stub(request, 'post');
    });

    afterEach(function(){
        postStub.restore();
    });

    it('should pass pkg stream', function() {
        octo.push(new Buffer('hello world'), {
            apiKey: 'KEY',
            server: 'http://localhost',
            name: 'package.tar',
            quiet: true
        });

        var req = postStub.firstCall.args[0];
        expect(req.headers['X-Octopus-ApiKey']).to.equal('KEY');
        expect(req.formData.file.value.toString()).to.equal(new Buffer('hello world').toString());
        expect(req.formData.file.options.filename).to.equal('package.tar');
    });

    describe('build url', function () {
        it('should include `replace` parameter if it is provided', function () {
            octo.push(new Buffer('hello world'), { replace: true, server: 'http://myweb/', name: 'package.tar', apiKey: "KEY"});
            var req = postStub.lastCall.args[0];
            expect(req.url).to.equal('http://myweb/api/packages/raw?replace=true');
        });

        it('should build correct url regardless of trailing slash', function () {
            testUrl('http://myweb', 'http://myweb/api/packages/raw');
            testUrl('http://myweb/', 'http://myweb/api/packages/raw');
        });

        it('should build correct url with port', function () {
            testUrl('http://myweb:3000/', 'http://myweb:3000/api/packages/raw');
        });

        it('should build correct url with relative path', function () {
            testUrl('http://myweb/path/to/octopus', 'http://myweb/path/to/octopus/api/packages/raw');
        });

        function testUrl(host, expected) {
            octo.push(new Buffer('hello world'), { server: host, name: 'package.tar', apiKey: "KEY" });
            var req = postStub.lastCall.args[0];
            expect(req.url).to.equal(expected);
        }
    });

    it('should return response body if request successful', function(done) {
        var body = { prop: 12 };

        octo.push(new Buffer('hello world'), {
            apiKey: 'KEY',
            replace: true,
            server: 'http://localhost',
            name: 'package.tar',
        }, function(err, result) {
            expect(err).to.be.null;
            expect(result).to.eql(body);
            done();
        });

        var callback = postStub.firstCall.args[1];
        callback(null, {statusCode: 200}, body);
    });
});