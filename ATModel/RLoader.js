/**
 * AT Components - Resource Loader
 * 
 */
 

ATModel.RLoader = function() {
	
	
	this.eval = function( r ) {
		if( r.js ) {
			_eval(r.js, 'script', true);
		}
		
		if( r.css ) {
			_eval(r.css, 'style');
		}
	}
	
	
	
	function _eval(array, tag, closure) {
		var h = '';
		for (var i = 0, len = array.length; i < len; i++) {
			h += array[i].content + ';';
		}
		
		// set the js closure
		if ( closure ) {
			h = '(function(){ ' + h + ' })();';
		}
		
		// jquery will auto remove script tag
		$('head').append('<'+ tag +'>'+ h +'</'+ tag +'>');
		
	}
	
	
}

