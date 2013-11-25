<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

if(empty($_POST['project_id']) || empty($_POST['file'])) {
	die("project_id and file must be specified");
}


$path = PROJECT_PATH . $_POST['project_id'] . "/" . $_POST['file'];

if(file_exists($path)) {
	header(' ', true, 409);		
	echo "The file '" . $_POST['file'] . "' already exists!";	
} else {
	header(' ', true, 202);
	echo "Ok! no collision: " . $path;
}

?>