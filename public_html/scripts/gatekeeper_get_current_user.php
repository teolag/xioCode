<?php
require "../../includes/init.php";
$user_id = Gatekeeper::getUserId();

if($user_id>0) {
	$user = $db->getRow("SELECT user_id, username, email FROM users WHERE user_id=? LIMIT 1", array($user_id));
	header('Content-Type: application/json');
	echo json_encode($user);
} else {
	echo "Access denied";
}
?>