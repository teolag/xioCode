<?php
require "../../includes/init.php";

if(isset($_GET['do']) && $_GET['do']=="save") {
	echo "sparar";
	print_r($_POST);
	
	$configFile = PROJECT_PATH . $_POST['project_id'] . "/" . PROJECT_CONFIG_FILE;
	file_put_contents($configFile, json_encode($_POST['config']));
	
	exit;
}






if(empty($_GET['project_id'])) {
	die("project_id must be defined");
}


$configFile = PROJECT_PATH . $_GET['project_id'] . "/" . PROJECT_CONFIG_FILE;
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
	<input type="hidden" name="project_id" value="<?php echo $_GET['project_id']; ?>" />

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