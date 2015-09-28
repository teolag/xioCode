<?php
Gatekeeper::checkAccess();

$userId = Gatekeeper::getUserId();


$name = $_POST['name'];
$path = fixURI($name);


$num=0;
$testPath = $path;
while(is_dir(utf8_decode(PROJECT_PATH.$testPath))) {
	$num++;
	$testPath = $path.$num;
}
$path = $testPath;
mkdir(utf8_decode(PROJECT_PATH.$path), 0755, 1);

$configFile = PROJECT_PATH.$path."/".PROJECT_CONFIG_FILE;
$config = array("name"=>$name, "creator_id"=>$userId, "created"=>time());
file_put_contents($configFile, json_encode($config));

$response['name'] = "Project '" . $name . "' was created (" . $path . ")";
$response['projectId'] = $path;


?>