<?php


// Find the last updated file in the js folder
$files = glob("../js/*.js");
$last_modified = 0;
foreach($files as $file) {
	if($last_modified < filemtime($file)) $last_modified=filemtime($file);
}
$minifile = "js.mini.".date("ymdHis", $last_modified).".js";



if(file_exists($minifile)) {
	//No updates, use existing file
	$js=file_get_contents($minifile);
}
else {
	//File updated, save new version
	
	
	require_once('../../includes/jsmin-1.1.1.php');
	
	$js = "";
	foreach($files as $file) {
		$js .= file_get_contents($file) . "\n ";
	}
	
	$before = strlen($js);
	//$js = JSMin::minify($js);
	$after = strlen($js);
	$precent = 100-round(($after/$before)*100,1);

	//Add compression rate
	$js = "/* " . date("Y-m-d H:i:s", $last_modified) . " | Removed ".($before-$after)." bytes | Compressed " . $precent . "% */\n" . $js;
	
	//Delete old versions
	foreach (glob("js.mini*.js") as $oldfile) unlink($oldfile);
	
	//Save new file
	file_put_contents($minifile, $js);
}


header("Content-type: text/javascript");
echo $js;


?>
