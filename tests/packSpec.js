'use strict';

var octo = require('../lib');
var fs = require('fs');
var expect = require('chai').expect;
var sinon = require('sinon');

describe('pack', function() {

    it('can create a stream', function (done) {
        octo.pack({bypassDisk: true, quiet: true}, function (err, data) {
            expect(err).to.be.null;
            expect(data.name).to.not.be.null;
            expect(data.stream.readable).to.be.true;
            done();
        }).append('buffer files/hello.txt', new Buffer('hello world'), {date: new Date(2011, 11, 11)})
            .append('stream.txt', fs.createReadStream('./package.json'))
            .append('lib/pack.js')
            .finalize();
    });

    it('can create a file', function (done) {
        octo.pack({outFolder: './temp', quiet: true}, function (err, data) {
            expect(err).to.be.null;
            expect(data.name).not.to.be.null;
            expect(data.path.indexOf('temp')).to.not.equal(-1);

            fs.exists(data.path, function (exists) {
                expect(exists).to.be.true;
                fs.unlinkSync(data.path);
                done();
            });
        }).append('buffer files/hello.txt', new Buffer('hello world'), {date: new Date(2011, 11, 11)})
            .append('stream.txt', fs.createReadStream('./package.json'))
            .append('lib/pack.js')
            .finalize();
    });

    it('can add files with glob', function (done) {
        octo.pack({outFolder: './temp', quiet: true}, function (err, data) {
            expect(err).to.be.null;
            console.log(data.path);
            expect(fs.existsSync(data.path)).to.be.true;
            fs.unlinkSync(data.path);
            done();
        }).finalize();
    });

    it('can create tar.gz', function (done) {
        octo.pack({quiet: true, format: 'tar.gz', bypassDisk: true}, function (err, data) {
            expect(data.name).not.to.be.null;
            expect(data.name.indexOf('.tar.gz', data.name.length - 7)).to.not.equal(-1);
            done();
        }).append('file.txt', new Buffer('hello world'))
        .finalize();
    });

    it('defaults to zip', function (done) {
        octo.pack({quiet: true, bypassDisk: true}, function (err, data) {
            expect(data.name).not.to.be.null;
            expect(data.name.indexOf('.zip', data.name.length - 4)).to.not.equal(-1);
            done();
        }).append('file.txt', new Buffer('hello world'))
            .finalize();
    });

    it('can\'t create nupkg', function () {
        expect(function(){ octo.pack({outFolder: null, dependencies: 'none', quiet: true, format: 'nupkg'}); }).to
            .throw('Currently unable to support .nupkg file. Please use .tar.gz or .zip');
    });

    it('can pass through custom id and version', function (done) {
        octo.pack({id: 'MYAPP', version: '4.2.0', quiet: true, format: 'zip', bypassDisk: true}, function (err, data) {
            expect(data.name).not.to.be.null;
            expect(data.name.indexOf('MYAPP.4.2.')).to.equal(0);
            done();
        }).append('file.txt', new Buffer('hello world'))
            .finalize();
    });
});