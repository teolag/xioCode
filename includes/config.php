<?php

//READ CONFIG FILE
$configFile = $_SERVER["DOCUMENT_ROOT"]."/../config.json";
if(!is_file($configFile)) {
	die("Could not find config file: ". $configFile);
}
$config = json_decode(file_get_contents($configFile), 1);

?>