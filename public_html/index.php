<?php

require "../includes/init.php";


define("CODEMIRRORPATH", "/codemirror/");

$pageTitle = "xioCode";

$jsUser = "null";
if(Gatekeeper::hasAccess()) {
	$loginState=" class='authorized'";
	$jsUser = json_encode(Gatekeeper::getUser($db));
}

$themes = glob($_SERVER['DOCUMENT_ROOT'].CODEMIRRORPATH."theme/*.css");

?>
<!doctype html>
<html>
	<head>
		<title><?php echo $pageTitle; ?></title>
		<meta charset="utf-8" />
		<!--
		<link rel="stylesheet" href="<?php echo CODEMIRRORPATH; ?>lib/codemirror.css" type="text/css" />
		<link rel="stylesheet" href="<?php echo CODEMIRRORPATH; ?>theme/ambiance.css" type="text/css" />
		<link rel="stylesheet" href="<?php echo CODEMIRRORPATH; ?>theme/lesser-dark.css" type="text/css" />
		<link rel="stylesheet" href="<?php echo CODEMIRRORPATH; ?>theme/neat.css" type="text/css" />
		<link rel="stylesheet" href="<?php echo CODEMIRRORPATH; ?>addon/dialog/dialog.css" type="text/css" />
		-->
		<link rel="stylesheet" href="http://xio.se/projects/xiopop/XioPop.css">
		<link rel="stylesheet" href="/scripts/minify_css.php" type="text/css" />
		<link rel="shortcut icon" href="/images/favicon.ico" />
		<link href='http://fonts.googleapis.com/css?family=Inconsolata' rel='stylesheet' type='text/css'>
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
	</head>
	<body<?php echo $loginState ?>>
		<div id="header">
			<h1><span class="first">xio</span><span class="second">Code</span></h1>
			<span id="pageTitle"></span>
			<div id="userMenu">
				<div><span class="el-icon-user"></span> <span id="username"></span></div>
				<ul>
					<li id="btnExportAllZip">Export all</li>
					<li id="btnChangePassword">Change password</li>
					<li id="btnLogout">Logout</li>
				</ul>
			</div>
		</div>
		
		

		<div id="projectChooser" class="hidden">
			<input type="search" placeholder="Filter projects" id="projectsFilter" />
			<span id="btnNewProject" class="el-icon-plus-sign icon-small" title="Create a new project"></span>
			<ul id="projectsList"></ul>			
		</div>
		
		<div id="projectArea" class="hidden">
	
			<div id="leftColumn">
				<div id="toolbar" class="toolbar">						
					<span id="btnNew" title="Create new file" class="icon-small icon-new-file"></span
					><span id="btnSave" title="Save file" class="icon-small icon-save"></span
					><span id="btnPreviewFile" title="Preview active file" class="icon-small icon-preview"></span
					><span id="btnPreviewProject" title="Preview project" class="icon-small icon-play"></span
					><span id="btnExportZip" title="Export project to zip" class="icon-small icon-archive"></span
					><span id="btnProjectConfig" title="Project configurations" class="icon-small icon-cog"></span>
				</div>
				<div id="fileList"></div>
			</div>
			
			
			<div id="xioDoc">
				<div id="xioDocTop">
					<ul id="openedList"></ul>
				</div>
					<textarea name="code" id="code"></textarea>		
				<!--<div id="editorWrapper"></div>-->
			</div>
		
		</div>
		
		<!-- Popups -->
		
		<div class="door left <?php echo $doorState; ?>"></div>
		<div class="door right <?php echo $doorState; ?>"></div>

		<div id="login">
			<h1><span class="first">xio</span><span class="second">Code</span></h1>
			<?php if(Git::isGit()) : ?>
			<div class="version"><?php echo Git::getCurrentBranch() . " " . date("ymd.Hi", Git::getLastCommitDate()); ?></div>
			<?php endif; ?>
			
			<form action="/scripts/login.php" method="post" id="loginForm" autocomplete="off"> 
				<input type="text" name="code_username" id="inputUsername" placeholder="Username" autofocus />
				<input type="password" name="code_password" id="inputPassword" placeholder="Password" /><br />
				<button id="btnLogin" type="submit">Login</button>			
			</form>
		</div>
		
		<div id="imagePreview" class="hidden">
			<div id="imagePreviewImage"></div>
			<div id="imagePreviewInfo"></div>
		</div>
		
		<div id="fileListRightClickMenu" class="hidden">
			<ul>
				<li data-do="refresh">Refresh</li>
				<li data-do="delete" class="fileOnly">Delete</li>
				<li data-do="newFolder">New folder...</li>
				<li data-do="newFile">New file...</li>
				<li data-do="rename" class="fileOnly">Rename...</li>
				<li data-do="upload">Upload files...</li>
			</ul>
		</div>		
		
		
		<script src="<?php echo CODEMIRRORPATH; ?>lib/codemirror.js"></script>
		<!--
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
				
		-->
		<script src="http://xio.se/projects/xiopop/XioPop.js"></script>
		
		<script>
			var projectsURL = '<?php echo PROJECT_FOLDER; ?>';
			var _USER = <?php echo $jsUser; ?>;
			<?php
			$codes = get_defined_constants();
			foreach($codes as $key => $value) {
				if(substr($key, 0, 6)==="STATUS") {
					echo "var " . $key . " = " . $value . ";";
				}
			}
			
			?>
		</script>
		<script src="/scripts/minify_js.php"></script>
		<!--
		<script src="/js/ajax.js"></script>
		<script src="/js/xioDocs.js"></script>
		<script src="/js/project_list.js"></script>
		<script src="/js/file_list.js"></script>
		<script src="/js/writer.js"></script>
		<script src="/js/main.js"></script>
		-->
	</body>
</html>