(function(){
	
	ATModel.Agent = ATFn.extend(ATModel.AppletEventModel, function(ATConfig, P_AC, RLoader) {
		
		var This = this;
		
		// agent controller
		this.AC = new ATModel.AgentColl( P_AC );

		// record view agent and method name
		this.agentName = null;
		this.agentMethodName = null;
		
		
		
		
		/*
		* Return ture if agent is active;
		* @return [boolean]
		*/
		this.isAgentActive = function() {
			return this.agentName !== null;
		}
		
		/*
		* 取得正在運作的Agent Applet
		* @return [object]
		*/
		this.getApplet = function( agent ) {
			return this.AC.get ( agent || this.agentName );	
		}
		
		/*
		* Exec Agent through
		* @params [object]
		* @return [object]
		*/
		this.thru = function( config ) {
			
			// use the config copied
			var c = AT.Fn.clone( config );
			
			var app = c.app;
			var agent = c.agent || c.module;
			var target = c.target;
			var method = c.method;
			var params = c.params;
			var beforeFn = c.beforeFn;
			var __includeJs__ = false;
			
			// check agent ----------------------------------------------------------
			
			if( ! this.AC.isSet( agent ) ) {
				__includeJs__ = true;
			}
			
			// start thru -----------------------------------------------------------
			
			var Applet = this.AC.get( agent );
			
			if( target === true ) {
				target = AT.getViewTarget();
			}
			
			// set http post params ----------------------------------------------
	
			params = AT.Fn.GETStringToObj( params ) || {};
			
			c.params = params;
			
			var p = null;
			
			// 如果參數是非GET格式字串
			if( AT.Fn.isString( params ) ) {
				p = {};
				p['param'] = params;
			}
			else {
				p = AT.Fn.clone( params );
			}
			
			p.agent = agent;
				
			if( target ) {
				p.AT_target = target;	
			}
			
			// set include post data -----------------------------------------------
			
			if( __includeJs__ ) {
				p.AT_rRequest = JSON.stringify( ( agent )? 
						['Agent', {app: app, agent: agent}] : ['Agent', {app: app}] );
			}
			else {
				
				// exec beforeFn ( if beforeFn return false, then end the through )
				if( beforeFn && beforeFn() === false) {
					return null;
				}	
				
				// fire method beforeAjax event
				if( this.fireMethodEvent(Applet, method, 'beforeAjax', c, params) ) return this.interruptThru(c);
			}
			
			var agent_l = agent.toLowerCase();
			
			var server = 'agent';
			
			var viewAppName =  AT.getViewAppName();
			
			var includeAppletFn = function( data ) {
				// judge the Applet is exist
				if( __includeJs__ ) {
					rResponse = data.AT_rResponse;
					if ( rResponse ) {
						// eval js , Collection will auto add app/module;
						RLoader.eval( rResponse );
						// get the Applet
						//Applet = ( agent )? This.AC.get(app, agent) : This.AC.get(agent);
						Applet = This.AC.get(agent);
						
						// compensate for fire method beforeAjax event
						if( This.fireMethodEvent(Applet, method, 'beforeAjax', c, params) ) return This.interruptThru(c);
					}
					else {
						var errorFn = function() {
							AT.SEP.show('agent', ' Include '+ (app? app + '.' + agent : agent) +' JS Error');
						}
						
						if ( ! viewAppName ) {
							this.loadApp(null, errorFn);
						}
						else {
							errorFn();	
						}
						return null;
					}
					delete data.AT_rResponse;
				}
			}
			
			
			//run ajax
			var Ajax = AT.ajax({
				__mode__: ['agent', server, agent_l],
				app: app,
				method: method,
				params: p,
				scope: this,
				success: function( data ) {
					
					includeAppletFn( data );
					
					// 執行agent與判斷頁面是否存在app
					if ( ! viewAppName ) {
						var appConfig = ( Applet )? Applet.setting.defaultApplet : null;
						this.loadApp(appConfig, function() {
							This.execAgentFn(Applet, c, data, params, agent);
						}, c, data);
					}
					else {
						this.execAgentFn(Applet, c, data, params, agent);
					}
					
				},
				dataErrorFn: function( data ) {
					includeAppletFn( data );
					var appConfig = ( Applet )? Applet.setting.defaultApplet : null;
					this.loadApp(appConfig, null, c, data);
				}
			});
			
			return Ajax;
		}
		
		/*
		* 當任何應用程式尚未載入時，載入預設的應用程式介面
		* @params [object, function, object, object]
		*/
		this.loadApp = function(appConfig, execAgentFn, c, data) {
			if ( appConfig ) {
				var ac = appConfig;
				if ( AT.Fn.isFunction( ac ) ) {
					ac = appConfig(c, data);	
				}
				ac.__Agent__ = execAgentFn;
				AT.thru( ac );
			}
			else {
				AT.Url.href(AT.getIndexUrl(), {__Agent__: execAgentFn});
			}
		}
		
		/*
		* exec agent applet
		* @params [object, object, object, object]
		*/
		this.execAgentFn = function(Applet, c, data, params, agent) {	
		
			var method = c.method;
			var callback = c.callback;
			var variables = c.variables;
			var finallyFn = c.finallyFn;
			var timeout = c.timeout || 0;
			
			if( ! Applet ) {
				AT.SEP.show('agent', 'can\'t find the Agent ['+ agent +']');
				return null;
			}
			
			if ( this.agentName !== agent ) {
				this.destroyActiveAgent();
			}
			
			
			// fire method afterAjax event
			if( this.fireMethodEvent(Applet, method, 'afterAjax', c, params) ) return this.interruptThru(c);
			
			var method_args = [data, params];
			//如果有自定method參數
			if( variables ) {
				method_args = method_args.concat( variables );	
			}
			
			// exec method 
			setTimeout(function() {
				
				// fire method beforeShow event
				if( This.fireMethodEvent(Applet, method, 'beforeShow', c, params) ) return This.interruptThru(c);
				
				Applet[method].apply(Applet, method_args);
				
				This.record(agent, method);
				
				//run callback
				if( callback  ) {
					callback();
				}
				
				// fire method aftershowShow event
				This.fireMethodEvent(Applet, method, 'show', c, params);
				
				// set browser url
				AT.Url.setUrl(c.app, ( c.target || null ),  agent, method, params);
				
				// fire method end event
				This.fireMethodEvent(Applet, method, 'end', c, params);
				
				if( finallyFn  ) {
					finallyFn();
				}
				
				
			}, timeout);
		}
		
		
		/*
		* record view agent and method name
		*/
		this.record = function(agent, method) {
			this.agentName = agent;
			this.agentMethodName = method;
		}
		
		
		/*
		* destroy the activing agent
		*/
		this.destroyActiveAgent = function() {
			var ActiveAgent = this.AC.get ( this.agentName );
			// destroy ActiveAgent
			if ( ActiveAgent ) {
				AT.Destroyer.destroy(ActiveAgent, ActiveAgent.setting.destroy);
				this.agentName = null;
			}	
		}
		
		
		
		
	})
	
	
		  
})();