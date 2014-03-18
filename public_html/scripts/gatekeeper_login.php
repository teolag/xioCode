<?php
require "../../includes/init.php";

$user_id = Gatekeeper::login($_POST['code_username'], $_POST['code_password'], $db);
if($user_id>0) {
	$db->insert("INSERT INTO logins (user_id, ip, agent) VALUES (?,?,?)", array($user_id, ip2long($_SERVER['REMOTE_ADDR']), $_SERVER['HTTP_USER_AGENT']));
	echo json_encode(Gatekeeper::getUser($db));
} else {
	http_response_code(400);
	echo "0";
}
?>