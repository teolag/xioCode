<?php
session_start();
define("ROOT", $_SERVER["DOCUMENT_ROOT"]."/");
define("PROJECT_FOLDER", "projects/");
define("PROJECT_PATH", ROOT . PROJECT_FOLDER);
define("SALT", "d!g2%o#68AA34r296");
define("PROJECT_CONFIG_FILE", "xiocode.properties");

list($server, $username, $password, $name) = getDBInfo();
$db = new DatabasePDO($server, $username, $password, $name);

function __autoload($className) {	
	$file = ROOT."../classes/" . $className.".php";
	if(is_file($file)) require($file);	
	else die("Class not found: " . $file);
}

function isLocal() {
	if($_SERVER['SERVER_ADDR']=='127.0.0.1' || $_SERVER['SERVER_ADDR']=='192.168.0.102') return true;
	else return false;
}

function getDBInfo() {
    if(isLocal()) $dbInfo=array('localhost', 'xiod', 'koko', 'code');
    //else $dbInfo=array('mysql02.citynetwork.se', '105173-jk43008', 'Bastubad95', '105173-code');
    else $dbInfo=array('localhost', 'code', 'hjPMsDjZjMNNV6Et', 'code');
    return array($dbInfo[0], $dbInfo[1], $dbInfo[2], $dbInfo[3]);
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