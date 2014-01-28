<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

$path = PROJECT_PATH . $_GET['project_id'] . "/" . urldecode($_GET['uri']);
if(is_file($path)) {
	echo file_get_contents($path);
} else {
	die("file: '" . $path . "' not found");
}


?>