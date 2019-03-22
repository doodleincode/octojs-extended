octopack
====
> A nodejs cli tool for packaging and pushing projects to an Octopus Deploy instance.

**NOTE: This project is currently in a pre-release state and its api is subject to change at any time.**  

# Installation

Either through cloning with git or by using [npm](http://npmjs.org) (the recommended way):

```bash
npm install -g @octopusdeploy/octojs
```

And octojs will be installed globally to your system path.

You can also install octojs as a developement dependency:

```bash
npm install --save-dev @octopusdeploy/octojs
```

With a local installation, octojs will not be available in your system path. Instead, the local installation of octojs can be run by calling it from within an npm script (such as `npm start`).

# Usage

The simplest way to get started is to ask for help

```bash
octojs help
```
each command will also return help details detailing the valid arguments
```bash
octojs help pack
```

## Pack
By default the pack command all files from the base path (defaults to cwd).
To exclude files:
- The `--dependencies` parameter allows you to define precisely which `npm_modules` you want to include
  - `prod` will include just those modules that are defined as non dev dependencies. This is the recommended value.
  - `both` will include all `npm_modules` files. This is the default option
  - `none` will exclude the whole `npm_modules` directory.
 - Passing the `--gitignore` flag will result in the `.gitignore` file at the root location being read, and being used to exclude files from the archive.

To include additional files:
- provide the `octopack.json` file (automatically looked for in working directory or via explicit reference) and include an `includes` array of glob paths.
- if executing through the cli then the `--include` argument can be provided multiple times to specify multiple glob paths.
- if executing through code, then the files can individually be provided by using the `.append()` method. This method allows globs, file paths, buffers or streams. 

### cli
```bash
Usage: octo pack [<options>] [basePath]

  Options:

    --id <packageId>                           Override ID of the package
    --version <packageVersion>                 Override the version of the packag (default from package.json or timestamp)
    -O, --outFolder <directory>                The folder into which the generated package will be written (default '.')
    -D, --dependencies <prod|p|both|b|none|n>  Configure which node_module dependencies should be packaged (default both)
    -G, --gitignore                            Exclude files mathced from .gitignore
    -C, --config <path>                        Path to config file
    -q --quiet                                 Provide minimal output
    -v --verbose                               Provide detailed output
    -d --debug                                 Spam the console with logs
    -h, --help                                 output usage information

  Examples:

    $ octojs pack
    $ octojs pack --outFolder ./dist --format zip
    $ octojs pack -v --dependencies prod --gitignore -O C:\bin
    $ octojs pack --version 2.0.0 C:\Development\OtherApp

NOTE: If the config file is detected at the basePath location or is provided, then its values will be included with cli arguments taking precedence.

```
### code
```javascript
var octo = require('@octopusdeploy\\octojs');
octo.pack({outFolder: "./"}, (err, result) => {
      if(err){
          console.error(err);
      } else {
          console.log('Package: '+ result.name);
          console.log('Path to package: '+ result.path);
      }})
    .append('buffer files/hello.txt', new Buffer('hello world'), {date: new Date(2011, 11, 11)})
    .append('stream.txt', fs.createReadStream('./package.json'))
    .append('lib/pack.js')
    .finalize();
```
### configuration
The octojs commands will look for a file named `octopack.json` and additional arguments will be automatically included in the execution. Arguments supplied via CLI or in-code will override values provided in `octopack.json`

A simple example file might be
```json
{
    "format": "zip",
    "outFolder": "./bin",
    "verbose": false,
    "include": ["dist/**/*", "config/**/*", "nodemon.json", "ReadMe.md", "start.bat"]
}
```
allowing the command to be as simple as
```shell
octojs pack
```


## push
### cli
```bash
  Options:

    --package <file>     Package file to push
    --server <url>       The base URL for your Octopus server - e.g., http://your-octopus/
    --apiKey <key>       Your API key. Get this from the user profile page. If the guest account is enabled, a key of API-GUEST can be used.
    --replace            If the package already exists in the repository, the default behavior is to reject the new package being pushed. You can pass this flag to overwrite the existing package.
    --timeout <seconds>  Timeout in seconds for network operations. (default 600)
    -C, --config <path>  Path to config file
    -q --quiet           Provide minimal output
    -v --verbose         Provide detailed output
    -d --debug           Spam the console with logs
    -h, --help           output usage information

  Examples:

    $ octojs push --package C:\Out\Acme.Web.1.0.zip --apiKey API-SFJ23JSD2312 --server http://octopusserver.acme.com

NOTE: If the config file is detected at the basePath location or is provided, then its values will be included with cli arguments taking precedence.
```

### code
```javascript
var octo = require('@octopusdeploy\\octojs');
 octo.push("./AcmeProject.1.0.0.zip", {
            apiKey: 'API-XXX223123',
            server: 'http://octopus-server'
    }, (err, result) => {
     if(err){
         console.error(err);
     } else {
         console.log("Success!")
     }});
```

# Tests
```shell
    npm test
```
