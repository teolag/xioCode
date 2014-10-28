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
		<style>
			body {
				text-align: center;
				font-family: sans-serif;
				background-color: #aaa;
			}

			div {
				width: 300px;
				padding: 20px;
				margin: 100px auto;
				background-color: white;
			}

			h1 {
				color: #bada55;
				font-size: 120px;
				margin: 0;
			}

			h2 {
				color: #666;
				font-size: 30px;
				margin-top: 0;
			}
		</style>
	</head>
	<body class="error<?php echo $errorCode;?>">

		<div>
			<h1><?php echo $errorCode;?></h1>
			<h2><?php echo $description;?></h2>
		</div>

	</body>
</html>