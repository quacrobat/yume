"use strict";

module.exports = function( grunt ) {

	grunt.initConfig( {

		// config
		pkg : grunt.file.readJSON( "package.json" ),

		// non-task-specific properties

		// javascript
		srcPathJavascript : "src/javascript",
		distPathJavascript : "public/javascript",

		// less
		srcPathLess : "src/less",
		distPathLess : "src/css",

		// css
		srcPathCss : "src/css",
		distPathCss : "public/stylesheets",

		// tasks
		autoprefixer : {
			no_dist : {
				src : [ "<%= distPathLess %>/style.min.css" ]
			}
		},

		less : {
			options : {
				compress : true
			},
			dist : {
				files : {
					"<%= distPathLess %>/style.min.css" : [ "<%= srcPathLess %>/**/*.less" ]
				}
			}
		},

		watch : {
			less : {
				files : [ "<%= srcPathLess %>/**/*.less" ],
				tasks : [ "less", "autoprefixer", "concat", "clean" ]
			},
			javascript : {
				files : [ "<%= srcPathJavascript %>/engine/**/*.js" ],
				tasks : [ "browserify", "uglify" ]
			}
		},

		browserify : {
			dist : {
				src : [ "<%= srcPathJavascript %>/engine/**/*.js" ],
				dest : "<%= distPathJavascript %>/bundle.js"
			}
		},

		uglify : {
			options : {
				banner : "/* Version: <%= pkg.version %>, <%= grunt.template.today('dd-mm-yyyy') %> */\n",
				// The following identifiers must not changed, otherwise
				// WebWorkers cause reference erros
				mangle : {
					except : [ "self", "WebSocket" ]
				}
			},
			dist : {
				files : {
					"<%= distPathJavascript %>/bundle.min.js" : [ "<%= browserify.dist.dest %>" ]
				}
			}
		},

		concat : {
			options : {
				separator : "\n"
			},
			dist : {
				src : [ "<%= srcPathCss %>/bootstrap.min.css", "<%= srcPathCss %>/bootstrap-theme.min.css", "<%= srcPathCss %>/style.min.css" ],
				dest : "<%= distPathCss %>/bundle.min.css"
			}
		},

		clean : [ "<%= distPathLess %>/style.min.css" ]
	} );

	grunt.loadNpmTasks( "grunt-contrib-concat" );
	grunt.loadNpmTasks( "grunt-contrib-uglify" );
	grunt.loadNpmTasks( "grunt-contrib-watch" );
	grunt.loadNpmTasks( "grunt-contrib-less" );
	grunt.loadNpmTasks( "grunt-autoprefixer" );
	grunt.loadNpmTasks( "grunt-contrib-clean" );
	grunt.loadNpmTasks( "grunt-browserify" );

	grunt.registerTask( "default", [ "browserify", "uglify", "less", "autoprefixer", "concat", "clean" ] );
};