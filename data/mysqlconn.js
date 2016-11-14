var config = require('./config.js');
var mysql = require('mysql');
var pool = null;
module.exports = function () {
	if (pool === null) {
		//db = mysql.createConnection(config.db_connection);
		pool = mysql.createPool(config.db_connection);
		/*pool.connect(function (err) {
			if (!err) {
				console.log("Database is connected ... nn" + err);
			} else {
				console.log("Error connecting database ... nn" + err);
			}
		});*/

	}
	return pool;
}