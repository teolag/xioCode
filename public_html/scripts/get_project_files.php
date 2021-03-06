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

		if(is_dir($path.$i)) {
			if($i=="." || $i=="..") {
				continue;
			}
			$branch['type'] = FOLDER;
			$branch['icon'] = "folder";
			
			if($i==".git" || $i==".sass-cache" || $i=="node_modules") {
				$branch['disabled'] = true;
			} else {
				$branch['leafs'] = lookInFolder($path.$i."/", $relPath.$i."/");
			}
		}
		else {
			$branch["size"] = filesize($path.$i);
			//$branch["mime"] = finfo_file($finfo, $path.$i);

			if($imageInfo = getimagesize($path.$i)) {
				$branch["width"] = $imageInfo[0];
				$branch["height"] = $imageInfo[1];
			}

			$branch['icon'] = "file-txt";
			if(isset($parts['extension'])) {
				$branch['type'] = strtolower($parts['extension']);
				switch($branch['type']) {
					case "png": case "jpg": case "jpeg": case "ico": case "svg":
					$branch['icon'] = "file-image"; break;

					case "php":
					$branch['icon'] = "file-php"; break;

					case "xml":
					$branch['icon'] = "file-xml"; break;

					case "htm": case "html":
					$branch['icon'] = "file-html"; break;

					case "css":
					$branch['icon'] = "file-css"; break;
				}
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
