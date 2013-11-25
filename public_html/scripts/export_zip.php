<?php
require "../../includes/init.php";

	
	
//Show errors
ini_set('display_errors',1);
error_reporting(E_ALL);


if(isset($_GET['path']) && is_dir(PROJECT_PATH . $_GET['path'])) {
	$path = PROJECT_PATH . $_GET['path'];
} else {
	die("Invalid path");
}
$pathInfo = pathinfo($path);

$temp = findFiles($path);
$files = array();
foreach($temp as &$file) {
	$files[$file] = substr($file, strlen($pathInfo['dirname'])+1, 486);
}

//print_r($files);
$result = create_zip($files, $pathInfo['basename'], true);



function findFiles($path) {
	$files = glob($path."*");
	$fileList = array();
	foreach($files as $file) {
		if(is_dir($file)) {
			$fileList = array_merge($fileList, findFiles($file."/"));
		} else {
			$fileList[] = $file;
		}
	}	
	return $fileList;
}


function create_zip($files = array(), $destination='', $overwrite=false) {
	if(file_exists("export.zip") && !$overwrite) die("File already exists");
	
	$valid_files = array();
	if(is_array($files)) {
		foreach($files as $file => $name) {
			if(file_exists($file)) {
				$valid_files[$file] = $name;
			}
		}
	}
	
	//if we have good files...
	if(count($valid_files)) {
		
		//create the archive
		$zip = new ZipArchive();
		if($zip->open("export.zip",$overwrite ? ZIPARCHIVE::OVERWRITE : ZIPARCHIVE::CREATE) !== true) {
			die("Could not crate file export.zip");
		}
		
		//add the files
		foreach($valid_files as $file => $name) {
			$zip->addFile($file,$name);		
		}
		
		if(isset($_GET['filename'])) $filename = $_GET['filename'];
		else $filename = $destination . ".zip";
		
		$zip->close();
		header("Content-type: application/zip");
		header("Content-Disposition: attachment; filename=".$filename);
		header("Pragma: no-cache");
		header("Expires: 0");
		readfile("export.zip");
	}
	else { 
		return "bad files";
	}
}



?>