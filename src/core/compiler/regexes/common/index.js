'use strict';

exports.identifier = /[a-zA-Z$_][0-9a-zA-Z$_]*/;

exports.numericLiteral = require('./numeric-literal');
exports.stringLiteral = require('./string-literal');
