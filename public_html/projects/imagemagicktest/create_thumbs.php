<?php



$image = realpath("../big/pizza.jpg");
$thumb = realpath("../temp/thumb.jpg");





$run[] = 'convert "'.$image.'" -resize 400x500 "../temp/thumb0.jpg"';
$run[] = 'convert "'.$image.'" -thumbnail 400x500 -quality 100 "../temp/thumb1.jpg"';
$run[] = 'convert "'.$image.'" -thumbnail 400x500 -quality 100 -filter Lanczos "../temp/thumb2.jpg"';
$run[] = 'convert "'.$image.'" -thumbnail 400x500 -quality 100 -filter Lanczos "../temp/thumb3.jpg"';
$run[] = 'convert "'.$image.'" -scale 400x500 -quality 100 -filter Lanczos "../temp/thumb4.jpg"';
$run[] = 'convert "'.$image.'" -resize 10% "../temp/thumb5.jpg"';


foreach($run as $i => $r) {
	echo $r . "<br />";
	$start=microtime(true);
	echo system($r);
	$done=microtime(true);
	echo round($done-$start, 2) . " s - " . filesize('../temp/thumb' . $i . '.jpg') . "<br />";
	echo "<img src='../temp/thumb" . $i . ".jpg' />";
	echo "<br /><br />";
}



?>













































