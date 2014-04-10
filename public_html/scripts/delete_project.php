<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

$projectId = $_POST['project_id'];
if(empty($projectId)) die("Project id must be set");

$projectDir = PROJECT_PATH . $projectId;

if(is_dir($projectDir)) {
	rrmdir($projectDir);
}

?>