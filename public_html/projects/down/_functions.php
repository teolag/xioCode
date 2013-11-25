<?php

function getHTML($url) {
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	return curl_exec($ch);
}

function grabImage($url,$saveto){
    if(file_exists($saveto)){
        return;
    }
	$saveto = str_replace(" ", "\x20", $saveto);
	
    $ch = curl_init ($url);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_BINARYTRANSFER,1);
    $raw=curl_exec($ch);
    curl_close ($ch);
    $fp = fopen($saveto,'x');
    fwrite($fp, $raw);
    fclose($fp);
}


set_time_limit(120);

?>