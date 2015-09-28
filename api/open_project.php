<?php
$projectId = $_REQUEST['project_id'];
if(empty($projectId)) {
	die("project_id must be defined");
}

$userId = Gatekeeper::getUserId();
$configFile = PROJECT_PATH . $projectId . "/" . PROJECT_CONFIG_FILE;

$config = json_decode(file_get_contents($configFile), 1);
$config["last_opened"] = time();
file_put_contents($configFile, json_encode($config));



$response["message"] = "last opened updated";
$response["lastOpened"] = $config["last_opened"];
$response["project"] = ProjectHandler::getProject($db, $projectId, $userId);


?>