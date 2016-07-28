/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 14:49:33
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-27 15:42:54
*/

// Import the express typings:
import * as Express from 'express';
import * as MongoDB from 'mongodb';
import * as Monk from 'monk';

var path = require('path');
var express = require('express');
var router: Express.Router = express.Router();

router.post('/ValueCharts', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('GroupValueCharts');

	groupVcCollection.insert(req.body, function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: JSON.stringify(err) });

		} else {
			res.location('/group/ValueCharts/' + doc._id)
				.status(201)
				.json({ data: JSON.stringify(doc) });
		}
	});
});

router.get('/ValueCharts/:chart', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('GroupValueCharts');
	var chartId: string = req.params.chart;
	
	var password: string = req.query.password;

	groupVcCollection.findOne({ _id: chartId }, function(err: Error, doc: any) {
		if (err) {
			res.status(404)
				.json({ data: JSON.stringify(err) });

		} else {
			res.location('/group/ValueCharts/' + doc._id)
				.status(200)
				.json({ data: JSON.stringify(doc) });
		}
	});
});

router.put('/ValueCharts/:chart', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('GroupValueCharts');
	var chartId: string = req.params.chart;

	groupVcCollection.update({ _id: chartId }, (req.body), [] ,function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: JSON.stringify(err) });

		} else {
			res.location('/group/ValueCharts/' + doc._id)
				.status(200)
				.json({ data: JSON.stringify(doc) });
		}
	});
});

router.delete('/ValueCharts/:chart', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('GroupValueCharts');
	var chartId: string = req.params.chart;

	groupVcCollection.remove({ _id: chartId }, function(err: Error, doc: any) {
		if (err) {
			res.status(404)
				.json({ data: JSON.stringify(err) });
		} else {		
			res.status(200)
				.json({ data: JSON.stringify(doc) });
		}
	});
});

router.get('/ValueCharts/:chart/structure', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('GroupValueCharts');
	var chartId: string = req.params.chart;

	var password: string = req.query.password;

	groupVcCollection.findOne({ _id: chartId }, function(err: Error, doc: any) {
		if (err) {
			res.status(404)
				.json({ data: JSON.stringify(err) });

		} else {
			// Remove the users from the ValueChart so that it only contains the objectives and alternatives
			doc.users = undefined;

			res.location('/group/ValueCharts/' + doc._id)
				.status(200)
				.json({ data: JSON.stringify(doc) });
		}
	});
});

router.put('/ValueCharts/:chart/structure', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('GroupValueCharts');
	var chartId: string = req.params.chart;

	groupVcCollection.findOne({ _id: chartId }, function (err: Error, doc: any) {
		if (err) {
			res.status(404)
				.json({ data: JSON.stringify(err) });
		} else {
			// Attach the users to the structure object.
			req.body.users = doc.users;

			groupVcCollection.update({ _id: chartId }, (req.body), [], function(err: Error, doc: any) {
				if (err) {
					res.status(400)
						.json({ data: JSON.stringify(err) });

				} else {
					// Remove the users from the ValueChart so that it only contains the objectives and alternatives
					doc.users = undefined;

					res.location('/group/ValueCharts/' + doc._id)
						.status(200)
						.json({ data: JSON.stringify(doc) });
				}
			});
		}
	});
});

router.post('/ValueCharts/:chart/users', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('GroupValueCharts');
	var chartId: string = req.params.chart;

	groupVcCollection.findOne({ _id: chartId }, function (err: Error, doc: any) {
		if (err) {
			res.status(404)
				.json({ data: JSON.stringify(err) });
		} else {
			// Attach the users to the structure object.
			doc.users.push(req.body);

			groupVcCollection.update({ _id: chartId }, (doc), [], function(err: Error, doc: any) {
				if (err) {
					res.status(400)
						.json({ data: JSON.stringify(err) });

				} else {
					res.location('/group/ValueCharts/' + doc._id)
						.status(200)
						.json({ data: JSON.stringify(req.body) });
				}
			});
		}
	});
});

module.exports = router;