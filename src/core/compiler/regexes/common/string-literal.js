'use strict';

// TODO: this is copied from previous developing version, rewrite it later.

let quote = /($~stringQuote:["'])/;
let ending = /($stringQuote)|($stringUnexpectedEnd:)/;

let singleEscapeChar = /['"\\bfnrtv]/;
let nonEscapeChar = /[^'"\\bfnrtv\dxu\r\n\u2028\u2029]/;

let hexEscapeSequence = /x[\da-fA-F]{2}/;
let unicodeEscapeSequence = /u[\da-fA-F]{4}/;

let zeroNotFollowedByDigit = /0(?!\d)/;

let charEscapeSequence = {
    regexes: [
        singleEscapeChar,
        nonEscapeChar
    ],
    or: true
};

let slashEscapeSequence = [
    /\\/,
    {
        regexes: [
            charEscapeSequence,
            zeroNotFollowedByDigit,
            hexEscapeSequence,
            unicodeEscapeSequence
        ],
        or: true
    }
];

let lineContinuation = /\\(?:\r?\n|\r(?!\n)|[\u2028\u2029])/;

let unescapedStringChar = /(?!($stringQuote)|[\\\r\n\u2028\u2029])[\s\S]/;

let optionalStringChars = {
    regexes: [
        unescapedStringChar,
        slashEscapeSequence,
        lineContinuation
    ],
    or: true,
    repeat: '*'
};

let stringLiteral = [
    quote,
    optionalStringChars,
    ending
];

module.exports = stringLiteral;
