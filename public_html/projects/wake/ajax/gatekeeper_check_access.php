<?php
	require "../inc/users.php";
	
	session_start();
	
	if(isset($_SESSION['wake'])) {
		header(' ', true, 202);
		header('Content-Type: application/json');
		echo json_encode($users[$_SESSION['wake']]);
	} else {
		header(' ', true, 403);
	}
	
	
	
?>