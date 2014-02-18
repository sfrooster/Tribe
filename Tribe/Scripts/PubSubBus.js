//import _ = underscore;
//import lg = require("Logging");
//import cl = collections;
/// <reference path="collections.ts" />

var NullLogger = (function () {
    function NullLogger() {
    }
    NullLogger.prototype.addTag = function (tag) {
    };
    NullLogger.prototype.logLine = function (line) {
    };
    return NullLogger;
})();

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

//function createClient(title, leftOffset, topOffset, bus) {
//    var uid = newGUID();
//    var div = $('<div id="client-' + uid + '" class="client"><table><tbody><tr><td>Publish</td><td><input class="txtPublish" type="text"/><select class="ddlPublish" /><input class="btnPublish" type="button" value="Publish"/><input type="checkbox" class=cboxPubRegex"/>use regex<input class="btnAddTopic" type="button" value="Add Topic"/></td></tr><tr><td>Subscribe</td><td><select class="ddlSubscribe" /><input class="btnSubscribe" type="button" value="Subscribe"/><input type="checkbox" class=cboxSubRegex"/>use regex</td></tr><tr><td>Messages</td><td><textarea class="txtMessages" rows="10" cols="50"/></td></tr></tbody></table></div>');
//    var pos = { my: 'left top', at: 'left+' + leftOffset + ' top+' + topOffset, of: window };
//    var badd = div.find('.btnAddTopic');
//    var bpub = div.find('.btnPublish');
//    var bsub = div.find('.btnSubscribe');
//    var cpub = div.find('.cboxPubRegex');
//    var csub = div.find('.cboxSubRegex');
//    var dpub = div.find('.ddlPublish');
//    var dsub = div.find('.ddlSubscribe');
//    var tpub = div.find('.txtPublish');
//    var tmsg = div.find('.txtMessages');
//    //update all the DDL's with the list of topics from the bus
//    function updateTopics() {
//        dpub.empty();
//        dsub.empty();
//        bus.listTopics().forEach(function (topic, index) {
//            var selected = (index === 0);
//            dpub.append(new Option(topic, topic, selected));
//            dsub.append(new Option(topic, topic, selected));
//        });
//    }
//    div.dialog({
//        modal: false,
//        resizable: true,
//        width: 'auto',
//        height: 'auto',
//        title: title,
//        position: pos,
//        open: function () {
//            updateTopics();
//        }
//    });
//    //write to the message box
//    tmsg.write = function (text) { tmsg.append(text + '\n'); };
//    //the listener to be passed into the bus during subscription
//    function listener(message) {
//        tmsg.write(JSON.stringify(message));
//    }
//    //'Add' a topic
//    badd.click(function (ev) {
//        if (!cpub.prop('checked')) bus.addTopic(tpub.val());
//    });
//    //'Publish' - either regex (I hardcoded to 'starts with') or exact
//    bpub.click(function (ev) {
//        if (cpub.prop('checked')) {
//            bus.publish(regexMatchFN('/^' + dpub.val()), tpub.val());
//        }
//        else {
//            bus.publish(exactMatchFN(dpub.val()), tpub.val());
//        }
//    });
//    //'Subscribe' - either regex (I hardcoded to 'starts with') or exact
//    bsub.click(function (ev) {
//        if (csub.prop('checked')) {
//            bus.subscribe(regexMatchFN('/^' + dsub.val()), listener);
//        }
//        else {
//            bus.subscribe(exactMatchFN(dsub.val()), listener);
//        }
//    });
//    //I don't like this
//    setInterval(updateTopics, 10000);
//    //this uid is mostly useless, but...
//    return uid;
//}
//run a set of tests against the bus.  Tests some things the UI can't (ends with regex)
function runTest(bus, writer) {
    //writer.clear();
    bus.clearChannels();

    bus.addChannel('create');
    bus.addChannel('update');
    bus.addChannel('retrieve');
    bus.addChannel('delete');

    writer.logLine('List Channels');
    writer.logLine('=====================');
    bus.listChannels().forEach(writer.logLine);

    var s1 = new Subscriber(function (m) {
        var receipt = new Guid();
        writer.logLine('S1: received message (from: {0}, payload: {1}), returned receipt ({2})'.format(m.from, m.payloadAsString(), receipt));
        return receipt;
    });

    var s2 = new Subscriber(function (m) {
        var receipt = new Guid();
        writer.logLine('S2: received message (from: {0}, payload: {1}), returned receipt ({2})'.format(m.from, m.payloadAsString(), receipt));
        return receipt;
    });

    var l1 = bus.subscribe('retireve', s1);
    var l2 = bus.subscribe('update', s2);
    //writer.write('');
    //writer.write('Sunscribers');
    //writer.write('=====================');
    //writer.write('l1: ' + l1);
    //writer.write('l2: ' + l2);
    //writer.write('l3: ' + l3);
    //writer.write('');
    //writer.write('Publish to RegEx ^Test');
    //writer.write('=====================');
    //writer.write(bus.publish(regexMatchFN('/^Test/'), 'hello').join(', '));
    //writer.write('');
    //writer.write('Publish to Exact TestTopic');
    //writer.write('=====================');
    //writer.write(bus.publish(exactMatchFN('TestTopic'), { literal: 'hello' }).join(', '));
    //writer.write('');
    //writer.write('Publish to Exact Topic');
    //writer.write('=====================');
    //writer.write(bus.publish(exactMatchFN('Topic'), 555).join(', '));
    //writer.write('');
    //writer.write('New Subscriber (Topic)');
    //writer.write('=====================');
    //var l4 = bus.subscribe(exactMatchFN('Topic'), listenerFour);
    //writer.write('l4: ' + l4);
    //writer.write('');
    //writer.write('New Subscriber, again (TestTopic)');
    //writer.write('=====================');
    //var l5 = bus.subscribe(exactMatchFN('TestTopic'), listenerFour);
    //writer.write('l5: ' + l5);
    //writer.write('');
    //writer.write('Publish to Exact TestTopic');
    //writer.write('=====================');
    //writer.write(bus.publish(exactMatchFN('TestTopic'), { literal: 'hello again' }).join(', '));
    //writer.write('');
    //writer.write('Unsub l5(' + l5 + ') from Exact TestTopic');
    //writer.write('=====================');
    //writer.write(bus.unsubscribe(exactMatchFN('TestTopic'), l5).join(', '));
    //writer.write('');
    //writer.write('Publish to Exact TestTopic');
    //writer.write('=====================');
    //writer.write(bus.publish(exactMatchFN('TestTopic'), { literal: 'hello again again' }).join(', '));
    //bus.clearTopics();
}
//# sourceMappingURL=PubSubBus.js.map
