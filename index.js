/*jslint node: true */
var R = require('ramda'),
    moment = require('moment');

module.exports = function (spec) {
    'use strict';

    var defaultOptions = { date: function (o) {return o.date; } },
        config = spec || {},
        dategetter = config.date || defaultOptions.date,
        fixedPresentDate = config.fixedPresent,
        //present = config.present || defaultOptions.present,
        //presentdate = new Date(present),
        //mpresent = moment(present).utc(),

        hour = 60 * 60 * 1000,
        day = 24 * hour,

        lastDurationObj,
        lastDuration,
        frequencyfilter,
        combinedfilter;


    function getPresent() {
        return fixedPresentDate || new Date();
    }

    lastDuration = R.curry(function (duration, array) {
        var present = getPresent();
        function filter(item) {
            var delta = dategetter(item) - present;
            return delta <= 0 && delta > -duration;
        }

        return array.filter(filter);
    });


    function today(array) {
        var mpresent = moment(getPresent()).utc();
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

    frequencyfilter = R.curry(function (frequency, array) {
        var frequences = {},
            present = getPresent();

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