<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();


$userid = Gatekeeper::getUserId();

$items = glob(PROJECT_PATH."*", GLOB_ONLYDIR);
$projects = array();
foreach($items as $i) {
	$project = array("uri"=>$i, "project_id"=>basename($i));
	$configFile = $i."/".PROJECT_CONFIG_FILE;
	
	if(file_exists($configFile)) {
		$config = json_decode(file_get_contents($configFile), 1);
		if(!empty($config['creator_id']) && $config['creator_id']!=$userid) {
			continue;
		}
			
	} else {
		$config = array("name"=>basename($i));
		if(!file_put_contents($configFile, json_encode($config))) {
			http_response_code(400);
			die("could not save config file: ". $configFile);
		}
	}
	$projects[basename($i)] = $config;
}

header('Content-Type: application/json');
echo json_encode($projects);
?>