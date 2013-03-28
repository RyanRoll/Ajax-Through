/*                                                             *\
*□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□*
*========================              ========================*
*    ============         Ajax-Through       ============      *
*========================              ========================*
*               2011 by Roll visionroll@gmail.com              *
*□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□*
*\                                                             */

(function() {
	
	/*	
	*	AJAX-Through System
	*
	*	// System Models
	*
	*	- AppCollections
	*
	*	- App
	*
	*	- ModuleCollections
	*
	*	- Module
	*
	*	- Page
	*
	*	- AgentCollections
	*
	*	- Agent
	*
	*	- this.Url(Url)
	*
	*	- ErrorProcessor
	*
	*	- Destroyer
	*
	*	- Debuger
	*
	*	- LoginNotifier
	*
	*	// User Models (own namespace)
	*
	*	- Class
	*
	*	- Models
	*
	*	- Components
	*
	*	- ViewSwitch
	*
	*	- Debuger
	*
	*/
	
	var ATSystem = function() {
		
		var This = this;
		
		// System variables ----------------------------------------------------------------------
		
		// namespaces
		this.name = 'AT'
		this.namespace = { 'AT': true };
		this.webNamespace = { 'Web': true };
		
		// status
		var ISINIT = false;
		
		// AT config
		var ATConfig = {};
		
		// recrod views name
		ATConfig.VIEWSNAME = 'index';
		// record web init data
		ATConfig.INITDATA = null;
		// record web url sign
		ATConfig.URLSIGN = '#';
		// record url target sign
		ATConfig.TARGETSIGN = '~';
		// record target type
		ATConfig.TARGETTYPE = true;
		// record web client url
		ATConfig.CLIENTURL = null;
		// record web server url
		ATConfig.SERVERURL = null;
		// record web base url
		ATConfig.BASEURL = null;
		// record web index url
		ATConfig.INDEX = null;
		// debug mode
		ATConfig.ErrorApp = null;
		
		
		
		// Web expand Models ------------------------------------------------------------------------
		
		this.Fn = ATFn;
		
		this.Class = {};
		
		this.Components = {};
		
		
		
		// System Class -----------------------------------------------------------------------------
		
		
		// application class
		var AppClass = function() {};
		
		AppClass.prototype = {
			setting: {
				// component collections
				Comps: {},
				
				// default show page
				defaultRun: null,
				
				// register app events
				events: {},
				
				// register ajax errors
				errors: null,
				
				// destroy collections
				destroy: null,
				
				// view mask
				mask: undefined
			},
			
			_name_: ''
			
		};
		
		// module class
		var ModuleClass = this.Fn.extend(AppClass, {
			// record this parent's name (app name)
			_appname_: ''
		});
				
		// agent class
		var AgentClass = function() {};
		
		AgentClass.prototype = {
			setting: {
				// component collections
				Comps: {},
				
				// default show Applet
				defaultApplet: null,
				
				// register app events
				events: {},
				
				// register ajax errors
				errors: null,
				
				// destroy collections
				destroy: null,
			},
			
			Super: {
				'close': function() {
					AT.Url.setUrl( AT.getLastThruUrl() );
					Agent.agentName = null;
				}
			},
			
			_name_: ''
		}
		
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
				destroy: null,
			},
			
			_name_: ''
		}
		
		
		// System Models ( private ) -------------------------------------------------------------------------
		
		
		/**
		 * Interface Loader
		 */
		var InterfaceLoader = new ATModel.InterfaceLoader();
		
		/**
		 * Resource loader
		 */
		var RLoader = new ATModel.RLoader();
		
		/**
		 * Login handler
		 */
		var LoginNotifier = new ATModel.LoginNotifier();
		
		/**
		 * AJAX handler
		 */
		var AJAX = new ATModel.Ajax(ATConfig, LoginNotifier);

		/**
		 * AJAX-Through handler
		 */
		var Protocol = new ATModel.Protocol(ATConfig, AJAX,  InterfaceLoader, RLoader);
		
		/**
		 * AJAX Agent handler
		 */
		var Agent = new ATModel.Agent(ATConfig, Protocol.AC, RLoader);
		
		/**
		 * AJAX Action handler
		 */
		var Action = new ATModel.Action(Protocol, Agent, RLoader, ActionClass);
		
		//var AjaxErrorProcessor = null;
		
		
		Protocol.setATAgent( Agent );
		
		Protocol.setActionColl( Action.ActionC );
		
		
		// System Models ( public ) -------------------------------------------------------------------------
		
		
		this.Url = null;

		this.BrowserMoniter = new ATModel.BrowserMoniter();
		
		this.Browser = this.BrowserMoniter;
		
		this.Destroyer = new ATModel.Destroyer();
		
		this.ViewSwitch = new ATModel.ViewSwitch();
		
		this.Comet = ATModel.Comet;

		this.Debug = new ATModel.Debugger();
		
		this.File = new ATModel.File( AJAX );
		
		this.SEP = new SystemErrorProcessor( ATConfig );
		
		
		/**
		 * App/Module's page type method
		 * config: isPage、target、useronly、direct、events、overrideEvent、mask
		 * @param  [function, object]
		 * @return [function]
		 */
		this.Page = function(fn, config) {
			config = config || {};
			var defaults = {
				//target: ATConfig.TARGETTYPE
				//mask: this.ViewSwitch.defaultEl
			}
			//config = AT.Fn.override(config, defaults, true);
			config.isPage = true;
			//config.overrideEvent = true;
			config.target = ATConfig.TARGETTYPE;
			return AT.Fn.override(fn, config);
		}
		
		/**
		 * App/Module/Agent's method class (has event)
		 * @param  [function, object]
		 * @return [function]
		 */
		this.Method = function(fn, config) {
			config = config || {};
			config.isMethod = true;
			return AT.Fn.override(fn, config);
		}
		
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
		}
		
		
		
		// System methods ---------------------------------------------------------------------------
		
		
		this.ajax = this.Fn.setFnScope(AJAX.ajax, AJAX);
		
		this.alert = ATFn.setFnScope(this.Debug, 'print');
		// add Protocol's thru event
		this.addThruEvent = this.Fn.setFnScope(Protocol.EventRegister, 'addEvent');
		// remove Protocol's thru event
		this.removeThruEvent = this.Fn.setFnScope(Protocol.EventRegister, 'removeEvent');		
		// get views target
		this.getViewTarget = this.getViewTargetName = function() {
			return Protocol.viewTarget;
		}
		// get App views name
		this.getViewAppName = function() {
			return Protocol.viewApp;	
		}
		// get module views name
		this.getViewModuleName = function() {
			return Protocol.viewAppModule;	
		}
		// get method views name
		this.getViewMethodName = function() {
			return Protocol.viewMethod;	
		}
		// get the major run method name
		this.getThruMethodName = function() {
			return Protocol.thruMethod;	
		}
		// get client url
		this.getClientUrl = function() {
			return ATConfig.INITDATA.clientUrl || ATConfig.CLIENTURL;
		}
		// get server url
		this.getServerUrl = function() {
			return ATConfig.INITDATA.serverUrl || ATConfig.SERVERURL;
		}
		// get base url
		this.getBaseUrl = function() {
			return ATConfig.INITDATA.baseUrl || ATConfig.BASEURL;
		}
		// get index url
		this.getIndexUrl = function() {
			return ATConfig.INDEX;
		}
		// get the AT last thru url
		this.getLastThruUrl = function() {
			return Protocol.urlRecord;
		}
		// get url sign
		this.getUrlSign = function() {
			return ATConfig.URLSIGN	;
		}
		
		// get jquery $dom by id or $dom
		this.getjQueryDom = function( id ) {
			return  ( id instanceof jQuery )? id : $('#'+ id);
		}
		
		// get empty fn
		this.getEmptyFn = function() {
			return function(){};
		}
		
		// get web init data
		this.getWebInitData = function() {
			return ATConfig.INITDATA;	
		}
		
		
		/*****  LoginNotifier offer  ****/
		
		// get login data
		this.getLoginData = this.Fn.setFnScope(LoginNotifier, 'getLoginData');
		// get user name
		this.getUserName = this.getUser = this.Fn.setFnScope(LoginNotifier, 'getUserName');
		// getg user name
		this.getUserId = this.Fn.setFnScope(LoginNotifier, 'getUserId');
		
		// is admin
		this.isAdmin = function() {
			return ( LoginNotifier.isLogin() && LoginNotifier.getUserName() === Protocol.viewTarget );
		}
		// return ture if AT is init
		this.isInit = function() {
			return ISINIT;	
		}
		// is login
		this.isLogin = this.Fn.setFnScope(LoginNotifier, 'isLogin');
		// isset app
		this.isSetApp = this.Fn.setFnScope(Protocol.AC.isSet, Protocol.AC);
		// isset module
		this.isSetModule = this.Fn.setFnScope(Protocol.MC.isSet, Protocol.MC);
		// isset proxy
		this.isSetAgent = this.Fn.setFnScope(Agent.AC.isSet, Agent.AC);
		
		// is app property
		this.isAppProperty = this.Fn.setFnScope(Protocol.AC, 'isProperty');
		// is module property
		this.isModuleProperty = this.Fn.setFnScope(Protocol.MC, 'isProperty');
		// is proxy property
		this.isAgentProperty = this.Fn.setFnScope(Agent.AC, 'isProperty');
		
		// init system
		this.init = function(config) {
			
			if( ! config && ISINIT ) return;
			
			ISINIT = true;
			
			// call init config mehtod
			_initConfig.call(this, config);
			
			// set user
			Protocol.user = config.initData.user;
			
			// init Protocol.AC、Protocol.MC、PC
			Protocol.AC.init( AppClass );
			Protocol.MC.init( ModuleClass );
			Agent.AC.init( AgentClass );
			
			// init login notifier
			LoginNotifier.init( ATConfig.INITDATA );
			
			
			// window onload
			$(function() {
					   
				InterfaceLoader.init();
			
				This.BrowserMoniter.start();	
				
				// init this.Url object
				This.Url = new ATModel.Url( ATConfig );
				
				This.Url.href( window.location.href );
				
			});
			
			/*
			Protocol.thru({
				app: 'test2',
				target: 'Roll',
				module: 'Unit',
				method: 'page2',
				onlink: true,
				params: 'a=123&b=456'
			});
			*/
			
			
			
			/*
			this.thruAgent({
				app: 'test2',
				agent: 'agent',
				method: 'update'
			});
			*/
			
			/*
			
			this.thruAgent({
				agent: 'GlobalAgent',
				method: 'update'
			});
			
			*/
			
			delete this.init;
		}
		
		// register app
		this.registerApp = this.Fn.setFnScope(Protocol.AC, 'register');
		
		// register app's module
		this.registerModule = this.Fn.setFnScope(Protocol.MC, 'register');
		
		// register action
		this.registerAction = this.Fn.setFnScope(Protocol.ActionC, 'register');
		
		// register agent
		this.registerAgent = this.Fn.setFnScope(Agent.AC, 'register');
		
		// set target
		this.setTarget = function( target ) {
			Protocol.viewTarget = target;
		}
		
		// exec ajax through
		this.through = this.thru = this.Fn.setFnScope(Protocol, 'thru');
		
		// exec ajax through
		this.thruAgent = this.Fn.setFnScope(Agent, 'thru');
		
		
		
		
		// System private methods ---------------------------------------------------------------------------
		
		
		function _initConfig( c ) {
			
			// set target type
			if( c.target !== null ) {
				TARGETTYPE = Boolean(c.target);
			}
			
			// set INITDATA
			ATConfig.INITDATA = ( c.initData )? c.initData : ATConfig.INITDATA;
			// set TARGETSIGN
			ATConfig.VIEWSNAME = c.viewsName || ATConfig.VIEWSNAME;
			// set URLSIGN
			ATConfig.URLSIGN = c.urlSign || ATConfig.URLSIGN;
			// set TARGETSIGN
			ATConfig.TARGETSIGN = c.targetSign || ATConfig.TARGETSIGN;
			// set web client url
			ATConfig.CLIENTURL = c.clientUrl || ATConfig.INITDATA.clientUrl;
			// set web server url
			ATConfig.SERVERURL = c.serverUrl || ATConfig.INITDATA.serverUrl;
			// set web base url
			ATConfig.BASEURL = c.baseUrl || ATConfig.INITDATA.baseUrl;
			// set TARGETSIGN
			ATConfig.INDEX = c.index || ATConfig.CLIENTURL;
			// debug mode
			ATConfig.ErrorApp = c.errorApp;
			
			// if doesn't set client&sever url
			if( ! ATConfig.CLIENTURL || ! ATConfig.SERVERURL ) {
				AT.SEP.show(" client/server url Not Found ");
			}
			
			// add web namespace
			if( c.webNamespace ) {
				this.addWebNamespace( c.webNamespace );
			}
			
		}
		
		
		
		
		
	};
	
	
	// System's window ----------------------------------------------------------------------------------
	
	ATSystem.prototype = {
		
		addNamespace: function( name ) {
			this.namespace[name] = true;
			eval(name + ' = AT');
		},
		
		addWebNamespace: function( name ) {
			
			if ( AT.Fn.isString( name ) ) {
				eval(name + ' = {}; ' + name +'.Fn = AT.Fn; '+ name +'.Class = AT.Class; '+ name +'.Components = AT.Components; '+ name +'.ViewSwitch = AT.ViewSwitch;')
				this.webNamespace[name] = true;
			}
			
			if ( AT.Fn.isObject( name ) ) {
				name.Fn = AT.Fn;
				name.Class = AT.Class;
				name.Components = AT.Components;
				name.ViewSwitch = AT.ViewSwitch;
			}
			
		},		
		
		toString: function() {
			return this.name;	
		}
	}
		
	
	
	// AT's System error processor -------------------------------------------------------------------------------
	
	var SystemErrorProcessor = function( ATConfig ) {
		
		this.show = function(type, msg) {
			// only show msg
			if( arguments.length == 1 )	 {
				msg = type;
				type = 'system';
			}
			
			switch(type) {
				case 'system': default:
					msg = 'System Error: ' + msg;
				break;
				case 'thru':
					msg = 'AJAX-Through Error: ' + msg;
				break;
				case 'proxy':
					msg = 'AJAX-Agent Error: ' + msg;
				break;
				case 'ajax': 
					msg = 'AJAX Error: ' + msg;
				break;
			}
			
			this.render(type, msg);
			
		}
		
		this.render = function(type, msg) {
			if ( ATConfig.ErrorApp ) {
				var c = AT.Fn.clone( ATConfig.ErrorApp );
				c.variables = [type, msg].concat( c );
				c.endFn = function(){
					if( c.endFn ){
						c.endFn();
						c = null;
					}	
				}
				AT.thru( ATConfig.ErrorApp );
			}
			else {
				alert(msg);	
			}
		}
		
	}
	
	
	
	
	
	
	
	
	
	// init system
	AT = new ATSystem();
	
	AT.addWebNamespace('Web');
	
	
	
	
	
})();
