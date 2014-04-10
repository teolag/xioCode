<?php
require "../../includes/init.php";
$expectedUserId = intval($_GET['user_id']);
$actualUserId = Gatekeeper::getUserId();


$response = array();
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
http_response_code(200);
echo json_encode($response);

?>