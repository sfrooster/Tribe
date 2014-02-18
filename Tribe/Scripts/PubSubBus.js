var Message = (function () {
    function Message(from, payload) {
        this._from = from;
        this._payload = JSON.stringify(payload);
    }
    Object.defineProperty(Message.prototype, "from", {
        get: function () {
            return this._from;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Message.prototype, "payload", {
        get: function () {
            return JSON.parse(this._payload);
        },
        enumerable: true,
        configurable: true
    });

    Message.prototype.payloadAsString = function () {
        return this._payload;
    };
    return Message;
})();

var Subscriber = (function () {
    function Subscriber(callback) {
        this._callback = callback;
        this._guid = new Guid();
    }
    Object.defineProperty(Subscriber.prototype, "guid", {
        get: function () {
            return this._guid;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Subscriber.prototype, "callback", {
        get: function () {
            return this._callback;
        },
        enumerable: true,
        configurable: true
    });
    return Subscriber;
})();

var Channel = (function () {
    function Channel(name) {
        this._name = name;
        this._guid = new Guid();
        this._subscribers = [];
        this._messageHistory = [];
    }
    Object.defineProperty(Channel.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Channel.prototype, "guid", {
        get: function () {
            return this._guid;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Channel.prototype, "subscribers", {
        get: function () {
            return this._subscribers;
        },
        enumerable: true,
        configurable: true
    });
    Channel.prototype.addSubscriber = function (subscriber) {
        this._subscribers.push(subscriber);
    };

    Object.defineProperty(Channel.prototype, "messageHistory", {
        get: function () {
            return this._messageHistory;
        },
        enumerable: true,
        configurable: true
    });
    Channel.prototype.recordMessage = function (message, recipients) {
        this._messageHistory.push({ message: message, recipients: recipients });
    };
    return Channel;
})();

var PubSubBus = (function () {
    function PubSubBus(logger) {
        if (typeof logger === "undefined") { logger = new NullLogger(); }
        this._log = logger;
        this._channels = [];
    }
    PubSubBus.prototype.addChannel = function (channelName) {
        var channel = new Channel(channelName);
        this._channels.push(channel);
        this._log.logLine('bus: ');
        return channel.guid;
    };

    PubSubBus.prototype.clearChannels = function () {
        this._channels = [];
    };

    PubSubBus.prototype.listChannels = function () {
        return this._channels.map(function (c) {
            return c.name;
        });
    };

    //move this to channel???
    //return a promise???
    PubSubBus.prototype.publish = function (fn, message) {
        var log = this._log;
        var allRecipients = new collections.Dictionary();

        try  {
            var matches = this._channels.filter(fn);

            matches.forEach(function (c) {
                var recipients = new collections.Dictionary();
                c.subscribers.forEach(function (s) {
                    var receipt = s.callback(message);
                    recipients.setValue(s.guid, receipt);
                    allRecipients.setValue(s.guid, receipt);
                });

                c.recordMessage(message, recipients);
                log.logLine('published message({0}) to channel({1}: {2})'.format(message.toString(), c.guid.value, c.name));
            });
        } catch (e) {
            log.logLine('error: ' + e);
        }

        return allRecipients;
    };

    PubSubBus.prototype.subscribe = function (match, subscriber) {
        var success = true;

        if (_.isFunction(match)) {
            success = this.subscribeFuzzy(match, subscriber);
        } else if (_.isString(match)) {
            success = this.subscribeExact(match, subscriber);
        } else {
            success = false;
        }

        return success;
    };

    PubSubBus.prototype.subscribeFuzzy = function (fn, subscriber) {
        var success = true;
        var log = this._log;

        try  {
            this._channels.filter(fn).forEach(function (c) {
                c.addSubscriber(subscriber);

                var len = c.messageHistory.length;
                if (len > 0) {
                    for (var idx = Math.max(len - 2, 0); idx < Math.max(len, 1); idx++)
                        subscriber.callback(c.messageHistory[idx].message);
                }

                log.logLine('channel({0}: {1}) has new subscriber({2})'.format(c.guid.value, c.name, subscriber.guid.value));
            });
        } catch (e) {
            log.logLine('error: {0}'.format(e));
            success = false;
        }

        return success;
    };

    PubSubBus.prototype.subscribeExact = function (name, subscriber) {
        var fn = function (c) {
            return true;
        };

        return this.subscribeFuzzy(fn, subscriber);
    };

    PubSubBus.prototype.unsubscribe = function (fn, subscriber) {
        var log = this._log;
        var unsubList = [];

        try  {
            this._channels.filter(fn).forEach(function (c) {
                var newSubList = [];

                c.subscribers.forEach(function (s) {
                    if (s.guid.value !== subscriber.guid.value) {
                        newSubList.push(s);
                    } else {
                        unsubList.push(c);
                        log.logLine('subscriber({0}) has unsubscriber from channel({1}: {2})'.format(s.guid, c.name, c.guid));
                    }
                });

                c.subscribers = newSubList;
            });
        } catch (e) {
            log.logLine('error: {0}'.format(e));
        }

        return unsubList;
    };
    return PubSubBus;
})();

//function to create a function to check for an exact match
//between an object field (default is 'name') and a given value
function exactMatchFN(match, field) {
    field = ((typeof field === 'undefined') ? 'name' : field);
    return new Function('p', 'return p.' + field + ' === "' + match + '";');
}

//function to create a function to check for a regex match
//between a object field (default is 'name') and a given regex
function regexMatchFN(match, field) {
    field = ((typeof field === 'undefined') ? 'name' : field);
    return new Function('p', 'return ' + match + '.test(p.' + field + ');');
}
//# sourceMappingURL=PubSubBus.js.map
