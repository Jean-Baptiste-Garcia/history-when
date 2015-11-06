/*jslint node: true */

module.exports = function (options) {
    'use strict';

    var R = require('ramda'),
        moment = require('moment'),

        defaultOptions = {present: Date.now(), date: R.prop('date')},
        config = options || {},
        present = config.present || defaultOptions.present,
        dategetter = config.date || defaultOptions.date,

        presentdate = new Date(present),
        mpresent = moment(present).utc(),

        hour = 60 * 60 * 1000,
        day = 24 * hour,

        lastDurationObj,
        lastDuration,
        frequencyfilter;



    lastDurationObj = R.curry(function (duration, o) {
        if (o === undefined) {
            return duration;
        }
        var delta = dategetter(o) - present;
        return delta <= 0 && delta > -duration;
    });


    lastDuration = R.curry(function (duration, o) {
        return o.filter(lastDurationObj(duration));
    });

    function todayObj(o) {
        var date = moment(dategetter(o)).utc();
        return mpresent.isSame(date, 'day');
    }

    function modulo(delta, frequency) {
        return delta >= 0
                ? Math.floor(delta / frequency)
                : Math.ceil(delta / frequency);
    }

    frequencyfilter = R.curry(function (frequency, array) {
        var frequences = {};

        function objfilter(obj) {
            var testdate = dategetter(obj),
                bin = modulo(present - testdate, frequency);
            return frequences[bin]
                    ? false
                    : frequences[bin] = true;
        }

        return (typeof array === 'string')
            ? objfilter
            : array.filter(objfilter);

    });

    function when(timefilter, frequencyfilter) {
        var ret = function (array) {
            return frequencyfilter(array.filter(timefilter));
        };
        ret.timefilter = timefilter;                //backdoor to access filter
        ret.frequencyfilter = frequencyfilter;      //backdoor to access filter
        return ret;
    }

    function plan(ws) {
        return function (array) {
            var whens = ws.sort(function (w1, w2) { return w1.timefilter(undefined) - w2.timefilter(undefined); }), // backdoor to get duration
                timefilters = whens.map(R.prop('timefilter')),
                frequencyfilters = whens.map(function (w) {return w.frequencyfilter('itemfilter'); }), // backdoor to have individual filter
                index;
            return array.filter(function (item) {
                for (index = 0; index < whens.length; index += 1) {
                    if (timefilters[index](item)) {
                        return frequencyfilters[index](item);
                    }
                }
                return false;
            });

        };
    }

    function planX(whens) {
        return function (array) {

            var acc = [],
                remainder = array,
                current;
            // It is a reduce !!!

            return whens.reduce(function (acc, w) {
                var current = w(remainder, true);
                remainder = current.rejected;
                return R.union(acc, current.result);
            }, []);


         //   whens.forEach(function (w) {
        //        current = w(remainder, true);
        //        acc = R.union(acc, current.result);
        //        remainder = current.rejected;
        //    });
        //    return acc;

           // var ok0 = whens[0](array, true),
            //    ok1 = whens[1](ok0.rejected);

            //return R.union(ok0.result, ok1);

        };
    }

    // more efficient and whens are sortable. better than plan()
    // could be improved if frequencyfilter could work on item base
    function plan2(whens) {
        return function (array) {
            var thens = whens.map(function (w) {return w.then('x'); }),
                index;// get frequency filter at obj level,
            return array.filter(function (item) {
                for (index = 0; index < whens.length; index += 1) {
                    if (whens[index].when(item)) {
                        return thens[index](item);
                    }
                }
                return false;
            });

        };
    }

    return {
        last24h: lastDuration(day),
        last24hObj: lastDurationObj(day),
        lastWeek: lastDuration(7 * day),
        lastWeekObj: lastDurationObj(7 * day),
        hourly: frequencyfilter(hour),
        daily: frequencyfilter(day),
        todayObj: todayObj,
        when : when,
        plan: plan,
        plan2: plan2
    };
};