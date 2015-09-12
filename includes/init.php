<?php
session_start();
define("ROOT", realpath($_SERVER["DOCUMENT_ROOT"]."/..")."/");

//READ CONFIG FILE
$configFile = ROOT."config.json";
if(!is_file($configFile)) {
	die("Could not find config file: ". $configFile);
}
$config = json_decode(file_get_contents($configFile), 1);


define("PROJECT_FOLDER", $config['project_url']);
define("PROJECT_PATH", $config['project_uri']);
define("SALT", $config['database']['salt']);
define("PROJECT_CONFIG_FILE", "xiocode.properties");
define("PROJECT_TODO_FILE", "xiocode.todo");



define("STATUS_OK", 1000);
define("STATUS_FILE_COLLISION", 2001);
define("STATUS_FILE_COULD_NOT_CREATE", 2002);
define("STATUS_FILE_COULD_NOT_UPDATE", 2003);
define("STATUS_FILE_COULD_NOT_DELETE", 2004);
define("STATUS_FILE_NOT_EXIST", 2005);
define("STATUS_FILE_NOT_READABLE", 2006);

define("STATUS_AUTH_NO_ACCESS", 2201);
define("STATUS_AUTH_FOUND_ACCESS", 2202);
define("STATUS_AUTH_INCORRECT_USER", 2203);



$db = new DatabasePDO($config['database']['server'], $config['database']['username'], $config['database']['password'], $config['database']['name']);
Gatekeeper::setSalt(SALT);


function __autoload($className) {
	global $config;
	switch($className) {
		case "DatabasePDO":
		$file = $config['class_paths']['DatabasePDO'];
		break;

		case "PHPMailer":
		$file = $config['class_paths']['PHPMailer'];
		break;

		default:
		$file = ROOT."classes/" . $className.".php";
	}

	if(is_file($file)) require($file);
	else die("Class '".$className."' not found: " . $file);
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
	if(is_dir($dir)) {
		$objects = scandir($dir);
		foreach ($objects as $object) {
			if ($object != "." && $object != "..") {
				if (filetype($dir."/".$object) == "dir") {
					if(!rrmdir($dir."/".$object)) {
						return false;
					}
				} else {
					if(!unlink($dir."/".$object)) {
						return false;
					}
				}
			}
		}
		reset($objects);
		rmdir($dir);
		return true;
	}
}

?>