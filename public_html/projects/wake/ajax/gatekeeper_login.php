<?php
	
	if(md5($_POST['pass'])=="51a9003e1159bfdd1f7f71425de54b59") {
		$username = "roffe";		
	} elseif(md5($_POST['pass'])=="37f525e2b6fc3cb4abd882f708ab80eb") {
		$username = "teodor";
	}
	
	if(isset($username)) {
		session_start();
		$_SESSION['wake'] = $username;
	}
	
	require "gatekeeper_check_access.php";
?>