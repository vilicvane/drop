'use strict';

const Glob = require('glob');
const RegexTools = require('regex-tools');

let regexFileNames = Glob.sync('src/**/*.regex.js');

for (let filename of regexFileNames) {
    RegexTools.process(filename);
}
