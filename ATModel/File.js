(function (){
	
	// reference ( using from UploadController.buildSendContent)
	var _Ajax = null;	

	/*
	 *	FileReader and AJAX Upload multiple file Componments;
	 *
	 */
	ATModel.File = function( Ajax ) {
		
		// private vars ----------------------------------------------------------------------
		
		var This = this;
		
		var _id = 0;
		
		var _is_support_drag = !! window.FileReader && ! $.browser.opera;
		
		// reference
		_Ajax = Ajax;
		
		
		// public methods ----------------------------------------------------------------------
		
		
		/**
		 * 取得FileCtrl
		 * @param  [[FileList Object]]
		 * @return [object]
		 */
		this.getFileController = function( FL ) {
			return new FileController( FL );
		}
		
		
		/**
		 * 將tag初始化成可從桌面托拽式的tag
		 * @param  []
		 * @return []
		 */
		this.initDragPanel = function(id, dragConfig, warningMsg) {
			
			dragConfig = dragConfig || {};
						
			var $Panel = AT.getjQueryDom( id );
			
			var Panel = $Panel[0];
			
			// if not support
			if ( ! _is_support_drag ) {
				$Panel.append( warningMsg || '<span>This browser doesnt support dragging from Desktop</span>' );
				return false;
			}
			
			var FileCtrl = this.getFileController();
			
			
			$.data(Panel, 'isDragPanel', true);
			$.data(Panel, 'bg', $Panel.css('background'));
			
			
			if ( dragConfig.bg ) {
				$Panel.css('background', 'url("/assets/scs/interface/main/images/filebox/drog_bg.png") no-repeat scroll center center #FFF');
			}
		
			dragConfig.ondrop = dragConfig.ondrop || AT.getEmptyFn();

			
			// default dragging events
			Panel.ondragenter = dragConfig.ondragenter || function( e ) {
				//Panel.style.border = '4px solid #b1ecb3';d
				//return false;
			};
			
			Panel.ondragover = dragConfig.ondragover || function( e ) {
				//return false;
			};
			
			Panel.ondragleave = dragConfig.ondragleave || function( e ) {
				//Panel.style.border = 'none';
				//return false;
			};
			
			Panel.ondrop = function( e ) {
				e.preventDefault();
				var FileList = FileCtrl.addFileList( e.dataTransfer.files );
				
				dragConfig.ondrop(e, FileList);			
				
				return false;
			};
			
			return FileCtrl;
			
		};
		
		
		/**
		 * 將drag tag 還原無drag事件
		 * @param  []
		 * @return []
		 */
		this.clearDragPanel = function( id ) {
			var $Panel = AT.getjQueryDom( id );
			var Panel = $Panel[0];
			Panel.ondragenter = null;
			Panel.ondragover = null;
			Panel.ondragleave = null;
			Panel.ondrop = null;
			$Panel.css('background', $.data(Panel, 'bg'));
			$Panel.removeData('isDragPanel').removeData('bg');
		};
		
		
		/**
		 * 讀取從桌面托拽至瀏覽器的檔案(個檔)
		 * @param  [object, object, array, string]
		 * @return [object]
		 */
		this.readFile = function(FileItem, fileReadConfig, args, action, _callback_) {
			fileReadConfig = fileReadConfig || {};
			action = action || 'readAsBinaryString';
			args = args || [];
			
			var Reader = new window.FileReader();
			
			fileReadConfig.onprogress = fileReadConfig.onprogress || AT.getEmptyFn();
			fileReadConfig.onload = fileReadConfig.onload || AT.getEmptyFn();
			fileReadConfig.onerror = fileReadConfig.onerror || AT.getEmptyFn();
			
			var eventArgs = [Reader, FileItem].concat( args );
			
			_setReaderEvent(fileReadConfig, Reader, 'onloadstart', eventArgs);
			_setReaderEvent(fileReadConfig, Reader, 'onload', eventArgs, _callback_);
			_setReaderEvent(fileReadConfig, Reader, 'onprogress', eventArgs);
			_setReaderEvent(fileReadConfig, Reader, 'onerror', eventArgs);
			
			Reader[action]( FileItem.File );
			
			return Reader;
		};
		
		
		/**
		 * 讀取從桌面托拽至瀏覽器的所有檔案
		 * @param  [object]
		 */
		this.readAllFiles = function( config ) {
			var args = config.args || [];
			var verifyFn = config.verifyFn || function() { return false; };
			var finishFn = config.finish || AT.getEmptyFn();
			var fileReadConfig = config.ReadFileEvent;
			var FileList = config.FileList;
			var check = {
				total: FileList.length,
				read: 0,
				dis: 0
			};
			var _callback_ = function() {
				if ( ++check.read + check.dis == check.total ) {
					finishFn( check.total - check.dis );
				}
			}
			
			for( var i = 0; i < FileList.length; i++ ) {
				var FileItem = FileList[i];
				var File = FileItem.File;
				var verifyResult = verifyFn(File, FileItem);
				
				// 忽略檔案
				if ( verifyResult === null ) {
					FileController.ignoreFile(FileItem.index, FileList._ref || FileList);
					++check.dis;
				}
				// 不讀取檔案
				else if ( verifyResult === false ) {
					_callback_();
				}
				// 讀取檔案
				else {
					this.readFile(FileItem, fileReadConfig, args, config.action, _callback_);
				}
			}
		};
		
		
		/**
		 * 
		 * @param  []
		 * @return []
		 */
		this.upload = function( c ) {
			var num = _getId();
			var frameId = 'AT-AjaxFileUploadIframe-' + num;
			var fomeId = 'AT-AjaxFileUploadForm-' + num;
			var $Iframe = _createIframe( frameId );
			var $Form = _createForm( fomeId );
			
			
			for(var i in c.params) {
				form.append('<input type="hidden" name="'+ i +'" value="'+ c.params[i] +'" />');	
			}
			
			var fileIds = c.fileIds;
			for(var i in c.fileIds) {
				form.append( AT.getjQueryDom( fileIds[i] ).clone() );	
			}
			
			var url = AT.Url.getAjaxUri(c.app, c.module, c.method);
			
			$Form.attr('action', url);
			$Form.attr('method', 'POST');
			$Form.attr('target', frameId);
		};
		
		
		
		/**
		 * 將drag from desktop的檔案上傳檔案至伺服器端(僅提供於chrome、FF)
		 * @param  [object, object]
		 * @except "show Ajax Error"
		 */
		this.uploadFiles = function(c, FileList) {
			return new UploadController(c, FileList);
		};
		
		
		/**
		 * 判斷瀏覽器是否支援drag from desktop
		 * @return [boolean]
		 */
		this.isSupportDrag = function() {
			return 	_is_support_drag;
		}
		
		
		// FileReader methods ----------------------------------------------------------------------
		
		function _setReaderEvent(fileReadConfig, Reader, eventName, eventArgs, _callback_) {
			if ( fileReadConfig[eventName] ) {
				Reader[eventName] = function( event ) {
					fileReadConfig[eventName].apply(Reader, [event].concat( eventArgs ));
					if ( _callback_ ) {
						_callback_();	
					}
				};
			}
		}
			
	}
	
	
	/*
	*	File List Controller ====================================================================================
	*
	*/
	
	var FileController = function( OriginalFileList ) {
		
		// public objects & vars  ================================================
		
		
		this.FileList = FileController.getEmptyFileList();
		
		this._nextUploadPoint = 0;
		
		
		// public methods  =======================================================
		
		
		/**
		 * 附加FileList至this.FileList
		 * @param  [object] ATFileList or Original FileList
		 * @return [object] ATFileList
		 */
		this.addFileList = function( FL ) {
			
			var Part = FileController.getEmptyFileList();
			
			for(var i = 0; i < FL.length; i++) {
				var File = FL[i];
				this.addFile(File, this.FileList);
				Part[Part._currentId++] = this.FileList[this.FileList.length - 1];
				++Part.length;
			}
			
			// 設定本體參考
			Part._ref = this.FileList;
			
			return Part;
		};
		
		/**
		 * 附加File至this.FileList
		 * @param  [object, [object]] File, ATFileList
		 */
		this.addFile = function(File, FL) {
			FL = FL || this.FileList;
			FL[FL._currentId] = {
				File: File,
				index: FL._currentId,
				isUploaded: false,
				isIgnore: false,
				Vars: {}
			};
			++FL._currentId;
			++FL.length;
		};
		
		/**
		 * 將FileList裡的File標記ignore (以此代替刪除，較不影響開發人員的程設)
		 * @param  [int, object] ATFileList
		 */
		this.ignoreFile = function(index, FL) {
			FL = FL || this.FileList;
			return FileController.ignoreFile(index, FL);
		};
		
		/**
		 * 取得this.FileList裡準備上傳的檔案數量( no isUploaded and isIgnore)
		 * @return [number]
		 */
		this.getReadyToUploadAmount = function() {
			return this.FileList.length - ( this.FileList.ignoreNum - this.FileList._iau ) - this.FileList.uploadedNum;
		};
		
		
		/*
		this.removeFile = function(index, FL) {
			FL = FL || this.FileList;
			
			if ( FL[index] && AT.Fn.isNumber( index ) ) {
				if ( FL[index].isUploaded ) {
					--FL.uploadedNum;
				}
				--FL.length;
				delete FL[index];
			}
		};
		*/
		
		/**
		 * 將FileList裡的File標記ignore (以此代替刪除，較不影響開發人員的程設)
		 * @param  [int, object] ATFileList
		 */
		this.destroy = function() {
			this.Upload = null;
			this.FileList = null;
		};
		
		
		// constrcutor run  =======================================
		
		if ( typeof OriginalFileList === 'object' && Object.prototype.toString.call( OriginalFileList ) === '[object FileList]' ) {
			this.addFileList( OriginalFileList );
		}
		
		this.init();
		
	};
	
	// private method ==============================================================================
	
	FileController.getEmptyFileList = function() {
		return {
			length: 0,
			uploadedNum: 0,
			ignoreNum: 0,
			_currentId: 0,
			// ignore and delete num
			_iau: 0,
		};
	}
	
	FileController.ignoreFile = function(index, FL) {
		var FileItem = FL[index];
		if ( FileItem && AT.Fn.isNumber( index ) ) {
			FileItem.isIgnore = true;
			if ( FileItem.isUploaded ) {
				++FL._iau;
			}
			++FL.ignoreNum;
		}
		return FileItem;
	};
	
	
	//   prototype   ==============================================================================
	
	FileController.prototype.init = function() {
		this.Upload = new UploadController( this );
	}
	
	
	/*
	*	File Upload Controller ====================================================================================
	*
	*/
	var UploadController = function( FileCtrl ) {
		
		var This = this;
		
		this.Xhr = null;
		
		this.FileCtrl = FileCtrl;
		
		this.Files = FileCtrl.FileList;
		
		this._doBatch = function() {	
			var nextUploadIndex = FileCtrl._nextUploadPoint;
			var point = 0 + nextUploadIndex;
			var filesCount = this.Files.length;
			
			for (var i = 0; point < filesCount; i++) {
				var index = point;
				var FileItem = this.Files[index];
				
				++point;	
				
				if ( ! FileItem.isIgnore && ! FileItem.isUploaded ) {
					this.transportQueue.push( FileItem );
				}
				
			}
			
			FileCtrl._nextUploadPoint = point;
			
			UploadController.transport.call( this );
			
		};
		
	};

	
	// extend setting
	UploadController.prototype = {
		
		set: function( c ) {
			this.config = c;
			this.url = UploadController.beforeUploadFileSetting( c );	
			this.transportQueue = [];
			this.transportNum = 0;
		},
		
		setParams: function( p ) {
			this.config.params = p;
		},
		
		getParams: function() {
			return this.config.params;
		},
		
		start: function( FileList ) {			
			if ( FileList ) {
				this.Files = FileList;
			}
			
			this._doBatch();
		},
		
		stop: function() {
			if ( this.Xhr ) {
				this.Xhr.abort();
				this.config.abort(this.uploadId, this.FileItem);
				this.Xhr = null;
			}
			this.config.stop( this.FileItem );
			this.uploadId = null;
			this.FileItem = null;
		},
		
		destroy: function() {
			
		}
		
	}
	
	
	
	// UploadController 共同私有變數 ===========================================================================
	
	UploadController.transport = function() {
		var FileItem = this.transportQueue[this.transportNum];
		if ( FileItem ) {
			UploadController.ajaxSendFileQueue.call(this, FileItem);
		}
		else {
			this.transportQueue = [];
			this.transportNum = 0;
			this.config.complete.call( this.config.scope );	
		}
	};
	 
	 
	 UploadController.appendFileList = function(NewFileList, FileList) {
	 	for(var i = 0; i < FileList.length; i++) {
			var File = FileList[i];
			if ( ! File.ignore && ! File.isUploaded ) {
				NewFileList.push( File );
			}
		}
		return NewFileList;
	 }
	 
	 
	 /**
	 * 執行uploadFile的前置作業
	 * @param  [object]
	 * @return [string]
	 */
	 UploadController.beforeUploadFileSetting = function( c ) {
		var url = AT.Url.getAjaxUri(c.app, c.module, c.method);	
		c.scope = c.scope || window;
		c.transportDelay = ( c.transportDelay > 10 )? c.transportDelay : 10;
		c.fileInputName = c.fileInputName || 'file[]';
		// events
		c.start = c.start || AT.getEmptyFn();
		c.progress = c.progress || AT.getEmptyFn();
		c.success = c.success || AT.getEmptyFn();
		c.error = c.error || AT.getEmptyFn();
		c.stop = c.stop || AT.getEmptyFn();
		c.abort = c.abort || AT.getEmptyFn();
		c.complete = c.complete || AT.getEmptyFn();
		
		return url;
	 };
	
		
	
	UploadController.ajaxSendFileQueue = function( FileItem ){
		
		var This = this;
		var uploadId = new Date().getTime();
		var c = this.config;
		var url = this.url + uploadId;
		var File = FileItem.File;
		
		this.uploadId = uploadId;
		this.FileItem = FileItem;
		
		
		// XMLHttpRequest 2 only support Firefox 、 Safari And Chrome
		var Xhr = new XMLHttpRequest();
		this.Xhr = Xhr;
		
		
		Xhr.upload.addEventListener("progress", function (e) {
        	var value = 0;
			if ( e.lengthComputable ) {
			  value = Math.floor( (e.loaded / e.total) * 100 );
			}
			c.progress(e, FileItem, value);
        }, false);
		
		
        Xhr.addEventListener("load", function ( e ) {
           if ( Xhr.responseText ) {
				try {
					eval( 'var data = ' + Xhr.responseText );
				}
				catch ( e ) {
					AT.SEP.show('ajax', ' ajax failure ');
					return false;
				}
				
				// add uploaded length
				++This.Files.uploadedNum;
				This.Xhr = null;
				FileItem.isUploaded = true;
				
				var transportCallback = function(){
					setTimeout(function() {
						++This.transportNum;
						UploadController.transport.call( This );
					}, c.transportDelay);
				}
				
				// exec success function
				_Ajax.handleSuccess(data, c.success, transportCallback, function() {
					if ( c.error(data, FileItem) === false ) {
						c.stop( FileItem );
						return false;
					}
					transportCallback();
				}, c.scope, [FileItem]);
			}
			else {
				AT.SEP.show('ajax-uploadFile', ' ajax failure ');
				c.stop( FileItem );
			}
			
        }, false);
		
		
		Xhr.addEventListener("abort", function (e) {
			console.log( 'upload abort - ' + e );
		}, false);
		
		
        Xhr.addEventListener("error", function (e) {
			console.log( e );
			_Ajax.handleError( Xhr );
		}, false);
		
       	Xhr.open("POST", url);
		
        Xhr.setRequestHeader("Cache-Control", "no-cache");
        Xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		Xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		//Xhr.setRequestHeader('Content-type', 'multipart/form-data;');
        Xhr.setRequestHeader("X-File-Name", File.fileName);
		
		c.start( FileItem );
		
        Xhr.send( File );
		
	};
	

})();


