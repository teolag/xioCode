<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

$projectId = $_POST['project_id'];
if(empty($projectId)) die("Project id must be set");
//$project = $db->getRow("SELECT * FROM projects WHERE project_id=?", array($projectId));


rrmdir(PROJECT_PATH . $projectId);
//$sql = "DELETE FROM projects WHERE project_id=?";
//$db->query($sql, array($projectId));


?>