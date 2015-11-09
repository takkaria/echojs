var marked = require('marked');
var renderer = new marked.Renderer();
var url = require('url');

renderer.link = function renderLink(href, title, text) {

	// When the href and text are the same, just use the domain
	if (href == text) {
		var urlObj = url.parse(href);
		if (urlObj.host)
			text = urlObj.host;
	}

	return marked.Renderer.prototype.link.bind(this)(href, title, text);
};

module.exports = renderer;
