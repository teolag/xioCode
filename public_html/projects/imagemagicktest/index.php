<?php

//Point
//Triangle
//Box
//Hermite
//Catrom



$path = realpath("images/big")."\\";

/*
$files = glob($path."*.{jpg,JPG}", GLOB_BRACE );
echo count($files) . " images found<br />";

foreach($files as $file) {
	echo $file . "<br />";
}
*/


$size = "200x200";
$filter = "Box";
$quality = 85;
$image = realpath("images/big/pizza.jpg");
$thumb = "thumbs/pizza_".$filter."_".$size."_".$quality.".jpg";
$test = 'convert "'.$image.'" -thumbnail '.$size.' -filter '.$filter.' "'.realpath("./")."\\".$thumb.'"';

$start = microtime(true);
$return = system($test);
$done = microtime(true);

echo "Test: " . $test."<br />";
echo "Return: " . $return."<br />";
echo round($done-$start,2) . "seconds<br />";
echo "<img src='" . $thumb . "' />";
	

?>