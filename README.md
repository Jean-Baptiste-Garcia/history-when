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

var W = require('history-when')({fixedPresent: new Date('2015-12-17T13:24:00')}),
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

### W.skipWeekend
Filters out object dated on Saturday or Sunday.

### And combination
It is possible to combine several filters, using ```W.and``` function.

```javascript
 var W = require('history-when')({fixedPresent: new Date('2015-11-23T12:04:00')}),
            objects = [
                {date: new Date('2015-11-17T11:10:00')},
                {date: new Date('2015-11-18T11:01:00')},
                {date: new Date('2015-11-19T11:02:00')},
                {date: new Date('2015-11-20T11:20:00')},
                {date: new Date('2015-11-21T11:03:00')},
                {date: new Date('2015-11-22T22:30:00')},
                {date: new Date('2015-11-23T11:04:00')}
            ];
// issuing
W.and(W.skipWeekend, W.last24h)(objects);

// returns
[{date: new Date('2015-11-23T11:04:00')}]
```
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