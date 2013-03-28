/**
 * AT Components - Login Notifier
 * 
 */
 
 
 
ATModel.LoginNotifier = function() {
	
	var _isLogin = false;
	
	var _userData = null;
	
	var _webData = null;
	
	// offer
	this.isLogin = function() {
		return _isLogin;
	}
	// offer
	this.getLoginData = function() {
		return _userData;
	}
	// offer
	this.getUserName = function() {
		return _webData.user;
	}
	// offer
	this.getUserId = function() {
		return _webData.user_id;
	}
	
	
	/** private ========================================================================================== **/
	
	
	this.init = function( ATINITDATA ) {
		_isLogin = ( !! ATINITDATA.user ) || false;
		
		_webData = ATINITDATA;
	}
	
	this.login = function( c ) {
		_isLogin = c.login;
		
		if ( c.data && _isLogin ) {
			_userData = c.data || null;
			_webData.user = c.data.user || null;
			_webData.user_id = c.data.user_id || null;
		}
		else {
			_userData = null;
			_webData.user = null;
			_webData.user_id = null;
		}
	}
	
}