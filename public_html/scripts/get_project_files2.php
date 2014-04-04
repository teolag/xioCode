<?php



/*
fil1.txt
fil2.png
mapp1
	mapp1-1
	.htaccess
	mapp1-2
	fil3.css
mapp2
.git
*/	


require "../../includes/init.php";
Gatekeeper::checkAccess();

//$finfo = finfo_open(FILEINFO_MIME_TYPE);

define("FOLDER", "folder");

function lookInFolder($path) {
	$items = scandir($path);

	$bytestotal=0;
	$nbfiles=0;
	foreach($items as $filename) {
		$filesize=filesize($path.$filename);
		$bytestotal+=$filesize;
		$nbfiles++;
		echo "$filename ($filesize)<br>";
	}

	$bytestotal=number_format($bytestotal);
	echo "Total: $nbfiles files, $bytestotal bytes\n";
}



if(empty($_GET['project_id'])) die("project_id must be set");
$path = PROJECT_PATH . $_GET['project_id'] . "/";
if(is_dir($path)) {
	$tree = lookInFolder($path);
	//echo "<pre>".print_r($tree,1)."</pre>";
	//header('Content-Type: application/json');
	echo json_encode($tree);
} else {
	die("Can not find project path: " . $path);
}




?>