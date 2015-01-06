CREATE TABLE events (
	id INTEGER PRIMARY KEY,
	slug TEXT,

	/* Event data */
	title TEXT,
	startdt DATETIME,
	enddt DATETIME,
	location TEXT,
	blurb TEXT,
	url TEXT,
	type TEXT,		/* ATM this can only be "film" */
	cost TEXT,		/* NULL = free */
	host TEXT,

	/* State crap */
	state TEXT,		/* "submitted", "approved" */
	email TEXT,		/* Delete after submitted? */
	key TEXT,			/* key needed for validation */ /* XXX remove */
	importid TEXT
);

CREATE TABLE users (
	email TEXT PRIMARY KEY,
	salt TEXT,
	digest TEXT,

	pwreset TEXT,
	notify BOOLEAN,
	rights TEXT		/* "admin", "editor" */
);

CREATE TABLE posts (
	id TEXT PRIMARY KEY,
	link TEXT,
	title TEXT,
	date DATETIME,
	feed_id TEXT,
	hidden INTEGER
);

CREATE TABLE feeds (
	id TEXT PRIMARY KEY,
	site_url TEXT,
	title TEXT,
	errors TEXT
);
