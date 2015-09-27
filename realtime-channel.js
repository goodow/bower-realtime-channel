var realtime = realtime || {};
realtime.channel = realtime.channel || {};

!function(factory) {
  factory(Paho.MQTT);
}(function(Mqtt) {

  realtime.channel.Bus = function(host, port) {
  
    var that = this;
    var mqtt = new Mqtt.Client(host, port, "web_" + parseInt(Math.random() * 100));
    var onConnect = function() {
      state = realtime.channel.Bus.OPEN;
      if (that.onopen) {
        that.onopen();
      }
    };
    var state = realtime.channel.Bus.CONNECTING;
    mqtt.connect({onSuccess:onConnect});
    var handlerMap = {};
    var replyHandlers = {};

    that.onopen = null;
    that.onclose = null;

    that.send = function(topic, payload, replyHandler) {
      sendOrPub(true, topic, payload, replyHandler)
    };
  
    that.publish = function(topic, payload) {
      sendOrPub(false, topic, payload, null)
    };
  
    that.subscribe = function(topic, handler) {
      checkSpecified("topic", 'string', topic);
      checkSpecified("handler", 'function', handler);
      checkOpen();
      var handlers = handlerMap[topic];
      if (!handlers) {
        handlers = [handler];
        handlerMap[topic] = handlers;
        // First handler for this topic so we should register the connection
        mqtt.subscribe(topic);
      } else {
        handlers[handlers.length] = handler;
      }

      var unsubscribe = function() {
        //checkSpecified("topic", 'string', topic);
        //checkSpecified("handler", 'function', handler);
        checkOpen();
        var handlers = handlerMap[topic];
        if (handlers) {
          var idx = handlers.indexOf(handler);
          if (idx != -1) handlers.splice(idx, 1);
          if (handlers.length == 0) {
            // No more local handlers so we should unregister the connection
            mqtt.unsubscribe(topic);
            delete handlerMap[topic];
          }
        }
      };
      return {unsubscribe: unsubscribe};
    };
  
    that.close = function() {
      checkOpen();
      state = realtime.channel.Bus.CLOSING;
      mqtt.disconnect();
    };
  
    that.readyState = function() {
      return state;
    };

    // called when the client loses its connection
    mqtt.onConnectionLost = function(responseObject) {
      state = realtime.channel.Bus.CLOSED;
      if (that.onclose) {
        that.onclose(responseObject);
      }
    };
  
    mqtt.onMessageArrived = function(e) {
      var payloadString = e.payloadString;
      var topic = e.destinationName;
      var message = JSON.parse(payloadString);
      if (message["error"]) {
        console.error("Error received: " + JSON.stringify(message["error"]));
        return;
      }
      message["topic"] = topic;
      var replyTopic = message["replyTopic"];
      if (replyTopic) {
        message.reply = function(reply, replyHandler) {
          // Send back reply
          that.send(replyTopic, reply, replyHandler);
        };
      }
      var handlers = handlerMap[topic];
      if (handlers) {
        // We make a copy since the handler might get unregistered from within the
        // handler itself, which would screw up our iteration
        var copy = handlers.slice(0);
        for (var i  = 0; i < copy.length; i++) {
          copy[i](message);
        }
      } else {
        // Might be a reply message
        var handler = replyHandlers[topic];
        if (handler) {
          delete replyHandlers[topic];
          mqtt.unsubscribe(topic);
          handler({"result": message});
        }
      }
    };

    function sendOrPub(send, topic, payload, replyHandler) {
      checkSpecified("topic", 'string', topic);
      checkSpecified("replyHandler", 'function', replyHandler, true);
      checkOpen();
      var msg = {};
      if (send) {
        msg["send"] = true;
      }
      if (payload) {
        msg["payload"] = payload;
      }
      if (replyHandler) {
        var replyTopic = makeUUID(topic);
        msg["replyTopic"] = replyTopic;
        replyHandlers[replyTopic] = replyHandler;
        mqtt.subscribe(replyTopic);
      }
      var message = new Mqtt.Message(JSON.stringify(msg));
      message.destinationName = topic;
      mqtt.send(message);
    }
  
    function checkOpen() {
      if (state != realtime.channel.Bus.OPEN) {
        throw new Error('INVALID_STATE_ERR');
      }
    }
  
    function checkSpecified(paramName, paramType, param, optional) {
      if (!optional && !param) {
        throw new Error("Parameter " + paramName + " must be specified");
      }
      if (param && typeof param != paramType) {
        throw new Error("Parameter " + paramName + " must be of type " + paramType);
      }
    }

    function makeUUID(topic){
        var id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
            .replace(/[xy]/g,function(a,b){return b=Math.random()*16,(a=="y"?b&3|8:b|0).toString(16)});
        return "reply/" + id + "/" + topic;
    }
  
  };
  
  realtime.channel.Bus.CONNECTING = 0;
  realtime.channel.Bus.OPEN = 1;
  realtime.channel.Bus.CLOSING = 2;
  realtime.channel.Bus.CLOSED = 3;

  return realtime.channel.Bus;

});
