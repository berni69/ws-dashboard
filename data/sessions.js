var fs = require('fs');
var config = require('./config.js');
var co = require('./cookie.js'); //Cookies
var redis = require('redis'); //PHP Sesion

module.exports = {
	getSession: function (cookie) {
		return new Promise(function (resolve, reject) {
			var cookieManager = new co.cookie(cookie);
			var clientSession = new redis.createClient();
			clientSession.get("sessionsarr/" + cookieManager.get("PHPSESSID"), function (error, result) {
				if (error) {
					reject(new Error("Error conectando a redis"));
					console.log("error : " + error);
				}
				if (result != null && result.toString() != "") {
					console.log("result exist" + cookieManager.get("PHPSESSID"));
					resolve(result);
				} else {
					console.log("session does not exist");
					resolve('');
				}
			});

		});
	}
};