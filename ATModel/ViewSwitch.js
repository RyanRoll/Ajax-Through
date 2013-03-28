(function(){
	
	/**
	 * AT Components ViewSwitch
	 * 
	 */	
	ATModel.ViewSwitch = function() {
		
		var Collections = {};
		
		var $Dom = null;
		
		var startDelay = 0;
		
		var endDelay = 0;
		
		var _marginTop = 0;
		
		var opacity = 0.3;
		
		var _maskColor = '#fff';
		
		
		/** public methods ========================================================================================== **/
		
		/**
		 * mask document
		 * @param  [string, int, object]
		 */
		this.mask = function(id, timeout, style) {
			
			$Obj = $('#'+ id);
			
			if ( ! AT.Fn.isString( id ) || $Obj.size() == 0 ) {
				return false;	
			}
			
			if ( id in Collections ) {
				//this.unMask( id );
				return id;
			}
			
			timeout = timeout || 200;
			
			var offset = $Obj.offset();
			var l = offset.left;
			var t = offset.top;
			var h = $Obj.height();
			var w = $Obj.width();
			
			var $Mask = $('<div class="AT-mask" style="background: '+ _maskColor +';position: absolute; z-index: 1000"></div>');
			$Mask.css('opacity', opacity);
			$Mask.css({
				width: w,
				height: h,
				left: l,
				top: t
			});
			
			var $D = $Dom.clone();
			
			$('body').append( $Mask ).append( $D );		
			
			var $Window = $(window);
			
			var wWidth = $Window.height();
			
			var scrollTop = $Window.scrollTop();
			
			if ( h >= wWidth ) {
				h = wWidth;
			}
			
			var imgTop = t + _marginTop + scrollTop;
			
			if ( imgTop == t ) {
				imgTop += 50;
			}
			
			$D.css({
				left: l + w / 2 - $D.width() / 2,
				top: imgTop,
				position: 'absolute',
				'z-index': 1010
			});	
			
			Collections[ id ] = $D;
			
			return id;
			
		}
		
		
		/**
		 * unmask document
		 * @param  [string]
		 */
		this.unMask = ( Ext.isIE )? _unMaskForIE : _unMask;
		 
		
		/**
		 * set ViewSwitch config
		 * @param  [obj]
		 */
		this.set = function( c ) {
			$Dom = c.dom || $Dom;
			startDelay = AT.Fn.isNumber( c.startDelay )? c.startDelay : startDelay;
			endDelay = AT.Fn.isNumber( c.endDelay )? c.endDelay : endDelay;
			_marginTop = c.marginTop || _marginTop;
			opacity = c.opacity || opacity;
			_maskColor = c.maskColor || _maskColor;
		}
		
		
		/** private methods ========================================================================================== **/
		
		function _unMaskForIE( id ) {
			if ( id in Collections ) {	
				var delay = endDelay - 200;
				if ( delay < 0 ) {
					delay = 0;	
				}
				$('.AT-mask').empty().remove();
				var $D = Collections[id];
				setTimeout(function() {
					$D.remove();			
				}, delay);
				delete Collections[id];
			}
		}
		
		function _unMask( id ) {
			if ( id in Collections ) {	
				
				var $D = Collections[id];
				$D.fadeOut(endDelay, function(){
					$('.AT-mask').empty().remove();
					$D.remove();
				});
				delete Collections[id];
			}
			
		}
		
		
	}
	
	
})();