var fs = require('fs');

module.exports = function readJsonFileSync(file, shouldThrow) {
    try {
        var content = fs.readFileSync(file);
        return JSON.parse(stripBom(content))
    } catch (err) {
        if (shouldThrow) {
            err.message = file + ': ' + err.message;
            throw err
        } else {
            return null
        }
    }
}

function stripBom (content) {
    // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
    if (Buffer.isBuffer(content)) content = content.toString('utf8');
    return content.replace(/^\uFEFF/, '');
}