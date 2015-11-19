/*jslint node: true */

module.exports = function (options) {
    'use strict';

    var R = require('ramda'),
        moment = require('moment'),

        defaultOptions = {present: Date.now(), date: R.prop('date')},
        config = options || {},
        present = config.present || defaultOptions.present,
        presentdate = new Date(present),
        mpresent = moment(present).utc(),

        hour = 60 * 60 * 1000,
        day = 24 * hour,

        lastDurationObj,
        lastDuration,
        frequencyfilter,
        combinedfilter;


    lastDuration = R.curry(function (duration, dategetter, array) {
        function filter(item) {
            var delta = dategetter(item) - present;
            return delta <= 0 && delta > -duration;
        }

        return array.filter(filter);
    });


    function today(dategetter, array) {
        function filter(item) {
            var date = moment(dategetter(item)).utc();
            return mpresent.isSame(date, 'day');
        }
        return array.filter(filter);
    }

    function modulo(delta, frequency) {
        return delta >= 0
                ? Math.floor(delta / frequency)
                : Math.ceil(delta / frequency);
    }

    frequencyfilter = R.curry(function (frequency, dategetter, array) {
        var frequences = {};

        function objfilter(obj) {
            var testdate = dategetter(obj),
                bin = modulo(present - testdate, frequency);
            return frequences[bin]
                    ? false
                    : frequences[bin] = true;
        }
        return array.filter(objfilter);
    });

    combinedfilter = R.curry(function (filters, array) {
        var remainder = array;
        return filters.reduce(function (out, f) {
            var selected = f.when(remainder);
            remainder = R.difference(remainder, selected);
            return out.concat(f.pick(selected));
        }, []);
    });

    return {
        last24h: lastDuration(day),
        lastWeek: lastDuration(7 * day),
        hourly: frequencyfilter(hour),
        daily: frequencyfilter(day),
        today: today,
        filter: combinedfilter
    };
};