<?php
$startTime = microtime(true);

require "../../includes/init.php";

if(isset($_GET['code'])) {
	// GET TOKEN
	$fields=array(
		'code'=>  urlencode($_GET['code']),
		'client_id'=>  urlencode($config['oauth2']['clientId']),
		'client_secret'=>  urlencode($config['oauth2']['clientSecret']),
		'redirect_uri'=>  urlencode($config['oauth2']['redirectUri']),
		'grant_type'=>  urlencode('authorization_code')
	);
	$post = '';
	foreach($fields as $key=>$value) {
		$post .= $key.'='.$value.'&';
	}
	$post = rtrim($post,'&');

	$curl = curl_init();
	curl_setopt($curl, CURLOPT_URL,'https://accounts.google.com/o/oauth2/token');
	curl_setopt($curl, CURLOPT_POST,5);
	curl_setopt($curl, CURLOPT_POSTFIELDS, $post);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
	$result = curl_exec($curl);
	curl_close($curl);

	$json = json_decode($result);

	$token = $json->access_token;
	$expires = time() + $json->expires_in;
	$_SESSION['googleToken'] = $token;
	$_SESSION['googleTokenExpire'] = $expires;



	//GET GOOGLE USER INFO
	$url = "https://www.googleapis.com/oauth2/v3/userinfo";
	$curl = curl_init();
	$headers = array(
		"Authorization: Bearer " . $token,
		"GData-Version: 3.0",
	);
	curl_setopt($curl, CURLOPT_URL, $url);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
	curl_setopt($curl, CURLOPT_POST, false);
	$result = curl_exec($curl);
	curl_close($curl);

	$googleUser = json_decode($result);

	// GET USER INFO FROM DB
	$user = $db->getValue("SELECT user_id FROM users WHERE google_id=?", array($googleUser->sub));
	$userId = Gatekeeper::login($user['user_id'], $db);
	$user = Gatekeeper::getUser($db);

	$data = array(
		"status" => 100,
		"message" => "authorized google access",
		"expires" => $expires,
		"user" => $user
	);
	?>
		<script>
			opener.GateKeeper.googleLoginCallback(<?php echo json_encode($data); ?>);
			window.close();
		</script>
	<?php
} else if($_GET["do"]==="checkAccess") {
	$response = array();
	$_SESSION['googleToken'] = $token;
	$_SESSION['googleTokenExpire'] = $expires;
}


?>