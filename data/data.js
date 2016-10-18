var fs = require('fs');
var config = require('./config.js');
var db = require('./mysqlconn.js');
module.exports = {
  getData: function () {

	  if (config.demo) {
		  return JSON.parse(fs.readFileSync('./data/example.json', 'utf8'));
	  }
	  else {
		  console.log(db());
		  
	  }
  },
  
};