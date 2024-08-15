var cp = require('child_process');
var sq = require('shell-quote');

var MECAB_LIB_PATH =
    process.env.MECAB_LIB_PATH ?
    process.env.MECAB_LIB_PATH :
    '/opt/mecab';

var buildCommand = function (text) {
    return 'LD_LIBRARY_PATH=' + MECAB_LIB_PATH + ' ' +
        sq.quote(['echo', text]) + ' | ' + MECAB_LIB_PATH + '/bin/mecab';
};

var execMecab = function (text, callback) {
    var command = buildCommand(text);
    cp.exec(command, function(err, stdout, stderr) {
        if (err) {
            return callback(err);
        }
        callback(null, stdout);
    });
};

var execMecabSync = function (text) {
    var command = buildCommand(text);
    try {
        var stdout = cp.execSync(command);
        return stdout.toString();
    } catch (err) {
        console.error("Error executing mecab:", err);
        throw err;
    }
};

var parse = function (text, method, callback) {
    execMecab(text, function (err, result) {
        if (err) { return callback(err); }

        result = result.split('\n').reduce(function(parsed, line) {
            var elems = line.split('\t');

            if (elems.length > 1) {
                return parseFunctions[method](parsed, elems);
            } else {
                return parsed;
            }
        }, []);

        callback(null, result);
    });
};

var parseSync = function (text, method) {
    var result = execMecabSync(text);

    return result.split('\n').reduce(function(parsed, line) {
        var elems = line.split('\t');

        if (elems.length > 1) {
            return parseFunctions[method](parsed, elems);
        } else {
            return parsed;
        }
    }, []);
};

var parseFunctions = {
    'pos': function (result, elems) {
        result.push([elems[0]].concat(elems[1].split(',')[0]));
        return result;
    },

    'morphs': function (result, elems) {
        result.push(elems[0]);
        return result;
    },

    'nouns': function (result, elems) {
        var tag = elems[1].split(',')[0];

        if (tag === 'NNG' || tag === 'NNP') {
            result.push(elems[0]);
        }

        return result;
    }
};

var pos = function (text, callback) {
    parse(text, 'pos', callback);
};

var morphs = function (text, callback) {
    parse(text, 'morphs', callback);
};

var nouns = function (text, callback) {
    parse(text, 'nouns', callback);
};

var posSync = function (text) {
    return parseSync(text, 'pos');
};

var morphsSync = function (text) {
    return parseSync(text, 'morphs');
};

var nounsSync = function (text) {
    return parseSync(text, 'nouns');
};

module.exports = {
    pos: pos,
    morphs: morphs,
    nouns: nouns,
    posSync: posSync,
    morphsSync: morphsSync,
    nounsSync: nounsSync
};
