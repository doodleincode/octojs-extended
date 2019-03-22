const program = require('commander');

program
    .option('--package <file>', 'Package file to push')
    .option('--server <url>', 'The base URL for your Octopus server - e.g., http://your-octopus/')
    .option('--apiKey <key>', 'Your API key. Get this from the user profile page. ' +
        'If the guest account is enabled, a key of API-GUEST can be used.')
    .option('--replace', 'If the package already exists in the repository, ' +
        'the default behavior is to reject the new package being pushed. ' +
        'You can pass this flag to overwrite the existing package.')
    .option('--timeout <seconds>', 'Timeout in seconds for network operations. (default 600)')
    .option('-C, --config <path>', 'Path to config file')
    .option('-q --quiet', 'Provide minimal output')
    .option('-v --verbose', 'Provide detailed output')
    .option('-d --debug', 'Spam the console with logs')
    .on('--help', function() {
        console.log();
        console.log('  Examples:');
        console.log();
        console.log('    $ octojs push --package C:\\Out\\Acme.Web.1.0.zip --apiKey API-SFJ23JSD2312 --server http://octopusserver.acme.com');
        console.log();
        console.log('NOTE: If the config file is detected at the basePath location or is provided, then its values will be included with cli arguments taking precedence.');
    })
    .parse(process.argv);

var args = {
    package: program.package,
    apiKey: program.apiKey,
    server: program.server,
    replace: program.replace,
    timeout: program.timeout,
    configFile: program.config,
    debug: program.debug,
    verbose: program.verbose,
    quiet: program.quiet,
    cli: true
};
for (const i in args)
    if (typeof args[i] === 'undefined')
        delete args[i];


try {
    require("../lib/index")["push"](args.package, args, function (err, suc) {
        if(err) {
            console.error(err.body || err);
            process.exit(1);
        }
    });
}catch(err){
    console.error(err.body || err);
    process.exit(1);
}

