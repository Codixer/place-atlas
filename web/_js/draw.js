/*
	========================================================================
	The 2022 /r/place Atlas

	An Atlas of Reddit's 2022 /r/place, with information to each
	artwork	of the canvas provided by the community.

	Copyright (c) 2017 Roland Rytz <roland@draemm.li>
	Copyright (c) 2022 r/placeAtlas2 contributors

	Licensed under the GNU Affero General Public License Version 3
	https://place-atlas.stefanocoding.me/license.txt
	========================================================================
*/

var finishButton = document.getElementById("finishButton");
var resetButton = document.getElementById("resetButton");
var undoButton = document.getElementById("undoButton");
var redoButton = document.getElementById("redoButton");
var highlightUnchartedLabel = document.getElementById("highlightUnchartedLabel");
var entryId = 0

var objectInfoBox = document.getElementById("objectInfo");
var hintText = document.getElementById("hint");

var periodsStatus = document.getElementById('periodsStatus')
var periodGroups = document.getElementById('periodGroups')
var periodGroupTemplate = document.getElementById('period-group').content.firstElementChild.cloneNode(true)
var periodsAdd = document.getElementById('periodsAdd')	

var exportButton = document.getElementById("exportButton");
var cancelButton = document.getElementById("cancelButton");

var exportOverlay = document.getElementById("exportOverlay");
var exportCloseButton = document.getElementById("exportCloseButton");
var exportBackButton = document.getElementById("exportBackButton")

var path = [];

var pathWithPeriods = []
var periodGroupElements = []

var drawing = true;

function initDraw(){
	
	wrapper.classList.remove('listHidden')

	window.render = render
	window.renderBackground = renderBackground
	window.updateHovering = updateHovering

	// var startPeriodField = document.getElementById('startPeriodField')
	// var endPeriodField = document.getElementById('endPeriodField')
	// var periodVisbilityInfo = document.getElementById('periodVisbilityInfo')

	var rShiftPressed = false;
	var lShiftPressed = false;
	var shiftPressed = false;

	var highlightUncharted = true;

	renderBackground();
	applyView();

	container.style.cursor = "crosshair";
	
	var undoHistory = [];

	render(path);

	container.addEventListener("mousedown", function(e){
		lastPos = [
			 e.clientX,
			e.clientY
		];
	});

	function getCanvasCoords(x, y){
		x = x - container.offsetLeft;
		y = y - container.offsetTop;

		var pos = [
			~~((x - (container.clientWidth/2  - innerContainer.clientWidth/2  + zoomOrigin[0]))/zoom)+0.5,
			~~((y - (container.clientHeight/2 - innerContainer.clientHeight/2 + zoomOrigin[1]))/zoom)+0.5
		];
		
		if(shiftPressed && path.length > 0){
			var previous = path[path.length-1];
			
			if(Math.abs(pos[1] - previous[1]) > Math.abs(pos[0] - previous[0]) ){
				pos[0] = previous[0];
			} else {
				pos[1] = previous[1];
			}
		}

		return pos;
	}

	container.addEventListener("mouseup", function(e){
		

		if(Math.abs(lastPos[0] - e.clientX) + Math.abs(lastPos[1] - e.clientY) <= 4 && drawing){

			var coords = getCanvasCoords(e.clientX, e.clientY);
			
			path.push(coords);
			render(path);

			undoHistory = [];
			redoButton.disabled = true;
			undoButton.disabled = false;

			if(path.length >= 3){
				finishButton.disabled = false;
			}
		}
	});

	window.addEventListener("mousemove", function(e){
		
		if(!dragging && drawing && path.length > 0){

			var coords = getCanvasCoords(e.clientX, e.clientY);
			render(path.concat([coords]));
		}
		
	});

	window.addEventListener("keyup", function(e){
		if(e.key == "Enter"){
			finish();
		} else if(e.key == "z" && e.ctrlKey){
			undo();
		} else if(e.key == "y" && e.ctrlKey){
			redo();
		} else if(e.key == "Escape"){
			exportOverlay.style.display = "none";
		} else if (e.key === "Shift" ){
			if(e.code === "ShiftRight"){
				rShiftPressed = false;
			} else if(e.code === "ShiftLeft"){
				lShiftPressed = false;
			}
			shiftPressed = rShiftPressed || lShiftPressed;
		}
	});

	window.addEventListener("keydown", function(e){
		if (e.key === "Shift" ){
			if(e.code === "ShiftRight"){
				rShiftPressed = true;
			} else if(e.code === "ShiftLeft"){
				lShiftPressed = true;
			}
			shiftPressed = rShiftPressed || lShiftPressed;
		}
	});

	finishButton.addEventListener("click", function(e){
		finish();
	});

	undoButton.addEventListener("click", function(e){
		undo();
	});

	redoButton.addEventListener("click", function(e){
		redo();
	});

	resetButton.addEventListener("click", function(e){
		reset();
	});
	
	cancelButton.addEventListener("click", function(e){
		back();
	});

	document.getElementById("nameField").addEventListener("keyup", function(e){
		if(e.key == "Enter"){
			exportJson();
		}
	});

	document.getElementById("websiteField").addEventListener("keyup", function(e){
		if(e.key == "Enter"){
			exportJson();
		}
	});

	document.getElementById("subredditField").addEventListener("keyup", function(e){
		if(e.key == "Enter"){
			exportJson();
		}
	});

	exportButton.addEventListener("click", function(e){
		exportJson();
	});

	exportCloseButton.addEventListener("click", function(e){
		reset();
		exportOverlay.style.display = "none";
	});

	exportBackButton.addEventListener("click", function(e){
		finish();
		exportOverlay.style.display = "none";
	});

	document.getElementById("highlightUncharted").addEventListener("click", function(e){
		highlightUncharted = this.checked;
		render(path);
	});

	function exportJson(){		
		var exportObject = {
			id: entryId,
			name: document.getElementById("nameField").value,
			description: document.getElementById("descriptionField").value,
			website: document.getElementById("websiteField").value,
			subreddit: document.getElementById("subredditField").value,
			center: calculateCenter(path),
			path: path,
		};

		if (startPeriodField.value === endPeriodField.value) {
			exportObject.period = [startPeriodField.value]
		} else if (startPeriodField.value * 1 < endPeriodField.value * 1) {
			exportObject.period = [startPeriodField.value + "-" + endPeriodField.value]
		}
		var jsonString = JSON.stringify(exportObject, null, "\t");
		var textarea = document.getElementById("exportString");
		jsonString = jsonString.split("\n");
		jsonString = jsonString.join("\n    ");
		jsonString = "    "+jsonString;
		textarea.value = jsonString;
		var directPostUrl = "https://www.reddit.com/r/placeAtlas2/submit?selftext=true&title=New%20Submission&text="+encodeURIComponent(document.getElementById("exportString").value);
		if (jsonString.length > 7493) {
			directPostUrl = "https://www.reddit.com/r/placeAtlas2/submit?selftext=true&title=New%20Submission&text="+encodeURIComponent("    " + JSON.stringify(exportObject));
		}
		document.getElementById("exportDirectPost").href=directPostUrl;

		exportOverlay.style.display = "flex";
		
		textarea.focus();
		textarea.select();
	}


	function calculateCenter(path){

		var area = 0,
			i,
			j,
			point1,
			point2,
			x = 0,
			y = 0,
			f;

		for (i = 0, j = path.length - 1; i < path.length; j=i,i++) {
			point1 = path[i];
			point2 = path[j];
			f = point1[0] * point2[1] - point2[0] * point1[1];
			area += f;
			x += (point1[0] + point2[0]) * f;
			y += (point1[1] + point2[1]) * f;
		}
		area *= 3;

		return [Math.floor(x / area)+0.5, Math.floor(y / area)+0.5];
	}

	function undo(){
		if(path.length > 0 && drawing){
			undoHistory.push(path.pop());
			redoButton.disabled = false;
			updatePath()
		}
	}

	function redo(){
		if(undoHistory.length > 0 && drawing){
			path.push(undoHistory.pop());
			undoButton.disabled = false;
			updatePath()
		}
	}

	function finish(){
		drawing = false;
		updatePath()
		objectInfoBox.style.display = "block";
		objectDraw.style.display = "none";
		hintText.style.display = "none";
		document.getElementById("nameField").focus();
		// if (isOnPeriod()) {
		// 	periodVisbilityInfo.textContent = ""
		// } else {
		// 	periodVisbilityInfo.textContent = "Not visible during this period!"
		// }
	}

	function reset(){
		updatePath([])
		undoHistory = [];
		drawing = true;
		objectInfoBox.style.display = "none";
		objectDraw.style.display = "block";
		hintText.style.display = "block";

		document.getElementById("nameField").value = "";
		document.getElementById("descriptionField").value = "";
		document.getElementById("websiteField").value = "";
		document.getElementById("subredditField").value = "";
	}

	function back(){
		drawing = true;
		updatePath()
		objectInfoBox.style.display = "none";
		objectDraw.style.display = "block";
		hintText.style.display = "block";
	}

	function renderBackground(){

		backgroundContext.clearRect(0, 0, canvas.width, canvas.height);
			
		backgroundContext.fillStyle = "rgba(0, 0, 0, 1)";
		//backgroundContext.fillRect(0, 0, canvas.width, canvas.height);
		
		for(var i = 0; i < atlas.length; i++){

			var path = atlas[i].path;
			
			backgroundContext.beginPath();

			if(path[0]){
				backgroundContext.moveTo(path[0][0], path[0][1]);
			}
			
			for(var p = 1; p < path.length; p++){
				backgroundContext.lineTo(path[p][0], path[p][1]);
			}

			backgroundContext.closePath();
			
			backgroundContext.fill();
		}
	}

	function render(path){

		context.globalCompositeOperation = "source-over";
		context.clearRect(0, 0, canvas.width, canvas.height);
		
		if(highlightUncharted){
			context.drawImage(backgroundCanvas, 0, 0);
			context.fillStyle = "rgba(0, 0, 0, 0.4)";
		} else {
			context.fillStyle = "rgba(0, 0, 0, 0.6)";
		}
		
		context.fillRect(0, 0, canvas.width, canvas.height);

		context.beginPath();

		if(path[0]){
			context.moveTo(path[0][0], path[0][1]);
		}
		
		for(var i = 1; i < path.length; i++){
			context.lineTo(path[i][0], path[i][1]);
		}

		context.closePath();

		context.strokeStyle = "rgba(255, 255, 255, 1)";
		context.stroke();

		context.globalCompositeOperation = "destination-out";

		context.fillStyle = "rgba(0, 0, 0, 1)";
		context.fill();
		
	}
	
	function updateHovering(e, tapped){
		if(!dragging && (!fixed || tapped)){
			var pos = [
				 (e.clientX - (container.clientWidth/2 - innerContainer.clientWidth/2 + zoomOrigin[0] + container.offsetLeft))/zoom
				,(e.clientY - (container.clientHeight/2 - innerContainer.clientHeight/2 + zoomOrigin[1] + container.offsetTop))/zoom
			];
			var coords_p = document.getElementById("coords_p");
			coords_p.innerText = Math.ceil(pos[0]) + ", " + Math.ceil(pos[1]);
	
		}
	}

	const getEntry = id => {
		const entries = atlas.filter(entry => entry.id === id)
		if (entries.length === 1) return entries[0]
		return {}
	}

	let params = new URLSearchParams(document.location.search)

	if (params.has('id')) {
		entry = getEntry(params.get('id'))
		document.getElementById("nameField").value = entry.name
		document.getElementById("descriptionField").value = entry.description
		document.getElementById("websiteField").value = entry.website
		document.getElementById("subredditField").value = entry.subreddit
		path = entry.path
		redoButton.disabled = true;
		undoButton.disabled = false;
		entryId = params.get('id')

		if (typeof entry.period === "string") {
            entry.period.split(', ').some(period => {
                if (period.search('-') + 1) {
                    var [before, after] = period.split('-')
                    startPeriodField.value = before
					endPeriodField.value = after
					console.log(before, after)
					return
                }
            })
        }

		if (Array.isArray(path)) {
			pathWithPeriods.push([defaultPeriod, path])
		} else if (typeof path === "object") {
			pathWithPeriods = Object.entries(path)
		}

		console.log(pathWithPeriods)

		zoom = 4;

		zoomOrigin = [
			innerContainer.clientWidth/2  - entry.center[0]* zoom,// + container.offsetLeft
		   	innerContainer.clientHeight/2 - entry.center[1]* zoom// + container.offsetTop
	   ];

	   	scaleZoomOrigin = [
		   2000/2 - entry.center[0],// + container.offsetLeft
		   2000/2 - entry.center[1]// + container.offsetTop
	   	];

	   applyView();
	} else {
		pathWithPeriods.push([defaultPeriod, []])
	}

	initPeriodGroups()

	document.addEventListener('timeupdate', (event) => {
		updatePeriodGroups()
	})

	periodsAdd.addEventListener('click', () => {
		pathWithPeriods.push([defaultPeriod, []])
		initPeriodGroups()
	})

}

function isOnPeriod(start = parseInt(startPeriodField.value), end = parseInt(endPeriodField.value), current = period) {
	console.log(start, end, current, current >= start && current <= end)
	return current >= start && current <= end
}

function initPeriodGroups() {

	periodGroupElements = []
	periodGroups.textContent = ''

	console.log(pathWithPeriods)

	pathWithPeriods.forEach(([period, path], index) => {
		let periodGroupEl = periodGroupTemplate.cloneNode(true)
		periodGroupEl.id = "periodGroup" + index

		let startPeriodEl = periodGroupEl.querySelector('.period-start')
		let endPeriodEl = periodGroupEl.querySelector('.period-end')
		let periodVisibilityEl = periodGroupEl.querySelector('.period-visible')
		let periodDeleteEl = periodGroupEl.querySelector('.period-delete')
		let periodDuplicateEl = periodGroupEl.querySelector('.period-duplicate')

		let [start, end] = parsePeriod(period)

		startPeriodEl.id = "periodStart" + index
		startPeriodEl.previousSibling.for = startPeriodEl.id
		endPeriodEl.id = "periodEnd" + index
		endPeriodEl.previousSibling.for = endPeriodEl.id
		periodVisibilityEl.id = "periodVisibility" + index

		startPeriodEl.value = start
		startPeriodEl.max = maxPeriod
		endPeriodEl.value = end
		endPeriodEl.max = maxPeriod

		startPeriodEl.addEventListener('input', () => {
			updatePeriodGroups()
		})
		endPeriodEl.addEventListener('input', () => {
			updatePeriodGroups()
		})
		periodDeleteEl.addEventListener('click', () => {
			if (pathWithPeriods.length === 1) return
			pathWithPeriods = pathWithPeriods.filter((_, i) => i !== index)
			initPeriodGroups()
		})
		periodDuplicateEl.addEventListener('click', () => {
			pathWithPeriods.push([pathWithPeriods[index][0], [...pathWithPeriods[index][1]]])
			initPeriodGroups()
		})

		periodGroups.appendChild(periodGroupEl)
		periodGroupElements.push({
			periodGroupEl,
			startPeriodEl,
			endPeriodEl,
			periodVisibilityEl
		})
	})
	console.log(periodGroupTemplate)
	updatePeriodGroups()

}

function updatePeriodGroups() {
	var pathToActive = []
	var lastActivePathIndex
	var currentActivePathIndex 

	periodGroupElements.forEach((elements, index) => {
		let {
			periodGroupEl,
			startPeriodEl,
			endPeriodEl,
			periodVisibilityEl
		} = elements

		if (periodGroupEl.dataset.active === "true") lastActivePathIndex = index

		if (isOnPeriod(
			parseInt(startPeriodEl.value), 
			parseInt(endPeriodEl.value),
			period
		)) {
			pathToActive = pathWithPeriods[index][1]
			currentActivePathIndex = index
			periodGroupEl.dataset.active = true
		} else {
			periodGroupEl.dataset.active = false
		}

		pathWithPeriods[index][0] = formatPeriod(
			parseInt(startPeriodEl.value), 
			parseInt(endPeriodEl.value),
			period
		)
	})

	periodsStatus.textContent = ""
	if (lastActivePathIndex !== undefined) {
		if (lastActivePathIndex === currentActivePathIndex) {
			// just update the path
			pathWithPeriods[currentActivePathIndex] = [
				formatPeriod(
					parseInt(periodGroupElements[currentActivePathIndex].startPeriodEl.value),
					parseInt(periodGroupElements[currentActivePathIndex].endPeriodEl.value)
				),
				path
			]
			console.log(pathWithPeriods[currentActivePathIndex])
		} else if (currentActivePathIndex === undefined) {
			pathWithPeriods[lastActivePathIndex][1] = path
			updatePath([])
			periodsStatus.textContent = "No paths available on this period!"
		} else {
			// switch the path
			pathWithPeriods[lastActivePathIndex][1] = path
			updatePath(pathToActive)

		}
	} else {
		updatePath(pathToActive)
	}

	drawing = currentActivePathIndex !== undefined
	
}

function parsePeriod(periodString) {
	periodString = periodString + ""
	// TODO: Support for multiple/alternative types of canvas
	if (periodString.search('-') + 1) {
		var [start, end] = periodString.split('-').map(i => parseInt(i))
		return [start, end]
	} else {
		let periodNew = parseInt(periodString)
		return [periodNew, periodNew]
	}
}

function formatPeriod(start, end) {
	if (start === end) return start
	else return start + "-" + end
}

function updatePath(newPath = path) {
	path = newPath
	render(path)
	finishButton.disabled = path.length;
	undoButton.disabled = path.length == 1; // Maybe make it undo the cancel action in the future
	// TODO: Able to click finish when one period has it.
	finishButton.disabled = path.length < 3;
}