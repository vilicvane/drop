'use strict';

const {
    identifier,
    stringLiteral
} = require('./common');

// PRE_START_REGEX

const escapedChar = /\\($escaped:[^])/;
const decoratorStartChar = /\[/;
const typeMarker = /($type:[#@+]?)/;

const name = {
    name: 'name',
    regexes: /[0-9a-zA-Z$_-]+/
};

const label = {
    regexes: [
        /:/,
        {
            name: 'label',
            regexes: identifier
        }
    ],
    repeat: '?'
};

const model = {
    regexes: [
        /=/,
        {
            name: 'model',
            regexes: [
                identifier,
                {
                    regexes: [
                        /\./,
                        identifier
                    ],
                    repeat: '*'
                }
            ]
        }
    ],
    repeat: '?'
};

const decoratorStart = [
    decoratorStartChar,
    typeMarker,
    name,
    label,
    model
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
