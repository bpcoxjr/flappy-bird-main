var gulp = require('gulp');
var gulpsync = require('gulp-sync')(gulp);

var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var imagemin = require('gulp-imagemin');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

gulp.task('bower', function() {
  return bower()
    .pipe(gulp.dest('./lib/'));
});

// JavaScript linting task
gulp.task('jshint', function() {
  return gulp.src('site/js/main.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Compile Sass task
/*gulp.task('sass', function() {
  return gulp.src('site/scss/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('site/css'));
});*/

// Minify index
/*gulp.task('html', function() {
  return gulp.src('site/index.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('site/'));
});*/

// JavaScript build task, removes whitespace and concatenates all files
gulp.task('scripts', function() {
  return browserify('site/js/main.js')
    .bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    //.pipe(uglify())
    .pipe(gulp.dest('site/js'));
});

// Styles build task, concatenates all the files
gulp.task('styles', function() {
  return gulp.src('site/css/*.css')
    .pipe(concat('styles.css'))
    .pipe(gulp.dest('site/css'));
});

// Image optimization task
gulp.task('images', function() {
  return gulp.src('site/img/*')
    .pipe(imagemin())
    .pipe(gulp.dest('site/img'));
});

// Watch task
gulp.task('watch', function() {
  gulp.watch('site/js/*.js', ['jshint']);
  gulp.watch('site/css/*.css', ['sass']);
});

// Default task
gulp.task('default', ['jshint', 'sass', 'watch']);

//Build task
gulp.task('build', gulpsync.async(['jshint', 'scripts', 'styles', 'images']));
