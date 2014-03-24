<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

$path = PROJECT_PATH . $_GET['project_id'] . "/" . urldecode($_GET['uri']);
if(!is_file($path)) {
	die("file: '" . $path . "' not found");
}

$filename = basename($_GET['uri']);



if(isset($_GET['download'])) {
	header("Content-disposition: attachment; filename=".$filename);
	readfile($filename);
} else {
	echo file_get_contents($path);
}
	


?>