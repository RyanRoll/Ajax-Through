(function(){
	
	/**
	 * Components Destroyer
	 * 
	 *
	 */	
	ATModel.Destroyer = function() {
		
		// 執行銷毀應用程式&模組的元件
		this.destroy = function(Scope, d) {
			if ( d ) {
				//銷毀資料為array複數型態
				if ( AT.Fn.isArray( d ) ) {
					
					for(var i = 0; i < d.length; i++) {
						this.destroyIfIsSetting( d[i] );
					}
					
				}
				// 銷毀資料為物件集合
				else if ( AT.Fn.isObject( d ) ) {
					if ( AT.Fn.isArray( d.Comps ) ) {
						this.execFn( d );
						for(var i = 0, len = d.Comps.length; i < len; i++) {
							this.execDestroy( d.Comps[i] );
						}
					}
					else {
						this.destroyIfIsSetting( d );
					}
				}
				//銷毀資料為function
				else {
					d.apply( Scope );	
				}
			}
		}
		
		
		this.destroyIfIsSetting = function( c ) {
			this.execFn( c );
			this.execDestroy( c.Comps );			
		}
		
		this.execFn = function( c ) {
			if ( c.fn ) {	
				if ( c.scope ) {
					c.fn.apply( c.scope );		
				}
				else {
					c.fn();	
				}
			}	
		}
		
		this.execDestroy = function( comps ) {
			if ( AT.Fn.isObject( comps ) ) {
				this.doDestroy(comps);
			}
			else if ( AT.Fn.isArray( comps ) ) {
				
				for(var i = 0; i < comps.length; i++) {
					this.doDestroy( comps[i] );
				}
				
			}
		}
		
		//recursive do destroy componments
		this.doDestroy = function( comp ) {
			for(var obj in comp) {
				if ( comp[obj] ) {

					if ( AT.Fn.isjQuery( comp[obj] ) ) {
						comp[obj].remove();
					}
					else if ( 'destroy' in comp[obj] ){
						
						//if ext component or function
						if ( AT.Fn.isFunction( comp[obj].destroy ) ) {
							comp[obj].destroy();	
						}
						else {
							var dt = comp[obj].destroy;
							this.destroyIfIsSetting( dt );
							
						}
					}
					comp[obj] = null;
				}
			}
		}
		
	}
	
	
})();