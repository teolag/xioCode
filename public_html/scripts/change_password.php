<?php
require "../../includes/init.php";

$user_id = Gatekeeper::getUserId();
if(!empty($user_id)) {
	Gatekeeper::changePassword($_POST['newPass'], $db);
	echo "Password changed.";
} else {
	echo "Not autorized to update user password";
}


?>