define([
	"../core",
	"../user"
], function( jQuery ) {

// Attach a bunch of functions for handling common AJAX users
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
});

});
