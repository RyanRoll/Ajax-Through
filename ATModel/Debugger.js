(function(){
	
	/**
	 * Debugger - the bug observer
	 * 
	 */	
	ATModel.Debugger = function() {
		
		
		// public methods ----------------------------------------------------------------------
		
		/**
		 * Alert all params
		 * @param  [mixed] - argument
		 */
		this.print = function() {
			var data = [];
			for(var i = 0; i < arguments.length; i++) {
				if( AT.Fn.isObject( arguments[i] ) ) {
					data.push( this.objToString(arguments[i]) );
				}
				else if( AT.Fn.isArray( arguments[i] ) ) {
					data.push( arguments[i].toString() );	
				}
				else {
					data.push( arguments[i] );
				}
			}
			alert( data.join(' ,\n') )
		}
		
		/**
		 * Alert object
		 * @param  [object]
		 */
		this.printObj = function(obj) {
			alert( this.objToString(obj) );
		}
		
		/**
		 * Alert variables
		 * @param  [mixed] - argument
		 */
		this.printVar = function() {
			alert( this.argToArray(arguments).join(' , ') );
		}
		
		/**
		 * Json to string
		 * @param  [mixed] - argument
		 * @return [string]
		 */
		this.jsonToString = JSON.stringify;
		
		/**
		 * Argument to array
		 * @param  [mixed] - argument
		 * @return [array]
		 */
		this.argToArray = function(arg) {
			var array = [];
			for(var i = 0; i < arg.length; i++) {
				array.push( arg[i] );
			}
			return array;
		}
		
		/**
		 * Object to string
		 * @param  [object]
		 * @return [string]
		 */
		this.objToString = function(obj) {
			var str = [];
			for(var p in obj) {
				str.push( p + ' : ' + ( AT.Fn.isObject( obj[p] ) ? this.objToString( obj[p] ) : obj[p] ) );	
			}
			return ( obj + ' = {\n\t' + str.join(',\n\t') + '\n}' );
		}
		/**
		 * print obj attribute
		 * @param  [object]
		 */
		this.printAttr = function(obj) {
			var str = [];
			for ( var i in obj) {
				str.push( i );	
			}
			alert( str.join(', ') );
		}
		
		
	}
	
	
	
})();