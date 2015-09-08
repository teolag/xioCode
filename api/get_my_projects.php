<?php

$userId = Gatekeeper::getUserId();

require("../classes/ProjectHandler.php");
$projects = ProjectHandler::getProjectsForUser($db, $userId);


$response['message'] = "returned all projects for user ". $userId;
$response['projects'] = $projects;
?>