history-when
===============
history-when is a time filtering API. It has been designed for [history-store](https://github.com/Jean-Baptiste-Garcia/history-store) and [history-trend](https://github.com/Jean-Baptiste-Garcia/history-trend), but it can be used independently. It has been inspired by [Ramda](https://github.com/Jean-Baptiste-Garcia/history-store).

Installation
------------

To use with node:

```bash
$ npm install history-when
```

Then in the console:

```javascript
var W = require('history-when');
```

Usage
-----
```javascript
var now = new Date(),
    afterPresent = new Date(now.getTime() + 1000),
    oneSecondAgo = new Date(now.getTime() - 1000),
    24hoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

W.last24h('date')({date: now }) // returns true
W.last24h('date')({date: afterPresent }) // returns false
W.last24h('date')({date: oneSecondAgo }) // returns true
W.last24h('date')({date: 24hoursAgo }) // returns false



```