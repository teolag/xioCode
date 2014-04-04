<?php

define("ROOT", $_SERVER["DOCUMENT_ROOT"]."/../");
$configFile = ROOT . "config.json";



$config = json_decode(file_get_contents($configFile), 1);
//print_r($config);




//Test database connection
$return = array("status"=>false);
$db = $config['database'];
if(empty($db['server'])) $return['messages'][] = "Database host must be specified";
if(empty($db['username'])) $return['messages'][] = "User name must be specified";
if(empty($db['password'])) $return['messages'][] = "User password must be specified";
if(empty($db['name'])) $return['messages'][] = "Database name must be specified";

if(!isset($return['messages'])) {
	try {
		$testConnection = new PDO('mysql:host='.$db['server'].';dbname='.$db['name'], $db['username'], $db['password']);
		$testConnection->exec('SET CHARACTER SET utf8');
		$return['status'] = 1;
		$return['messages'][] = "Connection OK";
	} catch(PDOException $e) {
		switch($e->getCode()) {
			case 1044:
			$return['messages'][] = "Database '".$db['name']."' does not exist or is invisible for you";
			break;
			
			case 1045:
			$return['messages'][] = "Access denied, no user with the specified username and password";
			break;
			
			default:
			$return['messages'][] = $e->getMessage();
		}
	}
}
echo json_encode($return);
?>
