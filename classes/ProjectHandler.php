<?php
class ProjectHandler {

	public static function getProjectsForUser(&$db, $userId) {
		$items = glob(PROJECT_PATH."*", GLOB_ONLYDIR);
		$projects = array();
		foreach($items as $i) {
			$projectId = basename($i);
			$project = self::getProject($db, $projectId, $userId);
			if(!empty($project)) {
				$projects[$projectId] = $project;
			}
		}
		return $projects;
	}


	public static function getProject(&$db, $projectId, $userId) {
		//array("uri"=>$i, "project_id"=>$projectId);
		$configFile = PROJECT_PATH . $projectId."/".PROJECT_CONFIG_FILE;

		if(file_exists($configFile)) {
			$config = json_decode(file_get_contents($configFile), 1);
			if(!empty($config['creator_id']) && $config['creator_id']!=$userId) {
				return;
			}
		} else {
			$config = array("name"=>$projectId);
			if(!file_put_contents($configFile, json_encode($config))) {
				http_response_code(400);
				die("could not save config file: ". $configFile);
			}
		}
		return $config;
	}

	public static function deleteProject($projectId, $userId) {
		$projectDir = realpath(PROJECT_PATH . $projectId);
		if(is_dir($projectDir)) {
			rrmdir($projectDir);
		}
	}

}
?>