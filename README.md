bower-realtime-channel
======================

This repo is for distribution on `bower`. The source for this module is in the
[main realtime-channel repo](https://github.com/goodow/realtime-channel).
Please file issues and pull requests against that repo.

## Install

Install with `bower`:

```shell
bower install realtime-channel#gh-pages
```

Add `<script>` tags to your `index.html`:

```html
<script src="/bower_components/bower-sockjs-client/sockjs.js"></script>
<script src="/bower_components/realtime-channel/realtime-channel.js"></script>
```

## Usage
```javascript
var bus = new realtime.channel.ReconnectBus("http://localhost:1986/channel", null);

bus.subscribe("some/topic", function(message) {
  var body = message.body();
  console.log("Name: " + body.name);
});

bus.publish("some/topic", {"name": "Larry Tin"});
```
See a [full example](https://github.com/goodow/realtime-web-playground/blob/master/app/bus.html) for more usage.

You can try out the Goodow Realtime Channel API Playground on its [live instance](http://realtimeplayground.goodow.com/bus.html).
