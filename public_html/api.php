<?php
http_response_code(200);
$action = $_GET['action'];
$actionFile = "../api/" . $action . ".php";

require("../includes/init.php");

$response = array();
$response['action'] = $action;


if(Gatekeeper::hasAccess()) {
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