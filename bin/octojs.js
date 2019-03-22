#!/usr/bin/env node

const program = require('commander');

program
  .command('pack','Creates a package (.zip, .tar or .targz) from files on disk')
  .command('push','Pushes a package to the Octopus built-in repository')
  .command('version','Output Octo command line tool version')
  .parse(process.argv);
