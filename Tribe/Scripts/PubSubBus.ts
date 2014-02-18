//import _ = underscore;
//import lg = require("Logging");
//import cl = collections;

/// <reference path="collections.ts" />

interface ILogger {
    addTag(tag: string): void;
    logLine(line: string): void;
}

class NullLogger implements ILogger {
    addTag(tag: string) { }
    logLine(line: string) { }
}

class Message {
    private _from: Guid;
    get from(): Guid {
        return this._from;
    }

    private _payload: string;
    get payload(): any {
        return JSON.parse(this._payload);
    }

    payloadAsString(): string {
        return this._payload;
    } 

    constructor(from: Guid, payload: any) {
        this._from = from;
        this._payload = JSON.stringify(payload);
    }
}

class Subscriber {
    private _guid: Guid;
    get guid(): Guid {
        return this._guid;
    }

    //return a promise???
    private _callback: (m: Message)=>Guid;
    get callback(): (m: Message)=>Guid {
        return this._callback;
    }

    constructor(callback: (m:Message)=>Guid) {
        this._callback = callback;
        this._guid = new Guid();
    }
}

class Channel {
    private _name: string;
    get name(): string {
        return this._name;
    }

    private _guid: Guid;
    get guid(): Guid {
        return this._guid;
    }

    private _subscribers: Subscriber[];
    get subscribers(): Subscriber[] {
        return this._subscribers;
    }
    addSubscriber(subscriber: Subscriber): void {
        this._subscribers.push(subscriber);
    }

    private _messageHistory: { message: Message; recipients: collections.Dictionary<Guid, Guid> }[];
    get messageHistory(): { message: Message; recipients: collections.Dictionary<Guid, Guid> }[] {
        return this._messageHistory;
    }
    recordMessage(message: Message, recipients: collections.Dictionary<Guid, Guid>): void {
        this._messageHistory.push({ message: message, recipients: recipients });
    }

    constructor(name: string) {
        this._name = name;
        this._guid = new Guid();
        this._subscribers = [];
        this._messageHistory = [];
    }
}

class PubSubBus {
    private _log: ILogger;
    private _channels: Channel[];

    constructor(logger:ILogger = new NullLogger()) {
        this._log = logger;
        this._channels = [];
    }

    addChannel(channelName: string):Guid {
        var channel = new Channel(channelName);
        this._channels.push(channel);
        this._log.logLine('bus: ');
        return channel.guid;
    }

    clearChannels(): void {
        this._channels = [];
    }

    listChannels(): String[] {
        return this._channels.map((c) => c.name);
    }

    //move this to channel???
    //return a promise???
    publish(fn: (c: Channel) => boolean, message: Message): collections.Dictionary<Guid, Guid> {
        var log = this._log;
        var allRecipients: collections.Dictionary<Guid, Guid> = new collections.Dictionary<Guid, Guid>();

        try {
            var matches = this._channels.filter(fn);

            matches.forEach((c) => {
                var recipients = new collections.Dictionary<Guid, Guid>();
                c.subscribers.forEach((s) => {
                    var receipt = s.callback(message);
                    recipients.setValue(s.guid, receipt);
                    allRecipients.setValue(s.guid, receipt);
                });

                c.recordMessage(message, recipients);
                log.logLine('published message({0}) to channel({1}: {2})'.format(message.toString(), c.guid.value, c.name));
            });
        }
        catch (e) {
            log.logLine('error: ' + e);
        }

        return allRecipients;
    }

    subscribe(match: any, subscriber: Subscriber): boolean {
        var success = true;

        if (_.isFunction(match)) {
            success = this.subscribeFuzzy(match, subscriber);
        }
        else if (_.isString(match)) {
            success = this.subscribeExact(match, subscriber);
        }
        else {
            success = false;
        }

        return success;
    }

    private subscribeFuzzy(fn: (c: Channel) => boolean, subscriber: Subscriber): boolean {
        var success: boolean = true;
        var log = this._log;

        try {
            this._channels.filter(fn).forEach((c) => {
                c.addSubscriber(subscriber);

                var len = c.messageHistory.length;
                if (len > 0) {
                    for (var idx = Math.max(len - 2, 0); idx < Math.max(len, 1); idx++)
                        subscriber.callback(c.messageHistory[idx].message);
                }

                log.logLine('channel({0}: {1}) has new subscriber({2})'.format(c.guid.value, c.name, subscriber.guid.value));
            });
        }
        catch (e) {
            log.logLine('error: {0}'.format(e));
            success = false;
        }

        return success;
    }

    private subscribeExact(name: string, subscriber: Subscriber): boolean {
        var fn = (c: Channel) => {
            return true;
        }

        return this.subscribeFuzzy(fn, subscriber);
    }

    unsubscribe(fn: (c:Channel) => boolean, subscriber: Subscriber): Channel[] {
        var log = this._log;
        var unsubList = <Channel[]>[];

        try {
            this._channels.filter(fn).forEach((c) => {
                var newSubList = [];

                c.subscribers.forEach((s) => {
                    if (s.guid.value !== subscriber.guid.value) {
                        newSubList.push(s);
                    }
                    else {
                        unsubList.push(c);
                        log.logLine('subscriber({0}) has unsubscriber from channel({1}: {2})'.format(s.guid, c.name, c.guid));
                    }
                });

                c.subscribers = newSubList;
            });
        }
        catch (e) {
            log.logLine('error: {0}'.format(e));
        }

        return unsubList;
    }
}

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
function runTest(bus:PubSubBus, writer:ILogger) {
    //writer.clear();
    bus.clearChannels();

    bus.addChannel('create');
    bus.addChannel('update');
    bus.addChannel('retrieve');
    bus.addChannel('delete');

    writer.logLine('List Channels');
    writer.logLine('=====================');
    bus.listChannels().forEach(writer.logLine);

    var s1 = new Subscriber((m) => {
        var receipt = new Guid();
        writer.logLine('S1: received message (from: {0}, payload: {1}), returned receipt ({2})'.format(m.from, m.payloadAsString(), receipt));
        return receipt;
    });

    var s2 = new Subscriber((m) => {
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

//$(document).ready(function () {
//    var output = $('#output');

//    output.write = function (text) { output.append('<span>' + text + '</span><br/>'); };
//    output.clear = function () { output.empty(); };

//    var bus = new PubSubBus(output);

//    $('#btnRunTest').click(function (ev) { runTest(bus, output); })
//            $('#btnClear').click(function (ev) { output.clear(); })

//            var c1 = createClient('Client 1', 10, 340, bus);
//    var c2 = createClient('Client 2', 580, 340, bus);
//    var c3 = createClient('Client 3', 10, 620, bus);
//    var c3 = createClient('Client 4', 580, 620, bus);
//});
