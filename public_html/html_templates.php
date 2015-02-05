<template id="tplProjectListItem">
	<li class="project">
		<div class="name"></div>
		<div class="description"></div>
		<ul class="functions">
			<li data-action="config"><svg class="icon config"><use xlink:href="/icons.svg#icon-config" /></svg></li>
			<li data-action="run"><svg class="icon run"><use xlink:href="/icons.svg#icon-run" /></svg></li>
		</ul>
	</li>
</template>



<template id="tplCodeEditorHeader">
	<div class="header">
		<ul class="toolbar">
			<li data-action="save"><svg class="icon save"><use xlink:href="/icons.svg#icon-save" /></svg></li>
			<li data-action="preview"><svg class="icon preview"><use xlink:href="/icons.svg#icon-preview" /></svg></li>
		</ul>

		<ol class="tabBar"></ol>
	</div>
</template>


<template id="tplCodeEditorTab">
	<li>
		<span class="filename">main.js</span>
		<span class="icon-close close"></span>
	</li>
</template>


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