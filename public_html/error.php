<?php

	$errorCode = $_SERVER["REDIRECT_STATUS"];
	switch($errorCode) {
		case 403:
		$description = "Access denied";
		break;
		
		case 404:
		$description = "Page not found";
		break;
		
		default:
		$description = "Unknown error";
	
	}



?>



<!doctype html>
<html>
	<head>
		<title>xioCode - error <?php echo $errorCode;?></title>
		<meta charset="utf-8" />
		<link rel="stylesheet" href="/error.css" type="text/css" />
	</head>
	<body class="error<?php echo $errorCode;?>">
	
		<div>
			<h1><?php echo $errorCode;?></h1>
			<h2><?php echo $description;?></h2>
		</div>
		
	</body>
</html>