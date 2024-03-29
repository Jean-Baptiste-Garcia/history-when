/*jslint node: true*/
/*global describe: true, it: true */
'use strict';

var should = require('chai').should(),
    oneDay = 24 * 60 * 60 * 1000,
    R = require('ramda');

function toDate(item) {
    return {key: item.key, date: new Date(item.date)};
}

function msToDate(item) {
    return {d: new Date(item)};
}

function keyOnly(item) {
    return item.key;
}


describe('history-when', function () {


    describe('last24h', function () {

        it('detects dated objects list', function () {
            var W = require('../index')(),
                last24hFilter,
                epsilon = 60 * 1000,
                now = Date.now(),
                objects = [
                    {date: new Date(now - epsilon)},
                    {date: new Date(now - (oneDay + epsilon))},
                    {date: new Date(now + (oneDay + epsilon))}];

            W.last24h(objects).should.eql([{date: new Date(now - epsilon)}]);
            W.last24h(objects).should.eql([{date: new Date(now - epsilon)}]);
        });

        it('detects dated objects list with custom date getter', function () {

            var W = require('../index')({date: R.prop('creationDate')}),
                last24hFilter,
                epsilon = 60 * 1000,
                now = Date.now(),
                objects = [
                    {creationDate: new Date(now - epsilon)},
                    {creationDate: new Date(now - (oneDay + epsilon))},
                    {creationDate: new Date(now + (oneDay + epsilon))}];

            W.last24h(objects).should.eql([ {creationDate: new Date(now - epsilon)}]);
        });

        it('detects 24 last-hours dated objects list with non default present', function () {
            var present = Date.now() - 2 * oneDay,
                W = require('../index')({fixedPresent: present}),
                last24hFilter,
                epsilon = 60 * 10000,
                today = new Date(present - epsilon),
                yesterdaysharp = new Date(present - (24 * 60 * 60 * 1000)),
                yesterday = new Date(present - (24 * 60 * 60 * 1000 + epsilon)),
                tomorrowsharp = new Date(present + 1),
                tomorrow = new Date(present + (24 * 60 * 60 * 1000 + epsilon));

            W.last24h([{date: today}]).should.eql([{date: today}]);
            W.last24h([{date: present}]).should.eql([{date: present}]);
            W.last24h([{date: yesterday}]).should.eql([]);
            W.last24h([{date: yesterdaysharp}]).should.eql([]);
            W.last24h([{date: tomorrow}]).should.eql([]);
            W.last24h([{date: tomorrowsharp}]).should.eql([]);
        });
    });

    describe('hourly', function () {

        it('accepts one date per hour and is stateless', function () {
            var now = Date.now(),
                W = require('../index')({present: now, date: R.prop('d')}),
                minute = 60 * 1000,
                onehour = 60 * minute,
                yesterday = new Date(now - (oneDay + 2 * minute)),
                tomorrow = new Date(now + (oneDay + 2 * minute)),
                dates = [
                    now,
                    now - onehour,
                    now - onehour - 30 * minute,
                    now - onehour - 45 * minute,
                    now - 2 * onehour,
                    now - 2 * onehour - 5 * minute,
                    now - 3 * onehour - 5 * minute,
                    now - 3 * onehour - 5 * minute - 1,
                    now - 23 * onehour,
                    now - 23 * onehour - 59 * minute
                ].map(msToDate);

            W.hourly(dates).should.eql(
                [
                    now, // 'e0',
                    now - onehour, //'e-1h',
                    now - 2 * onehour, //'e-2h00',
                    now - 3 * onehour - 5 * minute, //'e-3h05'
                    now - 23 * onehour
                ].map(msToDate)
            );

            // check hourly function is stateless
            W.hourly(dates).should.eql(
                [
                    now, // 'e0',
                    now - onehour, //'e-1h',
                    now - 2 * onehour, //'e-2h00',
                    now - 3 * onehour - 5 * minute, //'e-3h05'
                    now - 23 * onehour
                ].map(msToDate)
            );

        });

        it('accepts one dated object per hour', function () {
            var now = Date.now(),
                W = require('../index')({present: now}),
                minute = 60 * 1000,
                onehour = 60 * minute,
                yesterday = new Date(now - (oneDay + 2 * minute)),
                tomorrow = new Date(now + (oneDay + 2 * minute));

            W.hourly([
                {key: 'e0', date: now},
                {key: 'e-1h', date: now - onehour},
                {key: 'e-1h30', date: now - onehour - 30 * minute},
                {key: 'e-1h45', date: now - onehour - 45 * minute},
                {key: 'e-2h00', date: now - 2 * onehour},
                {key: 'e-2h05', date: now - 2 * onehour - 5 * minute},
                {key: 'e-3h05', date: now - 3 * onehour - 5 * minute},
                {key: 'e-3h05e', date: now - 3 * onehour - 5 * minute - 1},
                {key: 'e-23h', date: now - 23 * onehour},
                {key: 'e-23h59', date: now - 23 * onehour - 59 * minute}
            ].map(toDate)).
                map(keyOnly).should.eql(
                    [
                        'e0',
                        'e-1h',
                        'e-2h00',
                        'e-3h05',
                        'e-23h'
                    ]
                );
        });
    });

    describe('filter()', function () {
        it('detects 24 last-hours dated objects and filter one per hour', function () {
            var now = Date.now(),
                W = require('../index')({present: now}),
                minute = 60 * 1000,
                onehour = 60 * minute,
                yesterday = new Date(now - (oneDay + 2 * minute)),
                tomorrow = new Date(now + (oneDay + 2 * minute)),
                objects = [
                    {key: 'e0', date: now},
                    {key: 'e2', date: yesterday},
                    {key: 'e3', date: tomorrow},
                    {key: 'e-1h', date: now - onehour},
                    {key: 'e-1h30', date: now - onehour - 30 * minute},
                    {key: 'e-1h45', date: now - onehour - 45 * minute},
                    {key: 'e-2h00', date: now - 2 * onehour},
                    {key: 'e-2h05', date: now - 2 * onehour - 5 * minute},
                    {key: 'e-3h05', date: now - 3 * onehour - 5 * minute},
                    {key: 'e-3h05e', date: now - 3 * onehour - 5 * minute - 1},
                    {key: 'e-23h', date: now - 23 * onehour},
                    {key: 'e-23h59', date: now - 23 * onehour - 59 * minute},
                    {key: 'e-24h', date: now - 24 * onehour}
                ].map(toDate);

            W.filter([{when: W.last24h, pick: W.hourly}])(objects).
                map(keyOnly).should.eql(
                    [
                        'e0',
                        'e-1h',
                        'e-2h00',
                        'e-3h05',
                        'e-23h'
                    ]
                );
        });

        it('select hourly for 24 last-hours dated objects and daily for last week date objects', function () {
            var now = Date.now(),
                W = require('../index')({present: now}),
                minute = 60 * 1000,
                hour = 60 * minute,
                day = 24 * hour,
                objects = [
                    {date: new Date(now + day), key: 'tomorrow'},
                    {date: new Date(now - (4 * hour + 40 * minute)), key: 'h-4.40'},
                    {date: new Date(now - 5 * hour), key: 'h-5'},
                    {date: new Date(now - (5 * hour + 10 * minute)), key: 'h-5.10'},
                    {date: new Date(now - (23 * hour + 10 * minute)), key: 'h-23.10'},
                    {date: new Date(now - (day + hour)), key: 'd-1-h1'},
                    {date: new Date(now - (day + 3 * hour)), key: 'd-1-h3'},
                    {date: new Date(now - (day + 10 * hour)), key: 'd-1-h10'},
                    {date: new Date(now - (2 * day + 3 * hour)), key: 'd-2-h3'},
                    {date: new Date(now - (6 * day + 3 * hour)), key: 'd-6-h3'},
                    {date: new Date(now - (7 * day)), key: 'd-7'}
                ];

            W.filter([
                {when: W.last24h, pick: W.hourly},
                {when: W.lastWeek, pick: W.daily}])(objects).map(keyOnly).should.eql([
                'h-4.40',
                'h-5',
                'h-23.10',
                'd-1-h1',
                'd-2-h3',
                'd-6-h3'
            ]);
        });
    });


    describe('filters', function () {
        it('today detects today dated objects', function () {

            var present = new Date('1995-12-17T13:24:00'),
                W = require('../index')({fixedPresent: present, date: R.prop('d')}),
                objects = [
                    {d: present, desc: 'present'},
                    {d: new Date('1995-12-17T10:24:00'), desc: '3 hours before present'},
                    {d: new Date('1995-12-17T00:00:00'), desc: 'beginning of present'},
                    {d: new Date('1995-12-17T20:20:20'), desc:  'few hours after present'},
                    {d: new Date('1995-12-17T23:59:59'), desc: 'last second of today'},
                    {d: new Date('1995-12-18T00:00:00'), desc:  'tomorrow'},
                    {d: new Date('1995-12-16T23:59:59'), desc: 'yesterday'},
                    {d: new Date('1995-12-14T10:24:00'), desc:  '3 days 3 hours before present'},
                    {d: new Date('1995-09-17T10:24:00'), desc:  '3 months 3 hours before present'},
                    {d: new Date('1993-12-17T10:24:00'), desc:  '3 years 3 hours before present'}
                ];

            W.today(objects).should.eql([
                {d: present, desc: 'present'},
                {d: new Date('1995-12-17T10:24:00'), desc: '3 hours before present'},
                {d: new Date('1995-12-17T00:00:00'), desc: 'beginning of present'},
                {d: new Date('1995-12-17T20:20:20'), desc:  'few hours after present'},
                {d: new Date('1995-12-17T23:59:59'), desc: 'last second of today'}
            ]);
        });

        it('skipWeekend filters Saturday and Sunday', function () {
            var W = require('../index')(),
                objects = [
                    {date: new Date('2015-11-17T11:10:00')},
                    {date: new Date('2015-11-18T11:01:00')},
                    {date: new Date('2015-11-19T11:02:00')},
                    {date: new Date('2015-11-20T11:20:00')},
                    {date: new Date('2015-11-21T11:03:00')},
                    {date: new Date('2015-11-22T11:30:00')},
                    {date: new Date('2015-11-23T11:04:00')}
                ];
            W.skipWeekend(objects).should.eql([
                {date: new Date('2015-11-17T11:10:00')},
                {date: new Date('2015-11-18T11:01:00')},
                {date: new Date('2015-11-19T11:02:00')},
                {date: new Date('2015-11-20T11:20:00')},
                {date: new Date('2015-11-23T11:04:00')}
            ]);
        });
    });
    describe('and', function () {

        it('skipWeekend and W.last24h', function () {
            var W = require('../index')({fixedPresent: new Date('2015-11-23T12:04:00')}),
                objects = [
                    {date: new Date('2015-11-17T11:10:00')},
                    {date: new Date('2015-11-18T11:01:00')},
                    {date: new Date('2015-11-19T11:02:00')},
                    {date: new Date('2015-11-20T11:20:00')},
                    {date: new Date('2015-11-21T11:03:00')},
                    {date: new Date('2015-11-22T22:30:00')},
                    {date: new Date('2015-11-23T11:04:00')}
                ];
            W.and(W.skipWeekend, W.last24h)(objects).should.eql([
                {date: new Date('2015-11-23T11:04:00')}
            ]);
        });

        it('skipWeekend and W.last24h and hourly', function () {
            var W = require('../index')({fixedPresent: new Date('2015-11-23T12:04:00')}),
                objects = [
                    {date: new Date('2015-11-17T11:10:00')},
                    {date: new Date('2015-11-18T11:01:00')},
                    {date: new Date('2015-11-19T11:02:00')},
                    {date: new Date('2015-11-20T11:20:00')},
                    {date: new Date('2015-11-21T11:03:00')},
                    {date: new Date('2015-11-22T22:30:00')},
                    {date: new Date('2015-11-23T11:03:00')},
                    {date: new Date('2015-11-23T11:04:00')}
                ];
            W.and(W.skipWeekend, W.last24h, W.hourly)(objects).should.eql([
                {date: new Date('2015-11-23T11:03:00')}
            ]);
        });

    });

});


describe('readme', function () {
    it('usage example works', function () {
        var W = require('../index')({fixedPresent: new Date('2015-12-17T13:24:00')}),
            objects = [
                {date: new Date('2015-12-17T19:24:00'), name: 'after present'},
                {date: new Date('2015-12-17T13:24:00'), name: 'present' },
                {date: new Date('2015-12-17T13:23:59'), name: 'one second before present'},
                {date: new Date('2015-12-16T13:24:00'), name: '24 hours before present'}
            ];

        W.last24h(objects).should.eql([
            {date: new Date('2015-12-17T13:24:00'), name: 'present' },
            {date: new Date('2015-12-17T13:23:59'), name: 'one second before present'}
        ]);
    });
});
