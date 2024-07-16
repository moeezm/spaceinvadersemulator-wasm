#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "spaceinvadersemulator/emulate8080.h"
#include "spaceinvadersemulator/machine.h"

#define VRAM_START 0x2400

int add(int x, int y) {
	return x + y;
}

void free8080(State8080* state) {
	free(state);
}

void freeMachine(Machine* machine) {
	free(machine);
}

void copyVRAM(State8080* cpu, u8* buffer) {
	memcpy(buffer, cpu->memory + VRAM_START, 0x1C00);
}

void loadBytesIntoMemory(State8080* cpu, u8* buffer, int sz, int offset) {
	memcpy(cpu->memory + offset, buffer, sz);
}

u8 getMemByte(State8080* cpu, int idx) {
	return cpu->memory[idx];
}
