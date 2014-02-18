<?php

$startTime = microtime(true);

require "../../includes/init.php";
Gatekeeper::checkAccess();

if(empty($_REQUEST['project_id'])) die("project_id must be specified");
if(empty($_REQUEST['uri'])) die("uri must be specified");


$path = PROJECT_PATH . $_REQUEST['project_id'] . "/";
$uri = urldecode($_REQUEST['uri']);

$exists = is_file($path.$uri);
$overwrite = $_REQUEST['overwrite']==="true";


$response = array();
switch($_REQUEST['action']) {

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
	$response['uri'] = $uri;
	$code = $_REQUEST['code'];
	if($exists) {
		if(file_put_contents($path.$uri, $code)) {
			$response['status'] = STATUS_OK;
			$response['message'] = "file saved";
		} else {
			$response['status'] = STATUS_FILE_COULD_NOT_UPDATE;
			$response['message'] = "could not save to file";
		}
	} else {
		$response['status'] = STATUS_FILE_NOT_EXIST;
		$response['message'] = "file does not exist";
	}
	break;
	
	
	
	
	case "rename";
	$response['uri'] = $uri;
	$newUri = urldecode($_GET['new_uri']);
	$response['newUri'] = $newUri;
	if(empty($newUri)) die("new_uri must be set");
	if(!$overwrite && is_file($path.$newUri)) {
		$response['status'] = STATUS_FILE_COLLISION;
		$response['message'] = "filename already exists";
	} elseif(rename($path.$uri, $path.$newUri)) {
		$response['status'] = STATUS_OK;
		$response['message'] = "file renamed";
	} else {
		$response['status'] = STATUS_FILE_COULD_NOT_UPDATE;
		$response['message'] = "could not rename file";
	}
	break;
	
	
	
		
	case "delete";
	/*
	unlink($path.$uri);
	*/
	break;
	
	
	default:
	die("unknown action: " . $_REQUEST['action']);
}

http_response_code(200);
$response['timer'] = microtime(true)-$startTime;
echo json_encode($response);

?>