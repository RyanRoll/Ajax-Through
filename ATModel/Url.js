(function() {
	
	/**
	 * URL analyser
	 * 
	 */	
	ATModel.Url = function( ATConfig ) {
		
		// Url variables -----------------------------
		
		var browser_url = '';
		var uri = null;
		var app = null;
		var target = null;
		var module = null;
		var method = null;
		var params = null;
		// base url regular string
		var base_url_reg = getBaseUrlReg( ATConfig.CLIENTURL );
		
		// Url RegExps -------------------------------
		
		// URL regex
		var URLregex = new RegExp(base_url_reg, 'i');
		// URI regex
		var URIregex = new RegExp('(' + base_url_reg + ')' + '(' + ATConfig.URLSIGN + ')?' + '(.*)?', 'i');
		// Target regex
		var TargetRegex = new RegExp('^'+ ATConfig.TARGETSIGN +'{1,1}(.*)');
		
		
		// private functions ----------------------------------------------------------------------
		
		/**
		 * Get base_url regular string
		 * @param  [string]
		 * @return [string]
		 * @exception: return null
		 */
		function getBaseUrlReg( url ) {
			var out = url.match(/(^http:[\/]{2,})?(.+)/);
			try {
				if( out[2] ) {
					if( out[1] ) {
						if( ! /^http:[\/]{2,}$/.test(out[1]) ) {
							throw '';
						}
					}
					var reg = /[\/]+/ig;
					return '^http:[\/]{2,}' + out[2].replace(reg, '[\/]*');
				}
				// throw error
				else {
					throw '';
				}
			}
			catch (e) {
				AT.SEP.show('system', ' AT.Url - base_url Error ');
			}
			return null;
		}
		
		
		
		
		// public methods ----------------------------------------------------------------------
		
		/**
		 * Analyse url
		 * @param  [string]
		 * @return [mixed] {URI object} || 'base' || 'outer' || '#'
		 * @exception: return null
		 */
		this.analyse = function( url ) {
			// exec the url
			var m = URIregex.exec( url || location.href );

			if( m && m[1] ) {
				//   base    sign     uri
				if( m[1] && m[2] && m[3] ) {
					browser_url = m[1];
					return this.splitUri( m[3] );
				}
				else if( URLregex.test(url) || url == ATConfig.CLIENTURL + ATConfig.URLSIGN ) {
					return 'base';
				}
			}
			else if( ! URLregex.test(url) ) {
				return url == '#'? '#' : 'outer';
			}
			return null;
		}
		
		/**
		 * Split uri string
		 * @param  [string]
		 * @return [object]
		 * @exception: return null
		 */
		this.splitUri = function( uri ) {
			// split uri
			var u = uri.split(/\/+/g);
			var returns = {};
			var target_match = TargetRegex.exec( u[1] );
			var len = u.length;
			len  = ( u[ len - 1 ] )? len : --len;
			var index = 1;
			// if exist target
			if( ATConfig.TARGETTYPE && target_match != null ) {
				--len;
				++index;
				returns.target = target_match[1];
			}
			//try {
				
				returns.app = u[0];
				
				// 預先預測uri格式 ( 用於include js 模式 )
				returns = this.forecastUri(returns, u, index, len);
				
				switch( len ) {
					case 4:
						returns.module = u[index];
						returns.method = u[++index];
						returns.params = u[++index] || '';
						
						break;
					case 3:
						// has module
						if( AT.isSetModule(u[0], u[index]) ) {
							returns.module = u[index];
							// if last is module property
							if( AT.isModuleProperty(u[0], u[index], u[++index]) ) {
								returns.method = u[index];
							}
							// last is module params
							else if( this.isParams( u[index] ) ){
								returns.method = ATConfig.VIEWSNAME;
								returns.params = u[index];
							}
						}
						// it's A/[t]/P/p
						else if( AT.isAppProperty(u[0], u[index]) ) {
							returns.method = u[index];
							returns.params = u[++index];
						}
						
						break;
					case 2:
						// if last is module
						if( AT.isSetModule(u[0], u[index]) ) {
							returns.module = u[index];
							returns.method = ATConfig.VIEWSNAME;
						}
						// if last is app property
						else if( AT.isAppProperty(u[0], u[index]) ){
							returns.method = u[index];
						}
						// if last is params
						else if( this.isParams( u[index] ) ) {
							returns.method = ATConfig.VIEWSNAME;
							returns.params = u[index];
						}
						
						break;
					// only app
					case 1: 
						returns.method = ATConfig.VIEWSNAME;
						
						break;
					default:
						throw 'URL - URI analyse error';
				}
				return returns;
			//}
			//catch(e) {
			//	AT.SEP.show('system', e);
			//}
			
			return null;	
		}
		
		/**
		 * Forecast AT Uri format
		 * @param  [object, array, integer]
		 * @return [object]
		 */
		this.forecastUri = function(returns, uri, index, len) {
			// has module
			if( len >= 3 ) {
				if( this.isParams( uri[ index + 1 ] ) ) {
					returns.method = uri[index];
					returns.params = uri[++index];
				}
				else {
					returns.module = uri[index];
					returns.method = uri[++index];
					returns.params = uri[++index] || '';
				}
			}
			else {
				returns.method = uri[index];
				returns.params = uri[++index] || '';
			}
			
			return returns;
		}
		
		/**
		 * get ajax uri
		 * @return [string]
		 */
		 this.getAjaxUri = function(app, module, method) {

			if( module ) {
				app += '/' + module;
			}
			else {
				app += '/' + 'app/' + app;
			}
			
			return AT.getServerUrl() + app + '/' + method + '/';
		 }
		 
		 /**
		 * get ajax-thru urn
		 * @return [string]
		 */
		 this.getAjaxThruUrn = function(app, target, module, method, params) {
			params = params || '';
			if( AT.Fn.isObject( params ) ) {
				params = AT.Fn.objectToGETString(params);
			}
			var uri = AT.getUrlSign() + app;

			if( target !== null ) {
				
				if( ( target === undefined || target === true ) && ATConfig.TARGETTYPE ) {
					uri += '/~' + AT.getViewTarget();
				}
				else {
					uri += '/~' + target;
				}	
			}
			
			if( module ) {
				uri += '/' + module;
			}
			
			return uri + '/' + method + '/' + params;
		 }
		
		/**
		 * get ajax-thru urn by ajax-thru config
		 * @return [string]
		 */
		 this.getAjaxThruUrnByConfig = function( c ) {
			return this.getAjaxThruUrn(c.app, c.target, c.module, c.method, c.params); 
		 }
		 
		 /**
		 * get ajax-thru uri by ajax-thru config
		 * @return [string]
		 */
		 this.getAjaxThruUri = function( c ) {
			return AT.getClientUrl() + this.getAjaxThruUrn(c.app, c.target, c.module, c.method, c.params);
		 }
		
		
		var _setUrlTimeout = null;
		/**
		 * Only set browser url - window location.href
		 * @params [mixed] {string} || {app, target, module, method, params, [run]}
		 */
		this.setUrl = function(app, target, module, method, params, run) {
			if ( _setUrlTimeout ) {
				clearTimeout( _setUrlTimeout );
				_setUrlTimeout = null;
			}
			
			AT.BrowserMoniter.enableEvent = run;
			
			// param is url string
			if ( arguments.length == 1 ) {
				location.href = arguments[0];
			}
			else {
				location.href = browser_url + this.getAjaxThruUrn(app, target, module, method, params);
			}
			
			_setUrlTimeout = setTimeout(function() {
				AT.BrowserMoniter.enableEvent = true;
			}, 200);
			
			return location.href;
		}
		
		/**
		 * Set browser url ( window location.href ) by ajax-thru config
		 *
		 */
		 this.setUrlByConfig = function( c ) {
			return this.setUrl(c.app, c.target, c.module, c.method, c.params); 
		 }
		
		/**
		 * set browser url and fire AT-thru
		 * @params [mixed] app, target, module, method, params
		 */
		this.link = function(app, target, module, method, params) {
			location.href = browser_url + this.getAjaxThruUri(app, target, module, method, params);
		}
		
		/**
		 * Returns true if the param is GET params string format
		 * @param  [string]
		 * @return [boolean]
		 */
		this.isParams = function(string) {
			return /\=+/.test(string);
		}
		
		
		/**
		 * Href the url ( the same method is AT.thru )
		 * @param  [string, object, boolean]
		 * @return [mixed] string || null || object (xmlhttprequest)
		 */
		this.href = function(url, thruConfig, hrefConfig) {
			var data = this.analyse( url );
			var reLoadApp = false;
			var setUrl = false;
			var windowOpen = true;
			if( AT.Fn.isObject( hrefConfig ) ) {
				var reLoadApp = hrefConfig.reLoadApp || false;
				var setUrl = hrefConfig.setUrl;
				var windowOpen = ( hrefConfig.windowOpen === false )? false : true;
			}
			
			//AT.alert(data);
			switch( data ) {
				case 'base':
					if ( ATConfig.INDEX ) {
						window.location.href = ATConfig.INDEX;
					}
				break;
				
				case '#': break;
					
				case 'outer':
					if ( windowOpen ) {
						window.open( url );
					}
					else {
						window.location.href = url;	
					}
				break;
				
				case null:
					AT.SEP.show('Url.href - url error' );
				break;
				default:
					// fire hashchange event
					if ( setUrl ) {
						window.location.href = url;
					}
					// start thru
					else {
						data.locationhash = true;
						data = AT.Fn.override(data, thruConfig);
						data.onlink = true;
						data.noSetUrl = true;
						if ( hrefConfig ) {
							data.reLoadApp = reLoadApp;	
						}
						return AT.thru( data );	
					}
			}
			return data;
		}
		
		
		
		/**
		 * ReLoad the url
		 * @param  [string]
		 * @return [mixed] null || object (xmlhttprequest)
		 */
		this.reLoad = function(url, reLoadApp) {
			return this.href(url, {'reLoadApp': !! reLoadApp });
		}
		
		//設定選項項目的url(用於dockmenu、datamenu)
		this.getMenuItemTypeUrl = function(url, link_type_id, self) {
			var target = (self)? AT.getUser() : AT.getViewTarget();
		
			if( url ) {
				
				switch( link_type_id ) {
					case '1':
						url = AT.getClientUrl() + AT.getUrlSign() + url.replace(/~_target/i, '~' + target );	
					break;
					case '2':
						url = AT.getBaseUrl() + url.replace(/~_target/i, target);	
					break;
					default:
						return url;
					
				}
			}
			else {
				url = '#';
			}
			return url;
		}
		//取得處理過的location.href
		//(ex: whoop.ep.antslab.tw/community#user/~myluo/Msg/views/p=123 => whoop.ep.antslab.tw/community/#user/~myluo/Msg/views/)
		 this.getLocationHref = function() {
			var data = this.analyse(location.href);
			
			try {
				
				var url = AT.getClientUrl() + AT.getUrlSign() + '/' + data.app;
				
				if( data.target ) {
					url += '/~' + data.target;	
				}
				if( data.module ) {
					url += '/' + data.module;
				}
				
				return url + '/' + data.method + '/';
			}
			catch (e) {
				return location.href;
			}	
		}
		
		/*  private functinos  */
	};


})();