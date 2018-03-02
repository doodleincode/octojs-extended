'use strict';

var octo = require('./index');
var fs = require('fs');
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
      apikey: 'KEY',
      host: 'http://localhost',
      name: 'package.tar',
        quiet:true
    });

    var req = postStub.firstCall.args[0];
    expect(req.headers['X-Octopus-ApiKey']).to.equal('KEY');
    expect(req.formData.file.value.toString()).to.equal(new Buffer('hello world').toString());
    expect(req.formData.file.options.filename).to.equal('package.tar');
  });

  describe('build url', function () {
    it('should include `replace` parameter if it is provided', function () {
      octo.push(new Buffer('hello world'), { replace: true, host: 'http://myweb/', name: 'package.tar' });
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
      octo.push(new Buffer('hello world'), { host: host, name: 'package.tar' });
      var req = postStub.lastCall.args[0];
      expect(req.url).to.equal(expected);
    }
  });

  it('should return response body if request successful', function(done) {
    var body = { prop: 12 };

    octo.push(new Buffer('hello world'), {
      apikey: 'KEY',
      replace: true,
      host: 'http://localhost',
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

describe('pack', function() {

  it('can create a stream', function (done) {

      /*
      octo.pack({files: "./package.json", bypassDisk: true}, function (err, data) {
        expect(err).to.be.null;
        expect(data.stream.readable).to.be.true;
        done();
    });
    */
    octo.pack({bypassDisk: true, dependencies: 'none', quiet: true})
        .append('buffer files/hello.txt', new Buffer('hello world'), {date: new Date(2011, 11, 11)})
        .append('stream.txt', fs.createReadStream('./package.json'))
        .append('lib/pack.js')
        .finalize(function (err, data) {
            expect(err).to.be.null;
            expect(data.name).to.not.be.null;
            expect(data.stream.readable).to.be.true;
            done();
        });
      });

  it('can create a file', function (done) {

    octo.pack({outDir: './temp', dependencies: 'none', quiet: true})
        .append('buffer files/hello.txt', new Buffer('hello world'), {date: new Date(2011, 11, 11)})
        .append('stream.txt', fs.createReadStream('./package.json'))
        .append('lib/pack.js')
        .finalize(function (err, data) {
            expect(err).to.be.null;
            //expect(data.size).to.be.above(0);
            expect(data.name).not.to.be.null;
            expect(data.path.indexOf('temp')).to.not.equal(-1);

            fs.exists(data.path, function (exists) {
                expect(exists).to.be.true;
                done();
            });
        });
  });

  it('can add files with glob', function (done) {
      octo.pack({outDir: './temp', dependencies: 'none', quiet: true})
          .append('lib/*.js')
          .finalize(function (err, data) {
              expect(err).to.be.null;
              fs.exists(data.path, function (exists) {
                  expect(exists).to.be.true;
                  done();
              });
          });
      });

  it('defaults to tar.gz', function (done) {
    octo.pack({outDir: null, dependencies: 'none', quiet: true})
        .append('file.txt', new Buffer('hello world'))
        .finalize(function (err, data) {
          expect(data.name).not.to.be.null;
          expect(data.name.indexOf('.tar.gz', data.name.length - 7)).to.not.equal(-1);
          done();
        });
  });

  it('can create zip', function (done) {
    octo.pack({outDir: null, dependencies: 'none', quiet: true, format: 'zip'})
        .append('file.txt', new Buffer('hello world'))
        .finalize(function (err, data) {
          expect(data.name).not.to.be.null;
          expect(data.name.indexOf('.zip', data.name.length - 4)).to.not.equal(-1);
          done();
        });
  });

  it('can\'t create nupkg', function () {
    expect(function(){ octo.pack({outDir: null, dependencies: 'none', quiet: true, format: 'nupkg'}); }).to
        .throw('Currently unable to support .nupkg file. Please use .tar.gz or .zip');
  });

  it('can pass through custom id and version', function (done) {
    octo.pack({packageId: 'MYAPP', packageVersion: '4.2.0', outDir: null, dependencies: 'none', quiet: true, format: 'zip'})
        .append('file.txt', new Buffer('hello world'))
        .finalize(function (err, data) {
          expect(data.name).not.to.be.null;
          expect(data.name.indexOf('MYAPP.4.2.')).to.equal(0);
          done();
        });
  });
});
