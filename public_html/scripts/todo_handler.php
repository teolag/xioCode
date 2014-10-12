<?php
$startTime = microtime(true);
require "../../includes/init.php";
Gatekeeper::checkAccess();



if(empty($_REQUEST['project_id'])) die("project_id must be specified");


$todoFile = PROJECT_PATH . $_REQUEST['project_id'] . "/" . PROJECT_TODO_FILE;

$response = array();

if(!empty($_POST['prio'])) {
	$order = explode(",", $_POST['prio']);
	$todos = json_decode(file_get_contents($todoFile), true);

	foreach($order as $prio => $id) {
		$todos[$id]['prio'] = $prio;
		//echo "sätt id $id till prio $prio<br />";
	}
	$response['message'] = "sätter prio";
	if(file_put_contents($todoFile, json_encode($todos))) {
		$response['status'] = STATUS_OK;
	} else {
		$response['status'] = STATUS_TODO_COULD_NOT_BE_SAVED;
	}


} elseif(!empty($_POST['description'])) {
	if(is_file($todoFile)) {
		$todos = json_decode(file_get_contents($todoFile), true);
		if(empty($todos)) {
			$nextId = 1;
			$todos = array();
		} else {
			$nextId = key(array_slice($todos, -1, 1, TRUE)) + 1;
		}
	} else {
		$todos = array();
		$nextId = 1;
	}

	$todo = array();
	if(empty($_POST['todo_id'])) {
		$response['message'] = "new " . $_POST['type'] . " saved";
		$todo['created'] = $_POST['ts'];
		$todoId = $nextId;
	} else {
		$todoId = $_POST['todo_id'];
		$todo = $todos[$todoId];
		$todo['edited'] = $_POST['ts'];
		$response['message'] = $_POST['type'] . " saved";
	}
	$todo['description'] = $_POST['description'];
	$todo['type'] = $_POST['type'];
	$todo['status'] = $_POST['status'];
	$todos[$todoId] = $todo;
	$response['todo_id'] = $todoId;
	$response['todo'] = $todo;


	if(file_put_contents($todoFile, json_encode($todos))) {
		$response['status'] = STATUS_OK;
	} else {
		$response['status'] = STATUS_TODO_COULD_NOT_BE_SAVED;
	}
} elseif($_GET['action']==="delete") {
	$todos = json_decode(file_get_contents($todoFile), true);
	$todoId = $_POST['todo_id'];
	unset($todos[$todoId]);
	if(file_put_contents($todoFile, json_encode($todos))) {
		$response['status'] = STATUS_OK;
	} else {
		$response['status'] = STATUS_TODO_COULD_NOT_BE_SAVED;
	}
	$response['message'] = "delete todo";
	$response['todo_id'] = $todoId;
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