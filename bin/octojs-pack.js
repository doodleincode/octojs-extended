var program = require('commander');
var log = require('../lib/utils/log');
var combineConfig = require('../lib/utils/combineConfig');

function multiOption(val, list) {
  list = list || [];
  list.push(val);
  return list;
}

program
  .option('--id <packageId>', 'Override ID of the package')
  .option('--version <packageVersion>', 'Override the version of the packag (default from package.json or timestamp)')
  .option('-O, --outFolder <directory>', 'The folder into which the generated package will be written (default \'.\')')
  //.option('-I, --include <path>', '[Multiple] Add a file pattern to include, relative to the base path e.g. /bin/-', multiOption)
  .option('-D, --dependencies <prod|p|both|b|none|n>', 'Configure which node_module dependencies should be packaged (default both)')
  .option('-G, --gitignore', 'Exclude files matched from .gitignore')
  .option('--packignore', 'Exclude files specified in .packignore')
  .option('-F, --format <zip|tar|targz>', 'Archive file format')
  .option('-C, --config <path>', 'Path to config file')
  .option('-q --quiet', 'Provide minimal output')
  .option('-v --verbose', 'Provide detailed output')
  .option('-d --debug', 'Spam the console with logs')
  .on('--help', function() {
    console.log();
    console.log('  Examples:');
    console.log();
    console.log('    $ octojs pack');
    console.log('    $ octojs pack --outFolder ./dist --format zip');
    console.log('    $ octojs pack -v --dependencies prod --gitignore -O C:\\bin');
    console.log('    $ octojs pack --version 2.0.0 C:\\Development\\OtherApp');
    console.log();
    console.log('NOTE: If the config file is detected at the basePath location or is provided, then its values will be included with cli arguments taking precedence.');
  })
  .parse(process.argv);

if (program.args.length > 1) {
  console.error("  error: unknown option '"+ program.args[0] +"'");
  process.exit(1);
};

var args = {
  id: program.id,
  version: typeof program.version === "function" ? undefined : program.version,
  outFolder: program.outFolder,
  dependencies: program.dependencies,
  format: program.format,
  //include: program.include,
  configFile: program.config,
  debug: program.debug,
  verbose: program.verbose,
  gitignore: program.gitignore,
  packignore: program.packignore,
  quiet: program.quiet,
  root: program.args[0],
  cli: true
};

for (const i in args) {
  if (typeof args[i] === 'undefined') {
    delete args[i];
  }
}

try {
  args = combineConfig(args);
  log.setLevel(args);

  var pack = require("../lib/index")["pack"](args, function (err, suc) {
    if (err) {
      console.error(err.message || err);
      process.exit(1);
    }
  }).append("**/*", args)
      .finalize();
} catch(err) {
  console.error(err.message || err);
  process.exit(1);
}
