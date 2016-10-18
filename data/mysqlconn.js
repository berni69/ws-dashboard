var config = require('./config.js');
var mysql = require('mysql');
var db = null;
module.exports = function () {
	if (db === null) {
		db = mysql.createConnection(config.db_connection);
		db.connect(function (err) {
			if (!err) {
				console.log("Database is connected ... nn");
			} else {
				console.log("Error connecting database ... nn");
			}
		});
	}
	return db;
}