(function(){
	
	// AT's Apps Controller -------------------------------------------------------------------------------
	
	ATModel.AppColl = function() {
		
		// app class collections
		this.Class = {},
		 
		// app object collections
		this.Objects = {},
		
		// register app , if AT is started, this method will call add method
		this.register = function(name, Class) {
			this.Class[name] = Class;
			
			if( AT.isInit() ) {
				this.add( name );
			}
		}
		
		// init all app
		this.init = function(reference) {
			this.reference = reference;
			for(var p in this.Class) {
				this.add( p );
			}
			//AT.Debug.print(this.Objects['main']);
		}
		
		// add app (using in after AT started)
		this.add = function(name) {
			var extend = AT.Fn.extend(this.reference, this.Class[name], true);
			extend.prototype._name_ = name;
			this.Objects[name] = new extend();
		}
		
		// is app property
		this.isProperty = function(name, property) {
			try {
				return property in this.Objects[name];
			}
			catch (e) {
				return false;	
			}
		}
		
		// get app
		this.get = function(name) {
			return this.Objects[name];
		}
		
	};
	
	ATModel.AppColl.prototype = {
		// check app is set
		isSet: function(name) {
			return name in this.Class;
		}
		
	};
	
	
	
	
	// AT's Modules Controller -------------------------------------------------------------------------------
	
	ATModel.ModuleColl = ATFn.extend(ATModel.AppColl, function( AC ) {
		
		// module class collections
		this.Class = {};
		
		// module object collections
		this.Objects = {};
		
		this.AC = AC;

	});
	
	ATModel.ModuleColl.prototype = ATFn.extendPrototype(ATModel.AppColl.prototype, {
	
		// override - register app , if AT is started, this method will call add method
		register: function(appname, name, Class) {
			
			if( ! ( appname in this.Class ) || ! ( appname in this.Objects ) ) {
				this.Objects[appname] = {};
				this.Class[appname] = {};
			}
			
			this.Class[appname][name] = Class;
			
			if( AT.isInit() ) {
				this.add(appname, name);
			}
		},
		
		// override - init all module
		init: function(reference) {
			this.reference = reference;
			for(var p in this.Class) {
				for( var m in this.Class[p] ) {
					this.add(p, m);
				}
			}
		},
		
		// add module (using in after AT started)
		add: function(appname, name) {
			var extend = AT.Fn.extend(this.reference, this.Class[appname][name], true);
			extend.prototype._appname_ = appname;
			extend.prototype._name_ = name;
			this.Objects[appname][name] = new extend();
		},
		
		// override - check module is set
		isSet: function(appname, name) {
			return ( this.AC.isSet(appname) && appname in this.Class && name in this.Class[appname] );
		},
		
		// is module property
		isProperty: function(appname, name, property) {
			try {
				return property in this.Objects[appname][name];
			}
			catch (e) {
				return false;	
			}
		},
		
		// override - get module
		get: function(appname, name) {
			try {
				return this.Objects[appname][name];
			}
			catch (e) {
				return null;	
			}
		}
	});
	
	
	// AT's Agent Controller -------------------------------------------------------------------------------
	
	ATModel.AgentColl = ATFn.extend(ATModel.ModuleColl, function(AC) {
		// proxy class collections
		this.Class = {};
		
		// proxy object collections
		this.Objects = {};
		// App collections
		this.AC = AC;
		
		// override
		this.register = function(appname, name, Class) {

			if( arguments.length == 2 ) {
				Class = arguments[1];
				name = arguments[0];
				appname = 'agent';
			}
			
			if( ! ( appname in this.Class ) || ! ( appname in this.Objects ) ) {
				this.Objects[appname] = {};
				this.Class[appname] = {};
			}
			
			this.Class[appname][name] = Class;
			
			if( AT.isInit() ) {
				this.add(appname, name, Class);
			}
		}
		
		// override - init all Agent
		this.init = function(reference) {
			this.reference = reference;
			for(var p in this.Class) {
				for( var m in this.Class[p] ) {
					this.Objects[p][m] = new ( AT.Fn.extend(this.reference, this.Class[p][m], true) )();
				}
			}
		},
		
		// add module (using in after Agent started)
		this.add = function(appname, name, Class) {
			
			if( arguments.length == 2) {
				Class = arguments[1];
				name = arguments[0];
				appname = 'agent';
			}
			
			this.Objects[appname][name] = new ( AT.Fn.extend(this.reference, this.Class[appname][name], true) )();
		}
		
		// override - check module is set
		this.isSet = function(appname, name) {
			
			if ( arguments.length == 1 ) {
				name = arguments[0];
				appname = 'agent';
			}
			
			return ( appname in this.Class && name in this.Class[appname] );
		}
		
		// is Agent property
		this.isProperty = function(appname, name, property) {
			
			if( arguments.length == 2 ) {
				property = arguments[1];
				name = arguments[0];
			}
			
			try {
				return property in this.Objects[appname][name];
			}
			catch (e) {
				return false;	
			}
		}
		
		// override
		this.get = function(appname, name) {
			
			if( arguments.length == 1 ) {
				name = arguments[0];
				appname = 'agent';	
			}
			
			try {
				return this.Objects[appname][name];
			}
			catch (e) {
				return null;	
			}
		}
		
	});
	
	
	// AT's Action Controller -------------------------------------------------------------------------------
	
	ATModel.ActionColl = function(AC, MC, ActionClass) {
		
		this.Class = {};
		
		this.Objects = {};
		
		
		/**
		 * register Applet's Action object
		 * @param  [mixed] appname, modulename, name, class || modulename, name, class
		 */
		this.register = function() {
			var app = arguments[0];
			if ( AC.Objects[app] ) {
				this.Class[app] = {m: {}, c: {}};
				this._run(arguments, 3, this._registerApp, this._registerModule);
			}
			else {
				AT.SEP.show('system', 'register Action error : app "'+ app +'" is undefined');
			}
		}
		
		this._registerApp = function( a ) {
			var app = a[0];
			var name = a[1];
			var Class = a[2];
			this.Class[app].c[name] = Class;
		}
		
		this._registerModule = function( a ) {
			var app = a[0];
			var module = a[1];
			var name = a[2];
			if ( MC.Objects[app][module] ) {
				var M = this.Class[app].m;
				if ( ! M[module] ) {
					M[module] = {};
				}
				M[module][name] = a[3];
			}
			else {
				AT.SEP.show('system', 'register Action error : module "'+ module +'" is undefined');
			}
		}
		
		/**
		 * run Applet's Action
		 * @param  [mixed] appname, modulename, name, class || modulename, name, class
		 */
		 this.runAction = function() {
			 var app = arguments[0];
			 this.Objects[app] = {m: {}, o: {}};
			 if ( this.Class[app] ) {
				 this._run(arguments, 1, this._runAppAction, this._runModuleAction);
			 }
		 }
		 
		 this._runAppAction = function( a ) {
			var app = a[0];
			var Class = this.Class[app].c;
			var Obj = this.Objects[app].o;
			for(var c in Class) {
				var extend = AT.Fn.extend(ActionClass, Class[c], true);
				extend.prototype._name_ = c;
				Obj[c] = new extend();
			}
		 }
		 
		 this._runModuleAction = function( a ) {
			var app = a[0];
			var module = a[1];
			var Class = this.Class[app].m[module];
			var Obj = this.Objects[app].m[module] = {}
			for(var c in Class) {
				var extend = AT.Fn.extend(ActionClass, Class[c], true);
				extend.prototype._name_ = c;
				Obj[c] = new extend();
			}
			//AT.Debug.printObj(this.Objects);
		 }
		 
		/**
		 * destroy Applet Actions ( isn't this)
		 * @param  [mixed] appname, modulename, name, class || modulename, name, class
		 */
		this.destroy = function() {
			var app = arguments[0];
			if ( this.Class[app] ) {
				this._run(arguments, 1, this._destroyApp, this._destroyModule);
			}
		}

		this._destroyApp = function( a ) {
			var app = a[0];
			var Class = this.Class[app].c;
			var Obj = this.Objects[app].o;
			for(var c in Obj) {
				var Applet = Obj[c];
				AT.Destroyer.destroy(Applet, Applet.setting.destroy);
				Applet = null;
			}
			//delete this.Class[app];
			delete this.Objects[app];
		}
		
		this._destroyModule = function( a ) {
			var app = a[0];
			var module = a[1];
			var Class = this.Class[app].m[module];
			var Obj = this.Objects[app].m[module];
			//AT.Debug.printObj(this.Class);
			for(var c in Obj) {
				var Applet = Obj[c];
				AT.Destroyer.destroy(Applet, Applet.setting.destroy);
				Applet = null;
			}
			//delete this.Class[app].m[module];
			delete this.Objects[app].m[module];
			//AT.Debug.printObj(this.Objects);
		}
		 
		 
		/**
		 * get Applet's Action object
		 * @param  [mixed] appname, modulename, name, class || modulename, name, class
		 * @return [object]
		 */
		this.get = function() {
			return this._run(arguments, 2, this._getInApp, this._getInModule);
		}
		
		this._getInApp = function( a ) {
			var app = a[0];
			var name = a[1];
			return this.Objects[app].c[name];
		}
		
		this._getInModule = function( a ) {
			var app = a[0];
			var module = a[1];
			var name = a[2];
			return this.Objects[app].m[module][name];
		}
		
		/**
		 * Return true if Action is exist
		 * @param  [mixed] appname, modulename, name, class || modulename, name, class
		 * @return [boolean]
		 */
		this.isExist = function() {
			return this._run(arguments, 2, this._isAppExist, this._isModuleExist);
		}
		
		this._isAppExist = function( a ) {
			var app = a[0];
			var name = a[1];
			return ( name in this.Objects[app].c );
		}
		
		this._isModuleExist = function( a ) {
			var app = a[0];
			var module = a[1];
			var name = a[2];
			return ( name in this.Class[app].m[module] );
		}
		
		
		/**
		 * judge Applet type and exec
		 * @param  [object, int, function, function]
		 */
		this._run = function(a, pn, fn1, fn2) {
			switch ( a.length ) {
				case pn:
					return fn1.call(this, a);
				
				case ( pn + 1 ):
					return fn2.call(this, a);
				
				default:
					AT.SEP.show('system', 'register Action error!');
			}	
		}
		
	}
	
	
})();