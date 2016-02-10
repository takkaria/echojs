CREATE TABLE locations (
	id INTEGER PRIMARY KEY,
	name TEXT,
	address TEXT,
	description TEXT,
	longitude REAL,
	latitude REAL
);

CREATE TABLE events (
	id INTEGER PRIMARY KEY,
	slug TEXT,
	type TEXT,

	title TEXT,
	startdt DATETIME,
	enddt DATETIME,
	allday BOOLEAN,

	location_text TEXT,
	location_id INTEGER,	/* Indexes into locations */

	blurb TEXT,
	url TEXT,
	host TEXT,

	state TEXT,		/* "submitted", "approved" */
	email TEXT,		/* Delete after submitted? */
	key TEXT,			/* key needed for validation */ /* XXX remove */
	importid TEXT
);

CREATE TABLE users (
	id INTEGER PRIMARY KEY NOT NULL,
	email TEXT,
	twitter TEXT,
	notify TEXT,
	salt TEXT,
	digest TEXT,
	pwreset TEXT,
	rights TEXT		/* "admin", "editor" */
);

/* user test@example.com, password test */
INSERT INTO "users" VALUES(1, 'test@example.com',NULL,'','aaa','e3MjCoP7Oui8bQ+BK+2wWIRmq/OApZ8nXNuv6Kt6qiw=',NULL,'admin');

CREATE TABLE posts (
	id TEXT PRIMARY KEY,
	feedId INTEGER,

	link TEXT,
	title TEXT,
	date DATETIME,
	hidden INTEGER
);

CREATE TABLE feeds (
	id INTEGER PRIMARY KEY NOT NULL,
	feedURL TEXT UNIQUE,
	title TEXT,
	siteURL TEXT,
	errors TEXT,

	createdAt DATETIME,
	updatedAt DATETIME,
	lastFetched DATETIME
);

CREATE VIEW post_info AS SELECT * FROM posts LEFT OUTER JOIN feeds ON posts.feedId = feeds.id;

/* Manchester location information */
INSERT INTO "locations" VALUES(1,'Subrosa','27 Lloyd Street South
Moss Side
Manchester
M14 7HS','Subrosa is a social centre.  We want to create a space for local activity and interaction, enabling groups to hold meetings and events at low cost, for members to share resources, develop and form links with other groups, and providing an accessible means for the people of Manchester to unite and share in positive radicalism.

For more info see http://manchestersocialcentre.org.uk/',-2.23844311534424,53.4506027540654);
INSERT INTO "locations" VALUES(2,'People''s History Museum','Left Bank
Spinningfields
Manchester
M3 3ER','The People''s History Museum is the United Kingdom''s national centre for the collection, conservation, interpretation and study of material relating to the history of working people in the UK.
',-2.25226555634458,53.48129103035);
INSERT INTO "locations" VALUES(3,'Plan B Bunker','3 Birch Polygon
Rusholme
M14 5HX','The Bunker is underneath the main house at 3 Birch Polygon.  Take the left stone path that goes down to a wooden door with metal cage around it and you''re there.  Don''t go to the main house door, people live there!

Not wheelchair accessible.',-2.21465980608218,53.452441634642);
INSERT INTO "locations" VALUES(4,'Piccadilly Gardens','Piccadilly Gardens
Manchester
M1 1RG','',-2.23664484788515,53.4810227437389);
INSERT INTO "locations" VALUES(5,'The Green Fish Resource Centre','46-50 Oldham Street
Manchester
M4 1LE','',-2.23450595529482,53.483215240469);
INSERT INTO "locations" VALUES(6,'Working Class Movement Library','51 The Crescent
Salford
M5 4WX','',-2.27326497301635,53.4843829682153);
INSERT INTO "locations" VALUES(7,'Yard Theatre','41 Old Birley Street
Hulme
Manchester
M15 5RF','',-2.24845103491816,53.4656182354097);
INSERT INTO "locations" VALUES(8,'MERCi','Bridge 5 Mill
22a Beswick Street
Ancoats
Manchester
M4 7HR','MERCi is an independent charity (established in 1996) working to turn ideas into action for a sustainable future - by this we mean a future that is greener, safer, healthier and equitable. More info: http://www.merci.org.uk/',-2.21572151562191,53.4839209789324);
INSERT INTO "locations" VALUES(9,'Hardy''s Well','257 Wimslow Road
Manchester
M14 5LE','',-2.2220008539673,53.4517133439187);
INSERT INTO "locations" VALUES(10,'Friends Meeting House','6 Mount Street
Manchester
M2 5NS','',-2.24544724603265,53.4783359899172);
INSERT INTO "locations" VALUES(11,'Bangkok Bar','40-44 Princess Street
Manchester
M1 6DE','',-2.24014809999994,53.4776527);
INSERT INTO "locations" VALUES(12,'Central Hall','Between Back Piccadilly and Dale Street
Oldham Street
M1 1JQ','Central Hall is a Methodist-owned building with many rooms available to hire for meetings.  Ask the person at the front desk where to go.

For more information see http://www.methodistcentralbuildings.org.uk/',-2.235841540475,53.4823642105);
INSERT INTO "locations" VALUES(13,'Chorlton Irish Club','17 High Lane
Manchester
M21 9DJ','',-2.27628070000003,53.4393837);
INSERT INTO "locations" VALUES(14,'Contact Theatre','Oxford Road
Manchester
M15 6JA','',-2.231817933868,53.46321195804);
INSERT INTO "locations" VALUES(15,'Levenshulme Inspire','747 Stockport Road
Manchester
M19 3AR','',-2.19169910000005,53.4480013);
INSERT INTO "locations" VALUES(16,'Mechanics Institute','103 Princess Street
Manchester
M1 6DD','',-2.23928679999995,53.4768742);
