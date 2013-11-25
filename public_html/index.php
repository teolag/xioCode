<?php
require "../includes/init.php";

define("CODEMIRRORPATH", "/codemirror/");

$pageTitle = "xioCode";

$doorState = (Gatekeeper::hasAccess())? 'open' : '';

$themes = glob($_SERVER['DOCUMENT_ROOT'].CODEMIRRORPATH."theme/*.css");

?>

<!doctype html>
<html>
	<head>
		<title><?php echo $pageTitle; if(isLocal()) echo "(local)";?></title>
		<meta charset="utf-8" />	
		<link rel="stylesheet" href="<?php echo CODEMIRRORPATH; ?>lib/codemirror.css" type="text/css" />
		<link rel="stylesheet" href="<?php echo CODEMIRRORPATH; ?>theme/ambiance.css" type="text/css" />
		<link rel="stylesheet" href="<?php echo CODEMIRRORPATH; ?>theme/lesser-dark.css" type="text/css" />
		<link rel="stylesheet" href="<?php echo CODEMIRRORPATH; ?>theme/monokai.css" type="text/css" />
		<link rel="stylesheet" href="<?php echo CODEMIRRORPATH; ?>addon/dialog/dialog.css">
		<link rel="stylesheet" href="http://xio.se/projects/xiopop/XioPop.css">		
		<link rel="stylesheet" href="/scripts/cssMinify.php" type="text/css" />
		<link rel="shortcut icon" href="/images/favicon.ico" />
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
	</head>
	<body>
		<div id="header" class="hidden">
			<h1><span class="first">xio</span><span class="second">Code</span></h1>
			<?php if(isLocal()) echo "<div class='header-local'>local</div>" ?>
			<div id="userMenu">
				<div id="username"></div>
				<ul>
					<li id="btnExportAllZip">Export all</li>
					<li id="btnChangePassword">Change password</li>
					<li id="btnLogout">Logout</li>
				</ul>
				<!--
				<button id="btnExportAllZip" type="button" class="button24" title="Export all projects to a single zip-file"></button>
				<button id="btnChangePassword" type="button" class="button24" title="Change password"></button>
				<button id="btnLogout" type="button" class="button24" title="Logout"></button>
				-->
			</div>
			<span id="pageTitle">Projects</span>
		</div>
		
		<div class="door left <?php echo $doorState; ?>"></div>
		<div class="door right <?php echo $doorState; ?>"></div>

		<div id="login" class="hidden">
			<h1>xioCode</h1>
			<form action="/scripts/login.php" method="post" id="loginForm" autocomplete="off"> 
				<input type="text" name="code_username" id="inputUsername" placeholder="Username" autofocus />
				<input type="password" name="code_password" id="inputPassword" placeholder="Password" /><br />
				<button id="btnLogin" type="submit">Login</button>			
			</form>
		</div>

		<div id="choose_project" class="hidden">
			<input type="search" placeholder="Filter projects" id="projectFilter" />
			<button id="btnNewProject" type="button" class="button24" title="Create a new project"></button>
			<ul id="projects"></ul>			
		</div>
	
		<form id="writer" class="hidden">
			<div id="fileList"></div>
			<ul id="toolbar">						
				<li id="btnNew" title="Create new file"><div class="button32"></div></li>
				<li id="btnSave" title="Save file"><div class="button32"></div></li>
				<li id="btnRevert" title="Revert back to saved file"><div class="button32"></div></li>
				<li id="btnPreviewFile" title="Preview active file"><div class="button32"></div></li>
				<li id="btnPreviewProject" title="Preview project"><div class="button32"></div></li>
				<li id="btnExportZip" title="Export project to zip"><div class="button32"></div></li>
				<!--<li id="btnColorPicker"><div class="button32"></div></li>-->
				<li id="btnProjectConfig" title="Project configurations"><div class="button32"></div></li>
			</ul>
			<div id="editorWrapper">
				<textarea name="code" id="code"></textarea>		
			</div>			
		</form>
		
		<div id="imagePreview" class="hidden">
			<div id="imagePreviewImage"></div>
			<div id="imagePreviewInfo"></div>
		</div>
		
		<div id="fileListRightClickMenu" class="hidden">
			<ul>
				<li data-do="refresh" class="rootItem">Refresh</li>
				<li data-do="delete">Delete</li>
				<li data-do="newFolder" class="rootItem">New folder...</li>
				<li data-do="newFile" class="rootItem">New file...</li>
				<li data-do="rename">Rename...</li>
				<li data-do="upload" class="rootItem">Upload files...</li>
			</ul>
		</div>		
				
		<script src="/js/jquery-2.0.3.min.js"></script>
		
		<script src="<?php echo CODEMIRRORPATH; ?>lib/codemirror.js"></script>
		<script src="<?php echo CODEMIRRORPATH; ?>mode/xml/xml.js"></script>
		<script src="<?php echo CODEMIRRORPATH; ?>mode/javascript/javascript.js"></script>
		<script src="<?php echo CODEMIRRORPATH; ?>mode/css/css.js"></script>		
		<script src="<?php echo CODEMIRRORPATH; ?>mode/clike/clike.js"></script>		
		<script src="<?php echo CODEMIRRORPATH; ?>mode/php/php.js"></script>
		<script src="<?php echo CODEMIRRORPATH; ?>addon/dialog/dialog.js"></script>
		<script src="<?php echo CODEMIRRORPATH; ?>addon/edit/matchbrackets.js"></script>
		<script src="<?php echo CODEMIRRORPATH; ?>addon/search/search.js"></script>		
		<script src="<?php echo CODEMIRRORPATH; ?>addon/search/searchcursor.js"></script> 
		<script src="<?php echo CODEMIRRORPATH; ?>addon/search/match-highlighter.js"></script>
		<script src="<?php echo CODEMIRRORPATH; ?>addon/selection/active-line.js"></script>
				
		<script src="http://xio.se/projects/xiopop/XioPop.js"></script>
		<script>
			var projectsPath = '<?php echo PROJECT_FOLDER; ?>';
		</script>
		<script src="/js/writer.js"></script>
		<script src="/js/main.js"></script>
		
	</body>
</html>