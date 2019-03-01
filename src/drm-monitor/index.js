/**
 * Finish with error; Set an error status for the HTTP response and no service bus output.
 *
 * @param context - The app context
 * @param error - The error message
 */
function fail(context, error) {
    context.res = { status : 500, body: {status: error} };
    context.bindings.out = undefined;
    context.done(error);
}

/**
 * Finish with success; Set status and simple output for the HTTP response
 * and update the service bus output binding to send the message(s)
 *
 * @param context - The app context
 * @param statusText - The description
 * @param outgoingMessages - The outgoing service bus message(s) if any
 */
function ok(context, statusText, outgoingMessages) {
    context.res = { status : 200, body: {status: statusText} };
    context.bindings.out = outgoingMessages;
    context.done();
}

/**
 * Given a Digi Remote Manager event payload, add additional
 * attributes to the message that are useful for the infrastructure
 * which may consume the events later.
 *
 * @param message - The event message
 */
function addMessageAttributes(message) {
    // Generate the simplifiedTopic based on the 2nd element of
    // the topic field.
    message.simplifiedTopic = "Unknown";
    if (message.topic) {
        let parts = message.topic.split('/');
        if (parts.length > 2) {
            message.simplifiedTopic = parts[1];
        }
    }
}


module.exports = function (context, req) {
    context.log.verbose(req);

    let model = (typeof req.body != 'undefined' && typeof req.body == 'object') ? req.body : null;
    if (!model) {
        fail(context, "no data; or invalid payload in body");
        return;
    }
    if (typeof model.Document === 'undefined') {
        fail(context, "bad data; not a monitor payload document");
        return;
    }

    var doc = model.Document;
    if (!doc) {
        // Keepalive. Could still possibly be invalid data, but less likely,
        // verbose logging would show the full content.
        context.log.info("Keepalive message");
        ok(context, "Keep-alive");
        return;
    }

    const messages = doc.Msg;
    if (messages) {
        // Do some slight conversion of the incoming message in addition to logging.
        if (messages.length > 0) {
            for (let msg of messages) {
                addMessageAttributes(msg);
                context.log.info(`${msg.timestamp}  ${msg.operation}  ${msg.topic}`);
            }
        } else {
            addMessageAttributes(messages);
            context.log.info(`${messages.timestamp}  ${messages.operation}  ${messages.topic}`);
        }
        ok(context, "ok", messages);
        return;
    }
    fail(context, "bad data; no messages in payload");
};
