<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

$path = PROJECT_PATH . $_GET['project_id'] ."/". urldecode($_GET['uri']);
if(is_dir(dirname($path))) {
	http_response_code(200);
	mkdir($path);
} else {
	http_response_code(400);
	echo "Can't find: '".$path."'";
}





?>