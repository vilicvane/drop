'use strict';

module.exports = function (wallaby) {
    return {
        files: [
            'test/mocha.js',
            'src/**/*.ts',
            '!src/test/**/*.ts'
        ],
        tests: [
            'src/test/**/*-test.ts'
        ],
        env: {
            type: 'node'
        },
        testFramework: 'mocha',
        setup() {
            require('./test/mocha');
        }
    };
};
