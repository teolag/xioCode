<?php
$userId = Gatekeeper::getUserId();
require("../classes/ProjectHandler.php");

$projectId = $_POST['projectId'];
if(empty($projectId)) die("Project id must be set");


//The final path must contain the project path
if(isValidSubpath($projectId, PROJECT_PATH)) {
	ProjectHandler::deleteProject($projectId, $userId);
	$response['massage'] = "Project deleted";

} else {
	$response['massage'] = "Invalid projectId";
	http_response_code(400);
}



function isValidSubpath($subpath, $base) {
	$realpath = realpath($base . $subpath);
	$realbase = realpath($base);

	if($realpath == $realbase) {
		return false;
	}
	if(strpos($realpath, $realbase)===false) {
		return false;
	}
	return true;
}


?>