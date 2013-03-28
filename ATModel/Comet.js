(function() {
	
	
	/*
	*	Comet - kepp AJAX Require Component
	*	
	*	mode:
	*
	*		AT
	*
	*		AJAX
	*
	*	Support type:
	*
	*		polling
	*
	*		comet (long polling)
	*
	*		websocket
	*/
	
	var CometClass = {};
		
	ATModel.Comet = function(mode, type, c) {
		
		return new CometClass[mode.toUpperCase() +'_'+ type.toLowerCase()]( c );
		
	}
			
	
	var CometPrototype = {
		
		params: null,
		
		_AjaxRequest: null,
		
		_enable: true,
		
		_initConfig: function( c ) {
			
			var This = this;
			this.params = c.params;
			var scope = c.scope || window;
			this._ajaxConfig = {
				url: c.url,
				type: c.type || 'POST',
				dataType: c.dataType || 'json',
				success: function(d, t, X) {
					This._success(scope, d, This.params, t, X);
				},
				error: function(X, t, e) {
					if ( AT.Fn.isFunction( c.error ) && X.status !== 0 ) {
						var r = c.error.apply(scope, [X, t, e]);	
						if ( r === false ) {
							This.destroy();
						}
						else {
							This.start();	
						}
					}
				}
			}
			
		},
		
		start: function() {		
			this._enable = true;
			this._ajaxConfig.data = this.params;			
			this._AjaxRequest = $.ajax( this._ajaxConfig );
		},
		
		stop: function() {
			this._enable = false;
			this._AjaxRequest.abort();
		},
		
		reStart: function( p ) {
			this.stop();
			if ( p ) {
				this.setParamData( p );	
			}			
			this.start();
		},
		
		getParamData: function() {
			return this.params;
		},
		
		setParamData: function( p ) {
			this.params = p;
		},
	
		destroy: function() {
			if ( this._AjaxRequest ) {
				this._AjaxRequest.abort();	
			}
			this._AjaxRequest = null;	
		}	
	}
	
	
	/*
	*	Ajax Comet
	*/
	CometClass.AJAX_comet = ATFn.extend(CometPrototype, function( c ) {

		this._initConfig( c );
		
		this._success = function(s, d, p, t, X) {
			if ( this._enable ) {
				c.success.apply(s, [d, p, t, X]);
				this.start();
			}
			return p;
		}
		
	});
	
	/*
	*	Ajax Polling
	*/
	CometClass.AJAX_polling = ATFn.extend(CometPrototype, function( c ) {

		var _interval = null;
		
		var This = this;
		
		this._initConfig( c );
		
		this._success = function(s, d, p, t, X) {
			if ( this._enable ) {
				c.success.apply(s, [d, p, t, X]);
			}
			return p;
		}
		
		this.start = function() {
			_interval = setInterval(function (){
				This.superclass.start.call( This );
			}, c.timeout);
		}
		
		this.stop = function() {
			this.superclass.stop.call( this );	
			clearInterval( _interval );
		}
		
	});
	
	
	
	CometClass.AT_comet = function( c ) {
		
		this._initConfig( c );
		
	}
	
	CometClass.AT_comet.prototype = {
		
		_enable: true,
		
		_c: {
			__AjaxComet__ : function() {
				if ( this._enable ) {
					this.start();
				}
			}
		},
		
		_AjaxRequest: null,
		
		_initConfig: function( c ) {
	
			this._c = AT.Fn.override(this._c, c);
			 
		},
		
		start: function() {
			this._enable = true;
			this._AjaxRequest = AT.thru( this._c );
		},
		
		stop: function() {
			this._enable = false;
			this.destroy();
		},
		
		reStart: function( p ) {
			this.stop();
			if ( p ) {
				this.setParamData( p );	
			}
			this.start();
		},
		
		getParamData: function() {
			return this._c.params;
		},
		
		setParamData: function( p ) {
			this._c.params = null;
			this._c.params = p;
		},
	
		destroy: function() {
			if ( this._AjaxRequest ) {
				this._AjaxRequest.abort();	
			}
			_AjaxRequest = null;
		}
		
	}

	/*
	var a = new CometClass.AJAX_comet({
		
		url: 'http://roll.ep.antslab.tw/scs/comet',
		
		paramData: {
			i: 0
		},
		
		success: function(data, params) {
			params.i += 1;
		}
	
	});
	
	a.start();
	a.stop();
	*/
	
		  
})()