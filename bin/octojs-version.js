var readJsonFileSync = require("../lib/utils/readJsonFileSync");
var path = require('path');

var pkgPath = path.join(path.resolve(__dirname), "../", "package.json");
console.log(readJsonFileSync(pkgPath, {throws: true}).version);