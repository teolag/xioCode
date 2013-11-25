<?php
header( 'Content-Type: image/jpeg' );
$pass = passthru("convert rose:  jpg:-");

echo $pass;

?>