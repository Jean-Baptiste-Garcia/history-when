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
            ? objfilter // biniouterie pour plan
            : array.filter(objfilter);

    });

    function filter(filters) {
        return function (array) {
            var thens = filters.map(function (w) {return w.filter('x'); }),
                index;// get frequency filter at obj level,
            return array.filter(function (item) {
                for (index = 0; index < filters.length; index += 1) {
                    if (filters[index].when(item)) {
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
        filter: filter
    };
};