/* globals QiscusSDKCore */
// This service is to bridge QiscusSDK with this sample app

define(['service/emitter'], function (emitter) {
  var Qiscus = QiscusSDKCore;
  var qiscus = new QiscusSDKCore();

  var appId = 'sdksample';
  // var appId = 'dragongo'
  // var appId = 'apptest-parvvzx2tq0si'

  // qiscus.debugMode = true;
  // qiscus.debugMQTTMode = true;
  // qiscus.setCustomHeader({ 'QISCUS-SDK-PARTNER-KEY': 'm3KvU5-se4rc#' });

  qiscus.init({
    AppId: appId,
    // baseURL: 'https://api-dc-drc.qiscus.com',
    // baseURL: 'https://api3.qiscus.com',
    // updateCommentStatusMode: QiscusSDKCore.UpdateCommentStatusMode.throttled,
    // updateCommentStatusMode: QiscusSDKCore.UpdateCommentStatusMode.disabled,
    // mqttURL: 'wss://mqtt.qiscus.com:1886/mqtt',
    options: {
      loginSuccessCallback: function (authData) {
        emitter.emit('qiscus::login-success', authData);
      },
      newMessagesCallback: function (messages) {
        messages.forEach(function (it) {
          emitter.emit('qiscus::new-message', it);
        });
      },
      presenceCallback: function (data) {
        var isOnline = data.split(':')[0] === '1';
        var lastOnline = new Date(Number(data.split(':')[1]));
        emitter.emit('qiscus::online-presence', {
          isOnline: isOnline,
          lastOnline: lastOnline,
        });
      },
      commentReadCallback: function (data) {
        emitter.emit('qiscus::comment-read', data);
      },
      commentDeliveredCallback: function (data) {
        emitter.emit('qiscus::comment-delivered', data);
      },
      typingCallback: function (data) {
        emitter.emit('qiscus::typing', data);
      },
      commentDeletedCallback: function (data) {
        emitter.emit('qiscus::comment-deleted', data);
      },
    },
  });

  showdown.extension('only-inline-stuff', function () {
    return [
      {
        type: 'output',
        filter: function (text) {
          // remove paragraphs
          text = text.replace(/<\/?p[^>]*>/g, '');

          // remove code (if you want)
          // text = text.replace(/<\/?code[^>]*>/g, '');

          //add other stuff here that you want to remove
          // text = text.replace(, '');
          return text;
        },
      },
    ];
  });
  var conv = new showdown.Converter({ extensions: ['only-inline-stuff'] });

  // Here is an implementation of interceptor for semi translate
  qiscus.intercept(Qiscus.Interceptor.MESSAGE_BEFORE_SENT, function (message) {
    return message;
  });
  qiscus.intercept(Qiscus.Interceptor.MESSAGE_BEFORE_RECEIVED, async function (
    message
  ) {
    const content = message.message.replace(/(qis)(cus)/im, function (
      _,
      $1,
      $2
    ) {
      return `**${$1.toLowerCase()}**${$2.toLowerCase()}`;
    });

    Object.assign(message, {
      message: conv.makeHtml(content),
      extras: Object.assign(message.extras || {}, { before_received: true }),
    });
    return message;
  });

  return qiscus;
});
