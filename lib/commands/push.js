var url = require('url');
var isReadableStream = require('../utils/isReadableStream');


var path = require('path');
var fs = require('fs');
var request = require('request');
var streamToBuffer = require('stream-to-buffer');
var log = require('../utils/log');

var DEFAULT_TIMEOUTSECONDS = 600;

function validateFile(file) {
    if(!file){
        throw new Error("No file has been provided to be pushed");
    }
    return true;
}

module.exports = function push(file, options, cb) {
    if(!validateFile(file) || !validateArgs(options, cb)) return;

    if(isReadableStream(file)) {
        streamToBuffer(file, function (err, buffer) {
            if(err){
                cb(err);
            } else {
                performPost(buffer);
            }
        });
    } else {
        performPost(file);
    }

    function performPost(fileBytes) {

        var requestOptions = {
            url: getUri(options),
            headers: {
                'X-Octopus-ApiKey': options.apiKey
            },
            formData: extractFormData(fileBytes, options),
            json: true,
            timeout: (options.request | DEFAULT_TIMEOUTSECONDS) * 1000
        };

        log.info('Pushing to ' + requestOptions.url);
        request.post(requestOptions, function (err, resp, body) {
            if (err) {
                cb(err);
            } else {
                log.info('Push response ' + resp.statusCode +' - '+ resp.statusMessage);
                if (resp.statusCode === 200 || resp.statusCode === 201) {
                    cb(null, body);
                } else {
                    cb({
                        statusCode: resp.statusCode,
                        statusMessage: resp.statusMessage,
                        body: body,
                        response: resp
                    });
                }
            }
        });
    }

    function getUri(options) {
        var packageUri = options.server.replace(/\/?$/, '/');

        packageUri = url.resolve(packageUri, 'api/packages/raw');
        if (!!options.replace) {
            packageUri += '?replace=true';
        }
        return packageUri;
    }

    function extractFormData(file, options) {

        var fileContents;
        var fileName = options.name;
        if (typeof file === 'string') {
            fileContents = fs.createReadStream(file);
            fileName = fileName || file;
        } else if (Buffer.isBuffer(file) || isReadableStream(file)) {
            fileContents = file;
        }

        if (!fileName) {
            throw new Error('Filename is missing from options');
        }

        return {
            file: {
                value: fileContents,
                options: {
                    filename: path.basename(fileName),
                    contentType: 'application/octet-stream'
                }
            }
        };
    }
}

function validateArgs(args, cb) {
    validateApiKey();
    validateServerUrl();

    return true;

    function validateApiKey() {
        if(!args.apiKey) {
            throw new Error("You must provide an API key to access the Octopus Server.")
        }
    }

    function validateServerUrl() {
        if(!args.server) {
            throw new Error("You must provide the server address to access the Octopus Server.");
        }
        try{
            new url.Url(args.server)
        } catch(ex){
            throw new Error('Server argument `'+ args.server +'` does not appear to be a valid url');
        }
    }
}