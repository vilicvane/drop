'use strict';

let noneZeroDigit = /[1-9]/;

let decimalDigit = /[0-9]/;
let decimalDigits = {
    regexes: decimalDigit,
    repeat: '+'
};
let decimalDigitsOptional = {
    regexes: decimalDigit,
    repeat: '*'
};

let binaryDigit = /[01]/;
let binaryDigits = {
    regexes: binaryDigit,
    repeat: '+'
};

let octalDigit = /[0-7]/;
let octalDigits = {
    regexes: octalDigit,
    repeat: '+'
};

let hexDigit = /[0-9a-fA-F]/;
let hexDigits = {
    regexes: hexDigit,
    repeat: '+'
};

let exponentIndicator = /[eE]/;

let signedInteger = [
    /[+-]?/,
    decimalDigits
];

let decimalIntegerLiteral = {
    regexes: [
        /0/,
        [
            noneZeroDigit,
            decimalDigitsOptional
        ]
    ],
    or: true
};

let exponentPart = [
    exponentIndicator,
    signedInteger
];

let decimalLiteral = {
    regexes: [
        [
            decimalIntegerLiteral,
            /\./,
            decimalDigitsOptional,
            {
                regexes: exponentPart,
                repeat: '?'
            }
        ],
        [
            /\./,
            decimalDigits,
            {
                regexes: exponentPart,
                repeat: '?'
            }
        ],
        [
            decimalIntegerLiteral,
            {
                regexes: exponentPart,
                repeat: '?'
            }
        ]
    ],
    or: true
};

let binaryIntegerLiteral = [
    /0[bB]/,
    binaryDigits
];

let octalIntegerLiteral = [
    /0[oO]/,
    octalDigits
];

let hexIntegerLiteral = [
    /0[xX]/,
    hexDigits
];

module.exports = [
    {
        regexes: [
            decimalLiteral,
            binaryIntegerLiteral,
            octalIntegerLiteral,
            hexIntegerLiteral
        ],
        or: true
    },
    /(?![a-zA-Z0-9$_])/
];
