'use strict';

const {
    identifier,
    numericLiteral,
    stringLiteral
} = require('./common');

// TOKEN_REGEX

const punctuation = /($punctuation:[(){}[\],.?:])/;
const operator = /($operator:[!=]==?|[<>]=?|[-+*/%]|&&|\|\|)/;
const whitespace = /\s+/;
const unexpectedToken = /($unexpectedToken:[0-9a-zA-Z$_]+|[^])/;

const token = {
    regexes: [
        {
            name: 'identifier',
            regexes: identifier
        },
        {
            name: 'stringLiteral',
            regexes: stringLiteral
        },
        {
            name: 'numericLiteral',
            regexes: numericLiteral
        },
        punctuation,
        operator,
        whitespace,
        unexpectedToken
    ],
    or: true
};

exports.options = [
    {
        name: 'token',
        target: '../tokenizer.ts',
        flags: 'g',
        regexes: token
    }
];
