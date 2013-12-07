<?php
session_start();

require "config.php";

define("ROOT", $_SERVER["DOCUMENT_ROOT"]."/");
define("PROJECT_FOLDER", $config['project_url']);
define("PROJECT_PATH", $config['project_uri']);
define("SALT", $config['database']['salt']);
define("PROJECT_CONFIG_FILE", "xiocode.properties");

$db = new DatabasePDO($config['database']['server'], $config['database']['username'], $config['database']['password'], $config['database']['name']);

function __autoload($className) {	
	$file = ROOT."../classes/" . $className.".php";
	if(is_file($file)) require($file);	
	else die("Class not found: " . $file);
}


function fixURI($name, $allLower=true) {  
	$replace = array('&'=>' and ', '@'=>' at ', '/'=>' slash ');
	
	$name = str_replace(array_keys($replace), $replace, $name);
	$name = preg_replace('/\s+/', '_', trim($name)); 
	setlocale(LC_ALL, 'sv_SE.UTF-8');
	$name = iconv('UTF-8', 'ASCII//TRANSLIT', $name);
	$name = preg_replace("|[^0-9a-z-_]*|i", "", $name);
	if($allLower) $name = strtolower($name);
	return $name;
}

function rrmdir($dir) { 
	if (is_dir($dir)) {
		$objects = scandir($dir);
		foreach ($objects as $object) {
			if ($object != "." && $object != "..") {
				if (filetype($dir."/".$object) == "dir") {
					rrmdir($dir."/".$object); 
				} else {
					unlink($dir."/".$object);
				}
			}
		} 
		reset($objects);
		rmdir($dir);
	} 
} 

?>