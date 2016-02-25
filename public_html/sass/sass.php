<?php

require("../../includes/init.php");


//must update style.scss file to update style.css

$scss = new scssc();
$scss->setFormatter("scss_formatter_compressed");

$server = new scss_server(".", null, $scss);
$server->serve();

/*
$dir = "test";
scss_server::serveFrom();



$scss = new scssc();
echo $scss->compile('
  $color: #abc;
  div { color: lighten($color, 20%); }
');
echo "<br><br>";

echo "Running sass @ " . $dir . " (" . realpath($dir) . ")<br><br>";
$scss->setImportPaths($dir);
echo $scss->compile('$color: red;');
*/





?>