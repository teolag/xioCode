<?php
require "../../includes/init.php";

if(md5('litesalt'.$_GET['ip'].$_GET['user_id'])==$_GET['check']) {
	$db->insert("INSERT INTO valid_remote_addresses(ip, user_id) VALUES(?,?)", array($_GET['ip'], $_GET['user_id']));
	echo "The remote address was added successfully";
}
else {
	echo "Hee??";
}


?>