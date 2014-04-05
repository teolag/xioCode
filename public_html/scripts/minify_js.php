<?php

$files = array();



//$files[] = "../codemirror/lib/codemirror.js";
$files[] = "../codemirror/mode/xml/xml.js";
$files[] = "../codemirror/mode/javascript/javascript.js";
$files[] = "../codemirror/mode/css/css.js";
$files[] = "../codemirror/mode/clike/clike.js";
$files[] = "../codemirror/mode/sql/sql.js";
$files[] = "../codemirror/mode/php/php.js";
$files[] = "../codemirror/addon/dialog/dialog.js";
$files[] = "../codemirror/addon/edit/matchbrackets.js";
$files[] = "../codemirror/addon/search/match-highlighter.js";
$files[] = "../codemirror/addon/search/search.js";
$files[] = "../codemirror/addon/search/searchcursor.js";
$files[] = "../codemirror/addon/selection/active-line.js";
$files[] = "../codemirror/keymap/sublime.js";


// Find the last updated file in the js folder
$files = array_merge($files, glob("../js/*.js"));



$last_modified = 0;
foreach($files as $file) {
	if($last_modified < filemtime($file)) $last_modified=filemtime($file);
}
$minifile = "js.mini.".date("ymdHis", $last_modified).".js";

$tsstring = gmdate('D, d M Y H:i:s ', $last_modified) . 'GMT';
$if_modified_since = isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) ? $_SERVER['HTTP_IF_MODIFIED_SINCE'] : false;
if ($if_modified_since && $if_modified_since == $tsstring) {
    header('HTTP/1.1 304 Not Modified');
    exit();
}




if(file_exists($minifile)) {
	//No updates, use existing file
	$js=file_get_contents($minifile);
}
else {
	//File updated, save new version	
	
	
	$js = "";
	foreach($files as $file) {
		$js .= file_get_contents($file) . "\n\n";
	}
	
	$before = strlen($js);
	//$js = JShrink\Minifier::minify($js);
	$after = strlen($js);
	$precent = 100-round(($after/$before)*100,1);

	//Add compression rate
	$js = "/* " . date("Y-m-d H:i:s", $last_modified) . " | Removed ".($before-$after)." bytes | Compressed " . $precent . "% */\n" . $js;
	
	//Delete old versions
	foreach (glob("js.mini*.js") as $oldfile) unlink($oldfile);
	
	//Save new file
	file_put_contents($minifile, $js);
}

header("Last-Modified: $tsstring");
header("Content-type: text/javascript");
echo $js;


?>
