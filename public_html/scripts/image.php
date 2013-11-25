<?php

//CONSTANTS
define("IMAGEMAGICK_CLASS", 1);
define("IMAGEMAGICK_SYSTEM", 2);
define("GD", 3);

define("DO_NOT_ENLARGE", true);

define("VIEW", 1);
define("SAVE", 2);


//INPUT
if(!isset($_REQUEST['src'])) die("input image must be set");
$file = $_SERVER["DOCUMENT_ROOT"]."/".$_REQUEST['src'];
$filetype = strtolower(pathinfo($file, PATHINFO_EXTENSION)); 

if(isset($_REQUEST['output'])) {
	$output = $_SERVER["DOCUMENT_ROOT"]."/".$_REQUEST['output'];
	$do = SAVE;
} else {
	$do = VIEW;
}

$quality = isset($_REQUEST['quality'])? $_REQUEST['quality'] : 80;

$max_width = isset($_REQUEST['max_width'])? $_REQUEST['max_width'] : -1;
$max_height = isset($_REQUEST['max_height'])? $_REQUEST['max_height'] : -1;
$scale = isset($_REQUEST['scale'])? $_REQUEST['scale'] : -1;



//CALCULATE NEW SIZE
list($width, $height) = getimagesize($file);
$ratio = $width/$height;

if(DO_NOT_ENLARGE) {
	if($max_width>$width) $max_width=$width;
	if($max_height>$height) $max_height=$height;
}
if($max_width>0 && $max_height>0) {
	$new_ratio = $max_width / $max_height;
	if($new_ratio < $ratio) {
		$new_width = $max_width;
		$new_height = $new_width/$ratio;
	} else {
		$new_height = $max_height;
		$new_width = $new_height*$ratio;
	}	
} elseif($max_width>0) {
	$new_width = $max_width;
	$new_height = $new_width/$ratio;
} elseif($max_height>0) {
	$new_height = $max_height;
	$new_width = $new_height*$ratio;
} elseif($scale>0) {
	$new_height = $height*$scale;
	$new_width = $width*$scale;
} else {
	$new_height = $height;
	$new_width = $width;
}
$new_width = round($new_width);
$new_height = round($new_height);


//IMAGE PROCESSOR TO USE
$mode=-1;
if(class_exists("Imagick")) {
	$mode = IMAGEMAGICK_CLASS;
} elseif(function_exists("system") || function_exists("exec") || function_exists("passthru")) {
	$mode = IMAGEMAGICK_SYSTEM;
} elseif(extension_loaded('gd') && function_exists('gd_info')) {
	$mode = GD;
}




switch($mode) {

	case GD:
		$newImage = imagecreatetruecolor($new_width, $new_height);
		$original = gdLoad($file); 
		imagecopyresampled($newImage, $original, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
		if($do==VIEW) {
			printHeader($filetype);
			gdPrint($newImage, $filetype, $quality); 
		} elseif($do==SAVE) {
			gdSave($newImage, $output, $quality);
		}
	break;
	
	
	case IMAGEMAGICK_CLASS:
		$im = new Imagick($file);
		$im->resizeImage($new_width,$new_height, imagick::FILTER_CATROM , 1, true);
		if($do==VIEW) {
			header("Content-Type: image/png");
			echo $im;
		} elseif($do==SAVE) {
			$im->writeImage($output);
		}
		$im->clear();
		$im->destroy();
	break;


	case IMAGEMAGICK_SYSTEM:
		$params = array();
		$params[] = "convert";
		$params[] = '"' . $file . '"';
		$params[] = "-resize {$new_width}x{$new_height}";
		if($do==VIEW) {
			printHeader($filetype);
			$params[] = $filetype . ":-";
			passthru(implode(" ",$params), $retval);
		} elseif($do==SAVE) {
			$params[] = '"' . $output . '"';
			exec(implode(" ",$params));
		}
	break;
}
































function gdLoad($file) {
	$filetype = strtolower(pathinfo($file, PATHINFO_EXTENSION)); 
	switch($filetype) {
		case "jpg": case "jpeg":
		$image = imagecreatefromjpeg($file); 
		break;
		
		case "png":
		$image = imagecreatefrompng($file); 
		break;
	}
	return $image;
}

function gdSave($image, $file=null, $quality=80) {
	$filetype = strtolower(pathinfo($file, PATHINFO_EXTENSION));
	switch($filetype) {
		case "jpg": case "jpeg":
		imagejpeg($image, $file, $quality); 
		break;
		
		case "png":
		imagepng($image, $file); 
		break;
	}
}


function gdPrint($image, $filetype, $quality=80) {
	switch($filetype) {
		case "jpg": case "jpeg":
		imagejpeg($image, null, $quality); 
		break;
		
		case "png":
		imagepng($image); 
		break;
	}
}



function printHeader($filetype) {
	switch($filetype) {
		case "jpg": case "jpeg":
		header('Content-type: image/png');
		break;
		
		case "png":
		header('Content-type: image/png');
		break;
	}
}

?>

