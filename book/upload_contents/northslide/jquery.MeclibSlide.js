(function($) {
	var MeclibSlide = (function() {
		function MeclibSlide() {
			this._init.apply(this, arguments);
		}

		MeclibSlide.pluginName = 'MeclibSlide';
		MeclibSlide.options = {
			easing : 'easeOutSine',
			duration : 500,
			interval : 5000, // msec
			type : 1,
			index : 0,
			width : window.innerWidth ? window.innerWidth: $(window).width(),
			height : window.innerHeight ? window.innerHeight: $(window).height(),
		};
		/*
			type
				1:スライドのみ
				2:ページネーション
				3:上サムネイル
				4:下サムネイル
				5:左サムネイル
		*/

		MeclibSlide.defaults = [];
		MeclibSlide.images   = [];
		MeclibSlide.captions = [];

		MeclibSlide.canvas = {
			"width"  : 0,
			"height" : 0
		};

		MeclibSlide.deviceType = 1;
		MeclibSlide.touchDevice = false;
		MeclibSlide.window = {
			"width"  : 0,
			"height" : 0
		};

		MeclibSlide.boxPadding = {
			"top" : 25,
			"bottom" : 54,
			"pagenationHeight" : 32,
			"captionHeight"    : 22
		};

		MeclibSlide.page = {
			"total" : 0,
			"icon" : {
				"width"  : 26,
				"height" : 22
			}
		};

		//コンテンツ表示エリア
		MeclibSlide.stage = {
			"width"  : 22,
			"height" : 22
		};


		MeclibSlide.buttuns = {
			"left":"",
			"right":"",
			"size":
				{
					"width"  : 32,
					"height" : 32
				}
			};
		MeclibSlide.sidebar = {
			"left":"",
			"right":"",
			"size":
				{
					"width"  : 36,
					"height" : 0
				}
			};
		
		MeclibSlide.thumbs = {
			"size" : {
				"width" : 100,
				"height" : 100
			}
		}
			
		MeclibSlide.prototype = {
			constructor: MeclibSlide,

			_init: function($element) {
				$.extend($.fn, {
					transform: function(){
						var style = "";
						for(var i=0; i<arguments.length; i++){
							style += arguments[i] + "";
						}

						$(this).css(vendor+"transform", style);
						$(this).css("transform", style);
						return $(this);
					}
				});

				var vendor = (/webkit/i).test(navigator.appVersion) ? '-webkit-' : 
				             (/firefox/i).test(navigator.userAgent) ? '-moz-' : 
				             'opera' in window ? '-O-' : 
				             (/msie/i).test( navigator.userAgent ) ? '-ms-' : '';
				
				var translate =  function(x,y){
					if(typeof(x) == "number" && typeof(y) == "number"){
						if(vendor == "-ms-" && (/msie 9./i).test(navigator.appVersion)){
							return "translate("+x+"px,"+y+"px)";
						}else{
							return "translate3d("+x+"px,"+y+"px,0)";
						}
					}else{
						if(vendor == "-ms-" && (/msie 9./i).test(navigator.appVersion)){
							return "translate("+x+","+y+")";
						}else{
							return "translate3d("+x+","+y+",0)";
						}
					}
				};

				var startX = 0,
					moveX = 0,
					draged = false,
					animated = false,
					autoplay = null, 
					getRangeIndex = function(index){
						if(index < 0){
							return MeclibSlide.images.length-1;
						}else if(index > MeclibSlide.images.length-1){
							return 0;
						}else{
							return index;
						}
					},
					next = function(){
						MeclibSlide.options.index = getRangeIndex(MeclibSlide.options.index+1);
					},
					prev = function(){
						MeclibSlide.options.index = getRangeIndex(MeclibSlide.options.index-1);
					},
					getNext = function(){
						return getRangeIndex(MeclibSlide.options.index+1);
					},
					getIndex = function(){
						return getRangeIndex(MeclibSlide.options.index);
					},
					getPrev = function(){
						return getRangeIndex(MeclibSlide.options.index-1);
					},
					getNextImage = function(){
						return getImage(getNext());
					},
					getCurrentImage = function(){
						return getImage(getIndex());
					},
					getPrevImage = function(){
						return getImage(getPrev());
					},
					getImage = function(index){
						return $("<div/>")
									.attr("data-no", index)
									.css({
										"position": "absolute",
									})
									.append(
										$("<img/>")
										.attr("src", MeclibSlide.images[index])
										.css({
											"position": "absolute",
											"maxHeight": "100%",
											"maxWidth": "100%",
											"top": "50%",
											"left": "50%",
										})
										.transform(translate("-50%","-50%"))
									);
					},
					start = function(){
						if(MeclibSlide.page.total == 1){
							$(this)
								.append(getImage(0).css("left",0+"px"));
						
						}else{
							var prev = 
							$(this)
								.append(getPrevImage().css("left",-MeclibSlide.stage.width+"px"))
								.append(getCurrentImage().css("left",0+"px"))
								.append(getNextImage().css("left",MeclibSlide.stage.width+"px"))
						}
					},
					swipeRight = function(x){
						if(MeclibSlide.page.total == 1){
							swipeCancel(x);
							return;
						}
						var start = { x : x };
						var end = { x : MeclibSlide.stage.width };
						$(start).animate(
							end,
							{
								duration : MeclibSlide.options.duration*(MeclibSlide.stage.width-moveX)/MeclibSlide.stage.width,
								easing : MeclibSlide.options.easing,
								step : function(param, obj){
									$element.find("div").transform(translate(obj.now,0));
								},
								complete: function(){
									$element.find("div[data-no='" + getNext() + "']").remove();
									$element.find("div[data-no='" + getIndex() + "']").css("left",MeclibSlide.stage.width+"px").transform("none");
									$element.find("div[data-no='" + getPrev() + "']").css("left",0+"px").transform("none");
									prev();
									$element.prepend(getPrevImage().css("left",-MeclibSlide.stage.width+"px"));
									animated = false;
									pageUpdate();
								}
							}
						);
					},
					swipeLeft = function(x){
						if(MeclibSlide.page.total == 1){
							swipeCancel(x);
							return;
						}
						var start = { x : x };
						var end = { x : -MeclibSlide.stage.width };
						$(start).animate(
							end,
							{
								duration : MeclibSlide.options.duration*(MeclibSlide.stage.width+moveX)/MeclibSlide.stage.width,
								easing : MeclibSlide.options.easing,
								step : function(param, obj){
									$element.find("div").transform(translate(obj.now,0));
								},
								complete: function(){
									$element.find("div[data-no='" + getPrev() + "']").remove();
									$element.find("div[data-no='" + getIndex() + "']").css("left",-MeclibSlide.stage.width+"px").transform("none");
									$element.find("div[data-no='" + getNext() + "']").css("left",0+"px").transform("none");
									next();
									$element.append(getNextImage().css("left",MeclibSlide.stage.width+"px"));
									animated = false;
									pageUpdate();
								}
							}
						);
					},
					swipeCancel = function(x){
						var start = { x : x };
						var end = { x : 0 };
						$(start).animate(
							end,
							{
								duration : MeclibSlide.options.duration*Math.abs(moveX)/MeclibSlide.stage.width*4,
								easing : MeclibSlide.options.easing,
								step : function(param, obj){
									$element.find("div").transform(translate(obj.now,0));
								},
								complete: function(){
									animated = false;
								}
							}
						);
					},
					setAutoPlay = function(){
						if(MeclibSlide.defaults.autoslide){
							if(autoplay){
								clearTimeout(autoplay);
							}
							autoplay = setTimeout(swipeLeft,MeclibSlide.options.interval,0);
						}
					}
					
					pageUpdate = function(){
						var index = MeclibSlide.options.index;
						
						if(MeclibSlide.page.total == 2 && index >= MeclibSlide.page.total){
							index -= MeclibSlide.page.total;
						}
						$("#pagenation-box li").removeClass("current");
						$("#pagenation-box li").eq(index).addClass("current");

						$("#thumbs-top li").removeClass("current");
						$("#thumbs-top li").eq(index).addClass("current");

						$("#thumbs-bottom li").removeClass("current");
						$("#thumbs-bottom li").eq(index).addClass("current");

						if(MeclibSlide.defaults.caption === true && MeclibSlide.captions[index] != ""){
							$("#slide-caption").show();
							$("#slide-caption").html(MeclibSlide.captions[index]);
							$("#slide-caption").attr("title",MeclibSlide.captions[index]);
						}else{
							$("#slide-caption").hide();
						}

						$element.find("div").css({
							"width"  : MeclibSlide.canvas.width,
							"height" : MeclibSlide.canvas.height,
							"margin-left"   : (MeclibSlide.stage.width - MeclibSlide.canvas.width)/2,
							"margin-top"    : (MeclibSlide.stage.height - MeclibSlide.canvas.height)/2,
						});
						setAutoPlay();
					},
					
					resizeElements = function(){
						MeclibSlide.window.width = $(window).width() ? $(window).width(): window.innerWidth;
						MeclibSlide.window.height = window.innerHeight ? window.innerHeight: $(window).height();

						MeclibSlide.options.width = (window.innerHeight ? window.innerHeight: $(window).height())/MeclibSlide.options.height*MeclibSlide.options.width;
						MeclibSlide.options.height = window.innerHeight ? window.innerHeight: $(window).height();

						MeclibSlide.stage = {
							"width"  : (MeclibSlide.window.width - MeclibSlide.sidebar.size.width*2),
							"height" : (MeclibSlide.window.height - (MeclibSlide.boxPadding.top+MeclibSlide.boxPadding.bottom) )
						}

						MeclibSlide.canvas.width  = MeclibSlide.defaults.width;
						MeclibSlide.canvas.height = MeclibSlide.defaults.height;
						var rate = 0;
						if(MeclibSlide.defaults.resizable === true){
							//画面が横長
							if( MeclibSlide.stage.width >= MeclibSlide.stage.height ){
								rate = MeclibSlide.stage.height/MeclibSlide.canvas.height;
								MeclibSlide.canvas.height = MeclibSlide.stage.height;
					       		MeclibSlide.canvas.width  = MeclibSlide.canvas.width*rate;
							}else{
								rate = MeclibSlide.stage.width/MeclibSlide.canvas.width;
								MeclibSlide.canvas.width = MeclibSlide.stage.width;
					       		MeclibSlide.canvas.height  = MeclibSlide.canvas.height*rate;
							}
						}
						rate = 0;
						resizeFlg = 1;
						//画面が横長
						if( MeclibSlide.stage.width >= MeclibSlide.stage.height ){

							//コンテンツの高さ >= 画面の高さ
							if( MeclibSlide.canvas.height >= MeclibSlide.stage.height ){
				       			rate = MeclibSlide.stage.height/MeclibSlide.canvas.height;
				       			MeclibSlide.canvas.height = MeclibSlide.stage.height;
				       			MeclibSlide.canvas.width  = MeclibSlide.canvas.width*rate;
				       			//横がまだOVER
				       			if( MeclibSlide.canvas.width > MeclibSlide.stage.width ){
					       			rate = MeclibSlide.stage.width/MeclibSlide.canvas.width;
					       			MeclibSlide.canvas.width = MeclibSlide.stage.width;
					       			MeclibSlide.canvas.height  = MeclibSlide.canvas.height*rate;
								}
				       		}else if( MeclibSlide.canvas.width >= MeclibSlide.stage.width ){
				       		//横がOVER

				       			rate = MeclibSlide.stage.width/MeclibSlide.canvas.width;
				       			MeclibSlide.canvas.width = MeclibSlide.stage.width;
				       			MeclibSlide.canvas.height  = MeclibSlide.canvas.height*rate;
				       			//縦がまだOVER
				       			if( MeclibSlide.canvas.height >= MeclibSlide.stage.height ){
					       			rate = MeclibSlide.stage.height/MeclibSlide.canvas.height;
					       			MeclibSlide.canvas.height = MeclibSlide.stage.height;
					       			MeclibSlide.canvas.width  = MeclibSlide.canvas.width*rate;
				       			}

				       		}else{
				       			resizeFlg = 0;
				       		}


				       	//画面が縦長
				 		}else{
				       		if( MeclibSlide.canvas.width >= MeclibSlide.stage.width ){
				       			rate = MeclibSlide.stage.width/MeclibSlide.canvas.width;
				       			MeclibSlide.canvas.width = MeclibSlide.stage.width;
				       			MeclibSlide.canvas.height  = MeclibSlide.canvas.height*rate;
				       			//横がまだOVER
				       			if( MeclibSlide.canvas.height > MeclibSlide.stage.height ){
					       			rate = MeclibSlide.stage.height/MeclibSlide.canvas.height;
					       			MeclibSlide.canvas.height = MeclibSlide.stage.height;
					       			MeclibSlide.canvas.width  = MeclibSlide.canvas.width*rate;
								}

				       		}else if( MeclibSlide.canvas.height >= MeclibSlide.stage.height ){
				       		//縦がOVER
				       			rate = MeclibSlide.stage.height/MeclibSlide.canvas.height;
				       			MeclibSlide.canvas.height = MeclibSlide.stage.height;
				       			MeclibSlide.canvas.width  = MeclibSlide.canvas.width*rate;
				       			//縦がまだOVER
				       			if( MeclibSlide.canvas.width >= MeclibSlide.stage.width ){
					       			rate = MeclibSlide.stage.width/MeclibSlide.canvas.width;
					       			MeclibSlide.canvas.width = MeclibSlide.stage.width;
					       			MeclibSlide.canvas.height  = MeclibSlide.canvas.height*rate;
				       			}
				       		}else{
				       			resizeFlg = 0;
				       		}
				 		}

						$element.find("div").css({
						    "width"  : MeclibSlide.canvas.width,
						 	"height" : MeclibSlide.canvas.height,
						    "margin-left"   : (MeclibSlide.stage.width - MeclibSlide.canvas.width)/2,
						    "margin-top"    : (MeclibSlide.stage.height - MeclibSlide.canvas.height)/2,
						  });

						if(MeclibSlide.page.total > 1){
							$element.find("div[data-no='" + getPrev() + "']").css({ left : -MeclibSlide.stage.width+"px" });
							$element.find("div[data-no='" + getNext() + "']").css({ left : MeclibSlide.stage.width+"px" });
						}


						$(MeclibSlide.sidebar.right).css({
							"width"  : MeclibSlide.sidebar.size.width,
							"height" : MeclibSlide.stage.height,
							"right"  : 0,
							"top"    : MeclibSlide.boxPadding.top,
							"cursor" : "pointer"
						});
						$(MeclibSlide.sidebar.left).css({
							"width"  : MeclibSlide.sidebar.size.width,
							"height" : MeclibSlide.stage.height,
							"left"   : 0,
							"top"    : MeclibSlide.boxPadding.top,
							"cursor" : "pointer"
						});


						$(MeclibSlide.buttuns.right).css({
							"width"  : MeclibSlide.buttuns.size.width,
							"height" : MeclibSlide.buttuns.size.height,
							"right"  : 2,
							"top"    : ( (MeclibSlide.stage.height/2) - (MeclibSlide.buttuns.size.height/2)),
							"cursor" : "pointer"
						});
						$(MeclibSlide.buttuns.left).css({
							"width"  : MeclibSlide.buttuns.size.width,
							"height" : MeclibSlide.buttuns.size.height,
							"left"   : 2,
							"top"    : ( (MeclibSlide.stage.height/2) - (MeclibSlide.buttuns.size.height/2)),
							"cursor" : "pointer"
						});

						$("#pagenation-box").css({
							/*"top"    : -(MeclibSlide.stage.height - MeclibSlide.canvas.height)/2 + MeclibSlide.boxPadding.captionHeight,*/
							"width"  : MeclibSlide.page.icon.width*MeclibSlide.page.total,
							"height" : MeclibSlide.boxPadding.pagenationHeight
						});
						
						$("#thumbs-top,#thumbs-bottom").css({
							"width"  : MeclibSlide.thumbs.size.width * MeclibSlide.page.total,
							"height" : MeclibSlide.thumbs.size.height
						});
						$("#thumbs-top").css({
							"top"    : (MeclibSlide.stage.height - MeclibSlide.canvas.height)/2
						});
						$("#thumbs-bottom").css({
							"top"    : -(MeclibSlide.stage.height - MeclibSlide.canvas.height)/2
						});

						$("ul.pagenation-box li").css({
							"margin-top" : (MeclibSlide.boxPadding.pagenationHeight - MeclibSlide.page.icon.height)/2
						});

						$("#slide-caption").css({
							//"top"    : MeclibSlide.boxPadding.pagenationHeight-2,
							//"left"   : MeclibSlide.buttuns.size.width/2,
							"top"    : -(MeclibSlide.stage.height - MeclibSlide.canvas.height)/2,
							"left"   : MeclibSlide.sidebar.size.width,
							"width"  : MeclibSlide.stage.width - 10,
						});

						$("header").css({
							"height" : MeclibSlide.boxPadding.top
						});
						$("footer").css({
							"height" : MeclibSlide.boxPadding.bottom
						});
						$("#slide-box").css({
							"width"  : MeclibSlide.stage.width,
							"left"   : MeclibSlide.sidebar.size.width,
							"height" : MeclibSlide.stage.height,
							"top"    : MeclibSlide.boxPadding.top
						});

					}
				;

				start.call($element);
				
				if(MeclibSlide.defaults.type == 1){
					MeclibSlide.defaults.sidebar = false;
					MeclibSlide.defaults.caption = false;
				}


				$element.bind("touchstart mousedown",function(ev){
					ev.preventDefault();
					startX = ev.pageX ? ev.pageX : ev.touches ? ev.touches[0].pageX : ev.originalEvent.touches ? ev.originalEvent.touches[0].pageX : 0;
					moveX = 0;
					if(!draged && !animated){
						draged = true;
					}
				});

				$element.bind("touchmove mousemove",function(ev){
					ev.preventDefault();
					if(draged){
						moveX = ev.pageX ? ev.pageX : ev.touches ? ev.touches[0].pageX : ev.originalEvent.touches ? ev.originalEvent.touches[0].pageX : 0;
						moveX -= startX;
						$element.find("div").transform(translate(moveX,0));
					}
				});

				$element.bind("touchend mouseup mouseout",function(ev){
					ev.preventDefault();
					if(draged){
						draged = false;
						animated = true;
						if(moveX == 0){
							animated = false;
						}else if(moveX > MeclibSlide.stage.width*0.1){
							swipeRight(moveX);

						}else if(moveX < -MeclibSlide.stage.width*0.1){
							swipeLeft(moveX);

						}else{
							swipeCancel(moveX)
						}
					}
				});

				if(MeclibSlide.defaults.sidebar && MeclibSlide.defaults.type != 1){
					//サイドバーUI
					MeclibSlide.sidebar.left = $("<div/>").addClass("slide-sidebar");
					MeclibSlide.sidebar.right = $("<div/>").addClass("slide-sidebar");
					$("body").append(MeclibSlide.sidebar.left);
					$("body").append(MeclibSlide.sidebar.right);

					//サイドバー内のボタン
					MeclibSlide.buttuns.left = $("<img/>").attr("src","assets/arrow_l.png").addClass("slide-l").addClass("slide-side-button");
					MeclibSlide.buttuns.right = $("<img/>").attr("src","assets/arrow_r.png").addClass("slide-r").addClass("slide-side-button");

					$(MeclibSlide.sidebar.left).append(MeclibSlide.buttuns.left);
					$(MeclibSlide.sidebar.right).append(MeclibSlide.buttuns.right);

					//サイドバーのマウスオーバー(PCの場合)
	                if(MeclibSlide.deviceType === 1){
	                    $(".slide-sidebar").mouseover(function(ev){
	                        $(this).find("img").each(function(){
		                        $(this).css({
		                        	"opacity" : 0.5
		                        });
	                        });
	                    }).mouseout(function(){
	                        $(this).find("img").each(function(){
		                        $(this).css({
		                        	"opacity" : ""
		                        });
	                        });
	                    });
	                }

					//サイドバー及びボタンをクリック
					$(MeclibSlide.sidebar.right).click(function(event) {
						swipeLeft(0);
						return false;
					});
					$(MeclibSlide.buttuns.right).click(function(event) {
						swipeLeft(0);
						return false;
					});
					$(MeclibSlide.sidebar.left).click(function(event) {
						swipeRight(0);
						return false;
					});
					$(MeclibSlide.buttuns.left).click(function(event) {
						swipeRight(0);
						return false;
					});
				}else{
					MeclibSlide.sidebar.size.width = 0;
				}

				for(var i=0;i<MeclibSlide.page.total;i++){
					$("#pagenation-box").append($('<li><div class="pagenation-circle"></div></li>'));
				}
				
				//ページネーションをクリック
				$("#pagenation-box li").click(function(event) {
					 var index = $("#pagenation-box li").index(this);
					 MeclibSlide.options.index = index;
					$("#slide").hide();

					$("#slide").find("img").remove();
					$("#slide")
						.append(getPrevImage().css("left",-MeclibSlide.stage.width+"px"))
						.append(getCurrentImage().css("left",0+"px"))
						.append(getNextImage().css("left",MeclibSlide.stage.width+"px"));
						pageUpdate();
						resizeElements();
						//$("#slide").fadeIn("1000");
						setTimeout(function(){
							$("#slide").fadeIn("500");
						},500);
				});
				
				for(var i=0;i<MeclibSlide.page.total ;i++){
					$("#thumbs-top").append($('<li><div class="thumbs"><img src="' + MeclibSlide.images[i] + '" /></div></li>'));
					$("#thumbs-bottom").append($('<li><div class="thumbs"><img src="' + MeclibSlide.images[i] + '" /></div></li>'));
				}
				$("#thumbs-top li,#thumbs-bottom li").css({
					"width" : MeclibSlide.thumbs.size.width,
					"height" : MeclibSlide.thumbs.size.height
				});
				//サムネイルをクリック
				$("#thumbs-top li").click(function(event) {
					 var index = $("#thumbs-top li").index(this);
					 MeclibSlide.options.index = index;
					$("#slide").hide();

					$("#slide").find("div").remove();
					$("#slide")
						.append(getPrevImage().css("left",-MeclibSlide.stage.width+"px"))
						.append(getCurrentImage().css("left",0+"px"))
						.append(getNextImage().css("left",MeclibSlide.stage.width+"px"));
						pageUpdate();
						resizeElements();
						//$("#slide").fadeIn("1000");
						setTimeout(function(){
							$("#slide").fadeIn("500");
						},500);
				});
				$("#thumbs-bottom li").click(function(event) {
					 var index = $("#thumbs-bottom li").index(this);
					 MeclibSlide.options.index = index;
					$("#slide").hide();

					$("#slide").find("div").remove();
					$("#slide")
						.append(getPrevImage().css("left",-MeclibSlide.stage.width+"px"))
						.append(getCurrentImage().css("left",0+"px"))
						.append(getNextImage().css("left",MeclibSlide.stage.width+"px"));
						pageUpdate();
						resizeElements();
						//$("#slide").fadeIn("1000");
						setTimeout(function(){
							$("#slide").fadeIn("500");
						},500);
				});

				//キャプションの有効or 無効
				if(MeclibSlide.defaults.caption === false){
					MeclibSlide.boxPadding.bottom = (MeclibSlide.boxPadding.bottom - MeclibSlide.boxPadding.captionHeight);
					MeclibSlide.boxPadding.captionHeight = 0;
				}
				
				//1:スライドのみ
				if(MeclibSlide.defaults.type === 1){
					MeclibSlide.boxPadding = {
						"top" : 0,
						"bottom" : 0,
						"pagenationHeight" : 0,
						"captionHeight"    : 0
					};
					$("#thumbs-top").hide();
					$("#thumbs-bottom").hide();
					
				//2:ページネーション
				}else if(MeclibSlide.defaults.type === 2){
					$("#thumbs-top").hide();
					$("#thumbs-bottom").hide();
				
				//3:上サムネイル
				}else if(MeclibSlide.defaults.type === 3){
					MeclibSlide.boxPadding.top = MeclibSlide.thumbs.size.height;
					MeclibSlide.boxPadding.pagenationHeight = 0;
					$("#thumbs-bottom").hide();
					
				//4:下サムネイル
				}else if(MeclibSlide.defaults.type === 4){
					MeclibSlide.boxPadding.bottom = MeclibSlide.boxPadding.captionHeight+MeclibSlide.thumbs.size.height;
					MeclibSlide.boxPadding.pagenationHeight = 0;
					$("#thumbs-top").hide();
					
				}



				setTimeout(function(){
					pageUpdate();
					resizeElements();
					$("body").fadeIn("250");
				},500);


				$(window).resize(function(){
					if(MeclibSlide.options.height != window.innerHeight ? window.innerHeight: $(window).height()){
						resizeElements();
					}
				});
			},
		};
		return MeclibSlide;
	})();


	var methods = {
		init: function(defaults,resorces) {

			MeclibSlide.defaults = defaults;
	        var images = [];
	        for(var i=0;i<resorces.length;i++){
	            MeclibSlide.images[i] = resorces[i].src;
	            MeclibSlide.captions[i] = resorces[i].text;
	        }
			MeclibSlide.page.total = MeclibSlide.images.length;
			if(MeclibSlide.page.total == 2){
				MeclibSlide.images[2] = MeclibSlide.images[0];
				MeclibSlide.images[3] = MeclibSlide.images[1];
			}
			$("body").css("background-color",MeclibSlide.defaults.bgcolor);



			var _UA = navigator.userAgent;
			var sp = false;
			if (_UA.search('iPhone') > -1 ||  _UA.search('Android') > -1) {
				MeclibSlide.touchDevice = true;
				MeclibSlide.deviceType = 2;
			    if(_UA.search('iPhone') > -1){
			          MeclibSlide.deviceType = 3;
			    }
			    if(_UA.search('Android') > -1){
			        if(_UA.search('Mobile') > -1){
			            MeclibSlide.deviceType = 3;
			        }
			    }
			}


			this.each(function() {
				$(this).data(MeclibSlide.pluginName, new MeclibSlide($(this)));
			});
		},
	};

	$.fn.MeclibSlide = function() {
		methods.init.call(this,arguments[0],arguments[1],this);
		return this;
	};
})(jQuery);