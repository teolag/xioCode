var jsFiles = [
	'js/XI.js',
	'js/file.js',
	'js/file_list.js',
	'js/gatekeeper.js',
	'js/preview.js',
	'js/project_config.js',
	'js/project_list.js',
	'js/tab.js',
	'js/tab_bar.js',
	'js/todo.js',
	'js/code_editor.js',
	'js/codemirror_addons.js',
	'js/xiocode.js',
	'js/main.js'
];

var codemirrorJS = [
	'public_html/codemirror/lib/codemirror.js',
	'public_html/codemirror/mode/meta.js',
	'public_html/codemirror/mode/xml/xml.js',
	'public_html/codemirror/mode/javascript/javascript.js',
	'public_html/codemirror/mode/htmlembedded/htmlembedded.js',
	'public_html/codemirror/mode/htmlmixed/htmlmixed.js',
	'public_html/codemirror/mode/css/css.js',
	'public_html/codemirror/mode/clike/clike.js',
	'public_html/codemirror/mode/sql/sql.js',
	'public_html/codemirror/mode/php/php.js',
	'public_html/codemirror/addon/dialog/dialog.js',
	'public_html/codemirror/addon/edit/matchbrackets.js',
	'public_html/codemirror/addon/edit/closetag.js',
	'public_html/codemirror/addon/edit/closebrackets.js',
	'public_html/codemirror/addon/mode/multiplex.js',
	'public_html/codemirror/addon/search/match-highlighter.js',
	'public_html/codemirror/addon/search/search.js',
	'public_html/codemirror/addon/search/searchcursor.js',
	'public_html/codemirror/addon/selection/active-line.js',
	'public_html/codemirror/addon/comment/comment.js',
	'public_html/codemirror/keymap/sublime.js',
	'public_html/codemirror/addon/comment/continuecomment.js'
];

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		sass: {
			dist: {
				files: {
					'public_html/css/style.css' : 'sass/style.scss'
				}
			}
		},
		concat: {
			xiocode: {
				options: {
					banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n',
					sourceMap: false
				},
				files: {
					'public_html/js/xiocode.min.js': jsFiles,
				}
			}
		},
		uglify: {
			xiocode: {
				options: {
					banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n',
					sourceMap: true
				},
				files: {
					'public_html/js/xiocode.min.js': jsFiles,
				}
			},
			codemirror: {
				options: {
					banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n',
					sourceMap: true
				},
				files: {
					'public_html/js/codemirror.min.js': codemirrorJS
				}
			}
		},
		watch: {
			css: {
				files: '**/*.scss',
				tasks: ['sass']
			},
			js: {
				files: jsFiles,
				tasks: ['uglify:xiocode']
			}/*,
			codemirror: {
				files: codemirrorJS,
				tasks: ['uglify:codemirror']
			}*/
		}
	});
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.registerTask('default',['uglify:xiocode', 'concat:xiocode', 'sass', 'watch']);
}
