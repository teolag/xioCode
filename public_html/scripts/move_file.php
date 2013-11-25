<?php
require "../../includes/init.php";

$projectPath = PROJECT_PATH . $_GET['project_id'] . "/";
$from = urldecode($_GET['uri']);
$to = urldecode($_GET['toFolder']) . basename($from);

echo "Move ".$from." to " .$to;
rename($projectPath.$from, $projectPath.$to);
die();


?>