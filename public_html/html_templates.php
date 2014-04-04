
<template id="tplTodoEdit">
	<form id="formTodo">
		<h3></h3>
		<input type="hidden" name="todo_id" value="">
		
		<textarea name="description"></textarea><br>
		
		<p>Created: <time id="todoTimeCreated"></time></p>
		<p>Edited: <time id="todoTimeEdited"></time></p>
		
		
		<input type="radio" value="feature" name="type" id="rbTodoTypeFeature"><label for="rbTodoTypeFeature">Feature</label><br>
		<input type="radio" value="bug" name="type" id="rbTodoTypeBug"><label for="rbTodoTypeBug">Bug</label><br>
		
		<br>
		
		<input type="radio" value="new" name="status" id="rbTodoStatusNew"><label for="rbTodoStatusNew">New</label><br>
		<input type="radio" value="open" name="status" id="rbTodoStatusOpen"><label for="rbTodoStatusOpen">Open</label><br>
		<input type="radio" value="done" name="status" id="rbTodoStatusDone"><label for="rbTodoStatusDone">Done</label><br>
		
		<button type="submit">Save</button>
		<button type="button" class="delete">Delete</button>
	</form>
</template>