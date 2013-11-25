<?php
require "../../includes/init.php";


$projectId = $_POST['project_id'];

$newName = $_POST['new_name'];
$newPath = fixURI($newName);






$configFile = "../projects/".$projectId."/".PROJECT_CONFIG_FILE;
$config = json_decode(file_get_contents($configFile), 1);
$config['name'] = $newName;
file_put_contents($configFile, json_encode($config));

rename("../projects/".$projectId, "../projects/".$newPath);

//$sql = "UPDATE projects SET name=?, path=? WHERE project_id=?";
//$db->update($sql, array($newName, $newPath, $projectId));


?>