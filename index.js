var San;
var map = window.__SAN_HOT_MAP__ = {};
var installed = false;

exports.install = function (san) {
    if (installed) {
        return;
    }
    installed = true;

    San = san.__esModule ? san.default : san;

};

exports.createRecord = function (id, options) {
    makeOptionsHot(id, options);
    map[id] = {
        Ctor: San.defineComponent(options),
        instances: []
    };
};

// exports.reload = tryWrap(function (id, options) {
//     var record = map[id];
//     if (options) {
//         makeOptionsHot(id, options);
//         var newCtor = San.defineComponent(options);
//         record.Ctor.options = newCtor.options;
//         record.instances.slice.forEach(function (instance) {
//             if()
//         })
//     }
// });

function injectHook(options, name, hook) {
    var existing = options[name];
    options[name] = existing
        ? Array.isArray(existing)
            ? existing.concat(hook)
            : [existing, hook]
        : [hook];
}

function makeOptionsHot(id, options) {
    injectHook(options, 'attached', function () {
        map[id].instances.push(this);
    });

    injectHook(options, 'disposed', function () {
        var instances = map[id].instances;
        instances.splice(instances.indexOf(this), 1);
    });
}

function tryWrap(fn) {
    return function (id, arg) {
        try {
            fn(id, arg);
        } catch (e) {
            console.err(e);
            console.warn('Something went wrong during hot-reload,Full reload required.');
        }
    };
}