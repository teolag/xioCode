<?php
require "../includes/init.php";

$pageTitle = "xioCode";

$jsUser = "null";
if(Gatekeeper::hasAccess()) {
	$loginState=" class='authorized'";
	$jsUser = json_encode(Gatekeeper::getUser($db));
}

?>
<!doctype html>
<html>
	<head>
		<title><?php echo $pageTitle; ?></title>
		<meta charset="utf-8" />
		<link rel="stylesheet" href="/scripts/minify_css.php" type="text/css" />
		<link rel="shortcut icon" href="/favicon.ico" />
		<link href='http://fonts.googleapis.com/css?family=Roboto|Inconsolata' rel='stylesheet' type='text/css'>
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />

		<link rel="stylesheet" href="http://cdn.xio.se/xioPop/dev/XioPop.css" type="text/css" />
		<script src="http://cdn.xio.se/xioPop/dev/XioPop.js"></script>
		<script src="http://cdn.xio.se/AjaXIO/dev/AjaXIO.js"></script>

	</head>
	<body<?php echo $loginState ?>>
		<div id="header">
			<h1>
				<span class="first">xio</span><span class="second">Code</span>
				<span class="first tiny">X</span><span class="second tiny">C</span>
			</h1>

			<span id="pageTitle"></span>

			<ul id="projectToolbar" class="toolbar">
				<li data-action="run"><svg class="icon run"><use xlink:href="/icons.svg#icon-run" /></svg></li>
				<li data-action="export"><svg class="icon export"><use xlink:href="/icons.svg#icon-export" /></svg></li>
				<li data-action="config"><svg class="icon config"><use xlink:href="/icons.svg#icon-config" /></svg></li>
			</ul>

			<div id="userMenu">
				<div class="button">
					<svg class="icon user"><use xlink:href="/icons.svg#icon-user" /></svg>
					<span id="username"></span>
				</div>
				<ul>
					<li data-action="exportAll"><svg class="icon export"><use xlink:href="/icons.svg#icon-export" /></svg>Export all</li>
					<li data-action="changePassword"><svg class="icon key"><use xlink:href="/icons.svg#icon-key" /></svg>Change password</li>
					<li data-action="logout"><svg class="icon off"><use xlink:href="/icons.svg#icon-off" /></svg>Logout</li>
				</ul>
			</div>
		</div>

		<div id="projectChooser" class="hidden">
			<div id="projectFilter">
				<input type="search" placeholder="Filter projects" id="txtProjectFilter" />
				<svg id="btnNewProject" class="icon add" title="Create a new project"><use xlink:href="/icons.svg#icon-add" /></svg>
				<select id="listProjectOrderBy" class="orders">
					<option data-order="name" data-order_dir="asc">Name A-Z</option>
					<option data-order="name" data-order_dir="desc">Name Z-A</option>
					<option data-order="created" data-order_dir="asc">Create date first-last</option>
					<option data-order="created" data-order_dir="desc">Create date last-first</option>
					<option data-order="opened" data-order_dir="asc">Last opened</option>
					<option data-order="opened" data-order_dir="desc">Last opened reversed</option>
				</select>
				<ul id="listProjectTags" class="tags"></ul>
			</div>
			<div id="projectList"></div>
		</div>


		<div id="projectArea" class="hidden">

			<div id="fileBrowser" class="pane">
				<ul class="toolbar">
					<li data-action="new"><svg class="icon file"><use xlink:href="/icons.svg#icon-file" /></svg></li>
					<li data-action="reload"><svg class="icon reload"><use xlink:href="/icons.svg#icon-reload" /></svg></li>
				</ul>
				<div id="fileList"></div>
			</div>

			<div class="divider" data-subject="fileBrowser"></div>

			<div class="pane codeEditor" id="paneEditor1"></div>
			<!--<div class="pane codeEditor" id="paneEditor2"></div>-->

			<div id="preview" class="pane">
				<iframe src="" id="previewFrame" width="100%" height="100%"></iframe>
			</div>

			<div class="divider" data-subject="todoArea" data-subject_pos="right"></div>
			<div id="todoArea" class="pane">
				<div class="button" id="btnAddFeature">
					<svg class="icon feature"><use xlink:href="/icons.svg#icon-feature" /></svg>
					Add feature
				</div>
				<div class="button" id="btnAddBug">
					<svg class="icon bug"><use xlink:href="/icons.svg#icon-bug" /></svg>
					Add bug
				</div>

				<ol id="listTodos"></ol>
				<ul id="listTodosDone"></ul>
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
				<li data-do="preview">Preview</li>
				<li data-do="refresh">Refresh</li>
				<li data-do="newFolder">New folder...</li>
				<li data-do="newFile">New file...</li>
				<li data-do="saveAs" class="fileOnly">Save As...</li>
				<li data-do="rename" class="fileOnly">Rename...</li>
				<li data-do="export" class="fileOnly">Export</li>
				<li data-do="delete" class="fileOnly">Delete</li>
				<li data-do="upload">Upload files...</li>
			</ul>
		</div>

		<?php require $_SERVER['DOCUMENT_ROOT']."/html_templates.php"; ?>

		<script>
			var
			projectsURL = '<?php echo PROJECT_FOLDER; ?>',
			<?php
			$codes = get_defined_constants();
			foreach($codes as $key => $value) {
				if(substr($key, 0, 6)==="STATUS") {
					echo $key . " = " . $value . ", ";
				}
			}
			?>
			_USER = <?php echo $jsUser; ?>;
		</script>
		<script src="/scripts/minify_js.php"></script>
	</body>
</html>