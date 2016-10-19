var ns_socket = {};
$(function () {
    "use strict";
    
    // for better performance - to avoid searching in DOM
    var content = $('#logs');
    var input = $('#input');
    var status = $('#status');
    var dashboard = $('#dashboard');
    var status_arr = ['OK', 'FAIL', 'WORKING'];
    var status_class = ['panel-success', 'panel-danger', 'panel-primary'];
    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = 'user_' + Math.random().toString(36).substr(2, 5);
	ns_chat.init(myName);
	// if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    
    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', {
            text: 'Sorry, but your browser doesn\'t ' 
                                    + 'support WebSockets.'
        }));
        input.hide();
        $('span').hide();
        return;
    }
    
    // open connection
    var connection = new WebSocket('ws://' + document.location.hostname + ':1337');
    connection.onopen = function () {
        registerUser();
    };
    
    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        content.html($('<p>', {
            text: 'Sorry, but there\'s some problem with your ' 
                                    + 'connection or the server is down.'
        }));
    };
    
    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
        console.log("Recibido" + message.data)
        
        if (json.type === 'color') {
            // first response from the server with user's color
            setColor(json.data);
            // from now user can start sending messages
        } else if (json.type === 'history') {
            // entire message history
            appendHistory(json.data);
        } else if (json.type === 'initialStatus') {
            //We need create the dashboard in order to interact with it
            createDashboard(json.data);
 
        } else if (json.type === 'message') { // it's a single message
            input.removeAttr('disabled'); // let the user write another message
			ns_chat.appendMessage({ idUsuario: json.data.author, message: json.data.text, time: new Date(json.data.time) });
								   
        } else if (json.type === 'update') { // it's a single message
            
            addMessage(json.data.idUsuario, 'Updated server: ' + json.data.Descripcion + ' to "' + json.data.Estado + '"',
                       'green', new Date());
            updateEstado(json.data);


        } else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };
    
    /**
     * Send mesage when user presses Enter key
     */
    input.keydown(function (e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) {
                return;
            }
            sendChatMsg(msg);
            $(this).val('');
            // disable the input field to make the user wait until server
            // sends back response
            input.attr('disabled', 'disabled');
        }
    });
    /**
     * Send mesage when change the state of any server
     */

    $(document).on('click', '[id^=btns_] .btn', function (ev) {
        var idServidor = $(this).attr('data-idServidor');
        var Estado = '';
        //Find the next status of the server
        for (var i = 0; i < status_arr.length; i++) {
            if ($(this).hasClass(status_arr[i])) {
                Estado = status_arr[i];
                break;
            }
        }
        sendServerUpdate({
            idServidor: idServidor,
            Estado: Estado,
            Accion: ''
        })

    });
    
    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function () {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate ' 
                                                 + 'with the WebSocket server.');
        }
    }, 3000);
    
    /**
     * Add message to the chat window
     */
    function addMessage(author, message, color, dt) {
        content.prepend('<p><span style="color:' + color + '">' + author + '</span> @ ' +
             +(dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':' 
             + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes()) 
             + ': ' + message + '</p>');
    }
    
    /** Create initial dashboard **/
    var createDashboard = function (data) {
        dashboard.html('');
        $.each(data.servers, function (idx, value) {
            //Get server template and process it replacing {{key}} by the value
            value.statusClass = status_class[status_arr.indexOf(value.Estado)];
            var div = getDashTemplate(value);
            dashboard.append(div);
            $('#btns_' + value.idServidor + ' .btn').removeClass('active');
            $('#btns_' + value.idServidor + ' .btn.' + value.Estado).addClass('active');
        })
    }
    
    var updateEstado = function (value) {
        $('#btns_' + value.idServidor + ' .btn').removeClass('active');
        $('#btns_' + value.idServidor + ' .btn.' + value.Estado).addClass('active');
        var panel = $('#srv_' + value.idServidor + ' .panel');
        panel.removeClass(status_class.join(' '));
        panel.addClass(status_class[status_arr.indexOf(value.Estado)]);
    };
    /** 
     * Function used to load the template, for each value in @ it will search the mustache {{@}} of the key and it will be replaced by it's value
     *  @value object used to find and replace mustaches in the template
     */
    var getDashTemplate = function (values) {
        var div = $('#srvTemplate').html();
		return div.processTemplate(values);
    }
    
    /** Function used to register the user the first time **/
    
    var registerUser = function () {
        connection.send(JSON.stringify({
            type: 'register',
            data: myName
        }));
        input.removeAttr('disabled').focus();
    }
    /** Function used to append the log history **/
    var appendHistory = function (data) {
        // insert every single message to the chat window
		for (var i = 0; i < data.length; i++) {

			ns_chat.appendMessage({ idUsuario: data[i].author, message: data[i].text, time: new Date(data[i].time) });

        }
    };
    
    /** Function used to set the color of the user **/
    var setColor = function (color) {
        myColor = color;
        status.text(myName + ': ').css('color', myColor);
        input.removeAttr('disabled').focus();
    }
    
    /** Function used to send a server update **/
    var sendServerUpdate = function (data) {
        var obj = {
            type: 'update',
            data: data
        }
        connection.send(JSON.stringify(obj));
    };
    
    /** Function used to send chat msg **/
    var sendChatMsg = function (msg) {
        // Send the chat message
        connection.send(JSON.stringify({
            type: 'chat',
            data: msg
        }));
    };

});