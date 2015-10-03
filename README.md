history-when
===============
history-when is a time filtering API. It filters dated javascript objects based on present. For instance, it is possible to keep all objects whose date correspond to today, or yesterday. It is also possible to keep one object per hour.

It has been designed for [history-store](https://github.com/Jean-Baptiste-Garcia/history-store) and [history-trend](https://github.com/Jean-Baptiste-Garcia/history-trend), but it can be used independently. It has been inspired by [Ramda](https://github.com/Jean-Baptiste-Garcia/history-store).

Installation
------------

To use with node:

```bash
$ npm install history-when
```

Usage
-----
```javascript
var W = require('history-when')(),
    now = new Date(),
    afterPresent = new Date(now.getTime() + 1000),
    oneSecondAgo = new Date(now.getTime() - 1000),
    sharp24hoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

W.last24h({date: now }) // returns true
W.last24h({date: afterPresent }) // returns false
W.last24h({date: oneSecondAgo }) // returns true
W.last24h({date: sharp24hoursAgo }) // returns false
```

### Configuring present
By default, present is Date.now() when require('history-when')() is called.

It is possible to change present date by passing present date :

```javascript
var W = require('history-when')({present: new Date('1995-12-17T10:24:00')});
```

### Date objects
By default, date of object are accessed by ``` object.date```.
It is possible to change date access by passing a getter:

```javascript
var getter = function(o) {return o.creationdate},
    W = require('history-when')({date: getter)});
```