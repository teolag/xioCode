<?php


define("STATUS_OK", 1000);
define("STATUS_FILE_COLLISION", 2001);
define("STATUS_FILE_COULD_NOT_CREATE", 2002);
define("STATUS_FILE_COULD_NOT_UPDATE", 2003);


$codes = get_defined_constants();



require "../../includes/init.php";
Gatekeeper::checkAccess();

if(empty($_REQUEST['project_id'])) die("project_id must be specified");
if(empty($_REQUEST['uri'])) die("uri must be specified");


$path = PROJECT_PATH . $_REQUEST['project_id'] . "/";
$uri = urldecode($_REQUEST['uri']);

$exists = is_file($path.$uri);
$overwrite = $_REQUEST['overwrite']==="true";


$response = array();
switch($_REQUEST['do']) {

	case "saveAs":
		$code = $_REQUEST['code'];
	case "new":
	$response['uri'] = $uri;
	if($exists && !$overwrite) {
		$response['status'] = STATUS_FILE_COLLISION;
		$response['message'] = "collision";
	} else {
		if(file_put_contents($path.$uri, $code)===FALSE) {
			$response['status'] = STATUS_FILE_COULD_NOT_CREATE;
			$response['message'] = "can not create file";
			break;
		}
		$response['status'] = STATUS_OK;
		$response['message'] = "new file created";
	}
	break;

	
	
	case "save";
	/*
	if(get_magic_quotes_gpc()) $code = stripslashes($_POST['code']);
	else $code = $_POST['code'];
	
	
	$path = PROJECT_PATH . $_POST['project_id'] . "/" . $_POST['uri'];
	if(is_dir(dirname($path))) {
		if(file_put_contents($path, $code)===FALSE) {
			http_response_code(400);
			die("Could not save file: ". $path);
		}
		http_response_code(200);
		die("File saved");
	}
	else {
		http_response_code(400);
		die("Can't find: '".$path."'");
	}
	*/
	break;
	
	
	
	
	case "rename";
	/*
	if(empty($_GET['new_uri'])) die("new_uri must be set");

	$from = PROJECT_PATH . $_GET['project_id'] ."/". urldecode($_GET['from']);
	$to = PROJECT_PATH . $_GET['project_id'] ."/".  urldecode($_GET['to']);

	rename($from, $to);
	
	/*
	$projectPath = PROJECT_PATH . $_GET['project_id'] . "/";
	$from = urldecode($_GET['uri']);
	$to = urldecode($_GET['toFolder']) . basename($from);
	
	echo "Move ".$from." to " .$to;
	if(!rename($projectPath.$from, $projectPath.$to)) {
		http_response_code(400);
		die("Could not move file '$projectPath$from' to '$projectPath.$to'");
	}
	*/
	break;
	
	
	
		
	case "delete";
	/*
	unlink($path.$uri);
	*/
	break;

}

http_response_code(200);
echo json_encode($response);

?>