<?php


/*

Öppnar xioCode

	AJAX: Är jag inloggad på xioCode? Gatekeeper::getUser()
		Ja: returnera användaren
		Nej: returnera status access_denied

	Logga in med användarnamn & lösenord
		Giltigt?
			Ja: Finns IPt?
				Ja: logga in och returnera den användaren
				Nej: skicka mail till användaren
			Nej: returnera access denied

	Logga in med google/twitter
		Öppnar popup
		redirectas tillbaka med en kod
		gör om koden till en token
		hämta userinfo från google
		Finns någon användare med googleId:t?
			Ja: Loggar den in från ett giltigt IP?
				Ja: Logga in och returnera den användaren
				Nej: Skicka mail till användaren
			Nej: Skicka mail till mig att någon vill logga in och bifoga uppgifterna



*/

















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



	//GET USER INFO
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

	$user = json_decode($result);








	$data = array(
		"status" => 100,
		"message" => "authorized google access",
		"expires" => $expires
	);
	?>
		<script>
			opener.OAuth2.authorized(<?php echo json_encode($data); ?>);
			window.close();
		</script>
	<?php
} else if($_GET["do"]==="checkAccess") {
	$response = array();
	$_SESSION['googleToken'] = $token;
	$_SESSION['googleTokenExpire'] = $expires;



}


/*
session_start();


$token = $_SESSION['googleToken'];


if(isset($token)) {
	//GET USER INFO
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

	$user = json_decode($result);
	var_dump($user);


	//header("Location: index.php");
}
*/
?>