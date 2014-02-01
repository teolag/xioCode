<?php
require "../../includes/init.php";
Gatekeeper::checkAccess();

if(empty($_REQUEST['project_id'])) {
	die("project_id must be defined");
}

$configFile = PROJECT_PATH . $_REQUEST['project_id'] . "/" . PROJECT_CONFIG_FILE;
if(isset($_GET['do']) && $_GET['do']=="save") {
	echo "sparar";
	print_r($_POST);
	
	if(!file_put_contents($configFile, json_encode($_POST['config']))) {
		http_response_code(400);
		die("Could not write to config file: ". $configFile);
	}	
	exit;
}


$config = json_decode(file_get_contents($configFile), 1);

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
	</ul>
	<div class="buttonset">
		<button type="submit">Save</button>
		<button type="button" id="btnConfigCancel">Cancel</button>
	</div>
</form>