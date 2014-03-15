<?php
session_start();

require "config.php";

define("ROOT", $_SERVER["DOCUMENT_ROOT"]."/");
define("PROJECT_FOLDER", $config['project_url']);
define("PROJECT_PATH", $config['project_uri']);
define("SALT", $config['database']['salt']);
define("PROJECT_CONFIG_FILE", "xiocode.properties");
define("PROJECT_TODO_FILE", "xiocode.todo");



define("STATUS_OK", 1000);
define("STATUS_FILE_COLLISION", 2001);
define("STATUS_FILE_COULD_NOT_CREATE", 2002);
define("STATUS_FILE_COULD_NOT_UPDATE", 2003);
define("STATUS_FILE_NOT_EXIST", 2004);
define("STATUS_TODO_COULD_NOT_BE_SAVED", 2101);




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