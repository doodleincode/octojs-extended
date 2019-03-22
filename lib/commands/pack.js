var readJsonFileSync = require('../utils/readJsonFileSync');
var path = require('path');
var semver = require('semver');
var isReadableStream = require('../utils/isReadableStream');
var isGlob = require('is-glob');
var globby = require('globby');
var archiver = require('archiver');
var log = require('../utils/log');
var fs = require('fs');
var bytesToSize = require("../utils/bytesToSize");
var gitignoreParser = require('parse-gitignore');

var DEPENDENCIES_PROD = 'prod';
var DEPENDENCIES_BOTH = 'both';
var DEPENDENCIES_NONE = 'none';

var DEFAULT_DEPENDENCIES = DEPENDENCIES_BOTH;
var DEFAULT_FORMAT = 'zip';

module.exports = function pack(args, cb) {
  if (!validateArgs(args, cb)) {
    return;
  }

  log.verbose("Root directory is set as "+ args.root);

  var archive = createArchiver(args.format);
  var fileName = getFileName(args.id, args.version, args.format);
  var fullPath = path.resolve(args.outFolder, fileName);

  var output = null;
  if (!args.bypassDisk) {
    output = createOutput(fullPath);
    archive.pipe(output);
  }

  var finalized = false;
  var response = {};
  var appenders = [];

  response.append = function append(name, file, options) {
    if (finalized) {
      throw new Error('Archive already finalized');
    }
    if (Buffer.isBuffer(file) || isReadableStream(file)) {
      name = name.replace(/\\/g, '/') + (!file ? '/' : '');
      options = options || {};
      archive.append(file, {name: name, date: options.date});
    } else {
      name = name.replace(/\\/g, '/');

      if (isGlob(name)) {
        appenders.push(appendGlob(archive, name, file || {}));
      } else {
        var content = typeof file === 'string' ? file : name;
        archive.file(content, {name: name.replace(/\\/g, '/')});
      }
    }
    return response;
  };

  function appendGlob(archive, pattern, opts) {
    var root = args.root;
    var dependencies = opts.dependencies;
    var gitignore = opts.gitignore;

    var ignorePatterns = ['node_modules', `node_modules/**`].concat(gitignore ? gitignoreParser(path.join(root, '.gitignore')) : []);

    if (opts.packignore) {
      ignorePatterns = ignorePatterns.concat(gitignoreParser(path.join(root, '.packignore')));
    }

    if (opts.gitignore) {
      log.verbose(".gitignore file will be used to exclude files. node_modules folder will still be included unless explicitly excluded")
    }

    return new Promise(function (res) {
      archive.glob(pattern, {
        dot: true,
        deep: true,
        ignore: ignorePatterns,
        cwd: args.root
      });
      if (dependencies === DEPENDENCIES_NONE) {
        log.verbose("node_modules directory will be skipped");
      } else if (dependencies === DEPENDENCIES_BOTH) {
        var modules = path.join(root, 'node_modules');
        archive.directory(modules, 'node_modules');
      } else if (dependencies === DEPENDENCIES_PROD) {
        log.verbose("node_modules prod dependencies will be included");
        return appendProdNodeModules(archive, root).then(res);
      }
      res()
    });
  }

  response.finalize = function finalize() {
    if (finalized) {
      throw new Error('Archive already finalized');
    }
    finalized = true;

    Promise.all(appenders)
      .then(closeArchive, (a) => {
        cb(a)
      });

    function closeArchive() {
      var result = {stream: archive, name: fileName};

      if (output) {
        result.path = path.resolve(args.outFolder, fileName);

        output.on('close', function () {
          log.quiet(result.path);
          result.size = archive.pointer();
          cb(null, result);
        });

        archive.finalize();
      } else {
        archive.finalize();
        cb(null, result);
      }
    }
  };

  return response;
};

function createArchiver(type) {
  var archive;
  
  switch (type) {
    case 'targz':
    case 'tar.gz':
      archive = archiver('tar', {gzip: true});
      break;
    case 'tar':
      archive = archiver('tar');
      break;
    case 'zip':
      archive = archiver('zip', { zlib: { level: 9 }});
      break;
  }

  archive.on('error', function (err) {
    throw err;
  });

  archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
      log.warn(err);
    } else {
      throw err;
    }
  });

  archive.on('entry', function(a) {
    log.debug("Adding "+ a.type +" "+ a.sourcePath +" as "+ a.name);
  });

  return archive;
}

function getFileName(id, version, format) {
  var extension;
  
  switch (format) {
    case 'targz':
    case 'tar.gz':
      extension = '.tar.gz';
      break;
    case 'tar':
      extension = '.tar';
      break;
    case 'zip':
      extension = '.zip';
      break;
    default:
      throw new Error('Unknown archive type: '+ type);
  }

  return id +'.'+ version + extension;
}

function appendProdNodeModules(archive, root) {
  //Alternative: https://github.com/arloliu/copy-node-modules/blob/master/index.js
  var cmd = 'npm ls --parseable --prod';
  
  return new Promise((resolve, reject) => {
    require('child_process').exec(cmd, {cwd: root}, (err, stdout, stderr) => {
      if (err) {
        log.warn(stderr);
        reject("Error invoking `npm ls` command.\nEnsure you have run `npm install` first");
      }

      try {
        var modules = stdout.split('\n').filter(mod => mod !== '' && mod !== root);

        if (modules) {
          modules.forEach((modulePath) =>
              archive.directory(modulePath, path.relative(root, modulePath)));
        }
        resolve();
      } catch(err){
        reject(err);
      }
    });
  });
}

function createOutput(fullPath) {
  fs.mkdir(path.dirname(fullPath), function () {});

  var output = fs.createWriteStream(fullPath);

  output.on('close', function () {
    log.info('Created package ' + fullPath +' ('+ bytesToSize(output.bytesWritten) +')');
  });
  output.on('error', function (err) {
    throw err;
  });

  return output;
}

function applyConfigFromPackageJson(args) {
  var pkgPath = path.resolve(args.root, 'package.json');

  try {
    var pkgJson = readJsonFileSync(pkgPath, {throws: true});

    if (!args.version) {
      args.version = pkgJson.version;
    }
    if (!args.id) {
      args.id = pkgJson.name.replace('/', '.').replace('@', '');
    }
  } catch (e) {
    log.info("Unable to find package.json file at " + pkgPath);
  }
}

function validateArgs(args, cb) {
  applyConfigFromPackageJson(args);
  validateDependencies();
  validateId();
  validateVersion();
  validateFormat();
  validateOutFolder();
  validateCallback();
  args.include = args.include || [];

  return true;

  function validateCallback(){
    if(!cb || typeof cb !== "function") {
      throw new Error('A callback function must be provided`');
    }
  }

  function validateOutFolder(){
    args.outFolder = args.outFolder || process.cwd();
  }

  function validateDependencies() {
    switch ((args.dependencies || DEFAULT_DEPENDENCIES).toLowerCase()) {
      case 'production':
      case 'prod':
      case 'p':
        args.dependencies = DEPENDENCIES_PROD;
        return;
      case 'none':
      case 'n':
        args.dependencies = DEPENDENCIES_NONE;
        return;
      case 'both':
      case 'all':
      case 'b':
        args.dependencies = DEPENDENCIES_BOTH;
        return;
    }

    throw new Error('Unknown dependency value `' + args.dependencies + '`. Value values are `prod`, `both` or `none`. Default value is `'+ DEFAULT_DEPENDENCIES +'`');
  }

  function validateId(){
    if (!args.id){
      throw new Error('An ID is required');
    }
  }

  function validateVersion() {
    var version = args.version;

    if (!version){
      var now = new Date();
      args.version = version = `${now.getFullYear()}.${now.getMonth()}.${now.getDate()}-${now.getHours()*10000 + now.getMinutes()*100 + now.getSeconds()}`;
    }
    if (!version || !semver.valid(version)) {
      throw new Error('Version ' + version + ' is not a valid semver version');
    }
  }

  function validateFormat() {
    args.format = args.format || DEFAULT_FORMAT;
    args.format = args.format[0] === '.' ? args.format.substring(1) : args.format;

    if (args.format === "nupkg") {
      throw new Error('Currently unable to support .nupkg file. Please use .tar.gz or .zip');
    }

    if (!["tar.gz", "tar", "zip", "targz"].includes(args.format)){
      throw new Error('Unknown archive type `' + args.format + '`. Value values are `tar.gz`, `tar` or `zip`. Default value is `'+ DEFAULT_FORMAT +'`');
    }
  }
}