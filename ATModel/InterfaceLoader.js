(function(){
	
	/**
	 * AT Components InterfaceLoader
	 * 
	 */	
	ATModel.InterfaceLoader = function() {
		
		// record default document
		this.defaultDom = window;
		
		// record interface name
		this.appi = '';
		
		// call from AT.start
		this.init = function() {
			var ATinterface = document.createElement('AT-Interface');
			document.body.appendChild( ATinterface );
			//$(document.body).prepend('<div id="ATinterface" />');
		}
		
		
		/**
		 * switch interface, if interface == null then don't do anything
		 *
		 */
		this.switchInterface = function( i ) {
			if ( i && this.appi != i.name ) {
				if( i.html ) {
					$(document.body).removeClass(this.appi).addClass(i.name);
					this.appi = i.name;
					$('AT-Interface:first').html( i.html );
				}
				else {
					AT.SEP.show('system', ' AT.ViewSwitch - can\'t find i html ');
				}
			}
			
		}
		
		
		
		
		
		
		
	}
	
	
})();