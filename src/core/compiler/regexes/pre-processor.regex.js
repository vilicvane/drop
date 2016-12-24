'use strict';

const {
    identifier,
    stringLiteral
} = require('./common');

// PRE_START_REGEX

const escapedChar = /\\($escaped:[^])/;
const decoratorTypeMarker = /($type:[#@+]?)/;

const decoratorStart = [
    /\[/,
    decoratorTypeMarker,
    {
        name: 'identifier',
        regexes: identifier
    }
];

const templateStart = /\{($raw:=)?/;

const preStart = {
    regexes: [
        escapedChar,
        decoratorStart,
        templateStart
    ],
    or: true
};

// PRE_TOKEN_REGEX

const anyChar = /[^]/;

const openingBracket = /($openingBracket:[([{])/;
const closingBracket = /($closingBracket:[)\]}])/;

const preToken = {
    regexes: [
        stringLiteral,
        openingBracket,
        closingBracket,
        anyChar
    ],
    or: true
};

exports.options = [
    {
        name: 'preStart',
        target: '../pre-processor.ts',
        flags: 'g',
        regexes: preStart
    },
    {
        name: 'preToken',
        target: '../pre-processor.ts',
        flags: 'g',
        regexes: preToken
    }
];