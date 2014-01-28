<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

$projectPath = PROJECT_PATH . $_GET['project_id'] . "/";
$from = urldecode($_GET['uri']);
$to = urldecode($_GET['toFolder']) . basename($from);

echo "Move ".$from." to " .$to;
if(!rename($projectPath.$from, $projectPath.$to)) {
	http_response_code(400);
	die("Could not move file '$projectPath$from' to '$projectPath.$to'");
}





?>