<?php


require "../inc/functions.php";
require "../inc/pages.php";
$page = getPageToLoad($_GET['page'], $pages);

include "../pages/" . $page['filename'];

?>