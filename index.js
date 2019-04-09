var San;
var map = global.__SAN_HOT_MAP__ = {};
var installed = false;

exports.install = function (san) {
    if (installed) {
        return;
    }
    installed = true;
    San = san.__esModule ? san.default : san;
    exports.compatible = Number(san.version.split('.').join('')) >= 351;

    if (!exports.compatible) {
        console.warn(
            '[HMR] You are using a version of san-hot-reload-api that is ' +
            'only compatible with san.js core ^3.5.1.'
        );
    }
};

exports.createRecord = function (id, options) {
    var Ctor = San.defineComponent(options);
    makeOptionsHot(id, options);
    map[id] = {
        Ctor: Ctor,
        options: options,
        instances: []
    };
};

function injectHook(options, name, hook) {
    var existing = options[name];

    options[name] = existing
        ? function () {
            existing.call(this);
            hook.call(this);
        }
        : hook;
}

function makeOptionsHot(id, options) {
    // options 可能是san.defineComponent(options) 返回的组件类 希望在此做一个兼容处理
    options = typeof options === 'function' ? options.prototype : options;

    injectHook(options, 'attached', function () {
        map[id].instances.push(this);
    });

    injectHook(options, 'detached', function () {
        var instances = map[id].instances;
        instances.splice(instances.indexOf(this), 1);
    });
}

function tryWrap(fn) {
    return function (id, arg) {
        try {
            fn(id, arg);
        }
        catch (e) {
            console.error(e);
            console.warn('Something went wrong during hot-reload, Full reload required.');
        }
    };
}

exports.reload = tryWrap(function (id, newOptions) {
    var record = map[id];
    makeOptionsHot(id, newOptions);
    record.Ctor = San.defineComponent(newOptions);

    record.instances.concat().forEach(function (instance) {
        var parentEl = instance.el.parentElement;
        var beforeEl = instance.el.nextElementSibling;
        var options = {
            subTag: instance.subTag,
            owner: instance.owner,
            scope: instance.scope,
            parent: instance.parent,
            aNode: instance.givenANode
        };
        instance.dispose();
        var newInstance = new record.Ctor(options);
        newInstance.attach(parentEl, beforeEl);
    });
});
