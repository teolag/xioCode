<?php
require "_functions.php";




$url = "http://freshamateur.net/";
$url = "http://pinkfineart.com/czech-casting";


$url = "http://czechcastingpics.com/";
$url = "http://sexyexgfpics.com/";
$url = "http://sexygfpics.com/";
$url = "http://sexyamateurspics.com/Czech.shtml";

$html = getHTML($url);


preg_match_all("/(http:\/\/join\.czechcasting\.com\/gallery\/.+?)\"/", $html, $links);
for($i=0; $i<count($links[0]); $i++) {
	$link = $links[1][$i];
	echo "<a href='$link'>$link</a><br />";
}
?>

/*
<textarea cols="160" rows="30"><?php echo htmlentities($html);?></textarea>
*/

