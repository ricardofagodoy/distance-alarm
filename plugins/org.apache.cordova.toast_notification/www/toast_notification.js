/*
 *
 * Toasts plugin for Android
 *
 * @Author Linkpass Srl
 *
 * @licenze GPL v3
 *
 *
 */

var exec = require('cordova/exec');

module.exports = {

    Toasted: function(message, duration) {
		var options = { "message": message, "duration" : duration};
        exec( null, null, 'Toast_Notification', 'toasted', [options]);
    },
};