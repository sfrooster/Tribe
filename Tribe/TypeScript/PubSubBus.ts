import lg = require("Logging");
import cl = collections;

class Message {
    private _from: Guid;
    get from(): Guid {
        return this._from;
    }

    private _payload: string;
    get payload(): any {
        return JSON.parse(this._payload);
    }

    toString(): string {
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

    //make this a promise???
    //array of string(message:json) => string(receipt:guid)
    private _subscribers: Array<Subscriber>;
    get subscribers(): Array<Subscriber> {
        return this._subscribers;
    }
    addSubscriber(subscriber: Subscriber): void {
        this._subscribers.push(subscriber);
    }

    private _messageHistory: Array<{ message: Message, recipients: cl.Dictionary<Guid, Guid> }>;
    get messageHistory(): Array<{ message: Message, recipients: cl.Dictionary<Guid, Guid> }> {
        return this._messageHistory;
    }
    recordMessage(message: Message, recipients: cl.Dictionary<Guid, Guid>): void {
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
    private _log: lg.ILogger;
    private _channels: Array<Channel>;

    constructor(logger:lg.ILogger = new lg.NullLogger()) {
        this._log = logger;
        this._channels = [];
    }

    addChannel(channelName: string):Guid {
        var channel = new Channel(channelName);
        this._channels.push(channel);
        this._log.logLine('bus: ');
        return channel.guid;
    }

    clearTopics(): void {
        this._channels = [];
    }

    listChannels(): Array<String> {
        return this._channels.map((c: Channel) => c.name);
    }

    publish(fn: (c: Channel) => boolean, message: Message): cl.Dictionary<Guid, Guid> {
        var log = this._log;
        var allRecipients: cl.Dictionary<Guid, Guid> = new cl.Dictionary<Guid, Guid>();

        try {
            var matches = this._channels.filter(fn);

            matches.forEach((c:Channel) => {
                var recipients = new cl.Dictionary<Guid, Guid>();
                c.subscribers.forEach((s:Subscriber) => {
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

    subscribe(fn: (c: Channel) => boolean, subscriber: Subscriber): boolean {
        var success: boolean = true;
        var log = this._log;

        try {
            this._channels.filter(fn).forEach((c:Channel) => {
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

//not required, but I added an unsubscribe function taking the guid returned during subscription
//PubSubBus.prototype.unsubscribe = function (topicfn, guid) {
//    var writer = this.writer;
//    var unsubList = [];

//    try {
//        var topics = this.topics.filter(topicfn);

//        topics.forEach(function (t) {
//            var newSubList = [];

//            t.subscribers.forEach(function (s) {
//                if (s.guid !== guid) {
//                    newSubList.push(s);
//                }
//                else {
//                    unsubList.push(t.name);
//                    writer.write('subscriber(' + guid + ') has unsubscriber from topic(' + t.name + ')');
//                }
//            });

//            t.subscribers = newSubList;
//        });
//    }
//    catch (e) {
//        writer.write('error: ' + e);
//    }

//    return unsubList;
//};

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
//function runTest(bus:PubSubBus, writer:lg.ILogger) {
//    writer.clear();
//    bus.clearTopics();

//    bus.addTopic('TestTopic');
//    bus.addTopic('Test');
//    bus.addTopic('Topic');

//    writer.write('List Topics');
//    writer.write('=====================');
//    bus.listTopics().forEach(writer.write);


//    function listenerOne(message) {
//        writer.write('TT: ' + JSON.stringify(message));
//    }

//    function listenerTwo(message) {
//        writer.write('Tst: ' + JSON.stringify(message));
//    }

//    function listenerThree(message) {
//        writer.write('Tpc: ' + JSON.stringify(message));
//    }

//    function listenerFour(message) {
//        writer.write('New: ' + JSON.stringify(message));
//    }

//    var l1 = bus.subscribe(exactMatchFN('TestTopic'), listenerOne);
//    var l2 = bus.subscribe(exactMatchFN('Test'), listenerTwo);
//    var l3 = bus.subscribe(regexMatchFN('/Topic$/'), listenerThree);

//    writer.write('');
//    writer.write('Sunscribers');
//    writer.write('=====================');
//    writer.write('l1: ' + l1);
//    writer.write('l2: ' + l2);
//    writer.write('l3: ' + l3);

//    writer.write('');
//    writer.write('Publish to RegEx ^Test');
//    writer.write('=====================');
//    writer.write(bus.publish(regexMatchFN('/^Test/'), 'hello').join(', '));

//    writer.write('');
//    writer.write('Publish to Exact TestTopic');
//    writer.write('=====================');
//    writer.write(bus.publish(exactMatchFN('TestTopic'), { literal: 'hello' }).join(', '));

//    writer.write('');
//    writer.write('Publish to Exact Topic');
//    writer.write('=====================');
//    writer.write(bus.publish(exactMatchFN('Topic'), 555).join(', '));

//    writer.write('');
//    writer.write('New Subscriber (Topic)');
//    writer.write('=====================');
//    var l4 = bus.subscribe(exactMatchFN('Topic'), listenerFour);
//    writer.write('l4: ' + l4);

//    writer.write('');
//    writer.write('New Subscriber, again (TestTopic)');
//    writer.write('=====================');
//    var l5 = bus.subscribe(exactMatchFN('TestTopic'), listenerFour);
//    writer.write('l5: ' + l5);

//    writer.write('');
//    writer.write('Publish to Exact TestTopic');
//    writer.write('=====================');
//    writer.write(bus.publish(exactMatchFN('TestTopic'), { literal: 'hello again' }).join(', '));

//    writer.write('');
//    writer.write('Unsub l5(' + l5 + ') from Exact TestTopic');
//    writer.write('=====================');
//    writer.write(bus.unsubscribe(exactMatchFN('TestTopic'), l5).join(', '));

//    writer.write('');
//    writer.write('Publish to Exact TestTopic');
//    writer.write('=====================');
//    writer.write(bus.publish(exactMatchFN('TestTopic'), { literal: 'hello again again' }).join(', '));

//    bus.clearTopics();
//}

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
