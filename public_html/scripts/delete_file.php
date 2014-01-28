<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

if(empty($_GET['uri'])) die("uri must be specified");

unlink(PROJECT_PATH . $_GET['project_id'] . "/" . urldecode($_GET['uri']));


?>