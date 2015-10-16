var videoSource = "video/StarlightScamper.mp4";
var titleDisplay = "Starlight Scamper";
var videoDescription = "Hello Srikanth";


var videoApp = angular.module('videoApp', ['ngAnimate']);

videoApp.controller('VideoController', ['$scope', '$window', '$interval', '$http', function($scope, $window, $interval, $http) {
    $scope.videoDisplay = document.getElementById("VideoElement");
    $scope.videoSource = $window.videoSource;
    $scope.titleDisplay = $window.titleDisplay;
    $scope.videoDescription = $window.videoDescription;
    $scope.videoPlaying = false;
    $scope.currentTime;
    $scope.totalTime;
    $scope.scrubTop = -1000;
    $scope.scrubLeft = -1000;
    $scope.vidHeightCenter = -1000;
    $scope.vidWidthCenter = -1000;
    $scope.vidHeight;
    $scope.vidWidth;
    $scope.isDragging = false;
    $scope.showOptions = false;
    $scope.playlist;

    $scope.canvas = document.getElementById("videoCanvas");
    $scope.ctx;
    $scope.renderTimer;

    $scope.isInteractive = false;
    $scope.isDrawing = false;
    $scope.rectPts = [];

    // Get the timestamps for audio redaction
    $scope.redactAudio = [];
    $scope.mutePeriod = {
        start: 0.0,
        end  : 0.0
    }

    /*
    $http.get('data/playlist.json').success(function(data) {
        $scope.playlist = data;
    });
    */
    
    $interval(function(){
        if(!$scope.isDragging){
            var t = $scope.videoDisplay.currentTime;
            var d = $scope.videoDisplay.duration;
            var w = t / d * 100;
            var p = document.getElementById('progressMeterFull').offsetLeft + document.getElementById('progressMeterFull').offsetWidth;
            $scope.scrubLeft = (t / d * p) - 7;
        }else{
            $scope.scrubLeft = document.getElementById('thumbScrubber').offsetLeft;
        }
        $scope.updateLayout();
    }, 100);
    
    
    $scope.initPlayer = function() {
        $scope.currentTime = 0;
        $scope.totalTime = 0;
        $scope.videoDisplay.addEventListener("timeupdate", $scope.updateTime, true);
        
        $scope.videoDisplay.addEventListener("loadedmetadata", $scope.updateData, true);
        $scope.videoDisplay.addEventListener("loadeddata", $scope.updateResolution, true);
        
        $scope.videoDisplay.addEventListener("play", $scope.startRendering, true);
        $scope.videoDisplay.addEventListener("pause", $scope.stopRendering, true);
        $scope.videoDisplay.addEventListener("ended", $scope.stopRendering, true);
    }

    $scope.startRendering = function(e) {
        $scope.renderTimer = $interval(function() {
            $scope.ctx.drawImage($scope.videoDisplay, 0, 0, $scope.vidWidth, $scope.vidHeight);
        }, 20);
    }

    $scope.stopRendering = function(e) {
       $interval.cancel($scope.renderTimer);
    }

    $scope.updateTime = function(e) {
        if(!$scope.videoDisplay.seeking){
            $scope.currentTime = e.target.currentTime;
            if($scope.currentTime == $scope.totalTime){
                $scope.videoDisplay.pause();
                $scope.videoPlaying = false;
                $scope.currentTime = 0;
                $('#playBtn').children("span").toggleClass("glyphicon-play", true);
                $('#playBtn').children("span").toggleClass("glyphicon-pause", false);
            }
        }
    }

    $scope.updateResolution = function(e) {
        $scope.vidWidth = e.target.videoWidth;
        $scope.vidHeight = e.target.videoHeight;

        $scope.canvas.height = $scope.vidHeight;
        $scope.canvas.width = $scope.vidWidth;
        $scope.ctx = $scope.canvas.getContext("2d");
    }

    $scope.updateData = function(e) {
        $scope.totalTime = e.target.duration;
    }
    
    $scope.updateLayout = function() {
        $scope.scrubTop = document.getElementById('progressMeterFull').offsetTop-2;
        $scope.vidHeightCenter =  $scope.videoDisplay.offsetHeight/2 - 50;
        $scope.vidWidthCenter = $scope.videoDisplay.offsetWidth/2 - 50;
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    }
    
    
    $scope.mouseMoving = function($event) {
        if($scope.isDragging){
            $("#thumbScrubber").offset({left:$event.pageX});
        }
    }

    $scope.dragStart = function($event) {
        $scope.isDragging = true;
    }

    $scope.dragStop = function($event) {
        if($scope.isDragging){
            $scope.videoSeek($event);
            $scope.isDragging = false;
        }
    }
    
    
    $scope.videoSeek = function($event) {
        var w = document.getElementById('progressMeterFull').offsetWidth;
        var d = $scope.videoDisplay.duration;
        var s = Math.round($event.pageX / w * d);
        $scope.videoDisplay.currentTime = s;
    }
    
    
    $scope.toggleDetails = function() {
        if($scope.showOptions){
            $scope.showOptions = false;
        }else{
            $scope.showOptions = true;
        }
    }
    
    
    $scope.videoSelected = function(i) {
        $scope.titleDisplay = $scope.playlist[i].title;
        $scope.videoDescription = $scope.playlist[i].description;
        $scope.videoSource = $scope.playlist[i].path;
        $scope.videoDisplay.load($scope.videoSource);
        $scope.videoPlaying = false;
        $('#playBtn').children("span").toggleClass("glyphicon-play", true);
        $('#playBtn').children("span").toggleClass("glyphicon-pause", false);
        $scope.showOptions = false;
    }
    
    
    $scope.togglePlay = function() { 
        if($scope.videoDisplay.paused){
            $scope.videoDisplay.play();
            $scope.videoPlaying = true;
            $('#playBtn').children("span").toggleClass("glyphicon-play", false);
            $('#playBtn').children("span").toggleClass("glyphicon-pause", true);
        }else{
            $scope.videoDisplay.pause();
            $scope.videoPlaying = false;
            $('#playBtn').children("span").toggleClass("glyphicon-play", true);
            $('#playBtn').children("span").toggleClass("glyphicon-pause", false);
        }
    }
    
    $scope.toggleMute = function() {
        // Start tracking of start/end time
        if($scope.videoDisplay.volume == 1.0) {
            $scope.mutePeriod = {
                start: $scope.currentTime,
                end: $scope.totalTime
            };
        } else {
            $scope.mutePeriod.end = $scope.currentTime;
            $scope.redactAudio.push($scope.mutePeriod);
        }
        

        if($scope.videoDisplay.volume == 0.0){
            $scope.videoDisplay.volume = 1.0;
            $('#muteBtn').children("span").toggleClass("glyphicon-volume-up", true);
            $('#muteBtn').children("span").toggleClass("glyphicon-volume-off", false);
        }else{
            $scope.videoDisplay.volume = 0.0;
            $('#muteBtn').children("span").toggleClass("glyphicon-volume-up", false);
            $('#muteBtn').children("span").toggleClass("glyphicon-volume-off", true);
        }
    }
     
    $scope.toggleFullscreen = function() {
        var v = $scope.videoDisplay;
        if(v.requestFullscreen) {
            v.requestFullscreen();
        }else if(v.mozRequestFullScreen) {
            v.mozRequestFullScreen();
        }else if(v.webkitRequestFullscreen) {
            v.webkitRequestFullscreen();
        }else if(v.msRequestFullscreen) {
            v.msRequestFullscreen();
        }
    }
    
    // Draw shapes on HTML5 Canvas
     $scope.toggleDrawing = function($event) { 
        // Enable or disable drawing
        $scope.isInteractive = !$scope.isInteractive;
        $scope.togglePlay();
        
        if(!$scope.isInteractive) {
            $event.stopPropagation();
        } else {  
            $scope.canvas.addEventListener("mousedown", $scope.mouseDown, false);
            $scope.canvas.addEventListener("mouseup", $scope.mouseUp, false);
            $scope.canvas.addEventListener("mousemove", $scope.mouseMove, false); 
        }
    }


    $scope.mouseDown = function($event) {
      $scope.isDrawing = true;
      $scope.ctx.save();
      var rect = $scope.getMousePosition($scope.canvas, $event);
      $scope.rectPts = {
        x1: rect.x,
        y1: rect.y,
        x2: rect.x+1,
        y2: rect.y+1
      }
      $scope.drawRect($scope.ctx, $scope.rectPts);
    }

    $scope.mouseMove = function($event) {
        if($scope.isDrawing) {
            var rect = $scope.getMousePosition($scope.canvas, $event);
            $scope.rectPts.x2 =  rect.x;
            $scope.rectPts.y2 =  rect.y;
            //$scope.drawRect($scope.ctx, $scope.rectPts);
        }
    }

    $scope.mouseUp = function($event) {
        var rect = $scope.getMousePosition($scope.canvas, $event);
        $scope.rectPts.x2 =  rect.x;
        $scope.rectPts.y2 =  rect.y;

        $scope.isDrawing = false;
        $scope.drawRect($scope.ctx, $scope.rectPts);
        $scope.ctx.save();
    }

    $scope.drawRect = function(context, rect) {
        
        var w = rect.x2 - rect.x1;
        var h = rect.y2 - rect.y1;
        
        var offsetX = (w < 0) ? w : 0;
        var offsetY = (h < 0) ? h : 0;
    
        var width = Math.abs(w);
        var height = Math.abs(h);

        //context.clearRect(0, 0, $scope.ctx.canvas.width, $scope.ctx.canvas.height);
        context.beginPath();
        context.rect(rect.x1 + offsetX, rect.y1 + offsetY, width, height);
        context.lineWidth = 5;
        context.strokeStyle = 'red';
        context.stroke();
        
        //context.save();
    }

    $scope.getMousePosition = function(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
    }

    $scope.initPlayer();
    
}]);

videoApp.filter('time', function() {
    return function(seconds) {
        var hh = Math.floor(seconds / 3600), mm = Math.floor(seconds / 60) % 60, ss = Math.floor(seconds) % 60;
        return hh + ":" + (mm < 10 ? "0" : "") + mm + ":" + (ss < 10 ? "0" : "") + ss;
    };
});



