(function(){
	
	/**
	 * Ajax handler
	 * 
	 * 執行傳送、管理以及記錄
	 *
	 */	
	ATModel.Ajax = function(ATConfig, LoginNotifier) {
		
		var This = this;
		
		this._AjaxRecords = {};

		
		/**
		 * exec ajax ( use jquery $.ajax )
		 * @param  [mixed] object || arguments
		 * @return [object] XMLHttpRequest
		 */
		this.ajax = function(app, module, method, params, successFn, scope, type, finallyFn, abort, serverUrl, beforeFn, callback, dataErrorFn) {
			
			// set variables
			if( arguments.length == 1 ) {
				
				var c = arguments[0];
				__mode__ = c.__mode__;
				app = c.app || c.module;
				module = c.module || c.applet || c.controller;
				method = c.method || c.action;
				params = c.params;
				successFn = c.successFn || c.success;
				serverUrl = c.serverUrl;
				beforeFn = c.beforeFn;
				callback = c.callback;
				type = c.type;
				finallyFn = c.finallyFn;
				abort =  ( c.abort === undefined );
				dataErrorFn = c.dataErrorFn;
				scope = c.scope;
			}
			
			serverUrl = serverUrl || ATConfig.SERVERURL;
			
			// combine the server url
			var url, a_l, m_l;
			
			if ( __mode__ ) {
				a_l = __mode__[1];
				m_l = __mode__[2];
			}
			else {
				a_l = app;
				if ( module ) {
					m_l = module.toLowerCase();
				}
			}
			
			if( m_l ) {
				a_l += '/' + m_l;
			}
			else {
				a_l += '/' + 'app/' + a_l;
			}
			
			var url = serverUrl + (a_l? a_l + '/' : '' ) + method + '/';
			
			
			if( abort ) {
				this.delRecordByUrl(app, module, url);
			}
			
			
			if( beforeFn ) {
				beforeFn();	
			}
			
			// ths ajax end function
			var endFunction = function() {
				// delete ajax record
				This.delRecordByUrl(app, module, url, true);

				// run  finally function
				if ( finallyFn ) {
					finallyFn();	
				};
			}

			var Ajax = $.ajax({
				url: url,
				data: AT.Fn.objectToGETString(params) || '',
				type: type || 'POST',
				dataType: 'json',
				success: function(data, textStatus, XMLHttpRequest) {
					This.handleSuccess(data, successFn, callback, dataErrorFn, scope);
					endFunction();
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					This.handleError( XMLHttpRequest );
					endFunction();
				}
			});
			
			// recrod this ajax
			this.recordAjax(app, module, url, Ajax);
			
			return Ajax;
		};
		
		
		
		/**
		 * 處理AJAX success
		 * @param  [mixed, function, function, object, array]
		 */
		 this.handleSuccess = function(data, successFn, callback, errorFn, scope, args) {
			scope = scope || window;
			callback = callback || AT.getEmptyFn();
			if ( ! AT.Fn.isArray( args ) ) {
				args = [];	
			}
			
			if ( data.success === false && data.errorMsg ) {
				AT.SEP.show( data.errorMsg );
			}
			
			if ( AT.Fn.isObject( data.AT_Login ) ) {
				LoginNotifier.login( data.AT_Login );
			}
			if ( successFn ) {
				var fnArgs = [data].concat( args );
				//是否錯誤	
				if ( data.error ) {
					if ( AT.Fn.isFunction( errorFn ) ) {
						errorFn.apply(scope, fnArgs);
					}
					else {
						alert(data.error+'錯誤: ' + data.msg);
					}
				}
				else {
					// exec success function
					successFn.apply(scope, fnArgs);
					
					callback.apply(scope, args)
				}
				
			}
			else {
				//throw ' Exec success function Error';
				AT.SEP.show('ajax', ' no successFn ');
			}
		 };
		 
		 /**
		 * 處理AJAX error
		 * @param  [object]
		 */
		 this.handleError = function( Xhr ) {
			 // if is not aborted
			if( Xhr.status !== 0 ) {
				AT.SEP.show('ajax', ' ajax failure ');
			}
		 };
		
		
		// record the Applet's(include action、agent) ajax record
		this.recordAjax = function(app, module, url, Ajax) {
			if ( ! this._AjaxRecords[app] ) {
				this._AjaxRecords[app] = {a: {}, m: {}};
			}
			var a = this._AjaxRecords[app];
			var r = a.a;
			if ( module ) {
				if ( ! a.m[module] ) {
					a.m[module] = {};
				}
				r = a.m[module];
			}
			r[url] = Ajax;
		};
		
		// delete the App Applet's(include module action、agent) all ajax record
		this.delAppRecord = function( app ) {
			try {
				var A = this._AjaxRecords[app].a;
				for(var a in A) {
					A[a].abort();
					delete A[a];
				}
				var Ms = A.m;
				for(var M in Ms) {
					for(var a in M) {
						M[a].abort();
						delete M[a];	
					}
				}
			}
			catch(e) {alert(e);}
		};
		
		// delete the Module Applet's(include action) all ajax record
		this.delModuleRecord = function(app, module) {
			try {
				var M = this._AjaxRecords[app].m[module];
				for(var a in M) {
					M[a].abort();
					delete M[a];
				}
			}
			catch(e) {alert(e);}
		};
		
		/**
		 * delete ajax record by url
		 */
		this.delRecordByUrl = function(app, module, url, onlyDel) {
			try {
				var r;
				if ( module ) {
					r = this._AjaxRecords[app].m[module]
					A = this._AjaxRecords[app].m[module][url];	
				}
				else {
					r = this._AjaxRecords[app].a
					A = this._AjaxRecords[app].a[url];		
				}
				if ( ! onlyDel ) {
					r[url].abort();
				}
				delete r[url];
			}
			catch(e) {}
		}
		
	};

		  
})();