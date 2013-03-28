/*
		AT Protocol、Agent、Action event listener methods  ==========================================================================================
	
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
		
		return undefined
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
	 
}



/*
	AT event exptnded register model  ==========================================================================================

*/


ATModel.extendedEventModel = function() {
	
	// event collections
	var Events = {
		
		switchApp: {},
		
		beforeAjax: {},
		
		afterAjax: {},
		
		beforeShow: {},
		
		show: {},
		
		end: {}
	
	};
	
	
	/* public methods */
	
	
	/**
	 * add event
	 * @param  [string, string, function]
	 * @except AT.SEP.show
	 */
	this.addEvent = function(eventName, name, fn, scope) {
		
		if ( ! eventName in Events ) {
			AT.SEP.show('EventModel - addEvent Error: no ' + eventName + ' event type');
			return;
		}
		
		if ( name in Events[eventName] ) {
			remove(eventName, name);
		}

		add(eventName, name, fn, scope);
		
	}
	
	/**
	 * remove event
	 * @param  [string, string]
	 * @except AT.SEP.show
	 */
	this.removeEvent = function(eventName, name) {
		
		if ( ! eventName in Events ) {
			AT.SEP.show('EventModel - removeEvent Error: no ' + eventName + ' event type');
			return;
		}
		
		if ( name in Events[eventName] ) {
			remove(eventName, name);
		}
		else {
			AT.SEP.show('EventModel - removeEvent Error: event: ' + name + ' don\'t exist');
		}
		
	}
	
	
	/**
	 * fire event
	 * @param  [string, object, object]
	 * @except return undefined
	 */
	this.fireEvent = function(en, c, p) {
		//try {

		var noInterrupt = undefined;
		
		var E = Events[en];
		
		if ( E ) {
			
			for (var i in E) {
				var scope = E[i][1] || AT;
				if ( E[i][0].call(scope, c, p) === false ) {
					noInterrupt = false;	
				}
			}
			
			return noInterrupt;
		}
			
		//}
		//catch (n) {
			// not do anything
		//}
		return undefined;
	}
	
	
	/* private methods */
	
	
	/**
	 * add event setting
	 * @param  [string, string, function]
	 */
	function add(eventName, n, fn, scope) {
		
		Events[eventName][n] = [fn, scope];
	}
	
	/**
	 * remove event setting
	 * @param  [string, string]
	 */
	function remove(eventName, n) {			
		Events[eventName][n] = null;
		delete Events[eventName][n];
	}
	
	
}