<?php


// Find the last updated file in the css folder
$files = glob("../css/*.css");
$last_modified = 0;
foreach($files as $file) {
	if($last_modified < filemtime($file)) $last_modified=filemtime($file);
}
$minifile = "style.mini.".date("ymdHis", $last_modified).".css";



if(file_exists($minifile)) {
	//No updates, use existing file
	$css=file_get_contents($minifile);
}
else {
	//File updated, save new version
	$css="";
	foreach($files as $file) {
		$css .= file_get_contents($file);
	}
	$before = strlen($css);
	$css = cssMinify($css);
	$after = strlen($css);
	$precent = 100-round(($after/$before)*100,1);

	//Add compression rate
	$css = "/* " . date("Y-m-d H:i:s", $last_modified) . " | Removed ".($before-$after)." bytes | Compressed " . $precent . "% */\n" . $css;
	
	//Delete old versions
	foreach (glob("style.mini*.css") as $oldfile) unlink($oldfile);
	
	//Save new file
	file_put_contents($minifile, $css);
}


header("Content-type: text/css");
echo $css;



//Find and removes unused bytes
function cssMinify($css) { 
	$css = preg_replace('|[\n\r\t]*|', "", $css); 		//Remove tabs and line breaks
	$css = preg_replace('|\/\*.*?(\*\/)|', "", $css);	//Remove comments
	$css = preg_replace('|;\s|', ";", $css);			//Remove space between styles 
	$css = preg_replace('|:\s|', ":", $css);			//Remove space between key and attribute
	$css = preg_replace('|\s*\{\s*|', "{", $css);		//Remove space around {
	$css = preg_replace('|\s*\}\s*|', "}", $css);		//Remove space around }
	$css = preg_replace('|\s*\,\s*|', ",", $css);		//Remove space around commas
	$css = preg_replace('|[ ]+|', " ", $css);			//Remove more than one space in a row
	$css = preg_replace_callback('|#([0-9A-Fa-f]{6})([ ;\}])|', 'shortenColors', $css);
	$css = trim($css);
	return $css;
}

// Converts colors like #aabbcc to #abc
function shortenColors($m) {	
	$hex = $m[1];
	if($hex[0]==$hex[1] && $hex[0]==$hex[1] && $hex[0]==$hex[1]) $hex = $hex[0].$hex[2].$hex[4];	
	return "#".$hex.$m[2];
}


?>
