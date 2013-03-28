(function() {
	
	AT = {};
	var ATModel = {};
	var ATFn = {};
	
	
	/*
	*	AT functions  ===========================================================================================
	*/
	
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
		subClass.prototype.superclass = superClass;
		if( superClass.prototype.constructor == Object.prototype.constructor ) {
			superClass.prototype.constructor = superClass;
		}
		return subClass;
	};
	
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
	};
	
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
	};
	
	/**
	 * Clone the obj and Return a new obj
	 * @param  [mixed] obj || obj, noOverride
	 * @return [object]
	 */
	ATFn.clone = function(obj, noOverride) {
		return ATFn.override({}, obj, noOverride);
	};
	
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
	};
	
	/**
	 * Returns true if the param is number
	 * @param  [string]
	 * @return [boolean]
	 */
	ATFn.isNumber = function(i) {
		return typeof i === 'number' && isFinite(i);
	};
	
	/**
	 * Returns true if the param is string
	 * @param  [string]
	 * @return [boolean]
	 */
	ATFn.isString = function(s) {
		return typeof s === 'string';
	};
	
	/**
	 * Returns true if the param is object
	 * @param  [function]
	 * @return [boolean]
	 */
	ATFn.isObject = function(obj) {
		return !!obj && ( typeof obj === 'object' || Object.prototype.toString.call(obj) === '[object Object]' );
	};
	
	/**
	 * Returns true if the param is jQuery
	 * @param  [function]
	 * @return [boolean]
	 */
	ATFn.isjQuery = function(obj) {
		return !!obj && obj instanceof jQuery;
	};
	
	/**
	 * Returns true if the param is array
	 * @param  [function]
	 * @return [boolean]
	 */
	ATFn.isArray = function(a) {
		return ( a instanceof Array || Object.prototype.toString.apply(a) === '[object Array]' );
	};
	
	/**
	 * Returns true if the param is AT page object
	 * @param  [function]
	 * @return [boolean]
	 */
	ATFn.isATPage = function(fn) {
		if( ATFn.isFunction( fn ) ) {
			return !! fn['_isPage'];	
		}
	};
	
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
					};
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
	};
	
	
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
			len = ( splits[ len - 1 ] ? len : --len );
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
	};
	
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
	};
	
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
	};
	
	/*
	*	Debugger - the bug observer  ===========================================================================================
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
		};
		
		/**
		 * Alert object
		 * @param  [object]
		 */
		this.printObj = function(obj) {
			alert( this.objToString(obj) );
		};
		
		/**
		 * Alert variables
		 * @param  [mixed] - argument
		 */
		this.printVar = function() {
			alert( this.argToArray(arguments).join(' , ') );
		};
		
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
		};
		
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
		};
		
		/**
		 * print obj attribute
		 * @param  [object]
		 */
		this.printAttr = function(obj) {
			var str = [];
			for (var i in obj) {
				str.push( i );	
			}
			alert( str.join(', ') );
		};
		
	};
	
	
	/*
	*	AT Applet event listener methods  =================================================================
	*/
	ATModel.AppletEventModel = {
		/**
		 * Fire Applet Event method
		 * @param  [object, string]
		 * @return [boolean] return true is mean interrupt function
		 */
		fireAppletEvent: function(Applet, n, c, p) {
	
			var settingEvent = Applet.setting.events;
			
			if ( settingEvent[n] ) {
				return Applet.setting.events[n](c, p);
			}
	
			return undefined;
		},
		
		/**
		 * Fire Applet method Event method
		 * @param  [object, string]
		 * @return [boolean] return true is mean interrupt function
		 */
		fireMethodEvent: function(Applet, method, n, c, p) {
	
			var overrideEvent = Applet[method].overrideEvent;
			var methodEvent = Applet[method].events;
			var r1 = undefined, r2 = undefined;
			// exec app/module events
			if ( overrideEvent === false || ( overrideEvent === undefined  && ! ( methodEvent && methodEvent[n] ) ) ) {
				var settingEvent = Applet.setting.events;
				if ( settingEvent.method && settingEvent.method[n] ) {
					r1 = settingEvent.method[n].call(Applet, c, p);
				}
			}
			
			// exec method event
			if ( methodEvent && methodEvent[n] ) {
				r2 = methodEvent[n].call(Applet, c, p);
			}
			
			return ( r1 === false || r2 === false );
			
		},
		
		/**
		 * Unterrupt Thru method
		 * @param  [object]
		 * @return [null] return null is mean end the thru method
		 */
		 interruptThru: function( c ) {
			 this.unMaskView();
			 delete c.__callback__;
			 return null;
		 },
		 
		 unMaskView: function(){}
		 
	};
	
	
	
	/*
	*	AT-Action Actions collection  =================================================================
	*/
	ATModel.ACCollection = function() {
		
		// app class collections
		this.Class = {};
		 
		// app object collections
		this.Objects = {};
		
		// register app , if AT is started, this method will call add method
		this.register = function(name, Class) {
			this.Class[name] = Class;
			
			if( AT.isInit() ) {
				this.add( name );
			}
		};
		
		// init all app
		this.init = function(reference) {
			this.reference = reference;
			for(var p in this.Class) {
				this.add( p );
			}
		};
		
		// add app (using in after AT started)
		this.add = function( name ) {
			var extend = AT.Fn.extend(this.reference, this.Class[name], true);
			extend.prototype._name_ = name;
			this.Objects[name] = new extend();
		};
		
		// is app property
		this.isProperty = function(name, property) {
			try {
				return property in this.Objects[name];
			}
			catch (e) {
				return false;	
			}
		};
		
		// get app
		this.get = function( name ) {
			return this.Objects[name];
		};
		
		// is set
		this.isSet = function( name ) {
			return name in this.Class;
		};
		
	};
	
	
	
	/*
	*	AT-Action  ===========================================================================================
	*/
	ATModel.Action = ATFn.extend(ATModel.AppletEventModel, function( RLoader ) {
		
		var This = this;
		
		// agent applet collection
		this.Coll = new ATModel.ACCollection();
			
		/**
		 * bind Action attribute event
		 */
		$('*[at-action]').live('click', function( e ) {
			e.preventDefault();
			var $Obj = $(this);
			var code = $Obj.attr('at-action');
			This.thru($Obj, code);
		});
		
		
		/**
		 * split the action attr
		 * @param  [string]
		 * @return  [object]
		 * @except  show SEP
		 */
		 this.splitCode = function( code ) {
			 
			 var c = code.match(/^(\w+)\.(\w+)(\(['"-\., \w]*\))?$/);
			 
			 if ( c ) {
				 // if has arguments
				 if ( c[3] ) {
					var argString = c[3].substr(1, c[3].length - 2);
					var args = argString.split(',');
					c[3] = this.getArguments( args );
				 }
				 else {
					c[3] = []; 
				 }
				 
				 return {
					'cmd': c[0],
					name: c[1],
					method: c[2],
					args: c[3]
				 };
			 }
			  else {
				AT.SEP.show('system', 'Action: fire Action Error! 「'+ code + '」');
			 }
		 };
		 
		 /**
		 * get the action's cmd arguments
		 * @param  [array]
		 * @return  [array]
		 */
		 this.getArguments = function( args ) {
			for(var i = 0; i < args.length; i++) {
				var a = args[i];
				var out = a.match(/^\'([^"]*)\'$/);
				// if type is 'string'
				if ( out ) {
					args[i] = out[1];
				}
				// if type is number
				else if ( /^(\-)?([0-9]+)(\.?([0-9]+))?$/.test( a ) ){
					args[i] = parseInt(a, 10);
				}
				// if type is "string"
				else {
					out = a.match(/^\"([^"]*)\"$/);
					if ( out ) {
						args[i] = out[1];
					}
					// is js global variables
					else {
						args[i] = eval( a );
					}
				}
			}
			return args;
		 };
		 
		
		/**
		 * destroy Applet Actions ( isn't this)
		 * @param  [object]
		 * @return  [object]
		 */
		this.getFormParams = function( $O ) {
			var p = {};
			var $Form = $O.parent('form');
			if ( $Form.size() > 0 ) {
				$('*[name]', $Form).each(function(){
					var $T = $(this);
					p[ $T.attr('name') ] = $T.val();
				});
			}
			return p;
		};
		
		
		/**
		 * Thru - AJAX -> Action
		 * @param  [$object, array]
		 */
		this.thru = function($Obj, code) {
			
			var code = this.splitCode( code );
			var name = code.name;
			var method = code.method;
			var args = code.args;		
			var action = name.toLowerCase();
			
			if(  this.Coll.isSet( name ) ) {
				this._runThru($Obj, code, name, method, args, action);
			}
			else {	
				RLoader.requireResource({
					name: action,
					scope: this,
					callback: function() {
						//AT.Debug.printAttr(this.Coll.Objects);
						this._runThru($Obj, code, name, method, args, action);
					}
				});
			}
			
		};
		
		
		/**
		 * exec Action-thru
		 * @param  [mixed]
		 */
		this._runThru = function($Obj, c, name, method, args, action) {
			
			var Applet = this.Coll.get( name );
			
			if( ! Applet ) {
				AT.SEP.show('action', 'can\'t find the Action ['+ name +']');
				return null;
			}
			
			var $Form = $Obj.parent('form');
			
			var params = this.getFormParams( $Obj );
			
			var sendFn_args = [params, $Obj].concat( args );
			
			// exec send method

			var sendParams = Applet[method]._sendFn_.apply(Applet, sendFn_args);
			
			// check the sendFn's return data
			if ( sendParams === false ) { // interrupt thru
				return null;	
			}
			else if ( AT.Fn.isObject( sendParams ) ) {
				params = sendParams;
			}
			
			var p = AT.Fn.clone( params );

			
			// start ajax -----------------------------------------------------------
			
			var Ajax = $.ajax({
				url: AT.getServerUrl() + action + '/' + method + '/',
				type: 'POST',
				data: AT.Fn.objectToGETString( p ) || '',
				success: function( data ) {
					
					if ( ! AT.Fn.isObject( data ) ) {
						AT.SEP.show('action-ajax', ' ajax failure ');
						return null;
					}
					
					if ( ! data.error ) {
						// exec success function
						
						// fire method afterAjax event
						if( This.fireMethodEvent(Applet, method, 'afterAjax', c, params) ) return This.interruptThru(c);
						
						var method_args = [data, params, $Obj].concat( args );
						
						// fire method beforeShow event
						if( This.fireMethodEvent(Applet, method, 'beforeShow', c, params) ) return This.interruptThru(c);
						
						Applet[method].apply(Applet, method_args);
						
						// fire method aftershowShow event
						This.fireMethodEvent(Applet, method, 'show', c, params);
						
						// fire method end event
						This.fireMethodEvent(Applet, method, 'end', c, params);
						
					}
					// laert error
					else {
						AT.SEP.show('Action-'+ name + ' error:', data.error+'錯誤: ' + data.msg);
					}

				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					// if is not aborted
					if( XMLHttpRequest.status !== 0 ) {
						AT.SEP.show('ajax', ' ajax failure ');
					}
					
				}
			});
			
			return Ajax;
		
		
		};
		
	});
	
	

	/*
	*	AT- Resource Loader  ===========================================================================================
	*/
	ATModel.RLoader = function() {
		
		this.requireResource = function( c ) {
			
			var appletName  = c.name;
			var callback = c.callback || function(){};
			var scope = c.scope || window;
			
			$.ajax({
				url: AT.getServerUrl() + 'require/',
				type: 'POST',
				data: 'AT_rRequest=' + appletName,
				success: function( resource ) {
					
					if ( resource.AT_rResponse ) {
						_evalResource( resource.AT_rResponse );
						callback.apply( scope );
					}
					// laert error
					else {
						AT.SEP.show('RLoader', ' load ' + appletName + ' resources failure ');
					}

				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					// if is not aborted
					if( XMLHttpRequest.status !== 0 ) {
						AT.SEP.show('RLoader', ' ajax failure ');
					}
				}
			});
		};
		
		
		function _evalResource( r ) {
			if( r.js ) {
				_eval(r.js, 'script', true);
			}
			
			if( r.css ) {
				_eval(r.css, 'style');
			}
		};
		
		function _eval(array, tag, closure) {
			var h = '';
			for (var i = 0, len = array.length; i < len; i++) {
				h += array[i] + ';';
			}
			
			// set the js closure
			if ( closure ) {
				h = '(function(){ ' + h + ' })();';
			}
			
			// jquery will auto remove script tag
			$(document.body).append('<'+ tag +'>'+ h +'</'+ tag +'>');
			
		};
		
	};
	
	
	
	/*
	*	Components Destroyer  ===========================================================================================
	*/
	ATModel.Destroyer = function() {
		
		// 執行銷毀應用程式&模組的元件
		this.destroy = function(Scope, d) {
			if ( d ) {
				//銷毀資料為array複數型態
				if ( AT.Fn.isArray( d ) ) {
					
					for(var i = 0; i < d.length; i++) {
						this.destroyIfIsSetting( d[i] );
					}
					
				}
				// 銷毀資料為物件集合
				else if ( d.Comps ){
					if ( AT.Fn.isArray( d.Comps ) ) {
						for(var i = 0, len = d.Comps.length; i < len; i++) {
							this.destroyIfIsSetting( d.Comps[i] );
						}
					}
					else {
						this.destroyIfIsSetting( d );
					}
				}
				//銷毀資料為function
				else {
					d.apply( Scope );	
				}
			}
		};
		
		
		this.destroyIfIsSetting = function( c ) {
			this.execDestroy( c.Comps );			
			if ( c.fn ) {	
				if ( c.scope ) {
					c.fn.apply( c.scope );		
				}
				else {
					c.fn();	
				}
			}
		};
		
		
		this.execDestroy = function( comps ) {
			if ( AT.Fn.isObject( comps ) ) {
				this.doDestroy(comps);
			}
			else if ( AT.Fn.isArray( comps ) ) {
				
				for(var i = 0; i < comps.length; i++) {
					this.doDestroy( comps[i] );
				}
				
			}
		};
		
		//recursive do destroy componments
		this.doDestroy = function( comp ) {
			for(var obj in comp) {
				if ( comp[obj] ) {

					if ( AT.Fn.isjQuery( comp[obj] ) ) {
						comp[obj].remove();
					}
					else if ( 'destroy' in comp[obj] ){
						
						//if ext component or function
						if ( AT.Fn.isFunction( comp[obj].destroy ) ) {
							comp[obj].destroy();	
						}
						else {
							var dt = comp[obj].destroy;
							this.destroyIfIsSetting( dt );
							
						}
					}
					comp[obj] = null;
				}
			}
		};
		
	};
	
	
	
	/*
	*	AT's System error processor  ===========================================================================================
	*/
	var SystemErrorProcessor = function( ATConfig ) {
		
		this.show = function(type, msg) {
			// only show msg
			if( arguments.length == 1 )	 {
				msg = type;
				type = 'system';
			}
			
			switch( type ) {
				case 'system': default:
					msg = 'System Error: ' + msg;
				break;
			}
			
			this.render(type, msg);
			
		};
		
		this.render = function(type, msg) {
			if ( ATConfig.ErrorApp ) {
				var c = AT.Fn.clone( ATConfig.ErrorApp );
				c.variables = [type, msg].concat( c );
				c.endFn = function(){
					if( c.endFn ){
						c.endFn();
						c = null;
					}	
				};
				AT.thru( ATConfig.ErrorApp );
			}
			else {
				alert(msg);	
			}
		};
		
	};
	
	
	
	
	/*
	*	Small-AT System Class  ===========================================================================================
	*/
	var SmallATClass = function() {
	
		var This = this;
		
		// System variables ----------------------------------------------------------------------
		
		var ISINIT = false;
		
		// ATAction config
		var ATConfig = {};
		
		// record web init data
		ATConfig.INITDATA = null;
		
		// record web server url
		ATConfig.SERVERURL = null;
		
		// Web expand Models ------------------------------------------------------------------------
		
		this.Fn = ATFn;
		
		this.Class = {};
		
		
		// System Class -----------------------------------------------------------------------------
	
		// action class
		var ActionClass = function() {};
		
		ActionClass.prototype = {
			setting: {
				// component collections
				Comps: {},
				
				// register app events
				events: {},
				
				// register ajax errors
				errors: null,
				
				// destroy collections
				destroy: null
			},
			
			_name_: ''
		};
		
		
		// System Models ( private ) -------------------------------------------------------------------------
		
		
		/**
		 * Resource loader
		 */
		var RLoader = new ATModel.RLoader();

		/**
		 * AJAX Action handler
		 */
		var Action = new ATModel.Action( RLoader );
		
		/**
		 * Compoments Destroyer
		 */
		var Destroy = new ATModel.Destroyer();
		
		
		
		// System Models ( public ) -------------------------------------------------------------------------

		
		this.Debug = new ATModel.Debugger();
		
		this.SEP = new SystemErrorProcessor( ATConfig );
		
		
		/**
		 * Action's method class (has event)
		 * @param  [function, object]
		 * @return [function]
		 */
		this.Action = function(sendFn, sucFn, config) {
			config = config || {};
			config.isAction = true;
			config._sendFn_ = sendFn;
			return AT.Fn.override(sucFn, config);
		};
		
		
		
		// System public methods ---------------------------------------------------------------------------
		
		
		// get server url
		this.getServerUrl = function() {
			return ATConfig.SERVERURL;
		};
		
		// return ture if AT is init
		this.isInit = function() {
			return ISINIT;	
		};
		
		// register action
		this.register = this.Fn.setFnScope(Action.Coll, 'register');
		
		
		
		// init Small-AT system
		this.init = function( config ) {
			
			if( ! config && ISINIT ) return;
			
			ISINIT = true;
			
			// call init config mehtod
			_initConfig( config );
			
			// init action applet
			Action.Coll.init( ActionClass );
			
			
			
			
			delete this.init;
			
		};
		
		
		
		// System private methods ---------------------------------------------------------------------------
		
		
		function _initConfig( c ) {

			// set INITDATA
			ATConfig.INITDATA = ( c.initData ? AT.Fn.clone( c.initData ) : ATConfig.INITDATA );

			// set web server url
			ATConfig.SERVERURL = c.serverUrl || ATConfig.INITDATA.serverUrl;
			
			// if doesn't set client&sever url
			if(  ! ATConfig.SERVERURL ) {
				AT.SEP.show(" client/server url Not Found ");
			}
			
		};
	
	
	};
	
	AT = new SmallATClass();
	
	
	
})();