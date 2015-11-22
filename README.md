history-when
===============
history-when is a set of Date based filters that apply to array of dated objects. For instance, it is possible to keep all objects whose date correspond to today, or yesterday. It is also possible to keep one object per hour.

It has been designed for [history-trend](https://github.com/Jean-Baptiste-Garcia/history-trend), but it can be used independently. It has been inspired by [Ramda](https://github.com/ramda/ramda).

Installation
------------

To use with node:

```bash
$ npm install history-when
```

Usage
-----
### W.last24h
Retains dated objects whose date is no older than 24 hours ago.
Let us consider present to be ```2015-12-17T13:24:00```
```javascript

var W = require('history-when)({fixedPresent: new Date('2015-12-17T13:24:00')}),
    objects = [
        {date: new Date('2015-12-17T19:24:00'), name: 'after present'},
        {date: new Date('2015-12-17T13:24:00'), name: 'present' },
        {date: new Date('2015-12-17T13:23:59'), name: 'one second before present'},
        {date: new Date('2015-12-16T13:24:00'), name: '24 hours before present'}
    ];

// issuing
W.last24h(objects);

// returns
[
    {date: new Date('2015-12-17T13:24:00'), name: 'present' },
    {date: new Date('2015-12-17T13:23:59'), name: 'one second before present'}
]

```
### W.lastWeek
Retains dated objects whose date is no older than 7 days ago.

### W.hourly
Retains one object per hour.

### W.daily
Retains one object per day.

### W.today
Retains all objects whose date is today.

### Configuring Present
By default, present is ```Date.now()``` each time a filter is invoked.

It is possible to fix present by specifying present date of your choice :

```javascript
var W = require('history-when')({fixedPresent: new Date('1995-12-17T10:24:00')});
```

### Date objects
By default, date of object are accessed by ``` object.date```.
It is possible to change date access by passing a getter:

```javascript
var getter = function(o) {return o.creationdate},
    W = require('history-when')({date: getter)});
```