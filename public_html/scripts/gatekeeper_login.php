<?php
require "../../includes/init.php";

$user_id = Gatekeeper::login($_POST['code_username'], $_POST['code_password'], $db);
if($user_id>0) {
	$db->insert("INSERT INTO logins (user_id, ip, agent) VALUES (?,?,?)", array($user_id, ip2long($_SERVER['REMOTE_ADDR']), $_SERVER['HTTP_USER_AGENT']));
	$user = $db->getRow("SELECT user_id, username, email FROM users WHERE user_id=? LIMIT 1", array($user_id));
	echo json_encode($user);
} else {
	echo "0";
}


?>