<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

if(empty($_REQUEST['project_id'])) {
	die("project_id must be defined");
}

$configFile = PROJECT_PATH . $_REQUEST['project_id'] . "/" . PROJECT_CONFIG_FILE;
$config = json_decode(file_get_contents($configFile), 1);
if(isset($_GET['action'])) {

	switch($_GET['action']) {
	
		case "save":
		echo "sparar";	
		foreach($_POST['config'] as $key => $value) {
			$config[$key] = $value;
		}
		print_r($config);
		break;
		
		
		case "updateLastOpened":
		$config["last_opened"] = time();		
		break;
		
		
		default: die("unkown action");
	}
	
	if(!file_put_contents($configFile, json_encode($config))) {
		http_response_code(400);
		die("Could not write to config file: ". $configFile);
	}	
	exit;
}

$created = getValue($config, 'created');

$tags = getValue($config, 'tags');
if(empty($tags)) $tags=array();


function getValue(&$config, $key) {
	if(isset($config[$key])) {
		return $config[$key];
	}
	return "";
}



?>


<form id="frmProjectConfig">
	<h2>Project Config</h2>
	<input type="hidden" name="project_id" value="<?php echo $_REQUEST['project_id']; ?>" />

	<ul>
		<li>Created: <?php echo empty($created)? "unknown" : date("Y-m-d H:i:s", $created); ?></li>
		<li>
			<label for="confName">Project name:</label>
			<input type="text" id="confName" name="config[name]" value="<?php echo getValue($config, 'name'); ?>" />
		</li>
		<li>
			<label for="confRunUrl">Run URL:</label>
			<input type="text" id="confRunUrl" name="config[run_url]" value="<?php echo getValue($config, 'run_url'); ?>" />
		</li>
		<li>
			<label for="confDescription">Description:</label>
			<textarea id="confDescription" name="config[description]"><?php echo getValue($config, 'description'); ?></textarea>
		</li>
		<li>
			<label for="confTags">Tags:</label>
			<input type="text" name="tags" id="confTags" />			
			<ul id="listTags" class="tags"></ul>
		</li>
	</ul>
	<div class="buttonset">
		<button type="submit">Save</button>
		<button type="button" id="btnConfigCancel">Cancel</button>
	</div>
	
	<?php foreach($tags as $tag) { ?>
		<input type="hidden" name="config[tags][]" value="<?php echo $tag ?>" />
	<?php } ?>
</form>