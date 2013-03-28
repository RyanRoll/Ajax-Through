(function(){
	
	ATModel.Action = ATFn.extend(ATModel.AppletEventModel, function(Protocol, Agent, RLoader, ActionClass) {
		
		var This = this;
		
		// agent applet collection
		this.ActionC = new ATModel.ActionColl(Protocol.AC, Protocol.MC, ActionClass);
			
		/**
		 * bind Action attribute event
		 */
		$('*[AT-Action]').live('click', function( e ) {
			e.preventDefault();
			var $Obj = $(this);
			var code = $Obj.attr('AT-Action');
			This.thru($Obj, code);
			return false;
		});
		
		
		/**
		 * split the action attr
		 * @param  [string]
		 * @return  [object]
		 * @except  show SEP
		 */
		 this.splitCode = function( code ) {
			 
			 var c = code.match(/^(\w+)\.(\w+)(\([^\)]*\))?$/);
			 //var c = code.match(/^(\w+)\.(\w+)(\(['"-\., \w\u2E80-\u9FFF]*\))?$/);
			 
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
			 
		 }
		 
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
		 }
		 
		
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
		}
		
		
		/**
		 * Thru - AJAX -> Sever -> Action
		 * @param  [$object, array]
		 * @return  [object]
		 */
		this.thru = function($Obj, code) {
			
			var c = code = this.splitCode( code );
			var name = c.name;
			var method = c.method;
			var args = c.args;		
			var app = AT.getViewAppName();
			var module = AT.getViewModuleName();
			
			var Applet = null;
			
			// if agent mode
			if ( Agent.isAgentActive() ) {
				app = 'agent';
				module = Agent.agentName;
				Applet = Agent.getApplet();
			}
			else {
				var uri = AT.Url.analyse();
				// 如果單純使用AT.Url.setUrl設定網址(系統不會鎖定與記錄網址的app、module)且欲使用action觸發
				// 再此特別判斷是否有此需求，目前theater有所應用
				if ( uri.app === 'agent' ) {
					app = 'agent';
					module = uri.module;
					Applet = Agent.getApplet( module );
				}
			}
			
			// action url
			var a_l = '';
			
			// if Action Applet is this App/Module Applet
			if ( name === 'this' ) {
				if ( ! Applet ) {
					Applet = Protocol.getViewApplet();
				}
				if ( module ) {
					a_l = module;	
				}
			}
			else {
				if ( module ) {
					Applet = this.ActionC.get(app, module, name);
					a_l = ( module + '/actions/' + name );
				}
				else {
					Applet = this.ActionC.get(app, name);
					a_l = ( 'actions/' + name );
				}	
			}
			
			
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
			
			p.AT_target = AT.getViewTarget();

			
			// start ajax -----------------------------------------------------------
			
			var Ajax = AT.ajax({
				__mode__: ['action', app, a_l.toLowerCase()],
				app: app,
				module: module,
				method: method,
				params: p,
				scope: this,
				success: function( data ) {			
					// fire method afterAjax event
					if( this.fireMethodEvent(Applet, method, 'afterAjax', c, params) ) return this.interruptThru(c);
					
					var method_args = [data, params, $Obj].concat( args );
					
					// fire method beforeShow event
					if( this.fireMethodEvent(Applet, method, 'beforeShow', c, params) ) return this.interruptThru(c);
					
					Applet[method].apply(Applet, method_args);
					
					// fire method aftershowShow event
					this.fireMethodEvent(Applet, method, 'show', c, params);
					
					// fire method end event
					this.fireMethodEvent(Applet, method, 'end', c, params);
					
				}		
			});
			
			return Ajax;
		}
		
		
		
	})
	
		  
})();