var fs = require('fs');
module.exports = {
  getData: function () {
	return JSON.parse(fs.readFileSync('./data/example.json', 'utf8')); 
  },
  
};