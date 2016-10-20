'use strict';

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-dashboard';

// Port where we'll run the websocket server
var webSocketsServerPort = 8080;

// websocket and http servers

var http = require('http');
var fs = require('fs');
var url = require('url');
var mime = require('mime');

var redis = require('redis'); //PHP Sesion
var webSocketServer = require('websocket').server; //Websockets
var co = require('./cookie.js'); //Cookies
var data_mod = require('./data/data'); //Getting data from mysql/sample json



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


var fileExists = function(filename) {
	try {
		require('fs').accessSync(filename)
		return true;
	} catch (e) {
		return false;
	}
}

var handleStaticRequest = function (request, response) {
	var pathname = url.parse(request.url).pathname;
	if (fileExists('./client/' + path)) {
		console.log('Request for ' + pathname + ' received.');
		fs.readFile('./client/' + pathname, function (err, html) {
			if (err) {
				response.writeHead(404, {
					'Content-Type': 'text/plain'
				});
				response.end('Not found');
			} else {

				response.writeHead(200, { 'Content-Type': mime.lookup(pathname) });
				response.end(html);
			}
		});

		var cookieManager = new co.cookie(request.headers.cookie);
		var clientSession = new redis.createClient();
		clientSession.get("sessions/" + cookieManager.get("PHPSESSID"), function (error, result) {
			if (error) {
				console.log("error : " + error);
			}
			if (result != null && result.toString() != "") {
				console.log("result exist" + cookieManager.get("PHPSESSID"));
			} else {
				console.log("session does not exist");
			}
		});
	}


}

/**
 * HTTP server
 */
var server = http.createServer(function (request, response) {
	/** If the request is not a websocket, we will serve it **/
	handleStaticRequest(request, response);
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
    var index = clients.push(connection) - 1;
	var User = null;

	    
    console.log((new Date()) + ' Connection accepted.');
    
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
    
    
    // user sent some message
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            var msg = JSON.parse(message.utf8Data);
            console.log((new Date()) + ' New message as: ' + msg.type);
			if (msg.type === 'register') {
				var idUsuario = htmlEntities(msg.data);
                // get random color and send it back to the user
				var userColor = colors.shift();
				var userAvatar = avatars.shift();
				User = {
					idUsuario : idUsuario,
					avatar : userAvatar,
					color : userColor
				};
                connection.sendUTF(JSON.stringify({
					type: 'registerResponse',
					data: User
				}));
				console.log((new Date()) + ' User is known as: ' + User.idUsuario +
					' with ' + User.color + ' color.');

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
                    clients[i].sendUTF(json);
                }
            }			
            else if (msg.type === 'chat') { // log and broadcast the message
				console.log((new Date()) + ' Received Message from ' +
					User.idUsuario + ': ' + msg.data);
                // we want to keep history of all sent messages
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
                    clients[i].sendUTF(json);
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