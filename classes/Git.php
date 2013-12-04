<?php
class Git {

	static public function isGit() {
		exec('git rev-parse --is-inside-work-tree', $output);
		return $output[0]==="true";
	}	

	static public function getLastHash() {
		exec('git rev-parse --verify HEAD 2> /dev/null', $output);
		return $output[0];
	}
	
	static public function getCurrentBranch() {
		exec('git rev-parse --abbrev-ref HEAD 2> /dev/null', $output);
		return $output[0];
	}
	
	
	static public function getLastCommit() {
		return self::getCommit(self::getLastHash());
	}

	static public function getCommit($hash) {		
		exec("git log -n1 $hash --pretty=format:'%at|%s'", $output);
		list($ts, $message) = explode("|", $output[0]);
		return array(
			"hash"=>$hash,
			"ts"=>$ts,
			"message"=>$message
		);
	}

}
?>