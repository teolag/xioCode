<?php
require "../../includes/init.php";


if(get_magic_quotes_gpc()) $code = stripslashes($_POST['code']);
else $code = $_POST['code'];


$path = PROJECT_PATH . $_POST['project_id'] . "/" . $_POST['uri'];
if(is_dir(dirname($path))) {
	http_response_code(200);
	file_put_contents($path, $code);
}
else {
	http_response_code(400);
	echo "Can't find: '".$path."'";
}



?>