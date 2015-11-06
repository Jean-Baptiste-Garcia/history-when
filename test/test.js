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

        it('detects dated object', function () {

            var W = require('../index')(),
                last24hFilter,
                epsilon = 60 * 1000,
                now = Date.now(),
                today     = {date: new Date(now - epsilon)},
                yesterday = {date: new Date(now - (oneDay + epsilon))},
                tomorrow  = {date: new Date(now + (oneDay + epsilon))};

            W.last24hObj(today).should.equals(true, 'today');
            W.last24hObj(yesterday).should.equals(false, 'yesterday');
            W.last24hObj(tomorrow).should.equals(false, 'tomorrow');
        });

        it('detects dated objects array', function () {

            var W = require('../index')(),
                last24hFilter,
                epsilon = 60 * 1000,
                now = Date.now(),
                objects = [
                    {date: new Date(now - epsilon)},
                    {date: new Date(now - (oneDay + epsilon))},
                    {date: new Date(now + (oneDay + epsilon))}];

            W.last24h(objects).should.eql([{date: new Date(now - epsilon)}]);
        });

        it('detects dated object with specific getter', function () {

            var W = require('../index')({date: R.prop('creationDate')}),
                last24hFilter,
                epsilon = 60 * 1000,
                now = Date.now(),
                today     = {creationDate: new Date(now - epsilon)},
                yesterday = {creationDate: new Date(now - (oneDay + epsilon))},
                tomorrow  = {creationDate: new Date(now + (oneDay + epsilon))};

            W.last24hObj(today).should.equals(true, 'today');
            W.last24hObj(yesterday).should.equals(false, 'yesterday');
            W.last24hObj(tomorrow).should.equals(false, 'tomorrow');
        });


        it('detects 24 last-hours dated objects with non default present', function () {
            var present = Date.now() - 2 * oneDay,
                W = require('../index')({present: present}),
                last24hFilter,
                epsilon = 60 * 10000,
                today = new Date(present - epsilon),
                yesterdaysharp = new Date(present - (24 * 60 * 60 * 1000)),
                yesterday = new Date(present - (24 * 60 * 60 * 1000 + epsilon)),
                tomorrowsharp = new Date(present + 1),
                tomorrow = new Date(present + (24 * 60 * 60 * 1000 + epsilon));

            W.last24hObj({date: today}).should.equals(true, 'today');
            W.last24hObj({date: present}).should.equals(true, 'today sharp');
            W.last24hObj({date: yesterday}).should.equals(false, 'yesterday');
            W.last24hObj({date: yesterdaysharp}).should.equals(false, 'yesterday sharp');
            W.last24hObj({date: tomorrow}).should.equals(false, 'tomorrow');
            W.last24hObj({date: tomorrowsharp}).should.equals(false, 'tomorrow sharp');
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

    describe('when()', function () {
        it('detects 24 last-hours dated objects and filter one per hour', function () {
            var now = Date.now(),
                W = require('../index')({present: now}),
                minute = 60 * 1000,
                onehour = 60 * minute,
                yesterday = new Date(now - (oneDay + 2 * minute)),
                tomorrow = new Date(now + (oneDay + 2 * minute));

            W.when(W.last24hObj, W.hourly)([
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

    describe('plan()', function () {
        it('select hourly for 24 last-hours dated objects and daily for last week date objects', function () {
            var now = Date.now(),
                W = require('../index')({present: now}),
                minute = 60 * 1000,
                hour = 60 * minute,
                day = 24 * hour;

            W.plan([
                W.when(W.last24hObj, W.hourly),
                W.when(W.lastWeekObj, W.daily)
            ])([
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
            ]).map(keyOnly).should.eql([
                'h-4.40',
                'h-5',
                'h-23.10',
                'd-1-h1',
                'd-2-h3',
                'd-6-h3'
            ]);
        });

        it('sorts timefilters and select hourly for 24 last-hours dated objects and daily for last week date objects', function () {
            var now = Date.now(),
                W = require('../index')({present: now}),
                minute = 60 * 1000,
                hour = 60 * minute,
                day = 24 * hour;

            W.plan([
                W.when(W.lastWeekObj, W.daily),
                W.when(W.last24hObj, W.hourly)
            ])([
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
            ]).map(keyOnly).should.eql([
                'h-4.40',
                'h-5',
                'h-23.10',
                'd-1-h1',
                'd-2-h3',
                'd-6-h3'
            ]);
        });
    });


    describe('plan2()', function () {
        it('select hourly for 24 last-hours dated objects and daily for last week date objects', function () {
            var now = Date.now(),
                W = require('../index')({present: now}),
                minute = 60 * 1000,
                hour = 60 * minute,
                day = 24 * hour;

            W.plan2([
                {when: W.last24hObj, then: W.hourly},
                {when: W.lastWeekObj, then: W.daily}])([
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
            ]).map(keyOnly).should.eql([
                'h-4.40',
                'h-5',
                'h-23.10',
                'd-1-h1',
                'd-2-h3',
                'd-6-h3'
            ]);
        });
    });


    describe('today', function () {

        it('detects dated object', function () {

            var present = new Date('1995-12-17T13:24:00'),
                W = require('../index')({present: present.getTime(), date: R.prop('d')});

            W.today({d: present}).should.equals(true, 'present date');
            W.today({d: new Date('1995-12-17T10:24:00')}).should.equals(true, '3 hours before present');
            W.today({d: new Date('1995-12-17T00:00:00')}).should.equals(true, 'beginning of present');
            W.today({d: new Date('1995-12-17T20:20:20')}).should.equals(true, 'few hours after present');
            W.today({d: new Date('1995-12-17T23:59:59')}).should.equals(true, 'last second of today');
            W.today({d: new Date('1995-12-18T00:00:00')}).should.equals(false, 'tomorrow');
            W.today({d: new Date('1995-12-16T23:59:59')}).should.equals(false, 'yesterday');
            W.today({d: new Date('1995-12-14T10:24:00')}).should.equals(false, '3 days 3 hours before present');
            W.today({d: new Date('1995-09-17T10:24:00')}).should.equals(false, '3 months 3 hours before present');
            W.today({d: new Date('1993-12-17T10:24:00')}).should.equals(false, '3 years 3 hours before present');
        });
    });
});

describe('readme', function () {
    it('usage example works', function () {
        var W = require('../index')(),
            now = new Date(),
            afterPresent = new Date(now.getTime() + 1000),
            oneSecondAgo = new Date(now.getTime() - 1000),
            sharp24hoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        W.last24hObj({date: now }).should.equals(true); // returns true
        W.last24hObj({date: afterPresent }).should.equals(false); // returns false
        W.last24hObj({date: oneSecondAgo }).should.equals(true); // returns true
        W.last24hObj({date: sharp24hoursAgo }).should.equals(false); // returns false
    });
});
