<?php
//javascript:window.location.href='http://code/projects/down/index.php?url='+escape(window.location.href);



require "_functions.php";
$url = $_GET['url'];


//http://www.kogalx.com/special/gq/351_Aina_Sawada.php
preg_match("/(http:\/\/www.kogalx.com\/special\/gq\/)(.+)/", $url, $kogalx);
if(!empty($kogalx)) {
	echo "Matchar kogalx!<br />";
	//print_r($kogalx);
	$path = "D:/system/mDownload/kogalx/ ".$kogalx[2]."/" ;
	echo "Path: " . $path . "<br />";
	if(!is_dir($path)) mkdir($path, null, true);
	
	
	$html = getHTML($url);
	
	preg_match_all("/<A href=\"(.*?)\"><IMG/", $html, $pics);
	for($i=0; $i<count($pics[0]); $i++) {
		
		$src = $kogalx[1] . $pics[1][$i];
		$filename = $pics[2][$i];
		
		echo $src . "<br />" . $filename . "<br />";
		
		grabImage($src, $path.$filename);
		
		if(is_file($path.$filename)) {
			echo "<img src='".$src."' /><br />";
			echo $src . "<br />";
			
		}
		else {
			//die("error getting " . $src);
		}
		
	}
	exit;
}


//http://gallery.g-cash.biz/gallery/294/3/1143179
preg_match("/(http:\/\/gallery.g-cash.biz\/)gallery\/(\d+)\/\d+\/\d+/", $url, $gcash);
if(!empty($gcash)) {
	echo "Matchar gcash!";
	print_r($gcash);
	$path = "D:/system/mDownload/gCash ".$gcash[2]."/" ;
	echo $path;
	if(!is_dir($path)) mkdir($path, null, true);
	
	//<li><a href="/galimg/295/l/12.jpg"><img src="/galimg/295/12.jpg" alt="g-queen.com - Kayo Sakakibara" width="140px" height="210px"/></a></li>
	//http://gallery.g-cash.biz/galimg/295/l/1.jpg
	
	$html = getHTML($url);
	
	preg_match_all("/<a href=\"\/(galimg\/.+?(\d+\.jpg))\"/", $html, $pics);
	for($i=0; $i<count($pics[0]); $i++) {
		
		$src = $gcash[1] . $pics[1][$i];
		$filename = $pics[2][$i];
		
		//echo $src . "<br />" . $filename . "<br />";
		
		grabImage($src, $path.$filename);
		
		if(is_file($path.$filename)) {
			echo "<img src='".$src."' /><br />";
			echo $src . "<br />";
			
		}
		else {
			die("error getting " . $src);
		}
		
	}
	exit;
}



//http://sexyamateurspics.com/Czech.shtml
preg_match("/czechcasting\.com\/promo\/preview-czech-casting-(.+?)-(\d+?)\/\?nats=(.+)/", $url, $czech);
if(!empty($czech)) {
	$name = $czech[1];
	$id = $czech[2];
	
	$path = $_SERVER['DOCUMENT_ROOT']. "/projects/down/" . $id . " - " . ucfirst($name) . "/" ;
	$path = 'D:/system/fapper/' . $id . ' - ' . ucfirst($name) . '/' ;
	if(!is_dir($path)) mkdir($path, null, true);
		
	
	$html = getHTML($url);
	
	
	//Holding sign
	preg_match("/src=\"(.+?\/thumbs\/tour.jpg\?s.+?)\"/", $html, $sign);
	if(!empty($sign)) {
		$src = $sign[1];
		$saveto = $path."0.jpg";
		if(!is_file($saveto)) {
			grabImage($src, $saveto);
		}
	}	
	
	
	
	preg_match_all("/<div><a href=\"(.+?(\d+.jpg).+?)\" class=\"gallery\"/s", $html, $pics);
	for($i=0; $i<count($pics[0]); $i++) {
		$src = $pics[1][$i];
		$filename = $pics[2][$i];
		grabImage($src, $path.$filename);
		
		if(is_file($path.$filename)) {
			echo $src . "<br />";
		}
		else {
			die("error getting " . $src);
		}	
	}
	exit;
}


preg_match("/imagefap\.com\/pictures\/(\d+?)/", $url, $fap);
if(!empty($fap)) {
	
	$galleryId = $fap[1];
	$url = $url . "?view=2";
	$html = getHTML($url);
	
	//get title
	$pattern = "/<title>.... pics of (.+?)\(Page \d+\)<\/title>/s";
	preg_match($pattern, $html, $info);
	$title = trim($info[1]);
	
	
	//get images1
	$pattern = "/<a name.+?href=\"(.+?)\".+?src=\"(.+?)\".+?<\/a>/s";
	preg_match_all($pattern, $html, $pics);
	
	$filesDone=0;
	$filesTotal = count($pics[0]);
	
	//setup path
	$replaceFrom = array(" ", "'", "&#039;", "/");
	$replaceTo = array("_", "", "", "-");
	
	$path = "D:/system/mDownload/".str_replace($replaceFrom, $replaceTo, $title)."_-_".$galleryId."/" ;
	
	
	for($i = 0; $i<count($pics[0]); $i++) {
	
	
		$href = "http://www.imagefap.com".$pics[1][$i];	
		preg_match("/photo\/(\d+)\//", $href, $picId);
		
		$matchfile = glob($path."*".$picId[1].".*");
		if(!empty($matchfile)) {
			$filesDone++;		
			continue;
		}
		
		
		$html_single = getHTML($href);
		
		
		
		preg_match("/<img id=\"mainPhoto.+?title=\"(.+?)\".+?src=\"(.+?)\"/s", $html_single, $hit);
		
		
		
		if(!is_dir($path)) mkdir($path, null, true);
		
		$ext = substr($path.$hit[1], -4,4);
		$saveto = substr($path.str_replace($replaceFrom, $replaceTo,$hit[1]), 0, -4) . "_" . $picId[1] . $ext;
		
		
		grabImage($hit[2], $saveto);		
		
		if(is_file($saveto)) {
			$filesDone++;
			echo $href . "<br />";
		}
		else {
			die("error getting " . $saveto);
		}
		
	}
	exit;
}


?>