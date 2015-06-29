<?php
class PatchDB {
	private static $db;
	private static $log;
	private static $executedPatches;

	static public function run($uri, &$db) {
		self::$db = $db;
		self::$executedPatches = self::$db->getColumn("SELECT patch_id FROM patchdb");
		self::processPatchFile($uri);
	}

	static private function processPatchFile($uri) {
		$handle = fopen($uri, "r");
		$patch = null;
		$number = null;
		while (($line = fgets($handle)) !== false) {
			if(substr($line, 0, 3)==="###") {
				if($number>0) {
					self::processPatch($number, $patch);
					$patch = null;
					$number = null;
				}
				$number = trim(substr($line, 4));
			} else {
				$patch .= $line;
			}
		}
		if($number>0) {
			self::processPatch($number, $patch);
		}
		fclose($handle);
	}

	static private function processPatch($number, $patch) {
		//echo "patch" . $number . "<br>";
		if(in_array($number, self::$executedPatches)) {
			//echo "Har redan körts<br>";
		} else {
			//echo "KÖR:";
			$sth = self::$db->query($patch);
			//var_dump($sth);
			self::$db->insert("INSERT INTO patchdb(patch_id) VALUES(?)", array($number));
			//echo "Added to patch history";
		}
		//echo "<br><br>";
	}
}
?>