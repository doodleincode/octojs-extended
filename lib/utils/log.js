'use strict';


const levels = {
    debug:  0,
    verbose: 1,
    info: 2,
    quiet: 3
}


var level = levels.info;

module.exports = {
    debug: function(line) {if(level === levels.debug) { console.log(line); }},
    verbose: function(line) {if(level <= levels.verbose) { console.log(line); }},
    info: function(line) {if(level <= levels.info) { console.info(line); }},
    warn: function(line) {if(level <= levels.info) { console.warn(line); }},
    error: function(line) {if(level <= levels.info) { console.error(line); }},
    quiet: function(line) {if(level === levels.quiet) { console.log(line); }},
    setLevel: function(logLevel) {
        if(typeof logLevel === "string") {
            setLevelFromString(logLevel);
        } else {
            setLevelFromArgs(logLevel);
        }
    }
};

function setLevelFromArgs(args) {
    if (args.quiet) {
        setLevelFromString("quiet");
    }
    if (args.verbose) {
        setLevelFromString("verbose");
    }
    if (args.debug) {
        setLevelFromString("debug");
    }
}

function setLevelFromString(logLevel){
    if(logLevel === 'quiet') {
        level = levels.quiet;
    } else if (logLevel === 'verbose') {
        level = levels.verbose;
    } else if (logLevel === 'debug') {
        level = levels.debug;
    }else {
        console.warn('Unknown log level `'+ logLevel + '`')
    }
}

