'use strict';

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'ws-dashboard';

// Port where we'll run the websocket server
var webSocketsServerPort = 8080;

// websocket and http servers

var http = require('http');
var fs = require('fs');
var path = require('path')
var url = require('url');
var mime = require('mime');
var ejs = require('ejs');
var webSocketServer = require('websocket').server; //Websockets
var data_mod = require('./data/data'); //Getting data from mysql/sample json
var session = require('./data/sessions'); //Getting data from session (ejs)
require('mini-linq-js');
/**
 * Global variables
 */
// latest 100 messages
var history = [];
// list of currently connected clients (users)
var clients = [];
var data = [];
// List of data to draw dashboard
data_mod.getData(function (d) {
	data = d;
});


/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}





// Array with some colors
var colors = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange'];
// ... in random order
colors.sort(function (a) {
    return Math.random() > 0.5;
});
// Array with some colors
var avatars = ['medium_Avatar-1.png','medium_Avatar-10.png', 'medium_Avatar-11.png', 'medium_Avatar-12.png', 'medium_Avatar-13.png', 'medium_Avatar-14.png', 'medium_Avatar-15.png', 'medium_Avatar-16.png', 'medium_Avatar-17.png', 'medium_Avatar-18.png', 'medium_Avatar-19.png', 'medium_Avatar-2.png', 'medium_Avatar-20.png', 'medium_Avatar-21.png', 'medium_Avatar-22.png', 'medium_Avatar-3.png', 'medium_Avatar-4.png', 'medium_Avatar-5.png', 'medium_Avatar-6.png', 'medium_Avatar-7.png', 'medium_Avatar-8.png', 'medium_Avatar-9.png', 'medium_Avatar-addnew.png', 'medium_Avatar-default.png', 'medium_Avatar-unknown.png', 'medium_cloud.png', 'medium_codegeist.png', 'medium_config.png', 'medium_disc.png', 'medium_eamesbird.png', 'medium_finance.png', 'medium_hand.png', 'medium_jm_black.png', 'medium_jm_brown.png', 'medium_jm_orange.png', 'medium_jm_red.png', 'medium_jm_white.png', 'medium_jm_yellow.png', 'medium_kangaroo.png', 'medium_monster.png', 'medium_new_monster.png', 'medium_power.png', 'medium_rainbow.png', 'medium_refresh.png', 'medium_rocket.png', 'medium_servicedesk.png', 'medium_settings.png', 'medium_storm.png', 'medium_travel.png'];
// ... in random order
avatars.sort(function (a) {
	return Math.random() > 0.5;
});


var templateContent = ['.html','.htm','.js','.ejs']
var handleStaticRequest = function (request, response, session) {
	var pathname = url.parse(request.url).pathname;
	var extension = path.extname(pathname);
	var isTemplate = templateContent.indexOf(extension) !== -1;
	var options = {
		encoding : isTemplate?"utf-8":null
	}
	console.log('Request for ' + pathname + ' received.');
	fs.readFile(__dirname + '/client/' + pathname, options, function (err, content) {
		if (err) {
			response.writeHead(404, {
				'Content-Type': 'text/plain'
			});
			response.end('Not found');
		} else {


			var html = '';
			if (isTemplate) {
				console.log("rendering" + pathname );
				html = ejs.render(content, { session: session });
			}
			else
				html = content;
			response.writeHead(200, { 'Content-Type': mime.lookup(pathname) });
			response.end(html);
		}
	});
};




var handleRequest = function (request, response) {

	session.getSession(request.headers.cookie).then(function (session) {
		handleStaticRequest(request, response,session);
	});
	
}

/**
 * HTTP server
 */
var server = http.createServer(function (request, response) {
	/** If the request is not a websocket, we will serve it **/
	handleRequest(request, response);
});

server.listen(webSocketsServerPort, function () {
    console.log((new Date()) + ' Server is listening on port ' + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    
    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
	var connection = request.accept(null, request.origin);
	// we need to know client index to remove them on 'close' event
	var index = clients.push({ 'cnx': connection, 'User': null, type: null, role: null }) - 1;
	var User = null;

	    
    console.log((new Date()) + ' Connection accepted.');
    
    
    
    // user sent some message
	connection.on('message', function (message) {
		console.log(message);
        if (message.type === 'utf8') {
            var msg = JSON.parse(message.utf8Data);
            console.log((new Date()) + ' New message as: ' + msg.type);
			if (msg.type === 'register') {
				var idUsuario = htmlEntities(msg.data.idUsuario);
				var userColor = colors.shift();
				var userAvatar = avatars.shift();
				User = {
					idUsuario: idUsuario,
					avatar: userAvatar,
					color: userColor
				};
				clients[index].User = User;
				clients[index].type = msg.data.type;

				data_mod.getUserInfo(idUsuario,function (d) {
					clients[index].role = d.fields[0].AccessLevel;
					/*connection.sendUTF(JSON.stringify({
						type: 'log',
						data: d.fields[0].AccessLevel
					}));*/
					//console.log(clients[index]);
				});

				connection.sendUTF(JSON.stringify({
					type: 'registerResponse',
					data: User
				}));


				if (msg.data.type != 'onlyNotify') { //Create dashboard
					// send back chat history
					if (history.length > 0) {
						connection.sendUTF(JSON.stringify({
							type: 'history',
							data: history
						}));
					}
					if (typeof data !== 'undefined') {
						connection.sendUTF(JSON.stringify({
							type: 'initialStatus',
							data: data
						}));
					}
				}

			} else if (msg.type === 'update') {
				var server = msg.data;
				for (var i = 0, len = data.servers.length; i < len; i++) {
					if (data.servers[i].idServidor == server.idServidor) {
						data.servers[i].Estado = server.Estado;
						data.servers[i].Accion = server.Accion;
						msg.data.Descripcion = data.servers[i].Descripcion;
						break;
					}
				}

				msg.data.User = User;
				var json = JSON.stringify({
					type: 'update',
					data: msg.data
				});

				for (var i = 0; i < clients.length; i++) {
					clients[i].cnx.sendUTF(json);
				}
			}
			else if (msg.type === 'chat') { // log and broadcast the message
				var obj = {
					time: (new Date()).getTime(),	
					text: htmlEntities(msg.data),
					User: User,
				};
				history.push(obj);
				history = history.slice(-100);

				// broadcast message to all connected clients
				var json = JSON.stringify({
					type: 'message',
					data: obj
				});
				for (var i = 0; i < clients.length; i++) {
					clients[i].cnx.sendUTF(json);
				}
			}
			else if (msg.type === 'notify') {
				var obj = {
					time: (new Date()).getTime(),
					data: msg.data,
					User: User,
				};
				var json = JSON.stringify({
					type: 'notify',
					data: obj
				});
				
				//console.log(Enumerable.from(clients).where("$.type == 'onlyNotify'"));
				var e = clients.where(cli => cli.type === 'onlyNotify' && cli.role < 3);

				for (var i = 0; i < e.length; i++) {
					e[i].cnx.sendUTF(json);
				}
			}

        }
    });
    
    // user disconnected
	connection.on('close', function (connection) {
		if (User !== null) {
            console.log((new Date()) + ' Peer ' +
                connection.remoteAddress + ' disconnected.');
            // remove user from the list of connected clients
            clients.splice(index, 1);
            // push back user's color to be reused by another user
			colors.push(User.color);
			avatars.push(User.avatar)

        }
    });

});