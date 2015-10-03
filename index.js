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
        dategetter = config.date || defaultOptions.date,
        hour = 60 * 60 * 1000,
        day = 24 * hour,
        lastDuration,
        frequencyfilter;


    lastDuration = R.curry(function (duration, o) {
        var delta = dategetter(o) - present;
        return delta <= 0 && delta > -duration;
    });

    function today(o) {
        var date = moment(dategetter(o)).utc();
        return mpresent.isSame(date, 'day');
    }

    frequencyfilter = R.curry(function (frequency, array) {
        var frequences = {};

        return array.filter(function (obj) {
            var testdate = dategetter(obj),
                delta = present - testdate,
                bin = ((delta >= 0) ? Math.floor : Math.ceil)(delta / frequency);
            return frequences[bin] ?
                    false :
                    frequences[bin] = true;
        });
    });

    function when(timefilter, frequencyfilter) {
        return function (array) {
            return frequencyfilter(array.filter(timefilter));
        };
    }

    return {
        last24h: lastDuration(day),
        lastWeek: lastDuration(7 * day),
        hourly: frequencyfilter(hour),
        today: today,
        when : when
    };
};