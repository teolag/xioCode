<?php
$startTime = microtime(true);
require "../../includes/init.php";
Gatekeeper::checkAccess();
$userId = Gatekeeper::getUserId();
$response = array();



$parameters = array(
	$_POST['projects_order_by'],
	$_POST['projects_order_dir'],
	$userId	
);
$db->execute("UPDATE users SET projects_order_by=?, projects_order_dir=? WHERE user_id=?", $parameters);

print_r($parameters);






http_response_code(200);
$response['timer'] = microtime(true)-$startTime;
echo json_encode($response);

?>