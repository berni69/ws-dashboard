//Funciones para manejar el chat
var ns_chat = {};
$(function () {
	"use strict";
	
	var tmplOther = $('#chatMsgOtherTemplate').html();
	var tmplOwn = $('#chatMsgOwnTemplate').html();
	var myUser = new User();
	var minimize = function () {
		$('.module').removeClass('expanded');
		$('.module').addClass('collapsed');
	}

	var maximize = function () {
		$('.module').removeClass('collapsed');
		$('.module').addClass('expanded');
	}

	$('.module').off('click', '.minimize').on('click', '.minimize', function () {
		minimize();
	});

	$('.module').off('click', '.maximize').on('click', '.maximize', function () {
		maximize();
	});

	var appendMessage = function (args) {
		var tmpl = tmplOther;
		if (args.idUsuario == myUser.idUsuario) {
			tmpl = tmplOwn;
		}
		var message = tmpl.processTemplate(args);
		$('.module .discussion').append(message);
		$('.module .discussion').animate({ scrollTop: $('.module .discussion').prop('scrollHeight')},500);
	}

	var setUsername = function (user) {
		myUser = user;
	}

	var sendMessage = function (args) {


	}


	ns_chat.init = setUsername;
	ns_chat.appendMessage = appendMessage;
	ns_chat.sendMessage = sendMessage;
	ns_chat.minimize = minimize;
	ns_chat.maximize = maximize;

});