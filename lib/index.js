var log = require('./utils/log');
var combineConfig = require('./utils/combineConfig');
var pack = require("./commands/pack");
var push = require("./commands/push");

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

module.exports = {
  pack: function (args, cb) {
    args = combineConfig(args);
    log.setLevel(args);
    return pack.apply(null, [args, cb]);
  },
  push: function (file, args, cb) {
    args = combineConfig(args);
    log.setLevel(args);
    return push.apply(null, [file, args, cb]);
  }
};