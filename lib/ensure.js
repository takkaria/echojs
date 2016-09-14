function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }

	res.redirect('/user/login?next=' + encodeURIComponent(req.originalUrl));
}

function ensureEditorOrAdmin(req, res, next) {
	ensureAuthenticated(req, res, function() {
		if (req.user.rights === 'admin' || req.user.rights === 'editor') {
			return next();
		}

		req.flash('danger', 'Computer says no');
		res.redirect('/');
	});
}

function ensureAdmin(req, res, next) {
	ensureAuthenticated(req, res, function() {
		if (req.user.rights === 'admin') {
			return next();
		}

		req.flash('danger', 'Computer says no');
		res.redirect('/admin');
	});
}

module.exports = {
	authenticated: ensureAuthenticated,
	editorOrAdmin: ensureEditorOrAdmin,
	admin: ensureAdmin
};
