<?php
require "../../includes/init.php";


if(get_magic_quotes_gpc()) $code = stripslashes($_POST['code']);
else $code = $_POST['code'];


$path = PROJECT_PATH . $_POST['project_id'] . "/" . $_POST['uri'];
if(is_dir(dirname($path))) {
	if(file_put_contents($path, $code)===FALSE) {
		http_response_code(400);
		die("Could not save file: ". $path);
	}
	http_response_code(200);
	die("File saved");
}
else {
	http_response_code(400);
	die("Can't find: '".$path."'");
}



?>