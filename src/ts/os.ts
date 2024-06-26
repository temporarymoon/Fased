import { print } from "./print";
import { Planet } from "./planet";
import { length, tau } from "./math";
import * as loop from "mainloop.js";
import { WormHole } from "./WormHole";
import * as score from "./score";
import { fadeIn, fadeOut } from "./animations";

const paths = ["./assets/meteor.png","./assets/meteor2.png","./assets/meteor3.png"];
const images = paths.map(val => {
    const img = new Image(400,400);
    img.src = val;
    return img;
});

const earth = new Image(1000,1000);
earth.src = "./assets/earth.png";

type planetOptions = [number, number, number[], number[], boolean,HTMLImageElement];
interface system {
    planets: planetOptions[];
    G: number;
}
interface Line {
    radius: number;
    speed: number;
}

let started = performance.now();
let currentCameraOffset = 0;
let cameraOffsetStack = 0;
let basicCameraEffect = 15;
let speedUpEffect = 0;
let scoreMultiplier = 0.001;
let planets: Array<Planet> = [];
let wormHoles: Array<WormHole> = [];
let lines: Line[] = [];
let hp = 100;
let hpDamage = 11;
let deltaPlanetSpawn = 75;
let planetSpawnRadius = [300, 360];
let planetSpawnerClock = 0;

const restart = document.getElementById("again");
const popup = document.getElementById("end");
const terminal = document.getElementById("terminal");
const input = <HTMLInputElement>document.getElementById("terminal-input");
const container = terminal.parentElement;
popup.style.zIndex = "-1";
fadeOut(popup,0.5);
restart.addEventListener("click",(e) => {
    commands.restart("");
});

let startedMusic = false;
let music = new Audio("assets/music.ogg");
music.loop = true;

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const ctx: CanvasRenderingContext2D = canvas.getContext("2d");
let scale = 1;

canvas.height = window.innerHeight * scale;
canvas.width = window.innerWidth * scale;

const lineWidth = 20;
const original_os_name = "axios";
const commandHistory = [];
const portalSize = 12;


let level = 1;
let scorePerLevel = 10;
let lastScore = 0;
let normalLineSpeed = 2;
let lineSpeed = normalLineSpeed;
let points = 0;
let normalDeltaLines = 100;
let deltaLines = normalDeltaLines;
let lineTime = 0;
let size = [canvas.width, canvas.height];
let diagonal = Math.sqrt(size[0] ** 2 + size[1] ** 2);
let os_name = original_os_name;
let currentCommand = -1;
let tempPortals = [null, null];
let portalLimit = 5000;
let initialSystem: system = {
    planets: [
        [60, 100, size.map(val => val / 2), [0, 0], true,earth]
    ],
    G: 20
};

const loadSystem = (data: system): void => {
    level = 1;
    hp = 100;
    points = 0;
    planetSpawnerClock = 0;
    deltaPlanetSpawn = 75;
    lastScore = 0;
    scorePerLevel = 10;
    planets = [];
    wormHoles = [];
    tempPortals = [];
    started = performance.now();

    memory.G = data.G;
    print("<span class'red'>Reseting G...</span>")
    for (let i of data.planets) {
        print(`<span class="blue">Creating the planet:</span> ${i}...`);
        const newplanet = new Planet(i[0], i[1], i[2], i[4],i[5]);
        newplanet.speed = [i[3][0], i[3][1]];
        print(`<span class="blue">Loading the planet</span> ${i} <span class="blue">into the universe...</span>`)
        planets.push(newplanet);
    }

    fadeOut(popup,0.05);
    setTimeout(() => {
        popup.style.zIndex = "-1";
    }, 1000);
    // commands.start("");
    print("<span class='green'>Universe succesfully reseted.</span>");
}
const memory = {
    lineOperator: "overlay",
    warp: 0.1,
    G: 10,
    spawn: 0.3,
    dev: "0"
};
const commands = {
    "set": (key: any, value: any, path: string) => {
        print(path);
        memory[key] = value;
        print(memory, false);
    },
    "rename": (name: string, path: string) => {
        if (!path) {
            commands.rename(original_os_name, name);
            return;
        }
        const old_name = os_name;
        os_name = name;
        print(path);
        print(`<span class="green">${old_name}</span> succesfully renamed to <span class="red">${os_name}</span>`)
    },
    "print": (key: string, path: string) => {
        if (!path) {
            commands.print("*", key);
            return;
        }
        print(path);
        if (key == "*" || key === undefined || key === null || key === "")
            print(memory, false);
        else if (memory[key] != undefined)
            print(memory[key], false);
        else
            print(`<span class="error"> Error!!! ${key} is undefined </span>`, false);
    },
    "help": (path: string = "") => {
        print(path);

        print(`<span style="color:red">${os_name} set key value </span> => sets the value of key to value. You can use any variable you defined in your commands by adding the @ prefix.`)
        print(`<span class="example"> Example: </span>
            <br> >   ${os_name} set p print 
            <br> >   ${os_name} set 3 7 
            <br> >   ${os_name} @p 3 
            <br> >   7`
        );

        print(`<span style="color:red">${os_name} print key? </span> => prints the value of key (or the entire memory if key is  * or if key is not passed)`);
        print(`<span class="example"> Example: </span>
            <br> >   ${os_name} set 3 7 
            <br> >   ${os_name} print 3 
            <br> >   7
            <br> > ${os_name} print
            <br> > {"3":"7"}`
        );

        print(`<span style="color:red">${os_name} rename name</span> => changes the name of the cli to name`);
        print(`<span class="example"> Example: </span>
            <br> >   ${os_name} rename OwO 
            <br> >   ${os_name} print 3 <span class="comment">//some error</span>
            <br> >   OwO print <span class="comment">//works</span>`
        );

        print(`<span style="color:red">${os_name} start </span> => starts the universe`);
        print(`<span style="color:red">${os_name} stop </span> => stops the universe`);
        print(`<span style="color:red">${os_name} clear </span> => clears the console`);
    },
    "clear": () => {
        terminal.innerHTML = "";
    },
    "start": (path: string) => {
        print(path);
        loop.stop().start();
        print(`<span class="green">The universe was succesfully started</span>`);

        if (!startedMusic){
            startedMusic = true;
            music.play();
            // music.loop = true;
        }
    },
    "stop": (path: string) => {
        print(path);
        loop.stop();
        print(`<span class="green">The universe was succesfully sopeed</span>`);
    },
    "restart": (path: string) => {
        print(path);
        loadSystem(initialSystem);
        commands.start(path);
    },
    "noPortalLimit": (path: string = "") => {
        print(path);
        portalLimit = Math.sqrt(size[0] ** 2 + size[1] ** 2);
    },
    "hp": (value: string, path: string = "") => {
        print(path);
        print(`Setting the hp to ${value}...`, false);
        hp = parseFloat(value);
    },
    "score": (value: string, path: string = "") => {
        print(path);
        print(`Setting the score to ${value}...`, false);
        points = parseFloat(value);
    }
};
function run(command: string) {
    const words = command.split(" ");
    commandHistory.push(command);
    currentCommand = commandHistory.length;

    //use the memory
    for (let i = 0; i < words.length; i++) {
        if (words[i][0] == "@" && memory[words[i].substr(1)] != undefined)
            words[i] = memory[words[i].substr(1)];
    }

    const path = `<span class="blue"> >>>${words.join(" ")}: </span>`;

    //check if its a comment 
    if (command[0] == "/" && command[1] == "/") {
        print(`<span class="comment">//${command.substr(2)}<span>`);
        return;
    }

    //commands
    if (words[0] == os_name && words.length > 1) {
        const args = [...words];
        args.shift();
        args.shift();
        if (commands[words[1]] != undefined)
            commands[words[1]](...args, path);
        else
            print(`<span class="error">The command <span class="green">${words[1]}</span> is not defined. Run <span class="blue">${os_name}</span> or <span class="blue">${os_name} help</span> to get a list of all commands</span>`);
    }
    else if (words[0] == os_name)
        commands.help(path);
    else
        print(`<span class="error">The command <span class="green">${words.join(" ")}</span> is not defined. Run <span class="blue">${os_name}</span> or <span class="blue">${os_name} help</span> to get a list of all commands</span>`);
}
const back = () => {
    if (currentCommand < 1 || currentCommand - 1 >= commandHistory.length) return;
    input.value = commandHistory[--currentCommand];
};
const noPlanetOverlap = (data: Array<number>) => {
    if (!data) return true;
    for (let i of planets) {
        if (length(...i.position, ...data) < portalSize + i.radius) return false;
    }
    return true;
}
const portalSelfOverlap = (x1: Array<number>, x2: Array<number>): boolean => {
    if (!x1 || !x2) return true;
    return (length(...x1, ...x2) > 2 * portalSize);
}
const addBluePortal = (e) => {
    let sfx_1 = new Audio("assets/sfx_1.mp3");
    sfx_1.play();
    if (!tempPortals[0] || !tempPortals[1]) {
        if ((!tempPortals[1] || length(...e, ...tempPortals[1]) < portalLimit)
            && noPlanetOverlap(tempPortals[1])
            && noPlanetOverlap(e)
            && portalSelfOverlap(tempPortals[1], e))
            tempPortals[0] = e;
        if (tempPortals[0] && tempPortals[1]
            && noPlanetOverlap(tempPortals[0])
            && noPlanetOverlap(tempPortals[1])
            && portalSelfOverlap(tempPortals[0], tempPortals[1])) {
            wormHoles[0] = new WormHole(portalSize, tempPortals[0], tempPortals[1]);
        }
    }
    else if (length(...wormHoles[0].end, ...e) < portalLimit
        && noPlanetOverlap(wormHoles[0].end)
        && noPlanetOverlap(e)
        && portalSelfOverlap(wormHoles[0].end, e)) {
        wormHoles[0].start = e;
    }
};
const addRedPortal = (e) => {
    let sfx_1 = new Audio("assets/sfx_1.mp3");
    sfx_1.play();
    if (!tempPortals[0] || !tempPortals[1]) {
        if ((!tempPortals[0] || length(...e, ...tempPortals[0]) < portalLimit)
            && noPlanetOverlap(tempPortals[0])
            && noPlanetOverlap(e)
            && portalSelfOverlap(tempPortals[0], e))
            tempPortals[1] = e;
        if (tempPortals[0] && tempPortals[1]
            && noPlanetOverlap(tempPortals[0])
            && noPlanetOverlap(tempPortals[1])
            && portalSelfOverlap(tempPortals[0], tempPortals[1])) {
            wormHoles[0] = new WormHole(portalSize, tempPortals[0], tempPortals[1]);
        }
    }
    else if (length(...wormHoles[0].start, ...e) < portalLimit
        && noPlanetOverlap(wormHoles[0].start)
        && noPlanetOverlap(e)
        && portalSelfOverlap(wormHoles[0].start, e)) {
        wormHoles[0].end = e;
    }
};
const applyGravity = (time: number): void => {
    for (let i of planets) {
        for (let j of planets) {
            if (i != j) {
                const distance = length(...i.position, ...j.position);
                const acceleration = time * (i.mass * parseFloat(memory.G.toString())) / (distance ** 2);
                const direction = [
                    acceleration * (j.position[0] - i.position[0]) / distance,
                    acceleration * (j.position[1] - i.position[1]) / distance
                ];
                j.speed = [j.speed[0] - direction[0], j.speed[1] - direction[1]];
            }
        }
    }
}
function move(time: number): void {
    for (let i of planets) {
        if (i.locked) continue;
        i.position = i.position.map((val, index) => val + time * i.speed[index]);
    }
}
const drawPortalLimit = (color: string, position: [number, number]) => {
    let colorWithAlpha: string;
    if (color == "red")
        colorWithAlpha = "rgba(256,0,0,0.5)";
    else if (color == "blue")
        colorWithAlpha = "rgba(0,0,256,0.5)";
    else
        console.error(`Color: ${color} is not defined`);

    ctx.fillStyle = colorWithAlpha;
    ctx.beginPath();
    ctx.arc(position[0], position[1], portalLimit, 0, tau);
    ctx.fill();
}
const clear = (): void => {
    const color = 256 - Math.floor(256 * hp / 100);
    ctx.fillStyle = `rgba(0,${color / 4},${color / 4},0.9)`;
    ctx.fillRect(0, 0, size[0], size[1]);
}
const draw = (): void => {
    ctx.save();
    ctx.translate(Math.random() * currentCameraOffset * 2 - currentCameraOffset, Math.random() * currentCameraOffset * 2 - currentCameraOffset);

    clear();
    drawLine();
    for (let i of planets) {
        // ctx.fillStyle = "#ffff00";
        // ctx.beginPath();
        // ctx.arc(i.position[0], i.position[1], i.radius, 0, tau);
        // ctx.fill();
        ctx.drawImage(i.image,i.position[0] - i.radius,i.position[1] - i.radius,2 * i.radius,2 * i.radius);
    }
    // ctx.globalCompositeOperation = "screen";
    for (let i of wormHoles) {
        // drawPortalLimit("blue", i.start);
        // drawPortalLimit("red", i.end);
        ctx.fillStyle = "#0000ff";
        ctx.beginPath();
        ctx.arc(i.start[0], i.start[1], i.radius, 0, tau);
        ctx.fill();
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(i.end[0], i.end[1], i.radius, 0, tau);
        ctx.fill();
    }

    if (tempPortals[0] && !wormHoles[0]) {
        // drawPortalLimit("blue", tempPortals[0]);
        ctx.fillStyle = "#0000ff";
        ctx.beginPath();
        ctx.arc(tempPortals[0][0], tempPortals[0][1], portalSize, 0, tau);
        ctx.fill();
    }
    if (tempPortals[1] && !wormHoles[0]) {
        // drawPortalLimit("red", tempPortals[1]);
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(tempPortals[1][0], tempPortals[1][1], portalSize, 0, tau);
        ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
}
const checkTeleportation = () => {
    for (let i of planets) {
        for (let j of wormHoles) {
            points += i.mass;
            if (length(...j.start, ...i.position) < j.radius + i.radius && !i.locked) {
                i.position = j.end.map((val, index): number =>
                    val + j.start[index] - i.position[index]
                );
            }
            else if (length(...j.end, ...i.position) < j.radius + i.radius && !i.locked) {
                i.position = j.start.map((val, index): number =>
                    val + j.end[index] - i.position[index]
                );
            }
            else points -= i.mass;
        }
    }
}
const moveLines = () => {
    for (let i of lines) {
        i.radius -= lineSpeed;
        if (i.radius < 1) lines.splice(lines.indexOf(i), 1);
    }
}
const drawLine = () => {
    // ctx.globalCompositeOperation = memory.lineOperator;
    for (let i of lines) {
        const grd = ctx.createRadialGradient(size[0] / 2, size[1] / 2, i.radius, size[0] / 2, size[1] / 2, i.radius + lineWidth);

        let opacity = 0.1;
        if (i.radius <= 200)
            opacity = 1;
        else
            opacity = 1 - ((i.radius - 200) / (diagonal / 2 - 200)) ** 0.5;

        const color = Math.floor(hp * 256 / 100);

        grd.addColorStop(0, `rgba(256,${color},${color},${opacity / (hp * 3 / 100)})`);
        grd.addColorStop(1, `rgba(256,${color / 2},${color / 2},0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(size[0] / 2, size[1] / 2, i.radius + lineWidth, 0, tau, false);
        ctx.arc(size[0] / 2, size[1] / 2, i.radius, 0, tau, true);
        ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
}
const spawnLine = () => {
    if (++lineTime >= deltaLines) {
        lines.push({ radius: diagonal / 2, speed: lineSpeed });
        lineTime = 0;
    }
}
const increaseScore = () => {
    for (let i of planets) {
        if (i != planets[0])
            points += i.mass * scoreMultiplier;
    }
}
const spawnPlanets = () => {
    planetSpawnerClock += memory.spawn;
    if (planetSpawnerClock >= deltaPlanetSpawn) {
        const radius = planetSpawnRadius[0] + Math.random() * (planetSpawnRadius[1] - planetSpawnRadius[0]);
        const alpha = Math.random() * tau;
        const cartesanPosition = [
            Math.cos(alpha) * radius + size[0] / 2,
            Math.sin(alpha) * radius + size[1] / 2
        ];
        planetSpawnerClock = 0;
        
        const texture = images[Math.floor(Math.random() * 3)];
        const newPlanet: Planet = new Planet(portalSize, 1, cartesanPosition, false,texture);
        planets.push(newPlanet);
    }
}
const mainLoop = (delta: number): void => {
    const time = delta * parseFloat(memory.warp.toString());
    applyGravity(time);
    move(time);
    checkTeleportation();
    moveLines();
    spawnLine();
    increaseScore();
    checkLifeLost();
    spawnPlanets();
    checkLevelingUp();
    score.display(points, hp);
}
const checkLevelingUp = () => {
    if (points >= lastScore + scorePerLevel) {
        scorePerLevel *= 2;
        lastScore += scorePerLevel;
        memory.warp += 0.1;
        // level++;
        normalDeltaLines /= 2;
        normalLineSpeed *= 1.5;
        deltaLines = normalDeltaLines;
        lineSpeed = normalLineSpeed;
        deltaPlanetSpawn /= 2;
        hp += ++level * 10;
    }
}
const checkLifeLost = () => {
    for (let i of planets) {
        if (i == planets[0]) continue;
        else if (length(...planets[0].position, ...i.position) <= i.radius + planets[0].radius) {
            hp -= hpDamage;
            lineSpeed = 10;
            deltaLines = 500;
            currentCameraOffset = basicCameraEffect;
            speedUpEffect++;
            cameraOffsetStack++;
            memory.warp -= 0.01;
            if (memory.warp < 0.1) memory.warp = 0.1;
            if (hp <= 0) {
                loop.stop();
                popup.style.zIndex = "40";
                score.die(points,performance.now() - started,document.getElementById("end-data"));
                fadeIn(popup,0.05)
            }
            setTimeout(() => {
                if (--speedUpEffect == 0) {
                    lineSpeed = normalLineSpeed;
                    deltaLines = normalDeltaLines;
                }
                if (--cameraOffsetStack == 0) currentCameraOffset = 0;
            }, 1000);
            planets.splice(planets.indexOf(i), 1);
            let sfx = new Audio("assets/sfx_2.mp3");
            sfx.play();
        }
    }
}
const start = (data) => commands["start"]("");
const toggle = () => {
    if (container.style.display == "none")
        container.style.display = "block";
    else
        container.style.display = "none";
}
const effect = (e: any) => {
    if (!parseInt(memory.dev)) return;
    hp -= hpDamage
    lineSpeed = 10;
    deltaLines = 500;
    currentCameraOffset = basicCameraEffect;
    speedUpEffect++;
    cameraOffsetStack++;
    setTimeout(() => {
        if (--speedUpEffect == 0) {
            lineSpeed = normalLineSpeed;
            deltaLines = normalDeltaLines;
        }
        if (--cameraOffsetStack == 0) currentCameraOffset = 0;
    }, 1000);
}

loop.setUpdate(mainLoop).setDraw(draw);
loadSystem(initialSystem);

const resize = (e) => {
    console.log(e);
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;

    size = [canvas.width, canvas.height];
    diagonal = length(0, 0, ...size);

    planets[0].position = size.map(val => val / 2);
}

export { run, back, addRedPortal, addBluePortal, start, toggle, effect, resize };