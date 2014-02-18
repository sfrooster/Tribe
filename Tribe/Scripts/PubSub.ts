//import ps = require("PubSubBus");
//import lg = require("Logging");

//function runTest(bus: ps.PubSubBus, writer: lg.ILogger) {
//    //writer.clear();
//    bus.clearChannels();

//    bus.addChannel('create');
//    bus.addChannel('update');
//    bus.addChannel('retrieve');
//    bus.addChannel('delete');

//    writer.logLine('List Channels');
//    writer.logLine('=====================');
//    bus.listChannels().forEach(writer.logLine);

//    var s1 = new ps.Subscriber((m) => {
//        var receipt = new Guid();
//        writer.logLine('S1: received message (from: {0}, payload: {1}), returned receipt ({2})'.format(m.from, m.payloadAsString(), receipt));
//        return receipt;
//    });

//    var s2 = new ps.Subscriber((m) => {
//        var receipt = new Guid();
//        writer.logLine('S2: received message (from: {0}, payload: {1}), returned receipt ({2})'.format(m.from, m.payloadAsString(), receipt));
//        return receipt;
//    });

//    var l1 = bus.subscribe('retireve', s1);
//    var l2 = bus.subscribe('update', s2);


//    //writer.write('');
//    //writer.write('Sunscribers');
//    //writer.write('=====================');
//    //writer.write('l1: ' + l1);
//    //writer.write('l2: ' + l2);
//    //writer.write('l3: ' + l3);

//    //writer.write('');
//    //writer.write('Publish to RegEx ^Test');
//    //writer.write('=====================');
//    //writer.write(bus.publish(regexMatchFN('/^Test/'), 'hello').join(', '));

//    //writer.write('');
//    //writer.write('Publish to Exact TestTopic');
//    //writer.write('=====================');
//    //writer.write(bus.publish(exactMatchFN('TestTopic'), { literal: 'hello' }).join(', '));

//    //writer.write('');
//    //writer.write('Publish to Exact Topic');
//    //writer.write('=====================');
//    //writer.write(bus.publish(exactMatchFN('Topic'), 555).join(', '));

//    //writer.write('');
//    //writer.write('New Subscriber (Topic)');
//    //writer.write('=====================');
//    //var l4 = bus.subscribe(exactMatchFN('Topic'), listenerFour);
//    //writer.write('l4: ' + l4);

//    //writer.write('');
//    //writer.write('New Subscriber, again (TestTopic)');
//    //writer.write('=====================');
//    //var l5 = bus.subscribe(exactMatchFN('TestTopic'), listenerFour);
//    //writer.write('l5: ' + l5);

//    //writer.write('');
//    //writer.write('Publish to Exact TestTopic');
//    //writer.write('=====================');
//    //writer.write(bus.publish(exactMatchFN('TestTopic'), { literal: 'hello again' }).join(', '));

//    //writer.write('');
//    //writer.write('Unsub l5(' + l5 + ') from Exact TestTopic');
//    //writer.write('=====================');
//    //writer.write(bus.unsubscribe(exactMatchFN('TestTopic'), l5).join(', '));

//    //writer.write('');
//    //writer.write('Publish to Exact TestTopic');
//    //writer.write('=====================');
//    //writer.write(bus.publish(exactMatchFN('TestTopic'), { literal: 'hello again again' }).join(', '));

//    //bus.clearTopics();
//} 