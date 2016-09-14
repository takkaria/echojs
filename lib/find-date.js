'use strict';

// 'Safe' exec - returns an array no matter what, so you can index into it
function safeExec(regex, text) {
	return regex.exec(text) || [ ];
}

function monthToInt(s) {
	var first3 = s.slice(0, 3).toLowerCase();
	var a = {
		jan: 1,  feb: 2,  mar: 3,  apr: 4,
		may: 5,  jun: 6,  jul: 7,  aug: 8,
		sep: 9,  oct: 10, nov: 11, dec: 12
	};

	return a[first3] || null;
}

function findDate(base, text) {

	var time = safeExec(/\d?\d[\.:]\d\d([ap]m)?/, text)[0] ||
			safeExec(/\d?\d([ap]m)/, text)[0];

	var day = safeExec(/(\d?\d)(st|nd|rd|th)/, text)[1];

	var month = safeExec(/(January|February|March|May|April|June|July|August|September|October|November|December)/, text)[0] ||
			safeExec(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/, text)[0];

	if (time && day && month) {
		var d = new Date();

		// We set the day of the month to 1 first for the following reason:
		// Say it's February 2016, a leap year - so February has 29 days.
		// If the date we are setting is 30 January 2016, doing:
		//   (new Date()).setDate(30)
		// ...will result in a date object set to 1 March.
		//
		// Similarly, if it's 31 May, and you want to set the date to 28 Feb,
		// (new Date()).setMonth(2) gets you 3 March.
		d.setDate(1);

		// Months in JS are 0-11, not 1-12
		d.setMonth(monthToInt(month) - 1);
		d.setDate(parseInt(day, 10));

		// Assume year in the future
		if (d.getMonth() < base.getMonth())
			d.setYear(base.getFullYear() + 1);
		else
			d.setYear(base.getFullYear());

		var hours = parseInt(time, 10);

		if (!/(am|pm)/.test(time)) {
			if (hours > 0 || hours <= 6)
				hours += 12;
		} else if (/pm/.test(time)) {
			hours += 12;
		}

		var minutes = parseInt(safeExec(/[\.:](\d\d)/, time)[1], 10) || 0;

		d.setHours(hours, minutes, 0, 0);

		return d;
	}

	return null;
}

module.exports = findDate;
