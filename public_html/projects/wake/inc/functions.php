<?php


function getPageToLoad($requestPage, &$pages) {
	if(isset($pages[$requestPage])) {
		return $pages[$requestPage];
	} else {
		return $pages["start"];
	}
}



?>