(function(){
	 
	/**
	 * Protocol - AJAX-Through Protocol and handler
	 * 
	 *
	 */	
	ATModel.Protocol = ATFn.extend(ATModel.AppletEventModel, function(ATConfig, Ajax, InterfaceLoader, RLoader) {
		
		// public variables ----------------------------------------------------------------------
		
		// record user and target
		this.user = null;
		this.viewTarget = null;
		
		// record view App、module、method name
		this.viewApp = null;
		this.viewAppModule = null;
		this.viewMethod = null;
		
		// record the major run method
		this.thruMethod = null;
		
		// record previous App、module、method name
		this.prevApp = null;
		this.prevAppModule = null;
		this.prevMethod = null;
		
		// record if call this.maskView
		this.maskId = false;
		
		// if setUrl(onlink) then record the setting url
		this.urlRecord = '';
		
		// AT Agent object reference
		this._ATAgent = null;
		
		this.toString= function(){return 'ATClient.Protocol'};
		
		
		// public models ----------------------------------------------------------------------
		
		// app  applet collection
		this.AC =  new ATModel.AppColl();
		// module applet collection
		this.MC =  new ATModel.ModuleColl( this.AC );
		
		
		this.EventRegister = new ATModel.extendedEventModel();

		
		// public methods ----------------------------------------------------------------------
		
		/**
		 * set AT Agent object reference, set by AT constructor
		 * @param  [object]
		 */
		 this.setATAgent = function( Agent ) {
		 	this._ATAgent = Agent;
		 }
		 
		 /**
		 * set Action Collections reference
		 * @param  [object]
		 */
		 this.setActionColl = function( ActionC ) {
		 	this.ActionC = ActionC;
		 }
		
		/**
		 * Thru - AJAX -> Sever -> App/Module
		 * @param  [mixed] object || string (url)
		 * @return [object] XMLHttpRequest
		 * @exception: show erro and return null
		 */
		this.thru = function( config ) {
			
			if ( config.app == 'agent' ) {
				return AT.thruAgent( config );
			}
			
			// use the config copied
			var c = AT.Fn.clone( config );
			
			// copy the original config
			var arg = AT.Fn.clone( config );
			arg.reLoadApp = false;

			// record the major run method
			if ( ! c.__callback__ ) {
				this.thruMethod = c.method;
			}
			
			// verify thru config ----------------------------------------------
			
			var Applet = null;
			var permit = true;
			var result = this.verifyThruConfig( c );
			
			switch( result ) {
				case '!Applet':
					c.__includeJs__ = true;
				break;
				case '!method':
					AT.SEP.show('thru', '\nthe method : '+ ( c.module ? c.module : c.app ) + '.' + c.method +' is no\'t exist' );
					return null;
				break;
				default:
					c = result[0];
					Applet = result[1];
					permit = result[2];
					if ( ! permit ) {
						AT.SEP.show('thru', '\n[' + ( c.module ? c.module : c.app ) + '.' + c.method + '] is not a page');
						return null;
					}
			}
			/*
			if ( result !== '!Applet' ) {				
				c = result[0];
				Applet = result[1];
				permit = result[2];
				
				if ( ! permit ) {
					AT.SEP.show('thru', '\n[' + ( c.module ? c.module : c.app ) + '.' + c.method + '] is not a page');
					return null;
				}
			}
			// start include js type
			else {
				c.__includeJs__ = true;
			}
			*/
			
			
			if ( ! c.direct ) {
				
				// 檢測 應用程式/頁面/目標 是否重新切換 ----------------------------------------------

				var confirmResult = this.confirmSwitchApp(c, Applet, arg);

				if ( confirmResult === false ) {
					AT.SEP.show('thru', 'User Only');
					return null;
				}
				// return ajax obj
				else if ( confirmResult !== 'notSwitch' ) {
					return confirmResult;
				}
				
			}

			// 執行through --------------------------------------------------------
			
			var final = final = this.startThru(c, Applet);
			
			
			return ( final )? final : null;
			
		}
		
		
		/**
		 * Verify the Thru method config and modify config
		 * @param  [object]
		 * @return [array] - [c, Applet];
		 * @exception: return error string
		 */
		this.verifyThruConfig = function( c ){
			
			var permit = true;
					
			// 如果target = true或未設定target，代表自動存取
			if ( c.target === true || c.target === undefined ) {

				c.target = this.viewTarget;
			}

			// js端執行的應用程式/模組
			var Applet = this.AC.get( c.app );
			
			// 判斷是否執行app module method
			if ( c.module ) {
				
				if ( ! Applet || ! this.AC.isSet(c.app, c.module) ) {
					return '!Applet';
				}
				
				Applet = this.MC.get(c.app, c.module);
			}
			
			var method = c.method;
			
			// 判斷應用程式與method是否正確
			if (  Applet  ) {
				if ( Applet[method] && method !== 'setting' ) {
					// check link permit
					if ( c.onlink &&  ! Applet[method]['isPage'] ) {
						var permit = false;
					}
	
					// 判斷是否為連結或網址執行觸發
					if ( c.onlink && permit ) {
						
						// if  useronly
						c.useronly = Applet[method]['useronly'];
						
						// 判斷是否否定target (若無則以useronly為標準 )
						if ( c.target ) {
							permit = Applet[method]['target'] || c.useronly;
						}
						/*
						if ( c.useronly ){
							//c.target = this.viewTarget;
							alert(AT.getUser()+','+this.viewTarget+','+c.target);
						}*/
						
						// 如果onlink狀態且已設定method的direct，則為direct模式
						c.direct = Applet[method]['direct'] || c.direct;				
					}
					
					return [c, Applet, permit];
				}
				
				return '!method';
			}
			
			return '!Applet';

		};
		
		/**
		 * Switch App when Thru change App, Return the switch thru method
		 * @param  [object, object, object]
		 * @return [mixed] null || object
		 * @exception: return false
		 */
		this.confirmSwitchApp = function(c, Applet, arg) {
			
			// 是否app不同或target不同或reload  則觸發切換index
			if ( c.reLoadApp || ( this.viewApp != c.app || ( c.target && c.target != this.viewTarget ) ) ) {

				// record target				
				this.viewTarget = c.target;
				
				//如果不是單純執行應用程式的index，則進行先執行切換index
				if ( ! ( c.method ==  ATConfig.VIEWSNAME && c.module == null ) ) {

					return this.switchAppViews(c.app, c.target, arg, c.finallyFn);
					
				}
			}	
			//是否控制權轉交給app的module
			if ( c.module && ! c.__switchViews__ ) {
				
				if ( c.method != ATConfig.VIEWSNAME && this.viewAppModule != c.module ) {
					//this.viewAppModule = c.module;
					return this.thruAppModuleViews(arg, Applet, c.__includeJs__);
				}
			}
			
			return 'notSwitch'; // 代表不執行切換
		}
		
		/**
		 * Before Through
		 * @param  [object, object, object]
		 */
		 this.beforeAjax = function(Applet, c, params) {
			
			// exec beforeFn ( if  beforeFn return false, then end the through )
			if ( c.beforeFn && c.beforeFn() === false ) {
				return null;
			}
			
			// fire beforeAjax event (EventRegister)
			if ( this.EventRegister.fireEvent('beforeAjax', c, params) ) return this.interruptThru(c);
			// fire beforeAjax event
			if ( this.fireAppletEvent(Applet, 'beforeAjax', c, params) ) return this.interruptThru(c);
			// fire method beforeAjax event
			if ( this.fireMethodEvent(Applet, c.method, 'beforeAjax', c, params) ) return this.interruptThru(c);
			
			return params;
		 }
		 
		 
		 /**
		 * Start Through
		 * @param  [object, object]
		 */
		 this.startThru = function(c, Applet) {

			var app = c.app;
			var target = c.target;
			var module = c.module || c.model;
			var method = c.method;
			var params = c.params;
			var onlink = c.onlink;
			var variables = c.variables;
			var beforeFn = c.beforeFn;
			//var __callback__ = c.__callback__;  因事件因素故不另外宣告
			var finallyFn = c.finallyFn;
			var endFn = c.endFn;
			//var mask = c.mask;
			var reLoadApp = c.reLoadApp;
			var direct = c.direct;
			var useronly = c.useronly;
			var __switchViews__ = c.__switchViews__;
			var __includeJs__ = c.__includeJs__;
			var noSetUrl = c.noSetUrl;
			var pageMode = c.pageMode;
			var type = c.type;
				
			
			
			// set http post params ----------------------------------------------
			
			params = AT.Fn.GETStringToObj( params ) || {};
			var p = null;
			
			// 如果參數是非GET格式字串
			if ( AT.Fn.isString( params ) ) {
				p = {};
				p['param'] = params;
			}
			else {
				p = AT.Fn.clone( params );
			}
			
			p.AT_app = app;
			
			if ( module ) {
				p.AT_module = module;
			}
			else {
				p.AT_AppInterface = InterfaceLoader.appInterface;
			}
			
			if ( target ) {
				p.AT_target = target;
			}
			
			// request include js data ---------------------------------------------
			
			if ( __includeJs__ ) {
				p.AT_rRequest = JSON.stringify( ( module )?
						['Module', {app: app, module: module}] : ['App', {app: app}] );
			}
			else {
				var ba_result = this.beforeAjax(Applet, c, p);
				if ( ! ba_result ) {
					return null;	
				}
				p = ba_result;
			}
			
			// 在未include的可能下先判斷Applet是否為method
			var _isMethod = false;
			
			if  ( Applet &&  Applet[c.method] ) {
				var TAM = Applet[c.method];
				
				_isMethod = TAM['isMethod'];
				
				if ( TAM.direct !== undefined ) {
					direct = TAM.direct;
				}
			}
			
			if ( ! direct ) {
				this.maskView(Applet, c);
			}
			
			if ( ! _isMethod ) {
				this._ATAgent.destroyActiveAgent();
			}
			
			
			
			// exec ajax ----------------------------------------------
			
			return AT.ajax({
				app: app,
				module: module,
				method: method,
				params: p,
				scope: this,
				type: type,
				finallyFn: finallyFn,
				abort: c.abort,
				success: function( data ) {
					
					// default run
					var dr = null;
					
					// switch interface
					if ( data.AT_AppInterface ) {
						InterfaceLoader.switchInterface( data.AT_AppInterface );	
						delete data.AT_AppInterface;
					}
					
					// judge the Applet is exist
					if ( __includeJs__ ) {
						rResponse = data.AT_rResponse;
						if ( rResponse ) {
							// eval js , Collection will auto add app/module;
							RLoader.eval( rResponse );
							// get the Applet
							Applet = ( module )? this.MC.get(app, module) : this.AC.get( app );
							
							// compensate for fire beforeAjax event (EventRegister)
							if ( this.EventRegister.fireEvent('beforeAjax', c, params) ) return this.interruptThru(c);
							// compensate for fire beforeAjax event
							if ( this.fireAppletEvent(Applet, 'beforeAjax', c, params) ) return this.interruptThru(c);
							// compensate for fire method beforeAjax event
							if ( this.fireMethodEvent(Applet, c.method, 'beforeAjax', c, params) ) return this.interruptThru(c);
							
						}
						else {
							AT.SEP.show('thru', ' Include '+ app + (module? '.' + module : '') +' JS Error');
							return null;	
						}
						delete data.AT_rResponse;
					}
					// 是否存在程式物件
					if ( ! Applet ) {
						AT.SEP.show('thru', 'Load app/module js error or URL error');
						return null;
					}
					
					// the Applet Method
					var TAM = Applet[method];
					
					// 是否存在函式
					if ( ! TAM ) {
						AT.SEP.show('thru', 'the '+ method +' is no\'t exist in app/module');
						return null;
					}
					
					// 設定事件參數
					c.isPage = TAM['isPage'];
					c.useronly = c.useronly || TAM['useronly'];
					
					if ( onlink === true && ! c.isPage ) {
						AT.SEP.show('thru', 'is not a page!');
						return null;
					}
					
					
					// 是否useronly
					if ( c.useronly && ! AT.Fn.stringEqual(c.target, AT.getUserName()) ) {
						AT.SEP.show('thru', 'User Only!');
						return null;
					}
					
					
					
					var methodArgs = [data, params];
					
					// set method variables
					if ( c.variables ) {
						methodArgs = methodArgs.concat( variables );	
					}
					
					if (c.method=='update'){console.log(this)}
					// fire afterAjax event (EventRegister)
					if ( this.EventRegister.fireEvent('afterAjax', c, params) ) return this.interruptThru(c);
					// fire afterAjax event
					if ( this.fireAppletEvent(Applet, 'afterAjax', c, params) ) return this.interruptThru(c);
					// fire method afterAjax event
					if ( this.fireMethodEvent(Applet, method, 'afterAjax', c, params) ) return this.interruptThru(c);
					
					/*
					* exec Applet
					*/
					// if this job is load app index method
					if ( ! direct && __switchViews__ || ( method == ATConfig.VIEWSNAME && module == null ) ) {
						
						// fire beforeshow event (EventRegister)
						if ( this.EventRegister.fireEvent('beforeShow', c, params) ) return this.interruptThru(c);
						// fire beforeShow event
						if ( this.fireAppletEvent(Applet, 'beforeShow', c, params) ) return this.interruptThru(c);
						// fire method beforeShow event
						if ( this.fireMethodEvent(Applet, method, 'beforeShow', c, params) ) return this.interruptThru(c);
						// fire switchApp event (EventRegister)
						if ( this.EventRegister.fireEvent('switchApp', c, params) ) return this.interruptThru(c);
						
						this.destroyPrePage( Applet );
						
						this.destroyThisModule();
						
						dr = this.afterSwitchAppView(Applet, methodArgs, c);
						
						this.unMaskView();
						
						// fire show event
						this.fireAppletEvent(Applet, 'show', c, params);
						
					}
					// else if this job is load module index method
					else if ( ! direct && module && ( method == ATConfig.VIEWSNAME )  ) {
						
						// fire beforeshow event (EventRegister)
						if ( this.EventRegister.fireEvent('beforeShow', c, params) ) return this.interruptThru(c);
						// fire beforeShow event
						if ( this.fireAppletEvent(Applet, 'beforeShow', c, params) ) return this.interruptThru(c);
						// fire method beforeShow event
						if ( this.fireMethodEvent(Applet, method, 'beforeShow', c, params) ) return this.interruptThru(c);
						
						this.destroyPrePage( Applet );
						
						this.destroyThisModule();
						
						dr = this.afterSwitchModuleView(Applet, methodArgs, c);
						
						this.unMaskView();
						
						// fire show event
						this.fireAppletEvent(Applet, 'show', c);
		
					}		
					// else , the job is load app/module method
					else {
						
						// fire method beforeShow event
						if ( this.fireMethodEvent(Applet, method, 'beforeShow', c, params) ) return this.interruptThru(c);
						
						this.destroyPrePage(Applet, true);
						
						// record view & prev App,module,method,target
						this.recordViewStatus(Applet, c);
						
						if ( module ) {
							// exec module actions
							this.ActionC.runAction(app, module);
	
						}
						else {
							this.ActionC.runAction( app );	
						}
						
						// exec app/module method
						Applet[method].apply(Applet, methodArgs);
						
						
						// call __callback__ function
						if ( c.__callback__ ) {
							c.__callback__();
						}
						
						this.unMaskView();		
					}
					
					
					// fire show event (EventRegister)
					this.EventRegister.fireEvent('show', c, params);
					
					// fire method show event
					this.fireMethodEvent(Applet, method, 'show', c, params);
		
					
					// 最後設定Url ( 必須為Page模式)
					if ( ! noSetUrl && c.isPage ) {
						//alert(app+','+module+','+method+','+onlink);
						//set browser url
						this.urlRecord = AT.Url.setUrl(app, ( useronly? null : target ),  module, method, params);
					}
					else {
						this.urlRecord = location.href;
					}
					
					// call end function
					if ( endFn ) {
						endFn();	
					}
					
					
					// fire end event (EventRegister)
					this.EventRegister.fireEvent('end', c, params);
					
					// fire end event
					if ( __switchViews__ ){
						this.fireAppletEvent(Applet, 'end', c, params);
					}
					
					// fire method end event
					this.fireMethodEvent(Applet, method, 'end', c, params);
					
					
					// exec App default Module
					if ( dr ) {
						return this.thru( dr );
						//AT.Url.setUrl(dr.app, ( dr.useronly? null : dr.target ),  dr.module, dr.method, dr.params);	
					}
					
					// for ajax comet component
					if ( c.__AjaxComet__ ) {
						c.__AjaxComet__();
					}
					
					// for agent
					if ( c.__Agent__ ) {
						c.__Agent__();
					}
					
				
				}
			});
			
		 }
		
		/**
		 * After switch app view
		 * @param  [object, array, function]
		 * @return null
		 * @except return Applet.setting.defaultRun
		 */
		this.afterSwitchAppView = function(Applet, methodArgs, c) {
			
			// destroy this app
			this.closeAppView( this.viewApp );
			
			// record view & prev App,module,method,target
			this.recordViewStatus(Applet, c);
			
			// exec app actions
			this.ActionC.runAction( c.app );
			
			Applet[ c.method ].apply(Applet, methodArgs);
			
			//run __callback__
			if ( c.__callback__ ) {
				c.__callback__();
			}
			//run default
			else if ( Applet.setting.defaultRun ) {
				return AT.Fn.clone( Applet.setting.defaultRun );
				//this.thru( Applet.setting.defaultRun );
			}
			
			return null;
		}
		
		/**
		 * After switch module view
		 * @param  [object, array, function]
		 * @return null
		 * @except return Applet.setting.defaultRun
		 */
		this.afterSwitchModuleView = function(Applet, methodArgs, c) {
			
			// record view & prev App,module,method,target
			this.recordViewStatus(Applet, c);
			
			// exec module actions
			this.ActionC.runAction(c.app, c.module);
			
			// exec app/module method
			Applet[ c.method ].apply(Applet, methodArgs);			
			
			//run __callback__
			if ( c.__callback__ ) {
				c.__callback__();
			}
			//run default
			else if ( Applet.setting.defaultRun ) {
				return AT.Fn.clone(Applet.setting.defaultRun );
			}
			
			return null;
		}
		
		/**
		 * Close App View
		 * @param  [string, string]
		 */
		this.closeAppView = function( app ) {
			var App = this.AC.get( app );
			if ( App ) {
				// delete ajax record
				Ajax.delAppRecord( app );
				this.ActionC.destroy( app );
				AT.Destroyer.destroy(App, App.setting.destroy);
				//AT.Destroyer.execDestroy( App.setting.Comps );
			}
		}
		
		/**
		 * Switch App Views
		 * @param  [string, string, object function]
		 * @return [object]
		 */
		this.switchAppViews = function(app, target, arg, finallyFn) {
			var This = this;
			return this.thru({
				app: app,
				target: target,
				module: null,
				method: ATConfig.VIEWSNAME,
				params: null,
				onlink: false,
				noSetUrl: true,
				__callback__: function() {
					This.thru( arg );
				},
				beforeFn: function() {
					//$.scrollTo(0, 500);
				},
				finallyFn: finallyFn,
				__switchViews__: true
			});
		}
		
		/**
		 * 執行應用程式/模組的views
		 * @param  [object, object boolean]
		 * @return [object]
		 */
		this.thruAppModuleViews = function(c, Applet, __includeJs__) {
			var This = this;
			return this.thru({
				app: c.app,
				target: true,
				module: c.module,
				method: ATConfig.VIEWSNAME,
				onlink: false,
				noSetUrl: true,
				__callback__: function() {
					return This.thru(c);
				},
				finallyFn: c.finallyFn,
				__includeJs__: __includeJs__
			});
	
		}
		
		/**
		 * Destroy the prev App || Model
		 * @param  [mixed] {} || {string}
		 */
		this.destroyThisModule = function() {
			//AT.alert([this.viewApp , this.viewAppModule, this.viewMethod, this.viewTarget]);
			var app = this.viewApp, module = this.viewAppModule;
			if ( app && module ) {
				var Applet = this.getViewApplet();
				if ( Applet ) {
					// delete ajax record
					Ajax.delModuleRecord(app, module);
					this.ActionC.destroy(app, module);
					AT.Destroyer.destroy(Applet, Applet.setting.destroy);
					//AT.Destroyer.execDestroy( Applet.setting.Comps );
				}
			}
		}
		
		/**
		 * Exec prev App's || Model's Page destroy setting
		 * @param  [object , [boolean]]
		 */
		this.destroyPrePage = function(Applet, ignoreIndex) {
			var method = this.viewMethod;
			var AppletMethod = Applet[method];
			ignoreIndex = ( ignoreIndex )? ( method != ATConfig.VIEWSNAME ) : true;
			if ( AppletMethod &&  AppletMethod.isPage && AppletMethod.destroy && ignoreIndex ) {
				AT.Destroyer.destroy(Applet, AppletMethod.destroy);
			}
		}
		
		/**
		 * record view & prev App,module,method,target
		 *
		 */
		this.recordViewStatus = function(Applet, config) {
			//alert(viewTarget+','+config.target)
			if ( config.isPage ) {

				if ( ! config.direct ) {	
					this.prevApp = this.viewApp;
					this.prevAppModule = this.viewAppModule;
					this.prevMethod = this.viewMethod;
					
					this.viewApp = config.app;
					this.viewAppModule = config.module;
					this.viewMethod = config.method;
					//this.viewTarget = target;
				}
				this.viewTarget = config.target;
				//AT.Debug.printObj(config)
			
			}
			
		}
		
		/**
		 * call AT.ViewSwitch mask
		 * @param  [object, object]
		 */
		 this.maskView = function(Applet, c) {
			// no mask
			if ( c.mask === false ) {
				return null;	
			}
			
			// 如果沒有此applet，則預設為該應用程式之mask
			if ( ! Applet ) {
				var App = this.AC.get( c.app );
				if ( App ) {
					var dom = App.setting.mask;	
					this.maskId = AT.ViewSwitch.mask( dom );
				}
				return null;
			}
			
			var isPage = Applet[c.method]['isPage'];
			
			// 尋找mask並執行
			if ( isPage ) {
			
				var dom = Applet[c.method].mask;
				
				// extend mask
				if ( dom === undefined ) {
					
					dom = Applet.setting.mask;
					
					// find module mask
					if ( c.module && dom === undefined ) {
						dom = this.AC.get( Applet._appname_ ).setting.mask;	
					}
					
				}
						
				this.maskId = AT.ViewSwitch.mask( dom );
			}
			
			return null;
		 }
		 
		 /**
		 * call AT.ViewSwitch unMask
		 * @param  [object, object]
		 */
		 this.unMaskView = function() {
			
			if ( this.maskId ) {
				
				AT.ViewSwitch.unMask( this.maskId );
				this.maskId = false;
				
			}

		 }		
		
		/**
		 * Return the (App || Model) in execute
		 * @param  [string]
		 * @return [object]
		 */
		 this.getViewApplet = function( type ) {
			type = type || 'view';
			return ( this[ type + 'AppModule' ] )? 
				this.MC.get(this[ type + 'App' ], this[ type + 'AppModule' ]) : this.AC.get( this[ type + 'App' ] );
		 }
		 
		 /**
		 * Return the prev App || Model
		 * @return [object]
		 */
		this.getPrevApplet = function() {
			return this.getViewApplet('prev');
		}
		
		
	});

})();