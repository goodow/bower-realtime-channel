bower-realtime-channel
======================

## Install

Install with `bower`:

```shell
bower install realtime-channel#gh-pages
```

Add `<script>` tags to your `index.html`:

```html
<script src="bower_components/paho-mqtt/src/mqttws31.js"></script>
<script src="bower_components/realtime-channel/realtime-channel.js"></script>
```

## Usage
```javascript
var bus = new realtime.channel.Bus("localhost", Number(1883));

bus.subscribe("some/topic", function(message) {
  var payload = message.payload;
  console.log("payload: " + JSON.stringify(payload, null, 2));
});

bus.publish("some/topic", {"name": "Larry Tin"});
```
See a [full example](https://github.com/goodow/bower-realtime-channel/blob/gh-pages/index.html) for more usage.

You can try out the Goodow Realtime Channel API Playground on its [live instance](http://goodow.github.io/bower-realtime-channel/).
