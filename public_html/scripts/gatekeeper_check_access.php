<?php
require "../../includes/init.php";
$user_id = Gatekeeper::getUserId();
if($user_id>0) {
	header(' ', true, 202);
} else {
	header(' ', true, 403);
}
?>