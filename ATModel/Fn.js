(function(){
	
	// AT functions -----------------------------------------------------------------------------
	
	/**
	 * Extend class
	 * @param  [mixed] class, class || class, class, boolean
	 * @return [function (class)]
	 */
	ATFn.extend = function(superClass, subClass, noOverride) {
		// if superClass is object
		if( ATFn.isObject( superClass ) ) {
			var sp = ATFn.clone(superClass, noOverride);
			superClass = function(){};
			superClass.prototype = sp;
		}
		
		// if subClass is object
		if( ATFn.isObject( subClass ) ) {
			var subPrototype = 	subClass;
			subClass = function(){};
		}
		else {
			subClass = subClass || function(){};
		}
		
		var F = function() {};
		F.prototype = ATFn.clone(superClass.prototype, noOverride);
		subClass.prototype = new F();
		if( subPrototype ) {
			ATFn.override(subClass.prototype, subPrototype);
		}
		// set constructor 
		subClass.prototype.constructor = subClass;
		// set superclass
		subClass.superclass = superClass.prototype;
		subClass.prototype.superclass = superClass.prototype;
		if( superClass.prototype.constructor == Object.prototype.constructor ) {
			superClass.prototype.constructor = superClass;
		}
		return subClass;
	}
	
	/**
	 * Extend class's prototype, this mehod don't effect the object param, return a new object
	 * @param  [mixed] obj, config || obj, config, defaults, noOverride
	 * @return [object]
	 */
	ATFn.extendPrototype = function(object, config, defaults, noOverride){
		object =  ATFn.clone(object, noOverride);
		if( defaults ){
			ATFn.extendPrototype(object, defaults);
		}
		return ATFn.override(object, config);
	};
	
	/**
	 * Override property
	 * @param  [mixed] obj, config || obj, config, noOverride, clone
	 * @return [object]
	 */
	ATFn.override = function(obj, config, noOverride, clone) {
		if( noOverride ) {
			for(var p in config) {
				
				if( ! (p in obj) ) {
					
					if( ATFn.isObject( config[p] ) ) {
						obj[p] = ATFn.clone( config[p] );
					}
					else {
						obj[p] = config[p];
					}
				}
			}
		}
		else {
			for(var p in config) {
				
				if( clone && ATFn.isObject( config[p] ) ) {
					obj[p] = ATFn.clone( config[p] );
				}
				else {
					obj[p] = config[p];
				}
			}	
		}
		return obj;
	}
	
	/**
	 * Add private property
	 * @param  [mixed] obj, config || obj, config, string
	 * @return [object]
	 */
	ATFn.addPrivateProperty = function(obj, config, prefix) {
		prefix = prefix || '_';
		for(var p in config) {
			obj[prefix + p] = config[p];
		}
		return obj;
	}
	
	/**
	 * Clone the obj and Return a new obj
	 * @param  [mixed] obj || obj, noOverride
	 * @return [object]
	 */
	ATFn.clone = function(obj, noOverride) {
		return ATFn.override({}, obj, noOverride);
	}
	
	/**
	 * Returns true if the param is function
	 * @param [function]
	 * @return [boolean]
	 */
	ATFn.isFunction = function(fn) {
		try {
			return /^\s*\bfunction\b/.test(fn) ;
		}
		catch (x) { 
			return false;
		}
	}
	
	/**
	 * Returns true if the param is number
	 * @param  [string]
	 * @return [boolean]
	 */
	ATFn.isNumber = function(i) {
		return typeof i === 'number' && isFinite(i);
	}
	
	/**
	 * Returns true if the param is string
	 * @param  [string]
	 * @return [boolean]
	 */
	ATFn.isString = function(s) {
		return typeof s === 'string';
	}
	
	/**
	 * Returns true if the param is object
	 * @param  [function]
	 * @return [boolean]
	 */
	ATFn.isObject = function(obj) {
		return !!obj && ( typeof obj === 'object' || Object.prototype.toString.call(obj) === '[object Object]' );
	}
	
	/**
	 * Returns true if the param is jQuery
	 * @param  [function]
	 * @return [boolean]
	 */
	ATFn.isjQuery = function(obj) {
		return !!obj && obj instanceof jQuery;
	}
	
	/**
	 * Returns true if the param is array
	 * @param  [function]
	 * @return [boolean]
	 */
	ATFn.isArray = function(a) {
		return ( a instanceof Array || Object.prototype.toString.apply(a) === '[object Array]' );
	}
	
	/**
	 * Returns true if the param is AT page object
	 * @param  [function]
	 * @return [boolean]
	 */
	ATFn.isATPage = function(fn) {
		if( ATFn.isFunction( fn ) ) {
			return !!fn['_isPage'];	
		}
	}
	
	/**
	 * Set the function scope
	 * @param  [mixed]	obj, fn, scope || fn, scope || obj, fn || fn
	 * @return [boolean]
	 */
	ATFn.setFnScope = function() {
		var a = arguments;
		switch( a.length ) {
			case 3:
				return function(){
					return a[0][ a[1] ].apply(a[2] , arguments);
				};
			case 2:
				if( ATFn.isFunction(a[0]) ) {
					return function() {
						return a[0].apply(a[1] , arguments);
					}
				}
				// obj.method.apply(obj)
				return function(){
					return a[0][ a[1] ].apply(a[0] , arguments);
				};
			case 1:
				return function(){
					return a[0].apply(a[0] , arguments);
				};
			default:
				AT.SEP.show(' Fn:apply error');
				return null;
		}
	}
	
	
	/**
	 * GET format string to object
	 * @param  [string]
	 * @return [object]
	 * @exception: return object {p: p}
	 */
	ATFn.GETStringToObj = function(p) {
		if( ATFn.isString( p ) ) {
			var r = {};
			var splits = p.split('&');
			var len = splits.length;
			len = ( splits[ len - 1 ] )? len : --len;
			for(var i = 0; i < len; i++) {
				var data = splits[i].split('=');
				if( data.length == 2 ) {
					r[ data[0] ] = data[1];
				}
				// return p(string)
				else {
					break;
				}
			}
			return r;
		}
		
		return p;
	}
	
	/**
	 * Object to GET string format
	 * @param  [object]
	 * @return [string]
	 * @exception: return argument
	 */
	ATFn.objectToGETString = function( object ) {
		if( ATFn.isObject( object ) ) {
			var str = '';
			for(var i in object){
				if( i != 'remove' &&  i != 'indexOf' ){
					str += i + '=' + object[i] + '&';
				}
			}
			return str.substr(0, str.length - 1);
		}
		else {
			return 	object;
		}
	}
	
	/**
	 * Return true, if these string is the same
	 * @param  [string, string]
	 * @return [boolean]
	 * @exception: return false
	 */
	ATFn.stringEqual = function(s1, s2) {
		if ( AT.Fn.isString( s1 ) && AT.Fn.isString( s2 ) ) {
			return ( s1.toUpperCase() === s2.toUpperCase() );
		}
		
		return false;
	}
	
	/**
	 * get jquery object
	 * @param  [string]
	 * @return [object]
	 */
	this.getjQueryDom = function( id ) {
		return  ( id instanceof jQuery )? id : $('#'+ id);
	}
	
	
})();