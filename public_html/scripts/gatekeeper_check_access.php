<?php
require "../../includes/init.php";
$user_id = Gatekeeper::getUserId();
if($user_id>0) {
	http_response_code(202);
} else {
	http_response_code(401);
}
?>