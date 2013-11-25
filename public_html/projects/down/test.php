<?php

$url = "http://gallery.g-cash.biz/galimg/294/l/7.jpg";


$ch = curl_init ($url);
curl_setopt($ch, CURLOPT_HEADER, 0);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_BINARYTRANSFER,1);
$raw=curl_exec($ch);

var_dump($ch);
var_dump($raw);

?>