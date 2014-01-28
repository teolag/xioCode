<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();


if(isset($_GET['from']) && isset($_GET['from'])) {

	$from = PROJECT_PATH . $_GET['project_id'] ."/". urldecode($_GET['from']);
	$to = PROJECT_PATH . $_GET['project_id'] ."/".  urldecode($_GET['to']);

	rename($from, $to);

} else die("from and to must be set");

?>