<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

//$finfo = finfo_open(FILEINFO_MIME_TYPE);

define("FOLDER", "folder");

function lookInFolder($path, $relPath="") {
	//global $finfo;
		
	$items = scandir($path);
	
	
	$branches = array();
	foreach($items as $i) {
		$parts = pathinfo($path.$i);
		$branch=array();
		$branch['filename']=$i;
		$branch['path']=$relPath;
		if($i=="." || $i=="..") {
			continue;
		}
		
		if(is_dir($path.$i)) {
			$branch['type'] = FOLDER;
			$branch['icon'] = "folder";
			$branch['leafs'] = lookInFolder($path.$i."/", $relPath.$i."/");
		}
		else {
			$branch["size"] = filesize($path.$i);
			//$branch["mime"] = finfo_file($finfo, $path.$i);
			if($imageInfo = getimagesize($path.$i)) {
				$branch["width"] = $imageInfo[0];
				$branch["height"] = $imageInfo[1];
			}
			if(isset($parts['extension'])) {
				$branch['type'] = strtolower($parts['extension']);
				switch($branch['type']) {
					case "png": case "jpg": case "jpeg": 
					$branch['icon'] = "file-image"; break;

					case "htm": case "html": case "xml": 
					$branch['icon'] = "file-xml"; break;
					
					case "css":
					$branch['icon'] = "file-css"; break;
					
					default: $branch['icon'] = "file";					
				}				
			} else {
				$branch['type'] = "";
				$branch['icon'] = "file";
			}
		}
		$branches[] = $branch;
	}
	usort($branches, 'folderComperator');
	return $branches;
}

function folderComperator($a, $b) {
	$aFolder = (isset($a['type']) && $a['type']==FOLDER);
	$bFolder = (isset($b['type']) && $b['type']==FOLDER);
	$aName = $a['filename'];
	$bName = $b['filename'];
	
	if($aFolder && !$bFolder){ 
		$return=-1;
		//echo "$aName before $bName because it is a folder\n"; 
	}
	elseif($bFolder && !$aFolder) { 
		$return=1;
		//echo "$bName before $aName because it is a folder\n"; 
	}	
	else {
		$return=strnatcasecmp($aName,$bName);
		//if($return>0) echo "$bName before $aName\n"; 
		//elseif($return<0) echo "$aName before $bName\n";
		//else echo "$aName is the same as $bName\n";
	}
	return $return;
}

if(empty($_GET['project_id'])) die("project_id must be set");
$path = PROJECT_PATH . $_GET['project_id'] . "/";
if(is_dir($path)) {
	$tree = lookInFolder($path);
	//echo "<pre>".print_r($tree,1)."</pre>";
	header('Content-Type: application/json');
	echo json_encode($tree);
} else {
	die("Can not find project path: " . $path);
}




?>