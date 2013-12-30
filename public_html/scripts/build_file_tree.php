<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

//$finfo = finfo_open(FILEINFO_MIME_TYPE);

define("FOLDER", "folder");

function lookInFolder($path, $relPath="") {
	//global $finfo;
	$hidden = glob($path.".h*");  //to get all the .h* files for example .htaccess
	$items = glob($path."*");
	if(!empty($hidden)) $items = array_merge($items, $hidden);
	
	$branches = array();
	foreach($items as $i) {
		$parts = pathinfo($i);
		$branch=array();
		$branch['filename']=$parts['basename'];
		$branch['path']=$relPath;
		if(is_dir($i)) {
			$branch['type'] = FOLDER;
			$branch['leafs'] = lookInFolder($i."/", $relPath.$parts['basename']."/");
		}
		else {
			$branch["size"] = filesize($i);
			//$branch["mime"] = finfo_file($finfo, $i);
			if($imageInfo = getimagesize($i)) {
				$branch["width"] = $imageInfo[0];
				$branch["height"] = $imageInfo[1];
			}
			if(isset($parts['extension'])) {
				$branch['type'] = strtolower($parts['extension']);
			} else {
				$branch['type'] = "";
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
		//echo "$aName kommer f�re $bName eftersom det �r en mapp\n"; 
	}
	elseif($bFolder && !$aFolder) { 
		$return=1;
		//echo "$bName kommer f�re $aName eftersom det �r en mapp\n"; 
	}	
	else {
		$return=strnatcasecmp($aName,$bName);
		//if($return>0) echo "$bName kommer f�re $aName\n"; 
		//elseif($return<0) echo "$aName kommer f�re $bName\n";
		//else echo "$aName �r lika som $bName\n";
	}
	return $return;
}


$path = PROJECT_PATH . $_GET['project_id'] . "/";
if(is_dir($path)) {
$tree = lookInFolder($path);
//echo "<pre>".print_r($tree,1)."</pre>";
echo json_encode($tree);
} else {
	die("Can not find project path: " . $path);
}




?>