<?php

$startTime = microtime(true);

require "../../includes/init.php";
Gatekeeper::checkAccess();

if(empty($_REQUEST['project_id'])) die("project_id must be specified");
if(empty($_REQUEST['uri'])) die("uri must be specified");


$path = PROJECT_PATH . $_REQUEST['project_id'] . "/";
$uri = urldecode($_REQUEST['uri']);

$exists = is_file($path.$uri);
$writeable = is_writeable($path.$uri);

/*
$processUser = posix_getpwuid(posix_getuid());
echo "Current user: " . $processUser['name'] . "<br>";

$processGroup = posix_getgrgid(posix_getgid());
echo "Current primary group: " . $processGroup['name'] . "<br>";

echo "<br>Current groups: ";
$groups = posix_getgroups();
foreach($groups as $gid) {
	echo posix_getgrgid($gid)['name'] . ", ";
}
*/


//sleep(5);


$overwrite = $_REQUEST['overwrite']==="true";

$response = array();
$response['uri'] = $uri;
if($exists && !$writeable) {
	$response['permissions'] = getFilePermissions($path.$uri);
	$response['owner'] = get_current_user();
	$response['group'] = posix_getgrgid(getmygid())["name"];
}

switch($_REQUEST['action']) {

	case "saveAs":
		$code = $_REQUEST['code'];
	case "new":
	if($exists && !$overwrite) {
		$response['status'] = STATUS_FILE_COLLISION;
		$response['message'] = "collision";
	} else {
		if(file_put_contents($path.$uri, $code)===FALSE) {
			$response['status'] = STATUS_FILE_COULD_NOT_CREATE;
			$response['message'] = "can not create file";
		} else {
			$response['status'] = STATUS_OK;
			$response['message'] = "new file created";
		}
	}
	break;

	
	
	case "save";
	$code = $_REQUEST['code'];
	if($exists) {
		if(!is_writable($path.$uri)) {
			$response['status'] = STATUS_FILE_COULD_NOT_UPDATE;
			$response['message'] = "could not write to file";
			break;
		}
	
		if(file_put_contents($path.$uri, $code)===FALSE) {
			$response['status'] = STATUS_FILE_COULD_NOT_UPDATE;
			$response['message'] = "could not save to file";
		} else {
			$response['status'] = STATUS_OK;
			$response['message'] = "file saved";
		}
	} else {
		$response['status'] = STATUS_FILE_NOT_EXIST;
		$response['message'] = "file does not exist";
	}
	break;
	
	
	
	
	case "rename";
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
	
	
	case "load":
	if($exists) {
		$finfo = finfo_open(FILEINFO_MIME);
		$mime = finfo_file($finfo, $path.$uri);
		$response['mime'] = $mime;
		if(substr($mime, 0, 4) === "text" || substr($mime, 0, 13) === "inode/x-empty" || substr($mime, 0, 13) === "image/svg+xml") {
			$text = file_get_contents($path.$uri);
			if($text === false) {
				$response['status'] = STATUS_FILE_NOT_READABLE;
				$response['message'] = "could not read file";
			} else {
				$response['text'] = $text;
				$response['status'] = STATUS_OK;
				$response['message'] = "file loaded";
			}
		} else {
			$response['status'] = STATUS_FILE_NOT_READABLE;
			$response['message'] = "the file is not a textfile. (".$mime.")";
		}
	} else {
		$response['status'] = STATUS_FILE_NOT_EXIST;
		$response['message'] = "file '" . $path.$uri ."' does not exist";
	}
	break;
	
	case "load_raw":
	readfile($path.$uri);
	exit();
	break;
	
	case "download":
	$filename = basename($uri);
	header("Content-disposition: attachment; filename=".$filename);
	readfile($path.$uri);
	exit();
	break;
	
		
	case "delete";	
	if(is_dir($path.$uri)) {
		if(rrmdir($path.$uri)) {
			$response['status'] = STATUS_OK;
			$response['message'] = "folder deleted";
		} else {
			$response['status'] = STATUS_FILE_COULD_NOT_DELETE;
			$response['message'] = "could not delete the folder";
		}
	} elseif(is_file($path.$uri)) {
		if(unlink($path.$uri)) {
			$response['status'] = STATUS_OK;
			$response['message'] = "file deleted";
		} else {
			$response['status'] = STATUS_FILE_COULD_NOT_DELETE;
			$response['message'] = "could not delete the file";
		}
	} else {
		$response['status'] = STATUS_FILE_NOT_EXIST;
		$response['message'] = "file or folder does not exist";
	}
	break;
	
	
	default:
	die("unknown action: " . $_REQUEST['action']);
}

http_response_code(200);
$response['timer'] = microtime(true)-$startTime;
echo json_encode($response);








function getFilePermissions($uri) {
	$perms = fileperms($uri);
	if (($perms & 0xC000) == 0xC000) {
		// Socket
		$info = 's';
	} elseif (($perms & 0xA000) == 0xA000) {
		// Symbolic Link
		$info = 'l';
	} elseif (($perms & 0x8000) == 0x8000) {
		// Regular
		$info = '-';
	} elseif (($perms & 0x6000) == 0x6000) {
		// Block special
		$info = 'b';
	} elseif (($perms & 0x4000) == 0x4000) {
		// Directory
		$info = 'd';
	} elseif (($perms & 0x2000) == 0x2000) {
		// Character special
		$info = 'c';
	} elseif (($perms & 0x1000) == 0x1000) {
		// FIFO pipe
		$info = 'p';
	} else {
		// Unknown
		$info = 'u';
	}

	// Owner
	$info .= (($perms & 0x0100) ? 'r' : '-');
	$info .= (($perms & 0x0080) ? 'w' : '-');
	$info .= (($perms & 0x0040) ?
				(($perms & 0x0800) ? 's' : 'x' ) :
				(($perms & 0x0800) ? 'S' : '-'));

	// Group
	$info .= (($perms & 0x0020) ? 'r' : '-');
	$info .= (($perms & 0x0010) ? 'w' : '-');
	$info .= (($perms & 0x0008) ?
				(($perms & 0x0400) ? 's' : 'x' ) :
				(($perms & 0x0400) ? 'S' : '-'));

	// World
	$info .= (($perms & 0x0004) ? 'r' : '-');
	$info .= (($perms & 0x0002) ? 'w' : '-');
	$info .= (($perms & 0x0001) ?
				(($perms & 0x0200) ? 't' : 'x' ) :
				(($perms & 0x0200) ? 'T' : '-'));

	return $info;
}
?>