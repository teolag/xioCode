

<?php




$run = 'mogrify -path "../small" -resize 400 "../big/*"';


	echo $run . "<br />";
	$start=microtime(true);
	echo system($run);
	$done=microtime(true);
	echo round($done-$start, 2) . " s ";
//	echo "<img src='../small/thumb" . $i . ".jpg' />";



?>










