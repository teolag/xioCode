<?php
$startTime = microtime(true);
require "../../includes/init.php";
Gatekeeper::checkAccess();



if(empty($_REQUEST['project_id'])) die("project_id must be specified");


$todoFile = PROJECT_PATH . $_REQUEST['project_id'] . "/" . PROJECT_TODO_FILE;

$response = array();

if(!empty($_POST)) {
	if(is_file($todoFile)) {
		$todos = json_decode(file_get_contents($todoFile), true);
		$nextId = key(array_slice($todos, -1, 1, TRUE)) + 1;
	} else {
		$todos = array();
		$nextId = 1;
	}
	$todo = array(
		'description' => $_POST['description'],
		'type' => $_POST['type']	
	);
	if(empty($_POST['todo_id'])) {
		$response['message'] = "new " . $_POST['type'] . " saved";
		$todoId = $nextId;
	} else {
		$response['message'] = $_POST['type'] . " saved";
		$todoId = $_POST['todo_id'];
	}
	$todos[$todoId] = $todo;
	$response['todo_id'] = $todoId;
	$response['todo'] = $todo;
	
		
	if(file_put_contents($todoFile, json_encode($todos))) {
		$response['status'] = STATUS_OK;
	} else {
		$response['status'] = STATUS_TODO_COULD_NOT_BE_SAVED;
	}
} elseif($_GET['action']==="getAll") {
	$response['message'] = "returning all todos";
	if(is_file($todoFile)) {
		$todos = json_decode(file_get_contents($todoFile), true);
	} else {
		$todos = array();
	}
	$response['todos'] = $todos;
}




http_response_code(200);
$response['timer'] = microtime(true)-$startTime;
echo json_encode($response);
?>