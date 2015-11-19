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

            W.last24h(R.prop('date'), objects).should.eql([{date: new Date(now - epsilon)}]);
            W.last24h(R.prop('date'))(objects).should.eql([{date: new Date(now - epsilon)}]);
        });

        it('detects dated objects list with specific getter', function () {

            var W = require('../index')(),
                last24hFilter,
                epsilon = 60 * 1000,
                now = Date.now(),
                objects = [
                    {creationDate: new Date(now - epsilon)},
                    {creationDate: new Date(now - (oneDay + epsilon))},
                    {creationDate: new Date(now + (oneDay + epsilon))}];

            W.last24h(R.prop('creationDate'), objects).should.eql([ {creationDate: new Date(now - epsilon)}]);
        });

        it('detects 24 last-hours dated objects list with non default present', function () {
            var present = Date.now() - 2 * oneDay,
                W = require('../index')({present: present}),
                last24hFilter,
                epsilon = 60 * 10000,
                today = new Date(present - epsilon),
                yesterdaysharp = new Date(present - (24 * 60 * 60 * 1000)),
                yesterday = new Date(present - (24 * 60 * 60 * 1000 + epsilon)),
                tomorrowsharp = new Date(present + 1),
                tomorrow = new Date(present + (24 * 60 * 60 * 1000 + epsilon));

            W.last24h(R.prop('date'), [{date: today}]).should.eql([{date: today}]);
            W.last24h(R.prop('date'), [{date: present}]).should.eql([{date: present}]);
            W.last24h(R.prop('date'), [{date: yesterday}]).should.eql([]);
            W.last24h(R.prop('date'), [{date: yesterdaysharp}]).should.eql([]);
            W.last24h(R.prop('date'), [{date: tomorrow}]).should.eql([]);
            W.last24h(R.prop('date'), [{date: tomorrowsharp}]).should.eql([]);
        });
    });

    describe('hourly', function () {

        it('accepts one date per hour and is stateless', function () {
            var now = Date.now(),
                W = require('../index')({present: now}),
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

            W.hourly(R.prop('d'), dates).should.eql(
                [
                    now, // 'e0',
                    now - onehour, //'e-1h',
                    now - 2 * onehour, //'e-2h00',
                    now - 3 * onehour - 5 * minute, //'e-3h05'
                    now - 23 * onehour
                ].map(msToDate)
            );

            // check hourly function is stateless
            W.hourly(R.prop('d'), dates).should.eql(
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

            W.hourly(R.prop('date'), [
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

            W.filter([{when: W.last24h(R.prop('date')), pick: W.hourly(R.prop('date'))}])(objects).
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
                date = R.prop('date'),
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
                {when: W.last24h(date), pick: W.hourly(date)},
                {when: W.lastWeek(date), pick: W.daily(date)}])(objects).map(keyOnly).should.eql([
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
        it('detects dated objects', function () {

            var present = new Date('1995-12-17T13:24:00'),
                W = require('../index')({present: present.getTime()}),
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

            W.today(R.prop('d'), objects).should.eql([
                {d: present, desc: 'present'},
                {d: new Date('1995-12-17T10:24:00'), desc: '3 hours before present'},
                {d: new Date('1995-12-17T00:00:00'), desc: 'beginning of present'},
                {d: new Date('1995-12-17T20:20:20'), desc:  'few hours after present'},
                {d: new Date('1995-12-17T23:59:59'), desc: 'last second of today'}
            ]);

        });
    });
});


describe('readme', function () {
    it('usage example works', function () {
        var W = require('../index')(),
            now = new Date(),
            afterPresent = new Date(now.getTime() + 1000),
            oneSecondAgo = new Date(now.getTime() - 1000),
            sharp24hoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000),
            objects = [
                {date: afterPresent, name: 'after present'},
                {date: now, name: 'now' },
                {date: oneSecondAgo, name: 'one second ago'},
                {date: sharp24hoursAgo, name: '24 hours ago'}
            ];
        function getdate(object) {return object.date; }

        W.last24h(getdate, objects).should.eql([
            {date: now, name: 'now' },
            {date: oneSecondAgo, name: 'one second ago'}
        ]);
    });
});
