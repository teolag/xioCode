<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

if(empty($_POST['project_id'])) {
	die("project_id must be specified");
}


$path = PROJECT_PATH . $_POST['project_id'] . "/" . $_POST['path'];
if(!is_dir($path)) {
	die("Path is not a valid folder. " . $path);
}

echo "Uploading to: " . $path ."<br />";

foreach($_FILES as $file) {
	if(move_uploaded_file($file["tmp_name"], $path . $file["name"])) {		
		header(' ', true, 200);	
		echo "'" . $file["name"] . "' uploaded<br />";		
	} else {
		header(' ', true, 400);	
		echo "knass!<br />";
	}
	
}

?>