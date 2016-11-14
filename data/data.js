var fs = require('fs');
var config = require('./config.js');
var connection = require('./mysqlconn.js');

module.exports = {
  getData: function (cb) {

	  if (config.localMode) {

		  fs.readFile('./data/example.json', { encoding: 'utf8' }, function (err, data) {
			  if (err) throw err;
			  cb(JSON.parse(data));

		  });
	  }
	  else {
		  var db = connection();
		  db.getConnection(function (err, cnx) {
			  cnx.query("SELECT idGranja as idServidor, Descripcion, 0 as Estado, '' as Accion FROM TB_Granjas order by OrdenReinicio", function (err, rows) {
				  if (err) throw err;
				  cb({ 'servers': rows });
			  });
		  });
		  
	  }
	},
  getUserInfo(idUsuario,cb) {
	  var db = connection();
	  db.getConnection(function(err,cnx){
		  cnx.query("SELECT * FROM TB_Usuarios WHERE idUsuario = '" + idUsuario + "'", function (err, rows) {
			  if (err) throw err;
			  cb({ 'fields': rows });
		  });

	  });

  }

  
};