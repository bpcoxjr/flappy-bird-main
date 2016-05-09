(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":4,"_process":3,"inherits":2}],6:[function(require,module,exports){
var settings = require("../../settings");

var BirdGraphicsComponent = function(entity) {
    this.entity = entity;

    this.flapIndex = 0;
    this.freakingOut = false;

    this.images = [
      document.getElementById("bird2"),
      document.getElementById("bird1"),
      document.getElementById("bird2"),
      document.getElementById("bird3")
    ];

    this.radians = 0;

    this.interval = window.setInterval(this.flap.bind(this),120);
};

BirdGraphicsComponent.prototype.flap = function() {
  this.flapIndex += 1;
  if(this.flapIndex >= this.images.length) this.flapIndex = 0;

};

BirdGraphicsComponent.prototype.freakOut = function() {
  if(this.freakingOut) return;
  var that = this;
  this.freakingOut = true;
  setTimeout(function(){
    that.freakingOut = false;
  },240);
}

BirdGraphicsComponent.prototype.draw = function(context) {
    var position = this.entity.components.physics.position;

    //Save a snapshot of the current transformation state.
    context.save();

    //Move the canvas to the x & y cordinates defined in position variable.
    context.translate(position.x -settings.birdRadius/2, position.y);

    context.scale(-1, 1);
    context.rotate(Math.PI);

    context.save();
    context.translate(settings.birdRadius/2,settings.birdRadius/2);
    context.rotate(this.radians);

    //context.fillRect(-settings.birdRadius/2,-settings.birdRadius/2,settings.birdRadius,settings.birdRadius);

    var verticalVelocity = this.entity.components.physics.velocity.y;
    verticalVelocity = Math.max(settings.minVerticalVelocity,verticalVelocity);
    verticalVelocity = Math.min(settings.maxVerticalVelocity,verticalVelocity);

    verticalVelocity = -verticalVelocity;

    var noseDive = settings.noseDive;

    //Start drawing a new path by calling the beginPath function.
    context.beginPath();


    context.drawImage(this.images[this.flapIndex], -settings.birdRadius/2,-settings.birdRadius/2, settings.birdRadius, settings.birdRadius);
    context.restore();
    //Stop drawing.
    context.closePath();

    //Restore transformation state back to what it was last time context.save was called.
    context.restore();

    if(!this.entity.hovering) {
      if(!this.freakingOut) {
          this.radians = Math.degreesToRadians(verticalVelocity * noseDive);
              this.radians -= Math.degreesToRadians(30);
      } else {
        this.radians += Math.degreesToRadians(-45);
      }
    }

};

exports.BirdGraphicsComponent = BirdGraphicsComponent;

},{"../../settings":13}],7:[function(require,module,exports){
var EventEmitter = require('events');
var util = require('util');
var settings = require("../../settings");

var PipeGraphicsComponent = function(entity) {
    this.entity = entity;
    this.image = document.getElementById("pipe");

    this.emitted = false;
};

util.inherits(PipeGraphicsComponent, EventEmitter);

PipeGraphicsComponent.prototype.draw = function(context) {
    var position = this.entity.components.physics.position;
    var flip = this.entity.flip;

    //Save a snapshot of the current transformation state.
    context.save();

    //Move the canvas to the x & y cordinates defined in position variable.
    context.translate(position.x, position.y);



    if(position.x < -settings.pipeWidth && !this.emitted) {
      this.emit('passed',this);
      this.emitted = true;
    }


    if(flip) {
      context.scale(1,-1);
    }

    var image = this.image;

    context.drawImage(image, 0, 0, settings.pipeWidth, 1);

    context.restore();
};

exports.PipeGraphicsComponent = PipeGraphicsComponent;
},{"../../settings":13,"events":1,"util":5}],8:[function(require,module,exports){
var PhysicsComponent = function(entity) {
    this.entity = entity;

    this.position = {
        x: 0,
        y: 0
    };
    this.velocity = {
        x: 0,
        y: 0
    };
    this.acceleration = {
        x: 0,
        y: 0
    };
};

PhysicsComponent.prototype.update = function(delta,accelerate,position) {
    position = (typeof(position) == 'undefined') ? true : position;
    if(accelerate) {
      this.velocity.x += this.acceleration.x * delta;
      this.velocity.y += this.acceleration.y * delta;
    }

    if(position) {
      this.position.x += this.velocity.x * delta;
      this.position.y += this.velocity.y * delta;
    }
};

exports.PhysicsComponent = PhysicsComponent;

},{}],9:[function(require,module,exports){
var graphicsComponent = require("../components/graphics/bird");
var physicsComponent = require("../components/physics/physics");
var settings = require("../settings");

var Bird = function() {
    var physics = new physicsComponent.PhysicsComponent(this);
    physics.position.y = 0.50;
    physics.acceleration.y = -settings.gravity || -0.75;

    var graphics = new graphicsComponent.BirdGraphicsComponent(this);

    this.scores = [];
    this.t = 0;
    this.freq = 0.0375;
    this.distance = 0.05;
    this.hovering = true;

    this.components = {
    	physics: physics,
    	graphics: graphics
    };

    window.requestAnimationFrame(this.tick.bind(this));
};

Bird.prototype.tick = function() {

  this.t += this.freq;

  this.components.physics.position.y = 0.5 + (Math.sin(this.t) * this.distance);

  if(this.hovering) window.requestAnimationFrame(this.tick.bind(this));
}

Bird.prototype.stopHovering = function() {
  this.hovering = false;
  //this.components.physics.position.y = 0.5;
}

Bird.prototype.freakOut = function() {
  this.components.graphics.freakOut();
}

Bird.prototype.freakOutOver = function(score) {
  var scores = this.scores;

  for(var i = 0; i < scores.length; i++) {
    if(scores[i] == score) return false;
  }
  this.components.graphics.freakOut();

  scores.push(score);

  return true;
}

exports.Bird = Bird;

},{"../components/graphics/bird":6,"../components/physics/physics":8,"../settings":13}],10:[function(require,module,exports){
var graphicsComponent = require("../components/graphics/pipe");
var physicsComponent = require("../components/physics/physics");
var EventEmitter = require('events');
var util = require('util');


var Pipe = function(position,flip, id) {
	var that = this;
	this.id = (typeof(id) == 'undefined') ? '' : id;
	this.flip = (typeof(flip) == 'undefined') ? false : flip;

	var physics = new physicsComponent.PhysicsComponent(this);
    physics.position.x = position.x;
		physics.position.y = position.y;

		physics.velocity.x = -0.4;

		var graphics = new graphicsComponent.PipeGraphicsComponent(this);

		graphics.on('passed',function(graphics){
			that.emit('passed',graphics);
		});

		this.components = {
			physics: physics,
			graphics: graphics
		};
};

util.inherits(Pipe, EventEmitter);

exports.Pipe = Pipe;

},{"../components/graphics/pipe":7,"../components/physics/physics":8,"events":1,"util":5}],11:[function(require,module,exports){
Math.randomRange = function(min,max) {
      return min + (Math.random() * (max-min));
};

Math.degreesToRadians = function(degrees) {
  return degrees * Math.PI / 180;
}

Math.radiansToDegrees = function(radians) {
  return radians * 180 / Math.PI;
}

var graphicsSystem = require('./systems/graphics');
var physicsSystem = require('./systems/physics');
var inputSystem = require('./systems/input');
var pipeSystem = require('./systems/pipe_system');

var bird = require('./entities/bird');
var settings = require('./settings');

var FlappyBird = function() {
  var that = this;

  this.gameOver = false;
  this.score = 0;
  this.paused = false;

  var flappy = new bird.Bird();


  this.entities = [flappy];
  this.graphics = new graphicsSystem.GraphicsSystem(this);
  this.physics = new physicsSystem.PhysicsSystem(this.entities);
  this.input = new inputSystem.InputSystem(this.entities);
  this.pipes = new pipeSystem.PipeSystem(this.entities);

  //Display game instructions when "How to Play" button is clicked
  $('#howtoplay').click(function(){
    $('#instructions').fadeIn(500);
  });

  /*var howToButton = document.getElementById('howtoplay');
  howToButton.onclick = function(){
    $('#instructions').fadeIn(500);
  };*/

  //Close game instructions when "Got it!" button is clicked
  $('#gotit').click(function(){
    $('#instructions').fadeOut(500);
  });

  /*var gotItButton = document.getElementById('gotit');
  gotItButton.onclick = function(){
    $('#instructions').fadeOut(500);
  }*/

  this.pipes.on('passed',function(score){
    that.score += 1;
    if(!that.gameOver) console.log(score);
  });

  this.graphics.on('collision',function(id, visible, hidden){
    if(!that.gameOver) {
      that.gameOver = true;
    }
    
    //function to display player's score on the overlay after game over
    var writeScore = function(){
      if (that.gameOver = true){
        return('Score: ' + that.score);
      }
    };

    var htmlScore = document.getElementById('score');
    htmlScore.innerHTML = writeScore();

    if(that.gameOver) {
      that.graphics.pause();
      that.physics.pause();
      that.pipes.pause();
      $("#game-over").fadeIn(100);
    }
  });

  var replaybutton = document.getElementById('replay');
  replaybutton.onclick = function(){
    location.reload(true);
  };

  this.input.on('visibilitychange',function(visible){
    if(visible) {
      that.graphics.paused = false;
      that.physics.run();
      that.pipes.run();
    } else {
      that.graphics.pause();
      that.physics.pause();
      that.pipes.pause();
    }
  });

  this.pipes.on('pipeadded',function(){ // whenever a pipe is added
    var entities = that.entities;
    entities = entities.filter(function(entity){ //
      return (entity.components.physics.position.x > -(that.graphics.canvas.width / that.graphics.canvas.height)) ? true : false;
    });

    // update all the references to our entities
    that.entities = that.graphics.entities = that.physics.entities = that.input.entities = that.pipes.entities = entities;
  });

  this.input.on('Paused', this.handlePaused.bind(this));

  this.input.on('Started', function(){
    that.entities[0].stopHovering();

    that.physics.justBird = false;
    that.pipes.run();

    setTimeout(function(){
      flappy.freakOutOver(0);
    },200);
  });

  //Listen for the 'f' key being pressed, do a backflip and add 1 to the score
  this.input.on('FlappyFreakout', function(){
    flappy.freakOut();
    if (that.score >= 1) {
    that.score += 1;
    }
  });
};

FlappyBird.prototype.handlePaused = function() {
    this.paused = !this.paused;
    if (this.paused){
      this.graphics.pause();
      this.physics.pause();
      this.pipes.pause();
    }
    else {
      this.graphics.run();
      this.physics.run();
      this.pipes.run();
    }
  };

FlappyBird.prototype.run = function() {
    this.graphics.run();
    this.input.run();
    this.physics.run();
};

exports.FlappyBird = FlappyBird;

},{"./entities/bird":9,"./settings":13,"./systems/graphics":14,"./systems/input":15,"./systems/physics":16,"./systems/pipe_system":17}],12:[function(require,module,exports){
var flappyBird = require('./flappy_bird');

document.addEventListener('DOMContentLoaded', function() {
    var app = new flappyBird.FlappyBird();
    app.run();
});
},{"./flappy_bird":11}],13:[function(require,module,exports){
exports.birdRadius = 0.1;
exports.pipeWidth = 0.2;
exports.collisionAllowance = 1;
exports.gravity = 2.25;
exports.lift = .75;
exports.noseDive = 120;
exports.minVerticalVelocity = -1;
exports.maxVerticalVelocity = 0;
exports.freakOutEvery = 0;
exports.displayFPS = false;
exports.collisionDetectionPerSecond = 12;

},{}],14:[function(require,module,exports){
var EventEmitter = require('events');
var util = require('util');
var settings = require('../settings');

var GraphicsSystem = function(flappyBird) {
    this.flappyBird = flappyBird;
    var that = this;

    this.entities = flappyBird.entities;
    //Canvas is WHERE we draw to. This part fetches the canvas element.
    this.canvas = document.getElementById('main-canvas');
    this.offcanvas = document.createElement('canvas');
    //Context is WHAT we draw to
    this.context = this.canvas.getContext('2d');

    this.interval = null;

    this.showBoundingBox = false;
    this.showCollisionDetection = false;

    this.paused = false;

    this.lastStamp = null;

    this.numerals = document.getElementById("numerals");

    var canvas = this.canvas,
    offcanvas = this.offcanvas;

    that.calculations = {};
    handleResize();
    window.onresize = function() {
        handleResize();
    }
    function handleResize() { // calculate and store these values on window resize rather than each step of the animation
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        that.calculations.birdSize = canvas.height * .1;
        that.calculations.halfWidth = canvas.width / 2;
        that.calculations.birdSizeBuffer = that.calculations.birdSize * 1.2; // pad the cut area because we angle the graphic with the "nose dive" effect

        offcanvas.width = that.calculations.birdSizeBuffer;
        offcanvas.height = that.calculations.birdSizeBuffer;
    }
};

util.inherits(GraphicsSystem, EventEmitter);

GraphicsSystem.prototype.run = function() {
    //Run the graphics rendering loop. requestAnimationFrame runs ever 1/60th of a second.
    window.requestAnimationFrame(this.tick.bind(this));
    this.interval = window.setInterval(this.tock.bind(this),Math.round(1000/settings.collisionDetectionPerSecond));
};

GraphicsSystem.prototype.pause = function() {
  clearInterval(this.interval);
};

GraphicsSystem.prototype.tock = function() {
  var that = this;

  var canvas = this.canvas,
  offcanvas = this.offcanvas,
  offcanvasContext = offcanvas.getContext('2d');

  this.clearContext(offcanvas);

  var bird = this.entities[0],
  cut = { // the section of the stage we are cutting out. we only take the bounding box of the bird for both our subjects (the bird and the pipes)
    x:that.calculations.halfWidth,
    y:(1-bird.components.physics.position.y)*canvas.height,
    width:that.calculations.birdSizeBuffer,
    height:that.calculations.birdSizeBuffer
  };

  var birdData = (function(bird,canvas){ // accepts the bird entity and a canvas to draw onto for collision detection
    if ((!'graphics' in bird.components) || (!'physics' in bird.components)) return false; // if the bird can't be rendered don't even try

    // set our collision detection canvas to the same size as the source canvas
    canvas.width = that.canvas.width;
    canvas.height = that.canvas.height;

    var context = canvas.getContext('2d'),
    position = bird.components.physics.position;

    context.save(); // save the context before applying custom transfomration coordinates

    // apply custom transformation coordinates
    context.translate(that.calculations.halfWidth, that.canvas.height);
    context.scale(that.canvas.height, -that.canvas.height);

    // draw the bird onto the hidden canvas
    bird.components.graphics.draw(context);

    // cut the image data (just the bouding box of the bird) out and colorize the pixels to solid green
    var imgData = context.getImageData(cut.x, cut.y, cut.width, cut.height);
    imgData = that.colorizeImageData(imgData,[0,255,0,255]);

    context.restore();
    that.clearContext(canvas);

    return imgData; // return the green birdy

  })(bird, document.createElement('canvas')); // pass in our bird entity and a temporary canvas to draw it onto

  var pipeData = (function(entities,canvas){ // accepts the pipe entities
    canvas.width = that.canvas.width;
    canvas.height = that.canvas.height;

    var context = canvas.getContext('2d');

    context.save(); // save the context before applying custom transfomration coordinates

    // apply custom transformation coordinates
    context.translate(that.calculations.halfWidth, that.canvas.height);
    context.scale(that.canvas.height, -that.canvas.height);

    for (var i=0; i<entities.length; i++) { // for each pipe
      var entity = entities[i];
      // draw the pipe the the hidden canvas
      if ('graphics' in entity.components) entity.components.graphics.draw(context);
    }

    // cut the image data (just the bouding box of the bird) out and colorize the pixels to solid red
    var imgData = context.getImageData(cut.x, cut.y, cut.width, cut.height);
    imgData = that.colorizeImageData(imgData,[255,0,0,255]);

    context.restore();
    that.clearContext(canvas);

    return imgData;

  })(this.entities.slice(1),document.createElement('canvas')); // pass in the pipe entities and a temporary canvas to them onto

  offcanvasContext.restore(); // back to the normal coordinates
  offcanvasContext.clearRect(0,0,offcanvas.width,offcanvas.height); // clear the canvas

  offcanvasContext.globalCompositeOperation = "multiply"; // set the blend mode to multiply so when pixels overlap they change color

  // add our bird and pipe graphics as undestructive layers on top of each other
  // REMEMBER: the bird is solid green and the pipe are solid red
  // we can't just use putImageData() because it is destructive (in other words) removes pixels beneath
  // so we take the imageData and convert it to a dataURL, then convert that to an Image, then pass that to drawImage
  offcanvasContext.drawImage(that.dataURLtoImg(that.imgDataToDataURL(pipeData)),0,0);
  offcanvasContext.drawImage(that.dataURLtoImg(that.imgDataToDataURL(birdData)),0,0);

  var isCollision = (function(){ // does the bird hit the pipes?
    var imgData = offcanvasContext.getImageData(0,0,offcanvas.width,offcanvas.height),
    data = imgData.data; // the pixel data of our hidden canvas
    var collisions = 0;
    for(var i = 0; i <= data.length - 4; i+=4) { // loop through each pixel (4 at a time because it takes four indexes to repesent one pixel (r,g,b,a))
      var isRed = (data[i] == 255 && !data[i+1] && !data[i+2]), // is the pixel solid red?
      isGreen = (!data[i] && data[i+1] == 255 && !data[i+2]), // is the pixel solid green?
      isNothing = (data[i] == 0 && data[i+1] == 0 && data[i+2] == 0 && data[i+3] == 0); // is the pixel nothing?

       // if it ain't red, and it ain't green, and it ain't nothing we got ourselves a hit!
       if(!isRed && !isGreen && !isNothing) collisions++;
       if(collisions > settings.collisionAllowance) return true;
    }
    return false; // go birdy, it's your birthday!
  })();

  
  var tooHighText = function(){
    return("Oh, no! Flappy flew too high and died!");
  };

  var tooLowText = function(){
    return("Oh, no! Flappy flew too low and died!");
  };

  //function to determine if the bird goes off the top or bottom of the canvas
  var offCanvas = (function(){
    if(bird.components.physics.position.y >= 1) {
      var tooHigh = document.getElementById("game-over-text");
      tooHigh.innerHTML = tooHighText();
      return true;
    }
    else if(bird.components.physics.position.y <= 0 + settings.birdRadius){
      var tooLow = document.getElementById("game-over-text");
      tooLow.innerHTML = tooLowText();
      return true;
    }
    else {return false;
    }
  })();

  //If either isCollision or offCanvas function return true, emit 'collision' and end game!
  if(isCollision || offCanvas) {
    that.emit('collision');
  }
}

GraphicsSystem.prototype.tick = function(timestamp) {

    var that = this; // so we can reference "this" from nested namespaces

    var canvas = this.canvas,
    offcanvas = this.offcanvas,
    offcanvasContext = offcanvas.getContext('2d');

    // start fresh for our visual canvas and our hidden hit detection offcanvas
    this.clearContext(canvas);


    var bird = this.entities[0],
    cut = { // the section of the stage we are cutting out. we only take the bounding box of the bird for both our subjects (the bird and the pipes)
      x:that.calculations.halfWidth,
      y:(1-bird.components.physics.position.y)*canvas.height,
      width:that.calculations.birdSizeBuffer,
      height:that.calculations.birdSizeBuffer
    };

    // set the hidden canvas to be the same size as the area we cut out for bitmap detection


    // save our contexts before we apply custom transformation coordinates
    this.context.save();

    // use our custom transformation and coordinates system (remember that getImageData ignores this)
    this.context.translate(that.calculations.halfWidth, this.canvas.height);
    this.context.scale(this.canvas.height, -this.canvas.height);

    //Rendering of graphics goes here
    for (var i=0; i<this.entities.length; i++) {
        var entity = this.entities[i];
        if ('graphics' in entity.components) entity.components.graphics.draw(this.context);
    }

    this.context.restore();

    (function(that){
      var score = that.flappyBird.score,
      digits = score.toString().split('');

      if(score && score % settings.freakOutEvery == 0) bird.freakOutOver(score);

      that.context.save();

      that.context.translate(that.calculations.halfWidth - (30 * that.flappyBird.score.toString().length),0);

      for(var i = 0; i < digits.length; i++) {
        var digitData = (function(int){ // get the pixel data for the given digit
          var canvas = document.createElement('canvas'),
          context = canvas.getContext('2d'),
          int = (typeof(int) == 'undefined') ? 0 : parseInt(int);

          canvas.width = 60;
          canvas.height = 80;

          context.translate(-60*int,0);

          context.drawImage(document.getElementById("numerals"),0,0,600,80);

          var imgData = context.getImageData(0,0,canvas.width,canvas.height);

          return imgData;
        })(digits[i]);

        that.context.drawImage(
          that.dataURLtoImg(
            that.imgDataToDataURL(digitData)
          ),
          i*30,
          0
        );

      }
      that.context.restore();
    })(this);

    if(settings.displayFPS) {
      (function(context,lastStamp){
        var fps = 1000 / (timestamp-lastStamp);
        context.font = "12px Verdana";
        context.fillStyle = 'red';
        context.fillText(fps.toString(),16,that.canvas.height - 16);
      })(this.context,this.lastStamp);
    }

    this.lastStamp = timestamp;

    //Continue the graphics rendering loop.
    if(!this.paused) window.requestAnimationFrame(this.tick.bind(this));
};

GraphicsSystem.prototype.colorizeImageData = function(imgData,color) {
  var data = imgData.data;
  for(var i = 0; i <= data.length-4; i+=4) {
    if(!(!data[i] && !data[i+1] && !data[i+2] && !data[i+3])) {

      data[i] = color[0];
      data[i+1] = color[1];
      data[i+2] = color[2];
      data[i+3] = color[3];
    }
  }
  return imgData;
}

GraphicsSystem.prototype.imgDataToDataURL = function(imgData) {
  var c = document.createElement('canvas');

  c.width = imgData.width;
  c.height = imgData.height;

  c.getContext('2d').putImageData(imgData,0,0);
  return c.toDataURL();
}

GraphicsSystem.prototype.dataURLtoImg = function(dataURL) {
    var img = new Image();

    img.src = dataURL;
    return img;
}

GraphicsSystem.prototype.clearContext = function(canvas,x,y,width,height) {
  x = (typeof(x) == 'undefined') ? 0 : x;
  y = (typeof(y) == 'undefined') ? 0 : y;
  width = (typeof(width) == 'undefined') ? canvas.width : width;
  height = (typeof(height) == 'undefined') ? canvas.height : height;
  canvas.getContext('2d').clearRect(x,y,width,height);
}

exports.GraphicsSystem = GraphicsSystem;

},{"../settings":13,"events":1,"util":5}],15:[function(require,module,exports){
var EventEmitter = require('events');
var util = require('util');
var settings = require('../settings');

var started = false;

var InputSystem = function(entities) {
    this.entities = entities;
    var that = this;

    // Canvas is where we get input from
    this.canvas = document.getElementById('main-canvas');
    this.started = false;

    var visibilityChange;
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
      visibilityChange = "visibilitychange";
    } else if (typeof document.mozHidden !== "undefined") {
      visibilityChange = "mozvisibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
      visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
      visibilityChange = "webkitvisibilitychange";
    }

    document.addEventListener(visibilityChange, this.handleVisibilityChange.bind(this), false);
};

util.inherits(InputSystem, EventEmitter);

InputSystem.prototype.run = function() {
    this.canvas.addEventListener('click', this.onClick.bind(this));
    document.body.addEventListener('keydown', this.onkeydown.bind(this));
};

InputSystem.prototype.onClick = function() {
    if(!this.started) {
      this.emit('Started');
      this.started = true;
    }
    var bird = this.entities[0];
    bird.components.physics.velocity.y = settings.lift;
};

InputSystem.prototype.onkeydown = function(e) {
  if(!this.started) {
    this.emit('Started');
    this.started = true;
  }

	if (e.keyCode ==32) {
		var bird = this.entities[0];
		bird.components.physics.velocity.y = settings.lift;
	}
  //if 'p' key is pressed, pause the game
  else if (e.keyCode ==80) {
    this.emit('Paused');
  }
  //make Flappy do a backflip when you hit the 'f' key
  else if (e.keyCode ==70){
    this.emit('FlappyFreakout');
  }
};



InputSystem.prototype.handleVisibilityChange = function() {
  var hidden;
  if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
    hidden = "hidden";
  } else if (typeof document.mozHidden !== "undefined") {
    hidden = "mozHidden";
  } else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
  } else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
  }

  if (document[hidden]) {
    this.emit('visibilitychange',false);
  } else {
    this.emit('visibilitychange',true);
  }
};

exports.InputSystem = InputSystem;

},{"../settings":13,"events":1,"util":5}],16:[function(require,module,exports){
var PhysicsSystem = function(entities) {
    this.entities = entities;
    this.interval = null;
    this.justBird = true;
};

PhysicsSystem.prototype.run = function() {
    // Run the update loop
    this.interval = window.setInterval(this.tick.bind(this), 1000 /60);
};

PhysicsSystem.prototype.pause = function() {
  clearInterval(this.interval);
};

PhysicsSystem.prototype.tick = function() {
  //console.log('pock',this.entities);
    for (var i=0; i < ((this.justBird) ? 1 : this.entities.length); i++) {
        var entity = this.entities[i];
        if (!'physics' in entity.components) {
            continue;
        }

        entity.components.physics.update(1/60,i<1,!this.justBird); // pass in the framerate and whether or not to accelerate (only acceralte the bird in other words don't accelerate the pipes)
    }
};

exports.PhysicsSystem = PhysicsSystem;

},{}],17:[function(require,module,exports){
var pipe = require('../entities/pipe');
var EventEmitter = require('events');
var util = require('util');

var PipeSystem = function(entities) {
  this.entities = entities;
  this.canvas = document.getElementById('main-canvas');
  this.interval = null;
  this.pipesPassed = 0;
}

util.inherits(PipeSystem, EventEmitter);

PipeSystem.prototype.run = function() {
  this.tick();
  this.interval = window.setInterval(this.tick.bind(this),2000);
};

PipeSystem.prototype.pause = function() {
  if(this.interval != null) {
    window.clearInterval(this.interval);
    this.interval = null;
  }
}

PipeSystem.prototype.tick = function() {
  var that = this;
  var position = {
    x:(this.canvas.width / this.canvas.height),
    y:Math.randomRange(0.25,0.65)
  };

  var pipeSetId = (this.entities.length - 1) / 2;

  function createPipe(pipe,position,flipped,id) {
    var pipe = new pipe.Pipe(position, flipped, id);
    pipe.on('passed',function(graphics){
      if(graphics.entity.flip) {
        that.pipesPassed++;
        that.emit('passed',that.pipesPassed);
      }
    });
    return pipe;
  }

  this.entities.push(createPipe(pipe,position, true, pipeSetId));

  position.y += .25;

  this.entities.push(createPipe(pipe,position, false, pipeSetId));

  this.emit('pipeadded');
};

exports.PipeSystem = PipeSystem;

},{"../entities/pipe":10,"events":1,"util":5}]},{},[12]);
