<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

$user = Gatekeeper::getUser();
header('Content-Type: application/json');
echo json_encode($user);
?>