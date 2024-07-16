const MKey = {
	MK_COIN: 0, MK_2P_START:1, MK_1P_START:2, MK_1P_SHOT:3, MK_1P_LEFT:4, MK_1P_RIGHT:5, MK_2P_SHOT:6, MK_2P_LEFT:7, MK_2P_RIGHT:8
};
const SCREEN_HEIGHT = 256;
const SCREEN_WIDTH = 224;
const PIXEL_SIZE_Y = 2;
const PIXEL_SIZE_X = 2;
const CLOCK_SPEED = 2000000;

var vramBufferPtr;
var vramBufferArr;

var WINDOW_HEIGHT = PIXEL_SIZE_Y * SCREEN_HEIGHT;
var WINDOW_WIDTH = PIXEL_SIZE_X * SCREEN_WIDTH;

var canvas = document.getElementById("game");
var ctx = canvas.getContext('2d');
ctx.willReadFrequently = true;

canvas.height = WINDOW_HEIGHT;
canvas.width = WINDOW_WIDTH;
var imageData = ctx.createImageData(canvas.width, canvas.height);
var pixelData = imageData.data;

var cpu;
var mach;

var frameCount = 0;
var sumOfTimes = 0;
var maxTime = 0;
const FPS_CHECK_INTERVAL = 3000; // ms
var Module = {
	onRuntimeInitialized: async function() {
		console.log("initeed!");
		cpu = Module._initState8080();
		mach = Module._initMachine();
		// load roms
		await loadFile("./spaceinvadersemulator/roms/invaders.h", 0x0000);
		await loadFile("./spaceinvadersemulator/roms/invaders.g", 0x0800);
		await loadFile("./spaceinvadersemulator/roms/invaders.f", 0x1000);
		await loadFile("./spaceinvadersemulator/roms/invaders.e", 0x1800);

		window.addEventListener("keydown", function(event) {
			switch (event.code) {
				case "ShiftLeft":
					Module._machineKeyDown(mach, MKey.MK_COIN);
					break;
				case "Digit1":
					Module._machineKeyDown(mach, MKey.MK_1P_START);
					break;
				case "Digit2":
					Module._machineKeyDown(mach, MKey.MK_2P_START);
					break;
				case "KeyA":
					Module._machineKeyDown(mach, MKey.MK_1P_LEFT);
					break;
				case "KeyD":
					Module._machineKeyDown(mach, MKey.MK_1P_RIGHT);
					break;
				case "KeyW":
					Module._machineKeyDown(mach, MKey.MK_1P_SHOT);
					break;
				case "ArrowLeft":
					Module._machineKeyDown(mach, MKey.MK_2P_LEFT);
					break;
				case "ArrowRight":
					Module._machineKeyDown(mach, MKey.MK_2P_RIGHT);
					break;
				case "ArrowUp":
					Module._machineKeyDown(mach, MKey.MK_2P_SHOT);
					break;
			}
		});
		window.addEventListener("keyup", function(event) {
			switch (event.code) {
				case "ShiftLeft":
					Module._machineKeyUp(mach, MKey.MK_COIN);
					break;
				case "Digit1":
					Module._machineKeyUp(mach, MKey.MK_1P_START);
					break;
				case "Digit2":
					Module._machineKeyUp(mach, MKey.MK_2P_START);
					break;
				case "KeyA":
					Module._machineKeyUp(mach, MKey.MK_1P_LEFT);
					break;
				case "KeyD":
					Module._machineKeyUp(mach, MKey.MK_1P_RIGHT);
					break;
				case "KeyW":
					Module._machineKeyUp(mach, MKey.MK_1P_SHOT);
					break;
				case "ArrowLeft":
					Module._machineKeyUp(mach, MKey.MK_2P_LEFT);
					break;
				case "ArrowRight":
					Module._machineKeyUp(mach, MKey.MK_2P_RIGHT);
					break;
				case "ArrowUp":
					Module._machineKeyUp(mach, MKey.MK_2P_SHOT);
					break;
			}
		});

		let vramLength = ((SCREEN_HEIGHT * SCREEN_WIDTH) / 8) | 0
		vramBufferPtr = Module._malloc(vramLength);
		vramBufferArr = Module.HEAPU8.subarray(vramBufferPtr, vramBufferPtr + vramLength);
		
		console.log(vramLength);
		console.log(vramBufferArr.length); 

		console.log(pixelData.length);
		console.log(canvas.height * canvas.width * 4);
		requestAnimationFrame(gameLoop);
		/*
		for (let i = 0; i < canvas.height; i++) {
			for (let j = 0; j < 96; j++) {
				let idx = (i * canvas.width + j)* 4;
				pixelData[idx] = 0;
				pixelData[idx+1] = 0;
				pixelData[idx+2] = 0;
				pixelData[idx+3] = 0xFF;
			}
		}
		ctx.putImageData(imageData, 0, 0);
		*/
	}
};

async function loadFile(fileName, offset) {
	let res = await fetch(fileName);
	let arrayBuffer = await res.arrayBuffer();
	var byteArr = new Uint8Array(arrayBuffer);
	var length = byteArr.length;
	var ptr = Module._malloc(length);

	Module.HEAPU8.set(byteArr, ptr);

	Module._loadBytesIntoMemory(cpu, ptr, length, offset);
	console.log(Module.HEAPU8.subarray(ptr, ptr+length));
	Module._free(ptr);
}

var cycles = 0;
var lastTime = 0;
var lastFpsCheckTime = 0;

const CYCLES_PER_FRAME = (CLOCK_SPEED / 60) | 0;
const CYCLES_PER_MS = (CLOCK_SPEED / 1000) | 0;
const MS_PER_FRAME = (1000 / 60) | 0;
function gameLoop(timestamp) {
	let deltaTime = timestamp - lastTime;
	lastTime = timestamp;
	sumOfTimes += deltaTime;
	frameCount++;
	maxTime = Math.max(maxTime, deltaTime);

	if (timestamp - lastFpsCheckTime > FPS_CHECK_INTERVAL ) {
		console.log(`Average FPS over last ${FPS_CHECK_INTERVAL/1000} seconds: ${1000 / (sumOfTimes / frameCount)}`);
		console.log(`Max time between consecutive frames: ${maxTime}`);
		sumOfTimes = 0;
		maxTime = 0;
		frameCount = 0;
		lastFpsCheckTime = timestamp;
	}
  
	// draw left half
	Module._copyVRAM(cpu, vramBufferPtr);
	let pixel;
	let pixelA = 0xFF; 

	
	for (let i = 0; i < SCREEN_WIDTH; i++) {
		for (let j = 0; j < SCREEN_HEIGHT; j++) {
			//if (vramBufferArr[i][(j/8)|0]>>(j%8) & 1) {
			if ((vramBufferArr[i*((SCREEN_HEIGHT/8)|0) + ((j/8)|0)]>>(j%8)) & 1) {
				pixelR = pixelG = pixelB = 0xFF;
			}
			else {
				pixelR = pixelG = pixelB = 0;
			}
			for (let k = 0; k < PIXEL_SIZE_Y; k++) {
				for (let l = 0; l < PIXEL_SIZE_X; l++) {
					let idx = ((PIXEL_SIZE_Y*(SCREEN_HEIGHT - 1 - j) + k) * WINDOW_WIDTH + (PIXEL_SIZE_X*i + l)) * 4;
					pixelData[idx] = pixelR;
					pixelData[idx+1] = pixelG;
					pixelData[idx+2] = pixelB;
					pixelData[idx+3] = pixelA;
				}
			}
		}
	}
	ctx.putImageData(imageData, 0, 0);
	Module._VBlankHalfInterrupt(cpu);
	for (let i = 0; i < 1000; i++) Module._nextOp8080(cpu, mach);
	Module._VBlankFullInterrupt(cpu);
	let target = deltaTime * CYCLES_PER_MS;
	while (cycles < target) cycles += Module._nextOp8080(cpu, mach);
	cycles = 0;

	/*
	// draw right half
	Module._copyVRAM(cpu, vramBufferPtr);
	imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for (let i = 96; i < SCREEN_WIDTH; i++) {
		for (let j = 0; j < SCREEN_HEIGHT; j++) {
			//if (vramBufferArr[i][(j/8)|0]>>(j%8) & 1) {
			if ((vramBufferArr[i*((SCREEN_HEIGHT/8)|0) + ((j/8)|0)]>>(j%8)) & 1) {
				pixelR = pixelG = pixelB = 0xFF;
			}
			else {
				pixelR = pixelG = pixelB = 0;
			}
			for (let k = 0; k < PIXEL_SIZE_Y; k++) {
				for (let l = 0; l < PIXEL_SIZE_X; l++) {
					let idx = ((PIXEL_SIZE_Y*(SCREEN_HEIGHT - 1 - j) + k) * WINDOW_WIDTH + (PIXEL_SIZE_X*i + l)) * 4;
					pixelData[idx] = pixelR;
					pixelData[idx+1] = pixelG;
					pixelData[idx+2] = pixelB;
					pixelData[idx+3] = pixelA;
				}
			}
		}
	}
	ctx.putImageData(imageData, 0, 0);
	Module._VBlankFullInterrupt(cpu);
	while (cycles < CYCLES_PER_FRAME) {
		cycles += Module._nextOp8080(cpu, mach);
	}
	cycles = 0;
	*/
	requestAnimationFrame(gameLoop);
}
