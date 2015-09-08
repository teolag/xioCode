<?php
http_response_code(200);
$action = $_GET['action'];
$actionFile = "../api/" . $action . ".php";

$config = json_decode(file_get_contents("../config.json"),1) or die("Could not decode json");
define("PROJECT_FOLDER", $config['project_url']);
define("PROJECT_PATH", $config['project_uri']);
define("SALT", $config['database']['salt']);
define("PROJECT_CONFIG_FILE", "xiocode.properties");
define("PROJECT_TODO_FILE", "xiocode.todo");


require("../classes/Gatekeeper.php");
Gatekeeper::setSalt(SALT);

$response = array();
$response['action'] = $action;


session_start();
if(Gatekeeper::hasAccess()) {
	require("/git/DatabasePDO/DatabasePDO.php");

	$db = new DatabasePDO($config['database']['server'], $config['database']['username'], $config['database']['password'], $config['database']['name']);

	if(file_exists($actionFile)) {
		require $actionFile;
	} else {
		http_response_code(400);
		$response['message'] = "unknown api action: '" . $action . "'";
	}
} else {
	http_response_code(401);
	$response['message'] = "Access denied";
}

$json = json_encode($response, JSON_NUMERIC_CHECK);
$etagFile = md5($json);
$seconds_to_cache = 50;
$ts = gmdate("D, d M Y H:i:s", time() + $seconds_to_cache) . " GMT";

header('Content-Type: application/json');
header("Etag: $etagFile");
header("Expires: $ts");
header("Pragma: cache");
header("Cache-Control: private, max-age=$seconds_to_cache");


// RETURN 304 if json has not changed

echo $json;
?>