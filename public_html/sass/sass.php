<?php

require($_SERVER["DOCUMENT_ROOT"] . "/../includes/init.php");
require($config['class_paths']['SCSS']);

//must update style.scss file to update style.css

use Leafo\ScssPhp\Compiler;
use Leafo\ScssPhp\Server;

$directory = ".";

$scss = new Compiler();
$scss->setFormatter('Leafo\ScssPhp\Formatter\Compressed');

$server = new Server($directory, null, $scss);
$server->serve();

/*
$scss = new scssc();
$scss->setFormatter("scss_formatter_compressed");

$server = new scss_server(".", null, $scss);
$server->serve();
*/


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