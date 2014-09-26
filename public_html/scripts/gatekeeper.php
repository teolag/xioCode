<?php
$startTime = microtime(true);

require "../../includes/init.php";

$response = array();


switch($_GET['action']) {

	case "login":
	$user_id = Gatekeeper::login($_POST['code_username'], $_POST['code_password'], $db);
	if($user_id>0) {
		$db->insert("INSERT INTO logins (user_id, ip, agent) VALUES (?,?,?)", array($user_id, ip2long($_SERVER['REMOTE_ADDR']), $_SERVER['HTTP_USER_AGENT']));
		$response['user'] = Gatekeeper::getUser($db);
		$response['status'] = STATUS_OK;
		$response['message'] = "Welcome " . $response['user']['username'];

	} else {
		$response['status'] = STATUS_AUTH_NO_ACCESS;
		$response['message'] = "Invalid username or password";
	}
	break;
	
	
	case "check":
	$expectedUserId = intval($_GET['user_id']);
	$actualUserId = Gatekeeper::getUserId();
	if(empty($actualUserId)) {
		$response['status'] = STATUS_AUTH_NO_ACCESS;
		$response['message'] = "not logged in";
	} else {
		if(empty($expectedUserId)) {
			$response['status'] = STATUS_AUTH_UNKNOWN_CURRENT_USER;
			$response['message'] = "cannot confirm current user";
		} else {
			if($expectedUserId==$actualUserId) {
				$response['status'] = STATUS_OK;
				$response['message'] = "logged in with id: " . $actualUserId;
			} else {
				$response['status'] = STATUS_AUTH_INCORRECT_USER;
				$response['message'] = "you are not logged in with id: " . $actualUserId;
			}
		}
	}
	break;
	
	/*
	case "current":
	Gatekeeper::checkAccess();
	$response['user'] = Gatekeeper::getUser($db);
	break;
	*/
	
	case "logout":
	session_start();
	unset($_SESSION['user_id']);
	$response['status'] = STATUS_OK;
	$response['message'] = "logged out successfully";
	break;
}

$response['timer'] = microtime(true)-$startTime;

http_response_code(200);
header('Content-Type: application/json');
echo json_encode($response);
?>