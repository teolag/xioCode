<?php
require "../../includes/init.php";
if(empty($_GET['uri'])) die("uri must be specified");

rrmdir(PROJECT_PATH . $_GET['project_id'] . "/" . urldecode($_GET['uri']));

?>