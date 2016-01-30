//
// Markdown is too heavy for user-supplied text.  Most people aren't going to
// learn the syntax because the cost of entry is too high.  So here is a
// basic text-to-html solution.
//

'use strict';

var autolinker = require('autolinker');

module.exports = function textToHTML(text, opts) {

	if (opts === undefined) {
		opts = {};
	}

	var link = (opts.link === false) ? false : true;

	// 1. Escape all special characters.
	// Borrowed from teppeis/htmlspecialchars (MIT licence)
	var textOut =
		'<p>' + text.
					replace(/&/g, '&amp;').
					replace(/</g, '&lt;').
					replace(/>/g, '&gt;').
					replace(/"/g, '&quot;').
					replace(/'/g, '&#039;').

					// 2. Turn lone carriage returns/newlines into <br> tags
					replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2').

					// 3. Turn two or more line breaks into <p> tags
					replace(/(\s*<br>\s*?){2,}/g, '</p><p>') +

		'</p>';

	// 4. Autolink any links
	if (link)
		return autolinker.link(textOut, module.exports.autolinkOptions);
	else
		return textOut;
};

module.exports.autolinkOptions = {
	truncate: { length: 32, location: 'middle' },
	email: false,
	phone: false,
	hashtag: false
};
