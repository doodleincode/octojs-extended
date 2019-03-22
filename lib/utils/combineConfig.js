var path = require("path");
var readJsonFileSync = require("./readJsonFileSync");

module.exports = function combineConfig(args) {
    args.root = args.root || process.cwd();
    return Object.assign(loadConfig(args.root, args.configFile), args)
}


function loadConfig(root, configFile) {
    var pkgPath = path.resolve(root, 'octopack.json');

    if (configFile) {
        pkgPath = configFile;
    }


    try {
        return readJsonFileSync(pkgPath, true);
    } catch (e) {
        // No override was provided, config must be empty
        if(!configFile) {
            return {};
        }
    }

    //Perhaps the config path was a directory and not file?
    try {
        pkgPath = path.resolve(pkgPath, 'octopack.json');
        return readJsonFileSync(pkgPath, true);
    } catch (e) {
        throw new Error('Unable to load config file at ' + configFile);
    }
}




