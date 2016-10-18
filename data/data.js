var fs = require('fs');
var config = require('./config.js');
var connection = require('./mysqlconn.js');
module.exports = {
  getData: function (cb) {

	  if (config.demo) {

		  fs.readFile('./data/example.json', { encoding: 'utf8' }, function (err, data) {
			  if (err) throw err;
			  cb(JSON.parse(data));

		  });
	  }
	  else {
		  var db = connection();
		  db.query("SELECT idGranja as idServidor, Descripcion, 0 as Estado, '' as Accion FROM TB_Granjas order by OrdenReinicio", function (err, rows) {
			  if (err) throw err;
			  cb({ 'servers' : rows });
		  });
		  
	  }
  },
  
};