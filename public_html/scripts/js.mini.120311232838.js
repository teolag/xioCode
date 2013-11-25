/* 2012-03-11 23:28:38 | Removed 0 bytes | Compressed 0% */
/**
 *
 * Color picker
 * Author: Stefan Petre www.eyecon.ro
 * 
 * Dual licensed under the MIT and GPL licenses
 * 
 */
(function ($) {
	var ColorPicker = function () {
		var
			ids = {},
			inAction,
			charMin = 65,
			visible,
			tpl = '<div class="colorpicker"><div class="colorpicker_color"><div><div></div></div></div><div class="colorpicker_hue"><div></div></div><div class="colorpicker_new_color"></div><div class="colorpicker_current_color"></div><div class="colorpicker_hex"><input type="text" maxlength="6" size="6" /></div><div class="colorpicker_rgb_r colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_rgb_g colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_rgb_b colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_hsb_h colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_hsb_s colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_hsb_b colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_submit"></div></div>',
			defaults = {
				eventName: 'click',
				onShow: function () {},
				onBeforeShow: function(){},
				onHide: function () {},
				onChange: function () {},
				onSubmit: function () {},
				color: 'ff0000',
				livePreview: true,
				flat: false
			},
			fillRGBFields = function  (hsb, cal) {
				var rgb = HSBToRGB(hsb);
				$(cal).data('colorpicker').fields
					.eq(1).val(rgb.r).end()
					.eq(2).val(rgb.g).end()
					.eq(3).val(rgb.b).end();
			},
			fillHSBFields = function  (hsb, cal) {
				$(cal).data('colorpicker').fields
					.eq(4).val(hsb.h).end()
					.eq(5).val(hsb.s).end()
					.eq(6).val(hsb.b).end();
			},
			fillHexFields = function (hsb, cal) {
				$(cal).data('colorpicker').fields
					.eq(0).val(HSBToHex(hsb)).end();
			},
			setSelector = function (hsb, cal) {
				$(cal).data('colorpicker').selector.css('backgroundColor', '#' + HSBToHex({h: hsb.h, s: 100, b: 100}));
				$(cal).data('colorpicker').selectorIndic.css({
					left: parseInt(150 * hsb.s/100, 10),
					top: parseInt(150 * (100-hsb.b)/100, 10)
				});
			},
			setHue = function (hsb, cal) {
				$(cal).data('colorpicker').hue.css('top', parseInt(150 - 150 * hsb.h/360, 10));
			},
			setCurrentColor = function (hsb, cal) {
				$(cal).data('colorpicker').currentColor.css('backgroundColor', '#' + HSBToHex(hsb));
			},
			setNewColor = function (hsb, cal) {
				$(cal).data('colorpicker').newColor.css('backgroundColor', '#' + HSBToHex(hsb));
			},
			keyDown = function (ev) {
				var pressedKey = ev.charCode || ev.keyCode || -1;
				if ((pressedKey > charMin && pressedKey <= 90) || pressedKey == 32) {
					return false;
				}
				var cal = $(this).parent().parent();
				if (cal.data('colorpicker').livePreview === true) {
					change.apply(this);
				}
			},
			change = function (ev) {
				var cal = $(this).parent().parent(), col;
				if (this.parentNode.className.indexOf('_hex') > 0) {
					cal.data('colorpicker').color = col = HexToHSB(fixHex(this.value));
				} else if (this.parentNode.className.indexOf('_hsb') > 0) {
					cal.data('colorpicker').color = col = fixHSB({
						h: parseInt(cal.data('colorpicker').fields.eq(4).val(), 10),
						s: parseInt(cal.data('colorpicker').fields.eq(5).val(), 10),
						b: parseInt(cal.data('colorpicker').fields.eq(6).val(), 10)
					});
				} else {
					cal.data('colorpicker').color = col = RGBToHSB(fixRGB({
						r: parseInt(cal.data('colorpicker').fields.eq(1).val(), 10),
						g: parseInt(cal.data('colorpicker').fields.eq(2).val(), 10),
						b: parseInt(cal.data('colorpicker').fields.eq(3).val(), 10)
					}));
				}
				if (ev) {
					fillRGBFields(col, cal.get(0));
					fillHexFields(col, cal.get(0));
					fillHSBFields(col, cal.get(0));
				}
				setSelector(col, cal.get(0));
				setHue(col, cal.get(0));
				setNewColor(col, cal.get(0));
				cal.data('colorpicker').onChange.apply(cal, [col, HSBToHex(col), HSBToRGB(col)]);
			},
			blur = function (ev) {
				var cal = $(this).parent().parent();
				cal.data('colorpicker').fields.parent().removeClass('colorpicker_focus');
			},
			focus = function () {
				charMin = this.parentNode.className.indexOf('_hex') > 0 ? 70 : 65;
				$(this).parent().parent().data('colorpicker').fields.parent().removeClass('colorpicker_focus');
				$(this).parent().addClass('colorpicker_focus');
			},
			downIncrement = function (ev) {
				var field = $(this).parent().find('input').focus();
				var current = {
					el: $(this).parent().addClass('colorpicker_slider'),
					max: this.parentNode.className.indexOf('_hsb_h') > 0 ? 360 : (this.parentNode.className.indexOf('_hsb') > 0 ? 100 : 255),
					y: ev.pageY,
					field: field,
					val: parseInt(field.val(), 10),
					preview: $(this).parent().parent().data('colorpicker').livePreview					
				};
				$(document).bind('mouseup', current, upIncrement);
				$(document).bind('mousemove', current, moveIncrement);
			},
			moveIncrement = function (ev) {
				ev.data.field.val(Math.max(0, Math.min(ev.data.max, parseInt(ev.data.val + ev.pageY - ev.data.y, 10))));
				if (ev.data.preview) {
					change.apply(ev.data.field.get(0), [true]);
				}
				return false;
			},
			upIncrement = function (ev) {
				change.apply(ev.data.field.get(0), [true]);
				ev.data.el.removeClass('colorpicker_slider').find('input').focus();
				$(document).unbind('mouseup', upIncrement);
				$(document).unbind('mousemove', moveIncrement);
				return false;
			},
			downHue = function (ev) {
				var current = {
					cal: $(this).parent(),
					y: $(this).offset().top
				};
				current.preview = current.cal.data('colorpicker').livePreview;
				$(document).bind('mouseup', current, upHue);
				$(document).bind('mousemove', current, moveHue);
			},
			moveHue = function (ev) {
				change.apply(
					ev.data.cal.data('colorpicker')
						.fields
						.eq(4)
						.val(parseInt(360*(150 - Math.max(0,Math.min(150,(ev.pageY - ev.data.y))))/150, 10))
						.get(0),
					[ev.data.preview]
				);
				return false;
			},
			upHue = function (ev) {
				fillRGBFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				fillHexFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				$(document).unbind('mouseup', upHue);
				$(document).unbind('mousemove', moveHue);
				return false;
			},
			downSelector = function (ev) {
				var current = {
					cal: $(this).parent(),
					pos: $(this).offset()
				};
				current.preview = current.cal.data('colorpicker').livePreview;
				$(document).bind('mouseup', current, upSelector);
				$(document).bind('mousemove', current, moveSelector);
			},
			moveSelector = function (ev) {
				change.apply(
					ev.data.cal.data('colorpicker')
						.fields
						.eq(6)
						.val(parseInt(100*(150 - Math.max(0,Math.min(150,(ev.pageY - ev.data.pos.top))))/150, 10))
						.end()
						.eq(5)
						.val(parseInt(100*(Math.max(0,Math.min(150,(ev.pageX - ev.data.pos.left))))/150, 10))
						.get(0),
					[ev.data.preview]
				);
				return false;
			},
			upSelector = function (ev) {
				fillRGBFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				fillHexFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				$(document).unbind('mouseup', upSelector);
				$(document).unbind('mousemove', moveSelector);
				return false;
			},
			enterSubmit = function (ev) {
				$(this).addClass('colorpicker_focus');
			},
			leaveSubmit = function (ev) {
				$(this).removeClass('colorpicker_focus');
			},
			clickSubmit = function (ev) {
				var cal = $(this).parent();
				var col = cal.data('colorpicker').color;
				cal.data('colorpicker').origColor = col;
				setCurrentColor(col, cal.get(0));
				cal.data('colorpicker').onSubmit(col, HSBToHex(col), HSBToRGB(col), cal.data('colorpicker').el);
			},
			show = function (ev) {
				var cal = $('#' + $(this).data('colorpickerId'));
				cal.data('colorpicker').onBeforeShow.apply(this, [cal.get(0)]);
				var pos = $(this).offset();
				var viewPort = getViewport();
				var top = pos.top + this.offsetHeight;
				var left = pos.left;
				if (top + 176 > viewPort.t + viewPort.h) {
					top -= this.offsetHeight + 176;
				}
				if (left + 356 > viewPort.l + viewPort.w) {
					left -= 356;
				}
				cal.css({left: left + 'px', top: top + 'px'});
				if (cal.data('colorpicker').onShow.apply(this, [cal.get(0)]) != false) {
					cal.show();
				}
				$(document).bind('mousedown', {cal: cal}, hide);
				return false;
			},
			hide = function (ev) {
				if (!isChildOf(ev.data.cal.get(0), ev.target, ev.data.cal.get(0))) {
					if (ev.data.cal.data('colorpicker').onHide.apply(this, [ev.data.cal.get(0)]) != false) {
						ev.data.cal.hide();
					}
					$(document).unbind('mousedown', hide);
				}
			},
			isChildOf = function(parentEl, el, container) {
				if (parentEl == el) {
					return true;
				}
				if (parentEl.contains) {
					return parentEl.contains(el);
				}
				if ( parentEl.compareDocumentPosition ) {
					return !!(parentEl.compareDocumentPosition(el) & 16);
				}
				var prEl = el.parentNode;
				while(prEl && prEl != container) {
					if (prEl == parentEl)
						return true;
					prEl = prEl.parentNode;
				}
				return false;
			},
			getViewport = function () {
				var m = document.compatMode == 'CSS1Compat';
				return {
					l : window.pageXOffset || (m ? document.documentElement.scrollLeft : document.body.scrollLeft),
					t : window.pageYOffset || (m ? document.documentElement.scrollTop : document.body.scrollTop),
					w : window.innerWidth || (m ? document.documentElement.clientWidth : document.body.clientWidth),
					h : window.innerHeight || (m ? document.documentElement.clientHeight : document.body.clientHeight)
				};
			},
			fixHSB = function (hsb) {
				return {
					h: Math.min(360, Math.max(0, hsb.h)),
					s: Math.min(100, Math.max(0, hsb.s)),
					b: Math.min(100, Math.max(0, hsb.b))
				};
			}, 
			fixRGB = function (rgb) {
				return {
					r: Math.min(255, Math.max(0, rgb.r)),
					g: Math.min(255, Math.max(0, rgb.g)),
					b: Math.min(255, Math.max(0, rgb.b))
				};
			},
			fixHex = function (hex) {
				var len = 6 - hex.length;
				if (len > 0) {
					var o = [];
					for (var i=0; i<len; i++) {
						o.push('0');
					}
					o.push(hex);
					hex = o.join('');
				}
				return hex;
			}, 
			HexToRGB = function (hex) {
				var hex = parseInt(((hex.indexOf('#') > -1) ? hex.substring(1) : hex), 16);
				return {r: hex >> 16, g: (hex & 0x00FF00) >> 8, b: (hex & 0x0000FF)};
			},
			HexToHSB = function (hex) {
				return RGBToHSB(HexToRGB(hex));
			},
			RGBToHSB = function (rgb) {
				var hsb = {
					h: 0,
					s: 0,
					b: 0
				};
				var min = Math.min(rgb.r, rgb.g, rgb.b);
				var max = Math.max(rgb.r, rgb.g, rgb.b);
				var delta = max - min;
				hsb.b = max;
				if (max != 0) {
					
				}
				hsb.s = max != 0 ? 255 * delta / max : 0;
				if (hsb.s != 0) {
					if (rgb.r == max) {
						hsb.h = (rgb.g - rgb.b) / delta;
					} else if (rgb.g == max) {
						hsb.h = 2 + (rgb.b - rgb.r) / delta;
					} else {
						hsb.h = 4 + (rgb.r - rgb.g) / delta;
					}
				} else {
					hsb.h = -1;
				}
				hsb.h *= 60;
				if (hsb.h < 0) {
					hsb.h += 360;
				}
				hsb.s *= 100/255;
				hsb.b *= 100/255;
				return hsb;
			},
			HSBToRGB = function (hsb) {
				var rgb = {};
				var h = Math.round(hsb.h);
				var s = Math.round(hsb.s*255/100);
				var v = Math.round(hsb.b*255/100);
				if(s == 0) {
					rgb.r = rgb.g = rgb.b = v;
				} else {
					var t1 = v;
					var t2 = (255-s)*v/255;
					var t3 = (t1-t2)*(h%60)/60;
					if(h==360) h = 0;
					if(h<60) {rgb.r=t1;	rgb.b=t2; rgb.g=t2+t3}
					else if(h<120) {rgb.g=t1; rgb.b=t2;	rgb.r=t1-t3}
					else if(h<180) {rgb.g=t1; rgb.r=t2;	rgb.b=t2+t3}
					else if(h<240) {rgb.b=t1; rgb.r=t2;	rgb.g=t1-t3}
					else if(h<300) {rgb.b=t1; rgb.g=t2;	rgb.r=t2+t3}
					else if(h<360) {rgb.r=t1; rgb.g=t2;	rgb.b=t1-t3}
					else {rgb.r=0; rgb.g=0;	rgb.b=0}
				}
				return {r:Math.round(rgb.r), g:Math.round(rgb.g), b:Math.round(rgb.b)};
			},
			RGBToHex = function (rgb) {
				var hex = [
					rgb.r.toString(16),
					rgb.g.toString(16),
					rgb.b.toString(16)
				];
				$.each(hex, function (nr, val) {
					if (val.length == 1) {
						hex[nr] = '0' + val;
					}
				});
				return hex.join('');
			},
			HSBToHex = function (hsb) {
				return RGBToHex(HSBToRGB(hsb));
			},
			restoreOriginal = function () {
				var cal = $(this).parent();
				var col = cal.data('colorpicker').origColor;
				cal.data('colorpicker').color = col;
				fillRGBFields(col, cal.get(0));
				fillHexFields(col, cal.get(0));
				fillHSBFields(col, cal.get(0));
				setSelector(col, cal.get(0));
				setHue(col, cal.get(0));
				setNewColor(col, cal.get(0));
			};
		return {
			init: function (opt) {
				opt = $.extend({}, defaults, opt||{});
				if (typeof opt.color == 'string') {
					opt.color = HexToHSB(opt.color);
				} else if (opt.color.r != undefined && opt.color.g != undefined && opt.color.b != undefined) {
					opt.color = RGBToHSB(opt.color);
				} else if (opt.color.h != undefined && opt.color.s != undefined && opt.color.b != undefined) {
					opt.color = fixHSB(opt.color);
				} else {
					return this;
				}
				return this.each(function () {
					if (!$(this).data('colorpickerId')) {
						var options = $.extend({}, opt);
						options.origColor = opt.color;
						var id = 'collorpicker_' + parseInt(Math.random() * 1000);
						$(this).data('colorpickerId', id);
						var cal = $(tpl).attr('id', id);
						if (options.flat) {
							cal.appendTo(this).show();
						} else {
							cal.appendTo(document.body);
						}
						options.fields = cal
											.find('input')
												.bind('keyup', keyDown)
												.bind('change', change)
												.bind('blur', blur)
												.bind('focus', focus);
						cal
							.find('span').bind('mousedown', downIncrement).end()
							.find('>div.colorpicker_current_color').bind('click', restoreOriginal);
						options.selector = cal.find('div.colorpicker_color').bind('mousedown', downSelector);
						options.selectorIndic = options.selector.find('div div');
						options.el = this;
						options.hue = cal.find('div.colorpicker_hue div');
						cal.find('div.colorpicker_hue').bind('mousedown', downHue);
						options.newColor = cal.find('div.colorpicker_new_color');
						options.currentColor = cal.find('div.colorpicker_current_color');
						cal.data('colorpicker', options);
						cal.find('div.colorpicker_submit')
							.bind('mouseenter', enterSubmit)
							.bind('mouseleave', leaveSubmit)
							.bind('click', clickSubmit);
						fillRGBFields(options.color, cal.get(0));
						fillHSBFields(options.color, cal.get(0));
						fillHexFields(options.color, cal.get(0));
						setHue(options.color, cal.get(0));
						setSelector(options.color, cal.get(0));
						setCurrentColor(options.color, cal.get(0));
						setNewColor(options.color, cal.get(0));
						if (options.flat) {
							cal.css({
								position: 'relative',
								display: 'block'
							});
						} else {
							$(this).bind(options.eventName, show);
						}
					}
				});
			},
			showPicker: function() {
				return this.each( function () {
					if ($(this).data('colorpickerId')) {
						show.apply(this);
					}
				});
			},
			hidePicker: function() {
				return this.each( function () {
					if ($(this).data('colorpickerId')) {
						$('#' + $(this).data('colorpickerId')).hide();
					}
				});
			},
			setColor: function(col) {
				if (typeof col == 'string') {
					col = HexToHSB(col);
				} else if (col.r != undefined && col.g != undefined && col.b != undefined) {
					col = RGBToHSB(col);
				} else if (col.h != undefined && col.s != undefined && col.b != undefined) {
					col = fixHSB(col);
				} else {
					return this;
				}
				return this.each(function(){
					if ($(this).data('colorpickerId')) {
						var cal = $('#' + $(this).data('colorpickerId'));
						cal.data('colorpicker').color = col;
						cal.data('colorpicker').origColor = col;
						fillRGBFields(col, cal.get(0));
						fillHSBFields(col, cal.get(0));
						fillHexFields(col, cal.get(0));
						setHue(col, cal.get(0));
						setSelector(col, cal.get(0));
						setCurrentColor(col, cal.get(0));
						setNewColor(col, cal.get(0));
					}
				});
			}
		};
	}();
	$.fn.extend({
		ColorPicker: ColorPicker.init,
		ColorPickerHide: ColorPicker.hidePicker,
		ColorPickerShow: ColorPicker.showPicker,
		ColorPickerSetColor: ColorPicker.setColor
	});
})(jQuery)
 var codeMirror;
var fileListWidth = 200;

var printLog=true;

var projectsPath = "projects/";
var projects = new Array();
var activeProject;
var activeFile;

var hoverTimer;

var files = new Array();

var activeSkin = "default";


$(function() {
	init();
	
	
	$("h1").on("click", function() {
		setHash(" ");
	});
	
	$("#btnNewProject").on("click", function() {
		var projectName = prompt("Enter the projects name");
		if(projectName) {
			$.get("/scripts/new_project.php", {'projectName':projectName}, function(data) {
				findProjects();
			});
		}	
	});
	
	$("#projects").on("click", "li", function() {
		$this = $(this);
		projectId = $this.data("project_id");
		projectPath = $this.data("uri");
		projectName = $this.data("name");
		setHash(projectId+"/");
		return false;
	});
	
	$("#projects").on("click", ".btnDeleteProject", function(e) {
		$li = $(this).closest('li');
		projectId = $li.data("project_id");
		projectName = $li.data("name");
		if(confirm("Are you sure you want to delete project '"+projectName+"'?")) {
			$.post("/scripts/delete_project.php", {'project_id':projectId}, function(data) {
				findProjects();
			});
		}
		e.stopPropagation();
	});
	
	$("#projects").on("click", ".btnRenameProject", function(e) {
		$li = $(this).closest('li');
		projectId = $li.data("project_id");
		projectName = $li.data("name");
		newName = prompt("Rename project", projectName);		
		if(newName) {
			$.post("/scripts/rename_project.php", {'new_name':newName, 'project_id':projectId}, function(data) {
				findProjects();
			});			
		}
		e.stopPropagation();
	});
	
	
	$("#btnNew").on("click", function() {
		setHash(activeProject.id + "/");
	});
	
	$("#btnSave").on("click", function() {
		saveFile();
	});
	
	$("#btnLogout").on("click", function() {
		window.location="/scripts/logout.php";
	});
	
	$("#btnChangePassword").on("click", function() {
		var newPass = prompt("Enter new password");
		if(newPass) {
			$.post("/scripts/change_password.php", {'newPass':newPass}, function(data) {
				alert(data);		
			});
		}
	});
	
	$("#btnChangeSkin").on("click", function() {
		if(activeSkin=="monokai") {
			changeSkin("default");
		} else {
			changeSkin("monokai");
		}	
	});
	
	$("#btnDeleteFile").on("click", function() {
		uri = projectsPath + activeProject.path + activeFile;
		answer = confirm("Are you sure you want to delete\n"+uri+"?");
		if(answer) {
			$.get("/scripts/delete_file.php",  {'uri':encodeURI(uri)}, function() {
				reloadFileList();
			});
		}
	});
	
	$("#btnPreviewFile").on("click", function() {
		window.open(projectsPath + activeProject.path + activeFile,'code_file_preview');
	});
			
	$("#btnPreviewProject").on("click", function() {
		window.open(projectsPath + activeProject.path,'code_project_preview');
	});
	
	$("#btnExportZip").on("click", function() {
		window.location="/scripts/export_zip.php?path=" + projectsPath + activeProject.path;
	});
			
	
	$("#dimmer").live("click", function() {
		undim();
	});
	
	
	$("#fileList").bind("contextmenu",function(e){
		var $target = $(e.target);
		if($target.is("span") || $target.is("li")) {
			if($target.is("span")) $target = $target.parent();
			uri = $target.data("uri");			
			showFileListRightClickMenu(uri, e);
			return false;
		} else {
			showRootRightClickMenu("", e);
			return false;
		}		
	}); 
	
	$("#fileList").live("click", function(e) {
		hideFileListRightClickMenu();
	});
		
	$("#fileList li").live("click", function(e) {
		hideFileListRightClickMenu();
		
		uri = $(this).data("uri");
		
		if(e.which == 1) {
			switch(files[uri].type) {
				case "folder":
				toggleFolder($(this));
				break;
				
				case "png": case "jpg": case "gif":
				window.open(projectsPath + activeProject.path + uri, 'image_preview');
				break;
				
				default:
				setHash(activeProject.id + "/" + uri);
			}
		} else if(e.which==2) {
			alert("rightclick");
		}
		return false;
	});
	
	$("#fileList li").live("dragstart", function(e){
		log("dragga fil ");
		log(e);
		$("#fileList").data("dragItem", $(this));
		e.stopPropagation();
	});
			
	$("#fileList li.imagePreview").live("mouseover", function(e) {
		hoverTimer = setTimeout('showPreview("'+projectsPath + activeProject.path + $(this).data("uri")+'")', 500);
	});
	
	$("#fileList li.imagePreview").live("mousemove", function(e) {
		$("#imagePreview").css({top:e.pageY, left:e.pageX+20});
	});
	
	$("#fileList li.imagePreview").live("mouseout", function() {
		clearTimeout(hoverTimer)
		$("#imagePreview").hide();
	});
	
	$("#fileListRightClickMenu li").live("click", function() {
		var uri = $(this).parent().parent().data("uri");
		path = (uri)? files[uri].path : "";
		filename = (uri)? files[uri].filename : "";
		switch($(this).data("do")) {
			
			case "newFolder":
				var folderName = prompt("Enter the name of the folder");
				if(folderName) {
					if(uri && files[uri].type=='folder') path+=filename + "/";
					$.get("/scripts/create_folder.php",  {'uri':encodeURI(projectsPath + activeProject.path + path + folderName)}, function() {
						reloadFileList();
						selectInFileList(uri);
					});
				}
			break;
			
			case "delete":
				if(files[uri].type=='folder') { 
					answer = confirm("Are you sure you want to delete the folder and all its content?\n"+uri+"?");
					if(answer) {
						$.get("/scripts/delete_folder.php",  {'uri':encodeURI(projectsPath + activeProject.path + uri)}, function() {
							reloadFileList();
						});
					}
				} else {
					answer = confirm("Are you sure you want to delete the file: '"+uri+"'?");
					if(answer) {
						$.get("/scripts/delete_file.php",  {'uri':encodeURI(projectsPath + activeProject.path + uri)}, function() {
							reloadFileList();
						});
					}
				}
			break;
			
			case "rename":
				new_name = prompt("Enter the new name of the file/folder", filename);
				if(new_name) {
					from = projectsPath + activeProject.path + uri;
					to = projectsPath + activeProject.path + path + new_name;				
					$.get("/scripts/rename.php",  {'from':encodeURI(from), 'to':encodeURI(to)}, function() {
						if(activeFile==uri) activeFile=path+new_name;
						reloadFileList();
					});
				}
			break;
			
			case "upload":
				log("upload file...");
				dim();
			break;
			
		}
		hideFileListRightClickMenu();
	});
			
	$(window).resize(function() {
		fixLayout();
	});	
	
		
	$(window).bind('hashchange', function(){
		readHash();
	});
	
	
	window.onbeforeunload = function (evt) {
		var n = numberOfUnsavedFiles()
		if(n>0) {
			return "You have "+n+" unsaved files. Are you sure you want to navigate away from this page";
		}
    }
	
	


	//fileselect.addEventListener("change", dropFile, false);
	document.getElementById("fileList").addEventListener("drop", dropFile, false);
	
	/*
	$("#fileList").on("drop", dropFile);
	$("#fileList").on("hover", function(e){
		e.stopPropagation();
		e.preventDefault();
		if(e.type == "dragover") {
			$(e.target).addClass("fileOver");
		} else {
			$(e.target).removeClass("fileOver")
		}
	});
	*/
	
	document.getElementById("fileList").addEventListener("dragover", hoverFile, false);
	document.getElementById("fileList").addEventListener("dragleave", hoverFile, false);
	
});

function init() {
	log("Init start");
	
	findProjects();
	initWriter();
	fixLayout();
	readHash();	
}

function fixLayout() {
	var h = $(window).height();
	var w = $(window).width();
	
	
	$(codeMirror.getScrollerElement()).css({
		"width":w-fileListWidth-35,
		"height":h-100
	});
	
	$("#fileList").css ({
		"width":fileListWidth,
		"height":h-64
	});

		
	
}

function showPreview(imgsrc) {
	$("#imagePreview").attr("src","/scripts/image.php?src="+imgsrc).show();
}

function findProjects() {
	log("Get projects from database..."); 
	$.ajax({
		url: "/scripts/get_all_projects.php",
		data: {'uri':encodeURI(projectsPath)},
		success: function(data) {
			projectsHTML=[];
			$.each(data, function(i, item) {
				projects[item.project_id] = {'name':item.name, 'path':item.path+'/'};				
				projectsHTML.push("<li data-project_id='" + item.project_id + "' data-uri='" + item.path + "/' data-name='" + item.name + "'>");
				projectsHTML.push("<h3 class='projectTitle'>"+item.name+"</h3>");
				projectsHTML.push("<button class='btnDeleteProject'>Delete</button>");
				projectsHTML.push("<button class='btnRenameProject'>Rename</button>");
				projectsHTML.push("</li>");
				log(" * Project found: ["+item.project_id+"] "+item.name);
			});
			log(data.length + " projects found");
			$("#projects").html(projectsHTML.join(""));
			
		},
		async:false,
		dataType: "json"
	});
}

function openProject(id) {
	activeProject = {'id':id, 'name':projects[id].name, 'path':projects[id].path};

	log("Open project "+id+" "+activeProject.path);
	unloadFile();
	$("#choose_project").hide();
	$("#writer").show();
	$("#pageTitle").html(activeProject.name);
	
	fixLayout();
	findFiles();
}

function findFiles() {
	log("loading files...");
	path = projectsPath + activeProject.path;
	$.ajax({
		url: "/scripts/build_file_tree.php",
		data: {'uri':encodeURI(path)},
		success: function(data) {
			log("loading files complete!");
			$('#fileList').html(print_folder(data,path));
		},
		async: false,
		dataType: "json"
	});
}

function reloadFileList() {

	//Save filelist state
	var openFolders = [];
	$.each($("#fileList li[data-type=folder] span.open"), function(i, open) {
		openFolders.push($(open).parent().data("uri"));
	});
	log(openFolders);
	
	//Find files and build tree
	findFiles();
	
	//reopen all opened folders
	$.each(openFolders, function(i, elem) {
		log(elem);
		toggleFolder($("#fileList li[data-uri="+elem+"]"));
	});
	
	//select opened file
	selectInFileList(activeFile);
	
}


function changeSkin(skin) {
	activeSkin=skin;
	codeMirror.setOption("theme",skin);
}


function print_folder(arr, path) {
	var localStore = window.localStorage;
	var htm = [];
	htm.push("<ul>");
	$.each(arr, function(i, item) {
		if(item.type=="jpg" || item.type=="gif" || item.type=="png") {
			imagePreview=" imagePreview";
		} else imagePreview="";
		files[item.path + item.filename] = {'filename':item.filename, 'path':item.path, 'type':item.type};
		localSaved = localStore.getItem(activeProject.path+item.path+item.filename);
		if(localSaved) changed=' changed';
		else changed = '';
		htm.push("<li draggable='true' class='"+imagePreview + changed+"' data-uri='" + item.path + item.filename + "' data-type='"+item.type+"'>");
		htm.push("<span class='fileIcon "+item.type+"'></span>");
		htm.push("<span class='fileName'>"+item.filename+"</span>");
		if(item.leafs) {
			htm.push(print_folder(item.leafs, item.path));
		}
		htm.push("</li>");		
	});
	htm.push("</ul>");
	return htm.join("");
}

function selectInFileList(uri) {
	log("Try to select: '" + uri + "'");
	$('#fileList li[data-uri="'+uri+'"]').addClass("selected");
}

function showFileListRightClickMenu(uri, e) {
	$("#fileListRightClickMenu")
		.data('uri', uri)
		.css({left:e.pageX, top:e.pageY})
		.show()
		.find("li").show()
	;
}

function showRootRightClickMenu(uri, e) {
	$("#fileListRightClickMenu")
		.data('uri', uri)
		.css({left:e.pageX, top:e.pageY})
		.show()
		.find("li:not(.rootItem)").hide()
	;
}

function hideFileListRightClickMenu() {
	$("#fileListRightClickMenu").hide();
}

function loadFile(uri) {
		
	if(!files[uri]){
		log("File not found: '" + uri + "'");
		setHash(activeProject.id+"/");
		return false;
	}

	unloadFile();
	
	switch(files[uri].type) {
		case "php": mode="application/x-httpd-php"; break;
		case "js": mode="text/javascript"; break;
		case "html": case "htm": mode="text/html"; break;
		case "css": mode="text/css"; break;
		default: mode="text/plain";
	}
	
	
	var localStore = window.localStorage;
	localSaved = localStore.getItem(activeProject.path+uri);
	activeFile = uri;
	selectInFileList(uri);
	if(localSaved) {
		codeMirror.setValue(localSaved); 
		codeMirror.setOption("mode",mode);
		log("Loading '" + uri + "' from local storage. Display as '" + mode + "'");
	}
	else {
		$.get("/scripts/load_file.php", {'file':encodeURI(projectsPath + activeProject.path + uri)}, function(data) {
			codeMirror.setValue(data);
			codeMirror.setOption("mode",mode);			
			fileNotChanged();
			log("Loading file '" + uri + "'. Display as '" + mode + "'");			
		});	
	}
	
	
	
}

function unloadFile() {
	$("#fileList li").removeClass("selected");
	activeFile = null;
	codeMirror.setValue("");
	return true;
}

function saveFile() {
	codeMirror.save();
	$form = $("#writer");
	
	if(activeFile) { 
		log("Save file");
		$("#uri").val(activeProject.path + activeFile);
		$.post("/scripts/save.php", $form.serialize(), function(data) {
			fileNotChanged();
		});
	}
	else {	
		log("Save As...");
		newFilename = prompt("Enter path:", activeFile);
		if(newFilename) {
			activeFile = newFilename;
			$("#uri").val(activeProject.path + activeFile);
			$.post("/scripts/save_as.php", $form.serialize(), function(data) {
				reloadFileList();
				fileNotChanged();
				setHash(activeProject.id + "/" + activeFile);
			});
		}
	}
}


function setHash(hash) {
	window.location.hash = hash;
}

function readHash() {
	newHash = window.location.hash;        
	console.log("Hash changed to: " + newHash);

	if(match = newHash.match(/^#(\d+)\/(.*)$/)) {
		project_id = match[1];
		uri = match[2];
	
		if(!activeProject || (activeProject && project_id!=activeProject.id)) openProject(project_id);
		if(uri) {
			loadFile(uri);
		} else {
			unloadFile();
		}
	} else {
		chooseProject();
	}

}


function chooseProject() {
	$("#choose_project").show();
	$("#writer").hide();
	$("#pageTitle").html("Choose project");
	activeProject = null;
}



function fileChanged() {
	var localStore = window.localStorage;  
    localStore.setItem(activeProject.path+activeFile, codeMirror.getValue()); 
	$("#fileList li.selected").addClass("changed");
	$("#btnSave").removeAttr("disabled");
}

function fileNotChanged() {
	$("#btnSave").attr("disabled", "disabled");
	$("#fileList li.selected").removeClass("changed");
	var localStore = window.localStorage;  
    localStore.removeItem(activeProject.path+activeFile);	
}

function numberOfUnsavedFiles() {
	return $("#fileList li.changed").length;
} 


function dim() {
	if(!$("#dimmer").length) {
		$dimmer = $(document.createElement('div')).appendTo("body");
	} else {
		$dimmer = $("#dimmer");
	}
	$dimmer
		.attr("id","dimmer")
		.appendTo("body")
		.fadeIn(600)
	;
}

function undim() {
	$("#dimmer").fadeOut(600);
}


function log(text) {
	if(printLog) {
		console.log(text);
	}
}


function toggleFolder($this) {
	$folderIcon = $this.children("span.fileIcon");
	if($folderIcon.hasClass("open")) {
		$folderIcon.removeClass("open");
		$this.children("ul").hide();
	} else {
		$folderIcon.addClass("open");
		$this.children("ul").show();
	}
}






function uploadFile(file, folder, overwrite) {
	log("ladda upp " + file.fileName);
	log(file);
	
	var xhr = new XMLHttpRequest();
	if (xhr.upload) {
		
		xhr.onreadystatechange = function(e) {
			if (xhr.readyState == 4) {
				if(xhr.status == 200) {
					if(xhr.response === "collision"){
						if(confirm("Do you want to overwirite the existing file?")) {
							uploadFile(file, folder, true)
						}
					} else {
						reloadFileList();
						$("#fileselect").val("");
						$('#fileList li[data-uri="'+file.name+'"]').hide().slideDown();
					}					
				} else {
					log("Error uploading file:");
					log(file);
				}
			}
		};
		
		xhr.open("POST", "/scripts/file_upload.php", true);
		xhr.setRequestHeader("X_FILENAME", file.name);
		xhr.setRequestHeader("X_PATH", projectsPath + activeProject.path + folder);
		xhr.setRequestHeader("X_OVERWRITE", overwrite);
		xhr.send(file);

	}
}


function dropFile(e) {
	hoverFile(e);
	log(e);
	
	var folder="";
	if($(e.target).closest("li[data-type=folder]").length) {
		var folder = $(e.target).closest("li[data-type=folder]").data("uri") + "/";
		var $newParent = $(e.target).closest("li[data-type=folder]").children("ul");
	} else {
		var folder="";
		var $newParent = $("#fileList>ul");
	}
	log("drop to folder /" + folder);	
	
	var $dragItem = $("#fileList").data("dragItem");
	if($dragItem) {
		$.get("/scripts/move_file.php",  {'uri':encodeURI(projectsPath + activeProject.path + $dragItem.data('uri')), 'toFolder':encodeURI(projectsPath + activeProject.path + folder)}, function() {
			reloadFileList();
		});
	}	
	
	var files = e.target.files || e.dataTransfer.files;
	for (var i = 0, f; f = files[i]; i++) {
		if(f.size>0) {
			uploadFile(f, folder, false)
		} else {
			log("FileUpload aborted: Filesize=0");
			log(f);
		}		
	}
}

function hoverFile(e) {
	e.stopPropagation();
	e.preventDefault();
	
	$target = $(e.target).closest("li[data-type=folder]");
	if(!$target.length) $target = $("#fileList");
	
	if(e.type == "dragover") {
		$target.addClass("dropTo");
	} else {
		$target.removeClass("dropTo")
	}
}


 
function initWriter() {
	
	
	codeMirror = CodeMirror.fromTextArea(document.getElementById("code"), {
		theme: "default",
		lineNumbers: true,
        matchBrackets: true,
        //mode: "php",
        indentUnit: 4,
        indentWithTabs: true,
        enterMode: "keep",
        //tabMode: "shift",
		onChange: function(text) {
			fileChanged();
		},
		onCursorActivity: function() {
			codeMirror.setLineClass(hlLine, null);
			hlLine = codeMirror.setLineClass(codeMirror.getCursor().line, "activeline");
		},
		onKeyEvent: function(editor, e) {
			if(e.type=="keydown" && e.keyCode==9) {
				log("tab!!");
				log("Key event");
				log(e);
				var cur = editor.getCursor();
				log(cur);
				
				token = this.getSearchCursor("b");
				log(token);
			}
		}
		
	});
	
	var hlLine = codeMirror.setLineClass(0, "activeline");
	

	$(codeMirror.getScrollerElement()).ColorPicker({
		flat:true,
		
		onSubmit: function(hsb, hex, rgb, el) {
			codeMirror.setSelection(selStart, selEnd);
			codeMirror.replaceSelection(hex);
			$(el).ColorPickerHide();
		}	
	});
	$(codeMirror.getScrollerElement()).ColorPickerHide();

	$(codeMirror.getScrollerElement()).bind("contextmenu", function(e) {
		selection = codeMirror.getSelection();
		if(selection.match("^#?[A-Fa-f0-9]{6}$")) {
			e.preventDefault();
			$(this).ColorPickerSetColor(selection.replace("#",""));
			selStart=codeMirror.getCursor(true);
			selEnd=codeMirror.getCursor(false);
			$(codeMirror.getScrollerElement()).ColorPickerShow();
		}		
	});

	
}

var selStart, selEnd;

 