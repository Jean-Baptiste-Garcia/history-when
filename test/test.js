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

            W.last24h(today).should.equals(true, 'today');
            W.last24h(yesterday).should.equals(false, 'yesterday');
            W.last24h(tomorrow).should.equals(false, 'tomorrow');
        });

        it('detects dated object with specific getter', function () {

            var W = require('../index')({date: R.prop('creationDate')}),
                last24hFilter,
                epsilon = 60 * 1000,
                now = Date.now(),
                today     = {creationDate: new Date(now - epsilon)},
                yesterday = {creationDate: new Date(now - (oneDay + epsilon))},
                tomorrow  = {creationDate: new Date(now + (oneDay + epsilon))};

            W.last24h(today).should.equals(true, 'today');
            W.last24h(yesterday).should.equals(false, 'yesterday');
            W.last24h(tomorrow).should.equals(false, 'tomorrow');
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

            W.last24h({date: today}).should.equals(true, 'today');
            W.last24h({date: present}).should.equals(true, 'today sharp');
            W.last24h({date: yesterday}).should.equals(false, 'yesterday');
            W.last24h({date: yesterdaysharp}).should.equals(false, 'yesterday sharp');
            W.last24h({date: tomorrow}).should.equals(false, 'tomorrow');
            W.last24h({date: tomorrowsharp}).should.equals(false, 'tomorrow sharp');
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

            W.when(W.last24h, W.hourly)([
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
