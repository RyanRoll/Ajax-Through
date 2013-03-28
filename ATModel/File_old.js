(function (){
	
	// reference ( using from UploadController.buildSendContent)
	var _Ajax = null;
	
	window.BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder;
	window.URL = window.URL || window.webkitURL;
	

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
		
		
		// constructor run ----------------------------------------------------------------------
		
		// 目前針對chrome瀏覽器擴充sendAsBinary
		if ( $.browser.webkit ) {
			// 一定要轉成二進制，否則圖片編碼錯誤
			XMLHttpRequest.prototype.sendAsBinary = function( datastr ) {
				var ui8a = new Uint8Array( datastr.length );
				for (var i = 0; i < datastr.length; i++) {
					ui8a[i] = ( datastr.charCodeAt(i) & 0xff );
				}
				this.send( ui8a.buffer );
			};
			
			//XMLHttpRequest.prototype.sendAsBinary = XMLHttpRequest.prototype.send;
		}
		
		
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
				return false;
			};
			
			Panel.ondragover = dragConfig.ondragover || function( e ) {
				return false;
			};
			
			Panel.ondragleave = dragConfig.ondragleave || function( e ) {
				//Panel.style.border = 'none';
				return false;
			};
			
			Panel.ondrop = function( e ) {
				e.preventDefault();
				
				//Panel.style.border = '4px solid transparent';
				//displayFile(event.dataTransfer.files[0]);
				
				//var f = e.dataTransfer.files[0];
				//AT.Debug.printAttr( e.dataTransfer.getData );
				//alert(e.dataTransfer.clearData)
				
				var FileList = FileCtrl.addFileList( e.dataTransfer.files );
				
				dragConfig.ondrop(e, FileList);
				
				//AT.Debug.printAttr(f);
				
				//Reader.readAsBinaryString( files );
				
				//AT.Debug.printAttr(This.FileReader);				
				
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
		 * 【for chrome】將drag from desktop的檔案上傳檔案至伺服器端(僅提供於chrome、FF)
		 * @param  [object, (object|array)]
		 * @return [object]
		 */
		this.uploadFiles_Chrome = function(c, FileList) {
			return new UploadController_Chrome(c, FileList);
		};
		
		/**
		 * 【for firefox】將drag from desktop的檔案上傳檔案至伺服器端(僅提供於chrome、FF)
		 * @param  [object, object]
		 * @except "show Ajax Error"
		 */
		this.uploadFiles = ( $.browser.webkit )? this.uploadFiles_Chrome : function(c, FileList) {
			return new UploadController(c, FileList);
		};
		
		
		/**
		 * 判斷瀏覽器是否支援drag from desktop
		 * @return [boolean]
		 */
		this.isSupportDrag = function() {
			return 	_is_support_drag;
		}
		
		
		
		// private functions ----------------------------------------------------------------------
		
		/**
		 * 
		 * @param  []
		 * @return []
		 */
		function _createIframe( frameId ) {
            
			var $Iframe = $('<iframe id="' + frameId + '" name="' + frameId + '" src="' + url + '" style="display: none;position: absolute; left: -99999px;  top: -99999px;" />');
			
            if ( window.ActiveXObject ) {
				$Iframe.attr('src', 'javascript:false');
            }
			
            $('body').append( $Iframe );

            return $Iframe;
    	};
		
		/**
		 * 
		 * @param  []
		 * @return []
		 */
		function _createForm( formId ) {
			var $Form = $('<form action="" method="POST" name="' + formId + '" id="' + formId + '" enctype="multipart/form-data" style="display: none;position: absolute; left: -99999px;"></form>');	
			
			$('body').append( $Form );
			
			return $Form;
		};
		
		//
		function _getId() {
			return ++_id;
		};
		
		
		/**
		 * 將字串轉成二進制
		 * @param  [string]
		 * @return [binary]
		 */
		function _stringToBinary( str ) {return str;
			var i, j, d;
			var arr = [];
			var len = str.length;
			for (i = 0; i < len; i++){
				arr.push(str.charCodeAt( i ) & 0xff );
			}
			
			//arr.reverse().join("");
			return arr.join("");
			
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
		
		function _updateProgress( e ) {
			if ( e.lengthComputable ) {
				// evt.loaded and evt.total are ProgressEvent properties
				var loaded = ( e.loaded / e.total );
				
				if ( loaded < 1 ) {
				  // Increase the prog bar length
				  // style.width = (loaded * 200) + "px";
				}
			}
		};
		
		function _loaded( e ) {
			// Obtain the read file data
			var fileString = e.target.result;
			alert(fileString);
		};
		
		function _errorHandler(e ) {
			if( e.target.error.code == e.target.error.NOT_READABLE_ERR ) {
				
			}
		};
		
			
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
	
	if ( $.browser.webkit ) {
		FileController.prototype.init = function() {
			this.Upload = new UploadController_Chrome( this );
		}
	}
	else {
		FileController.prototype.init = function() {
			this.Upload = new UploadController( this );
		}	
	}
	
	
	/*
	*	File Upload Controller ====================================================================================
	*
	*/
	var UploadController = function( FileCtrl ) {
		
		var This = this;
		
		this.FileCtrl = FileCtrl;
		
		this.Files = FileCtrl.FileList;
		
		this._doBatch = function() {	
			var nextUploadIndex = FileCtrl._nextUploadPoint;
			var point = 0 + nextUploadIndex;
			var filesCount = this.Files.length;
			var splitNum = this.config.splitNum || 1;
			var uploads = this.FileCtrl.getReadyToUploadAmount();
			this.batchAmount = Math.ceil( uploads / splitNum );
			
			// 分批次
			for (var b = 0; b < this.batchAmount; b++) {
				var queue = [];
				for (var i = 0; i < splitNum && point < filesCount; i++) {
					var index = point;
					var FileItem = this.Files[index];
					if ( FileItem.isIgnore ) {
						--i;
					}					
					else if ( ! FileItem.isUploaded ) {
						queue.push( FileItem );
					}
					
					++point;
				}
				
				this.transportQueue.push( queue );
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
		},
		
		setParams: function( p ) {
			this.config.params = p;
		},
		
		getParams: function() {
			return this.config.params;
		},
		
		start: function( FileList ) {
			this.isStop = false;
			this.transportQueue = [];
			// 目前批次的運作數量
			this.transportNum = 0;
			
			if ( FileList ) {
				this.Files = FileList;
			}
			
			this._doBatch();
		},
		
		stop: function() {
			this.isStop = true;
		},
		
		destroy: function() {
			
		}
		
	}
	
	
	var UploadController_Chrome = ATFn.extend(UploadController, function( FileCtrl ) {
		
		var This = this;
		
		this.FileCtrl = FileCtrl;
		
		this.Files = FileCtrl.FileList;
		
		var _readAsBinaryEvent = {
			// FileReader.onload 為 執行緒運作
			onload: function(e, Reader, FileItem) {
				// 取得二進位內容
				FileItem._binaryContent_ = e.target.result;
				var f = FileItem._File_data;
				// 加入檔案於該批次
				f.queue.push( FileItem );
				// 判斷此批次佇列是否打包完成
				if ( f.queue.length == f.limit ) {
					// 打包完成，送至傳輸佇列
					This.transportQueue.push( f.queue );
					// 因執行緒運作必須每次判斷是否完成傳輸佇列
					if ( This.transportQueue.length == This.batchAmount ) {
						UploadController.transport.call( This );
					}
				}
				
				FileItem._File_data = null;
				delete FileItem._File_data;
			}
		};
		
		this._doBatch = function() {
			var nextUploadIndex = FileCtrl._nextUploadPoint;
			var point = 0 + nextUploadIndex;
			var filesCount = this.Files.length;
			var splitNum = this.config.splitNum || 1;
			var uploads = filesCount - ( this.Files.ignoreNum - this.Files._iau ) - this.Files.uploadedNum;
			this.batchAmount = Math.ceil( uploads / splitNum );
			
			// 分批次
			for (var b = 0; b < this.batchAmount; b++) {
				var part = filesCount - point;
				// 批次queue，因readFile是執行緒方式運作，所以用queue reference在file裡去解決問題
				var _File_data = {
					queue: [],
					limit: ( part < splitNum )? part : splitNum
				};
				// 此批各別readFile
				for (var i = 0; i < splitNum && point < filesCount; i++) {
					var index = point;
					var FileItem = this.Files[index];
					
					if ( FileItem.isIgnore ) {
						--i;
					}					
					else if ( ! FileItem.isUploaded ) {
						FileItem._File_data = _File_data;
						AT.File.readFile(FileItem, _readAsBinaryEvent);
					}
					
					++point;
				}
			}
			
			FileCtrl._nextUploadPoint = point;
			
		};
		
	});
	
	
	
	
	// UploadController 共同私有變數 ===========================================================================
	
	UploadController.transport = function() {
		var args = this.transportQueue[this.transportNum];
		if ( args ) {
			UploadController.ajaxSendFileQueue.call(this, args);
		}
		else {
			this.config.finish();	
		}
	};
	
	
	var _dashdash = '--';
	var _crlf     = '\r\n';
	
	
	/**
	 * 
	 * @param  []
	 * @return []
	 */
	UploadController.ajaxSendFileQueue = function( queue ) {
		
		if ( queue.length == 0 ) {
			console.log('no upload file queue');
			++this.transportNum;
			UploadController.transport.call( this );
			return false;
		}
		
		var This = this;
		var c = this.config;
		var url = this.url;
		
		var boundary = '------ATMultiPartFormBoundary' +  new Date().getTime();
		
		// Build RFC2388 string
		var stream = '';
	
		var Xhr = new XMLHttpRequest();
		
		// For each dropped file
		for (var i = 0; i < queue.length; i++) {
			
			var FileItem = queue[i];
			var File = FileItem.File;
			
			// Write boundary.
			stream += _dashdash + boundary + _crlf;			
	
			// Generate headers    
			stream += 'Content-Disposition: form-data; name="'+ c.fileInputName +'";';
			
			stream += ' filename="' + encodeURIComponent( File.fileName ) + '";';
			
			stream += _crlf;
	
			stream += 'Content-Type: ' + File.type + _crlf + _crlf; 
	
			// Append binary data
			stream += FileItem._binaryContent_ || File.getAsBinary();
			stream += _crlf;
		}
		
		// For each params
		for (var p in c.params) {
			
			// Write boundary.
			stream += _dashdash + boundary + _crlf;			
	
			// Generate headers    
			stream += 'Content-Disposition: form-data; name="'+ p +'";' + _crlf;
			
			stream += 'Content-Type: text/html' + _crlf + _crlf; 

			// Append binary data
			stream += encodeURIComponent( c.params[p] );
			stream += _crlf;
		}
		
		// Mark end of the request
		stream += _dashdash + boundary + _dashdash + _crlf;
		
		Xhr.open("POST", url, c.async);
		Xhr.setRequestHeader('Content-type', 'multipart/form-data; boundary='+ boundary);
		Xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		
		Xhr.onload = function( e ) { 

			if ( Xhr.responseText ) {
				try {
					eval( 'var data = ' + Xhr.responseText );
				}
				catch ( e ) {
					AT.SEP.show('ajax', ' ajax failure ');
					return false;
				}
				
				// add uploaded length
				This.Files.uploadedNum += queue.length;
				
				// loop queue and get the last FileItem
				var FileItem;
								
				// set isUploaded and exec fileUploadCallback
				for (var i = 0; i < queue.length; i++) {
					FileItem = queue[i];
					c.fileUploadCallback(data, FileItem);
					FileItem.isUploaded = true;
				}
				
				var transportCallback = function(){
					if ( ! This.isStop ) {
						setTimeout(function() {
							++This.transportNum;
							UploadController.transport.call( This );
						}, c.transportDelay);
					}
					else {
						This.FileCtrl._nextUploadPoint = FileItem.index + 1;
						c.stoped();
					}
				}
				
				// exec success function
				_Ajax.handleSuccess(data, c.success, transportCallback, function() {
					if ( c.error() !== false ) {
						This.stop();
					}
					transportCallback();
				}, c.scope, [queue]);
			}
			else {
				AT.SEP.show('ajax-uploadFile', ' ajax failure ');
				c.stoped();
			}
		};
		
		Xhr.onerror = function() {
			Ajax.handleError( Xhr );
		};
		
		Xhr.sendAsBinary( stream );
	}
	
	
	
	
	/**
	 * 掃描是否自定義忽略的檔案
	 * 因為FileList是readonly故無法delete File，僅用自定的ignore來判別欲移除的檔案，再模擬新的FileList
	 * 註：FileList的特性和array雷同，故用array模擬即可
	 * @param  [mixed] object:FileList | array:[File, File, ...] | array:[FileList, FileList, ...]
 	 * @return [array]
	 */
	UploadController.scanUploadFile = function( FileLists ) {
		var NewFileList = [];
		
		if ( AT.Fn.isArray( FileLists ) ) {
			for(var i = 0; i < FileLists.length; i++) {
				var FL = FileLists[i];
				if ( typeof FL === 'object' && Object.prototype.toString.call( FL ) === '[object FileList]' ) {
					NewFileList = UploadController.appendFileList(NewFileList, FL);
				}
				else {
					NewFileList.push( FL );	
				}
			}
		}
		// only one FileList
		else if ( AT.Fn.isObject( FileLists ) ) {
			NewFileList = UploadController.appendFileList(NewFileList, FileLists);
		}
		
		return NewFileList;
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
		c.async = ( c.async === false )? false : true;
		c.scope = c.scope || window;
		c.transportDelay = ( c.transportDelay > 100 )? c.transportDelay : 100;
		c.fileInputName = c.fileInputName || 'file[]';
		// 使用者自定method
		c.success = c.success || AT.getEmptyFn();
		c.error = c.error || AT.getEmptyFn();
		c.fileUploadCallback = c.fileUploadCallback || AT.getEmptyFn();
		c.stoped = c.stoped || AT.getEmptyFn();
		c.finish = c.finish || AT.getEmptyFn();
		
		return url;
	 };
	
	
	
/*

// XMLHttpRequest 2 only support Firefox And Chrome  
*/

	UploadController.ajaxSendFileQueue = function( queue ){

		if ( queue.length == 0 ) {
			console.log('no upload file queue');
			++this.transportNum;
			UploadController.transport.call( this );
			return false;
		}
		
		var This = this;
		var c = this.config;
		var url = this.url;
		
		var FileItem = queue[0];
		var File = FileItem.File;
		
		// XMLHttpRequest 2 only support Firefox And Chrome
		var Xhr = new XMLHttpRequest();
        var upload = Xhr.upload;
        upload.addEventListener("progress", function (e) {
        	
        }, false);
		
        upload.addEventListener("load", function (e) {
           if ( Xhr.responseText ) {
				try {
					eval( 'var data = ' + Xhr.responseText );
				}
				catch ( e ) {
					AT.SEP.show('ajax', ' ajax failure ');
					return false;
				}
				
				// add uploaded length
				This.Files.uploadedNum += queue.length;
				
				// loop queue and get the last FileItem
				var FileItem;
								
				// set isUploaded and exec fileUploadCallback
				for (var i = 0; i < queue.length; i++) {
					FileItem = queue[i];
					c.fileUploadCallback(data, FileItem);
					FileItem.isUploaded = true;
				}
				
				var transportCallback = function(){
					if ( ! This.isStop ) {
						setTimeout(function() {
							++This.transportNum;
							UploadController.transport.call( This );
						}, c.transportDelay);
					}
					else {
						This.FileCtrl._nextUploadPoint = FileItem.index + 1;
						c.stoped();
					}
				}
				
				// exec success function
				_Ajax.handleSuccess(data, c.success, transportCallback, function() {
					if ( c.error() !== false ) {
						This.stop();
					}
					transportCallback();
				}, c.scope, [queue]);
			}
			else {
				AT.SEP.show('ajax-uploadFile', ' ajax failure ');
				c.stoped();
			}
        }, false);
        upload.addEventListener("error", function (e) {
			console.log( e );
			Ajax.handleError( Xhr );
		}, false);
       	Xhr.open("POST", url, c.async);
        Xhr.setRequestHeader("Cache-Control", "no-cache");
        Xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		Xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		//Xhr.setRequestHeader('Content-type', 'multipart/form-data;');
        Xhr.setRequestHeader("X-File-Name", File.fileName);
        Xhr.send(File);
		
		return;
		
	};
	
	
	
	UploadController.ajaxSendFileQueue = function( queue ){

		if ( queue.length == 0 ) {
			console.log('no upload file queue');
			++this.transportNum;
			UploadController.transport.call( this );
			return false;
		}
		
		var This = this;
		var c = this.config;
		var url = this.url;
		
		var FileItem = queue[0];
		var File = FileItem.File;
		
		// XMLHttpRequest 2 only support Firefox And Chrome
		var Xhr = new XMLHttpRequest();
        var upload = Xhr.upload;
        upload.addEventListener("progress", function (e) {
        	
        }, false);
		
        upload.addEventListener("load", function (e) {
           if ( Xhr.responseText ) {
				try {
					eval( 'var data = ' + Xhr.responseText );
				}
				catch ( e ) {
					AT.SEP.show('ajax', ' ajax failure ');
					return false;
				}
				
				// add uploaded length
				This.Files.uploadedNum += queue.length;
				
				// loop queue and get the last FileItem
				var FileItem;
								
				// set isUploaded and exec fileUploadCallback
				for (var i = 0; i < queue.length; i++) {
					FileItem = queue[i];
					c.fileUploadCallback(data, FileItem);
					FileItem.isUploaded = true;
				}
				
				var transportCallback = function(){
					if ( ! This.isStop ) {
						setTimeout(function() {
							++This.transportNum;
							UploadController.transport.call( This );
						}, c.transportDelay);
					}
					else {
						This.FileCtrl._nextUploadPoint = FileItem.index + 1;
						c.stoped();
					}
				}
				
				// exec success function
				_Ajax.handleSuccess(data, c.success, transportCallback, function() {
					if ( c.error() !== false ) {
						This.stop();
					}
					transportCallback();
				}, c.scope, [queue]);
			}
			else {
				AT.SEP.show('ajax-uploadFile', ' ajax failure ');
				c.stoped();
			}
        }, false);
        upload.addEventListener("error", function (e) {
			console.log( e );
			Ajax.handleError( Xhr );
		}, false);
       	Xhr.open("POST", url, c.async);
        Xhr.setRequestHeader("Cache-Control", "no-cache");
        Xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		Xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		//Xhr.setRequestHeader('Content-type', 'multipart/form-data;');
        Xhr.setRequestHeader("X-File-Name", File.fileName);
        Xhr.send(File);
		
		return;
		
	};
	
	var bb = new BlobBuilder();
	bb.append(document.getElementById('AT-File-Worker').textContent);
	//bb.append("var x = new XMLHttpRequest();this.addEventListener('message', function(e) {this.postMessage(e.data);}, false);");
	
	var worker = new Worker(window.URL.createObjectURL(bb.getBlob()));
	
	
	worker.addEventListener('message', function(event) {
	  console.log("Worker said:" + event.data);
	}, false);
	
	var $Btn = $('<button> 23i3j42ln34l2n4l23n4ln324l23k </button>');
	
	$Btn.click(function(){
		worker.postMessage(123);						
	});

	
	
	
	
	
	
	
	
	
	
	
	


})();



$(function(){
		   
	  
	return;
		   
	/*
	
	WorkerGlobal（就是Worker的Javascript執行時的Global物件）
	* 方法
	1. postMessage()
	2. close()（目前Firefox及Chrome都沒有實作這個方法，但是在HTML5 Web Worker有定義）
	3. setTimeout()
	4. clearTimeout()
	5. setInterval()
	6. clearInterval()
	* 物件
	1. Worker （目前只有Firefox3.5實作）
	2. XMLHttpRequest
	* 事件
	1. onmessage
	*/
	
	window.BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder;
	window.URL = window.URL || window.webkitURL;
	var bb = new BlobBuilder();
	bb.append(document.getElementById('AT-File-Worker').textContent);
	//bb.append("var x = new XMLHttpRequest();this.addEventListener('message', function(e) {this.postMessage(e.data);}, false);");
	
	var worker = new Worker(window.URL.createObjectURL(bb.getBlob()));
	
	
	worker.addEventListener('message', function(event) {
	  console.log("Worker said:" + event.data);
	}, false);
	
	var $Btn = $('<button> 23i3j42ln34l2n4l23n4ln324l23k </button>');
	
	$Btn.click(function(){
		worker.postMessage(123);						
	});
	
	$(document.body).append($Btn);
		   
});


/*

// XMLHttpRequest 2 only support Firefox And Chrome  
*/

UploadController.GGGajaxSendFileQueue = function( queue ){
	
	var bb = new BlobBuilder();
	bb.append(document.getElementById('AT-File-Worker').textContent);
	//bb.append("var x = new XMLHttpRequest();this.addEventListener('message', function(e) {this.postMessage(e.data);}, false);");
	
	var worker = new Worker(window.URL.createObjectURL(bb.getBlob()));
	
					
	
	if ( queue.length == 0 ) {
		console.log('no upload file queue');
		++this.transportNum;
		UploadController.transport.call( this );
		return false;
	}
	
	var This = this;
	
	var FileItem = queue[0];
	var File = FileItem.File;
	
	
	
	worker.addEventListener('message', function( e ) {
		
		var event = e.data.event;
		
		
		
					
		//AT.Debug.printAttr(e.data.Xhr.upload);
		
		/*
		console.log(e.data.has)
		console.log(e.data.has2)
		console.log(e.data.has3)
		*/
		
		
		/*
		Xhr.onload = function (e) {
		   //self.postMessage('load');
		   console.log('finish');
		};
		
		Xhr.onerror = function (e) {
			//self.postMessage('error');
		};
		*/
		
		switch( event ) {
			case 'xhr':
				
			break;
			case 'progress':
				var value = e.data.value;
				console.log(value);
				
			break;
			case 'load':
				console.log(event);
			break;
			
			case 'error':
				console.log(event);
			break;
		}
		
	}, false);
	
	
	
	worker.postMessage({
		url: this.url,
		File: File
	});
	
	
	/*
	
	
	upload.addEventListener("load", function (e) {
	   if ( Xhr.responseText ) {
			try {
				eval( 'var data = ' + Xhr.responseText );
			}
			catch ( e ) {
				AT.SEP.show('ajax', ' ajax failure ');
				return false;
			}
			
			// add uploaded length
			This.Files.uploadedNum += queue.length;
			
			// loop queue and get the last FileItem
			var FileItem;
							
			// set isUploaded and exec fileUploadCallback
			for (var i = 0; i < queue.length; i++) {
				FileItem = queue[i];
				c.fileUploadCallback(data, FileItem);
				FileItem.isUploaded = true;
			}
			
			var transportCallback = function(){
				if ( ! This.isStop ) {
					setTimeout(function() {
						++This.transportNum;
						UploadController.transport.call( This );
					}, c.transportDelay);
				}
				else {
					This.FileCtrl._nextUploadPoint = FileItem.index + 1;
					c.stoped();
				}
			}
			
			// exec success function
			_Ajax.handleSuccess(data, c.success, transportCallback, function() {
				if ( c.error() !== false ) {
					This.stop();
				}
				transportCallback();
			}, c.scope, [queue]);
		}
		else {
			AT.SEP.show('ajax-uploadFile', ' ajax failure ');
			c.stoped();
		}
	}, false);
	upload.addEventListener("error", function (e) {
		console.log( e );
		Ajax.handleError( Xhr );
	}, false);
	*/
	
};



<script id="AT-File-Worker" type="javascript/worker">
	
	//importScripts('/assets/scs/AT/test1.js');
	
	
	self.addEventListener('message', function( e ) {
		
		var self = this;
		var data = e.data;
		var async = data.async;
		var url = data.url;
		var File = data.File;
		
		
		// XMLHttpRequest 2 only support Firefox And Chrome
		var Xhr = new XMLHttpRequest();
		
		/*
		self.postMessage({
			event: 'xhr',
			Xhr: Xhr,
			has: ( 'onprogress' in Xhr ? '1': '2'),
			//has2: ( 'onprogress' in Xhr.upload ? '1': '2'),
			has3: ( 'onload' in Xhr ? '1': '2')
		});
		*/
		
		
       	Xhr.open("POST", url);
        Xhr.setRequestHeader("Cache-Control", "no-cache");
        Xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		Xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		//Xhr.setRequestHeader('Content-type', 'multipart/form-data;');
        Xhr.setRequestHeader("X-File-Name", File.fileName);

		
		// 在WORK裡onprogress只會在onload完時執行.............why??????????
		Xhr.upload.onprogress = function (e) {
			var value = 0;
			if ( e.lengthComputable ) {
			  value = (e.loaded / e.total) * 100;
			}
			self.postMessage({
				event: 'progress',
				value: value
			});
		};
		
		
		Xhr.onload = function (e) {
			self.postMessage({event: 'load'});
		};
		
		Xhr.onerror = function (e) {
			self.postMessage({event: 'error'});
		};
		
        Xhr.send( File );
		
		
		
	}, false);

</script>



