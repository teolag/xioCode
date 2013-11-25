<?php

require "inc/functions.php";
require "inc/pages.php";
$page = getPageToLoad($_GET['page'], $pages);

?>

<!doctype html>
<html>
	<head>
		<title>Wake</title>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
		<link rel="stylesheet" href="style.css" type="text/css" />
	</head>
	<body>
		<h1>Wake</h1>	
		
		
		<form id="loginForm" class="hidden">		
			<input type="password" name="pass" />
			<button type="submit">Login</button>		
		</form>
		
		<div id="header" class="hidden">
			<nav>
				<a href="" data-uri="start" class="navLink">Home</a>
				<a href="models" data-uri="models" class="navLink">Models</a>
			</nav>
		
			<button type="button" id="btnLogout">Logout</button>
		</div>
		
		<div id="page" class="hidden <?php echo $page["name"]; ?>">
			<?php include "pages/" . $page['filename']; ?>
		</div>		
		
		<script src="main.js"></script>
	</body>
</html>