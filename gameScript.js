var mainCanvas;
var ctx;
var canvas_width;
var canvas_height;

var holdingitem = false;
var itemHeld = null;

var holdingTool = false;
var toolHeld = null;

var holePositions = [];

var camera_x = 0;
var camera_y = 0;

var camera_approach_x = 0;
var camera_approach_y = 0;

hole_size = 100;
gnome_size = 100;
coin_size = 40;
flower_size = 120;
coin_collection_size = 60;
coinCollectorRange = 200;
coin_collector_size = 120;
wind = 0;
gravitationalConstant = 0.4;

var canvas_width = 750;
var canvas_height = 550;

COIN_LIMIT = 2000;

coinDropInterval = 60000;
inHoleCoinBoost = 3;
enchantedCoinBoost = 3;
traderRefreshTimer = 14400000;
flowerSpawnTimer = 20000;

ghostHoles = [];
debugMessages = [];

function resetProgress() {
    for (let i = 0; i < data.datapoints.length; i++) {
        data.set(data.datapoints[i], data.defaults[i]);
    }
    data.save();
}

function flower_prob_1(x) {
    return Math.round(
        -41.9296 * x * x * x * x * x +
            95.6499 * x * x * x * x -
            54.6928 * x * x * x +
            1.35786 * x * x +
            6.53499 * x +
            0.905404
    );
}
//round(-41.9296xxxxx + 95.6499xxxx - 54.6928xxx + 1.35786xx + 6.53499x + 0.905404)

function flower_prob_2(x) {
    return Math.round(
        -257.358 * x * x * x * x * x +
            620.305 * x * x * x * x -
            487.694 * x * x * x +
            130.806 * x * x +
            0.371213 * x +
            2.69662
    );
}
//round(-257.358xxxxx + 620.305xxxx - 487.694xxx + 130.806xx + 0.371213x + 2.69662)

function flower_prob_3(x) {
    return Math.round(
        -371.755 * x * x * x * x * x +
            1008.58 * x * x * x * x -
            946.173 * x * x * x +
            356.661 * x * x -
            42.2152 * x +
            5.59973
    );
}
//round(-371.755xxxxx + 1008.58xxxx - 946.173xxx + 356.661xx - 42.2152x + 5.59973)

function flower_prob_4(x) {
    return Math.round(
        75.3325 * x * x * x * x * x -
            206.142 * x * x * x * x +
            254.2 * x * x * x -
            163.257 * x * x +
            49.3637 * x +
            4.38775
    );
}
//round(75.3325xxxxx - 206.142xxxx + 254.2xxx - 163.257xx + 49.3637x + 4.38775)

function flower_prob_5(x) {
    return Math.round(
        48.2798 * x * x * x * x * x -
            124.572 * x * x * x * x +
            113.094 * x * x * x -
            40.7922 * x * x +
            7.28838 * x +
            10.8208
    );
}
//round(48.2798xxxxx -124.572xxxx + 113.094xxx - 40.7922xx + 7.28838x + 10.8208)

var flower_probablity_functions = [
    flower_prob_1,
    flower_prob_2,
    flower_prob_3,
    flower_prob_4,
    flower_prob_5,
];

var isDown = false;
var isMoving = false;
var holdingitem = false;
var itemHeld = null;
var mouse_pos = { x: 0, y: 0 };
var grab_offset = { x: 0, y: 0 };
var rooms = [["trader", "main"]];
var current_room = "main";

var tot_room_width = rooms[0].length * canvas_width;
var tot_room_height = rooms.length * canvas_height;

function getOffset(room) {
    for (let y = 0; y < rooms.length; y++) {
        for (let x = 0; x < rooms[y].length; x++) {
            // console.log(rooms[y][x])
            if (rooms[y][x] == room) {
                return { x: x * canvas_width, y: y * canvas_height };
            }
        }
    }
}

var gnome_colliders = [
    {
        x1: getOffset("trader").x,
        y1: getOffset("trader").y,
        x2: getOffset("trader").x + canvas_width,
        y2: getOffset("trader").y,
    },
    {
        x1: getOffset("trader").x,
        y1: getOffset("trader").y,
        x2: getOffset("trader").x,
        y2: getOffset("trader").y + canvas_height / 2,
    },
    {
        x1: getOffset("trader").x + canvas_width,
        y1: getOffset("trader").y,
        x2: getOffset("trader").x + canvas_width,
        y2: getOffset("trader").y + canvas_height / 2,
    },
    {
        x1: getOffset("trader").x,
        y1: getOffset("trader").y + canvas_height / 2,
        x2: getOffset("trader").x + canvas_width * 0.34,
        y2: getOffset("trader").y + canvas_height * 0.37,
    },
    {
        x1: getOffset("trader").x + canvas_width,
        y1: getOffset("trader").y + canvas_height / 2,
        x2: getOffset("trader").x + canvas_width * 0.66,
        y2: getOffset("trader").y + canvas_height * 0.37,
    },
    {
        x1: getOffset("trader").x + canvas_width * 0.66,
        y1: getOffset("trader").y + canvas_height * 0.37,
        x2: getOffset("trader").x + canvas_width * 0.34,
        y2: getOffset("trader").y + canvas_height * 0.37,
    },
];

var starting_room = "main";

function ready() {
    mainCanvas = document.getElementById("mainCanvas");
    ctx = mainCanvas.getContext("2d");
    generateHoles();
    document
        .getElementById("mainCanvas")
        .addEventListener("click", handleClick);
    document
        .getElementById("mainCanvas")
        .addEventListener("mousemove", handleMouseMove);

    document
        .getElementById("toolbar-button-1")
        .addEventListener("click", toggleHoldingShovel);

    document.body.addEventListener("keypress", handleKeyPress);
    camera_approach_x = getOffset(current_room).x;
    camera_approach_y = getOffset(current_room).y;
    camera_x = camera_approach_x;
    camera_y = camera_approach_y;
    setTimeout(() => {
        setInterval(draw, 1000 / 60);
    }, 10);
    // console.log(holePositions);

    var loaded_detector = setInterval(() => {
        if (data.loaded) {
            clearInterval(loaded_detector);
            generateUI();
        }
    }, 10);

    debugMessage("Version 1.0 loaded.");
    debugMessage(Date.now());

    //detect click and drag on the canvas if the mouse if over a gnome
    document.addEventListener("mousedown", function (e) {
        if (e.target == mainCanvas) {
            isDown = true;
        }
    });
    document.addEventListener("mouseup", function (e) {
        if (e.target == mainCanvas) {
            isDown = false;
        }
    });
    document.addEventListener("mousemove", function (e) {
        if (e.target == mainCanvas) {
            isMoving = true;
            mouse_pos = getMousePos(mainCanvas, e);
        }
    });
    document.addEventListener("mouseout", function (e) {
        if (e.target == mainCanvas) {
            isMoving = false;
        }
    });

    document.getElementById("traderSign").addEventListener("click", () => {
        set_room("trader");
        isMoving = false;
    });
    document.getElementById("mainAreaSign").addEventListener("click", () => {
        set_room("main");
        isMoving = false;
    });

    setInterval(() => {
        if (!data.loaded) {
            return;
        }
        if (start_chase != 0) {
            return;
        }
        let gnomes = data.get("gnomes");
        let gnome_collection = [];
        let holes = data.get("holes");
        for (let i = 0; i < holes.length; i++) {
            if (holes[i].contents != null) {
                gnome_collection.push(holes[i].contents);
            }
        }
        for (let i = 0; i < gnomes.length; i++) {
            gnome_collection.push(gnomes[i]);
        }
        // console.log(holes);
        if (isDown && isMoving) {
            if (!holdingitem) {
                for (let i = gnome_collection.length - 1; i >= 0; i--) {
                    if (
                        mouse_pos.x > gnome_collection[i].x &&
                        mouse_pos.x < gnome_collection[i].x + gnome_size &&
                        mouse_pos.y < gnome_collection[i].y &&
                        mouse_pos.y > gnome_collection[i].y - gnome_size
                    ) {
                        holdingitem = true;
                        itemHeld = gnome_collection[i];
                        itemHeld.customData.ai_mode = "disabled";
                        // if gnome is in hole, remove it from hole and add it to gnomes
                        if (itemHeld.customData.inHole) {
                            gnomes.push(itemHeld);
                            for (j = 0; j < holes.length; j++) {
                                if (holes[j].contents == itemHeld) {
                                    holes[j].contents = null;
                                }
                            }
                            // holes[holes.indexOf(itemHeld)].contents = null;
                            itemHeld.customData.inHole = false;
                        } else {
                            gnomes.splice(gnomes.indexOf(itemHeld), 1);
                            gnomes.push(itemHeld);
                        }
                        data.set("gnomes", gnomes);
                        data.set("holes", holes);
                        grab_offset = {
                            x: mouse_pos.x - itemHeld.x,
                            y: mouse_pos.y - itemHeld.y,
                        };
                        break;
                    }
                }
            } else {
                itemHeld.x = mouse_pos.x - grab_offset.x;
                itemHeld.y = mouse_pos.y - grab_offset.y;
                data.set("gnomes", gnomes);
            }
        } else {
            if (holdingitem) {
                itemHeld.customData.ai_mode = "wander";
                itemHeld.customData.heading = Math.random() * 2 * Math.PI;
                data.set("gnomes", gnomes);
            }
            holdingitem = false;
            itemHeld = null;
        }
    }, 1000 / 60);
}

function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left + camera_x,
        y: event.clientY - rect.top + camera_y,
    };
}

function generateUI() {
    let buttons = document.getElementsByClassName("toolbar_button");
    for (let i = 0; i < buttons.length; i++) {
        rot_value = Math.random() * 360;
        let css =
            ".toolbar_button_" + i + "::after {rotate: " + rot_value + "deg;}";
        let style = document.createElement("style");
        style.innerHTML = css;
        document.getElementsByTagName("head")[0].appendChild(style);
        buttons[i].classList.add("toolbar_button_" + i);
    }

    let gnomeButton = document.getElementById("gnome-dex-button");

    gnomeButton.addEventListener("click", function () {
        document
            .getElementById("gnome-dex")
            .classList.toggle("gnome-dex-hidden");
        document
            .getElementById("gnome-dex-button")
            .classList.toggle("gnome-dex-button-toggled");
    });

    let inventoryButton = document.getElementById("toolbar-button-5");
    inventoryButton.addEventListener("click", toggleInventory);

    let trader = document.getElementById("trader");
    trader.addEventListener("click", toggleTraderMenu);

    fetch("gnomes.txt")
        .then((response) => response.text())
        .then((text) => generateGnomeDex(text));

    if (data.get("traderInventory") == null) {
        updateTraderItems();
    } else {
        updateTrader();
    }
}

function generateHoles(
    numHoleRows = 3,
    numHoleCols = 3,
    x_spacing = 140,
    y_spacing = 20
) {
    // the above set defaults if no value is passed
    let newHoles = [];

    let total_width = numHoleCols * hole_size + (numHoleCols - 1) * x_spacing;
    let total_height = numHoleRows * hole_size + (numHoleRows - 1) * y_spacing;
    let left_offset = (canvas_width - total_width) / 2;
    let top_offset = (canvas_height - total_height) / 2 - canvas_height * 0.045;

    for (let row = 0; row < numHoleRows; row++) {
        for (let column = 0; column < numHoleCols; column++) {
            newHoles.push({
                xPos:
                    left_offset +
                    column * (x_spacing + hole_size) +
                    getOffset("main").x,
                yPos:
                    top_offset +
                    row * (y_spacing + hole_size) +
                    getOffset("main").y,
                x: column,
                y: row,
            });
        }
    }
    holePositions = newHoles;
}

function generateGnomeDex(gnomeDescData) {
    // get rid of new lines in data
    document.getElementById("gnome-dex").innerHTML =
        '<h1 id="gd-title">GNOME-DEX</h1>';
    gnomeDescData = gnomeDescData.replace(/(\r\n|\n|\r)/gm, "");

    let lines = gnomeDescData.split(";");
    const linesPerGnomeEntry = 3;
    let numGnomes = Math.floor(lines.length / linesPerGnomeEntry);

    let highestGnomeDiscovered = data.get("highestGnomeDiscovered");
    console.log("asdhad872788  " + highestGnomeDiscovered);
    if (highestGnomeDiscovered >= 5) {
        document.getElementById("traderSign").style.display = "block";
    } else {
        document.getElementById("traderSign").style.display = "none";
    }

    for (let i = 0; i < numGnomes; i++) {
        let gnome = document.createElement("div");
        gnome.classList.add("gnome");

        let gnomeImage = document.createElement("img");
        gnomeImage.classList.add("gnome-image");
        gnomeImage.src = "./gnomes/Level " + (i + 1) + ".png";

        let gnomeNameDescriptionContainer = document.createElement("div");
        gnomeNameDescriptionContainer.classList.add(
            "gnome-description-container"
        );

        let gnomeName = document.createElement("h2");
        gnomeName.classList.add("gnome-name");
        gnomeName.innerHTML = lines[i * linesPerGnomeEntry + 1];

        let gnomeDescription = document.createElement("h3");
        gnomeDescription.classList.add("gnome-description");
        gnomeDescription.innerHTML = lines[i * linesPerGnomeEntry + 2];

        if (highestGnomeDiscovered <= i) {
            gnomeImage.classList.add("undiscovered");
            gnomeName.innerHTML = "???";
            gnomeDescription.innerHTML = "???";
        }

        gnome.appendChild(gnomeImage);
        gnomeNameDescriptionContainer.appendChild(gnomeName);
        gnomeNameDescriptionContainer.appendChild(gnomeDescription);
        gnome.appendChild(gnomeNameDescriptionContainer);
        document.getElementById("gnome-dex").appendChild(gnome);
    }
}

const checker = setInterval(() => {
    if (document.getElementById("mainCanvas") != null) {
        setTimeout(ready, 50);
        console.log("starting");

        clearInterval(checker);
    }
}, 10);

grass_blades = [];

var fn = "simplex";

hole_img = document.createElement("img");
hole_img.src = "gnomes/Hole.png";

hole_front_img = document.createElement("img");
hole_front_img.src = "gnomes/Hole Front.png";

coin_img0 = document.createElement("img");
coin_img0.src = "gnomes/Coin.png";
coin_img1 = document.createElement("img");
coin_img1.src = "gnomes/Big Money.png";
coin_imgs = [coin_img0, coin_img1];

gnome_imgs = [];
for (i = 1; i <= 16; i++) {
    gnome_imgs.push(document.createElement("img"));
    gnome_imgs[i - 1].src = "gnomes/Level " + i + ".png";
}
flowerImgs = [];
for (i = 1; i <= 5; i++) {
    flowerImgs.push(document.createElement("img"));
    flowerImgs[i - 1].src = "gnomes/Flower Level " + i + ".png";
}
coinCollectorImg = document.createElement("img");
coinCollectorImg.src = "gnomes/magnet.png";

console.log(gnome_imgs);

moving_coins = [];

class DataStorage {
    constructor() {
        this.data = {};
        this.lastSave = Date.now() + 1000000000;
        this.datapoints = [
            "logoffTime",
            "gnomes",
            "holes",
            "inventory",
            "coinEntities",
            "coinsInCurrentRun",
            "totalCoins",
            "totalResets",
            "highestGnomeDiscovered",
            "msUntillForGnomeSpawnMin",
            "msUntillForGnomeSpawnMax",
            "timeOfNextGnomeSpawn",
            "timeOfNextTraderRefresh",
            "traderInventory",
            "flowers",
            "coinCollectors",
        ];
        let restartOffset = 0;
        this.defaults = [
            Date.now() - restartOffset * 1000,
            [],
            [
                {
                    x: 1,
                    y: 1,
                    contents: null,
                },
            ],
            [],
            [],
            0,
            0,
            0,
            1,
            7000,
            10000,
            Date.now() - restartOffset * 1000,
            Date.now() + traderRefreshTimer,
            null,
            [],
            [],
        ];
        this.loaded = false;
    }

    set(key, value) {
        this.data[key] = value;
        if (this.lastSave + 1000 < Date.now()) {
            this.save();
        }
    }

    save() {
        this.lastSave = Date.now();
        let val = {};
        for (let i = 0; i < data.datapoints.length; i++) {
            val[data.datapoints[i]] = JSON.stringify(
                data.data[data.datapoints[i]]
            );
        }
        chrome.storage.local.set(val, () => {
            // console.log("Stored");
        });
    }

    load() {
        var dp = this.datapoints;
        var defau = this.defaults;
        var dat = this;
        chrome.storage.local.get(this.datapoints, function (items) {
            for (i = 0; i < dp.length; i++) {
                let key = dp[i];
                console.log(key);
                if (key in items) {
                    console.log("taking from storage");
                    dat.set(key, JSON.parse(items[key]));
                } else {
                    console.log("taking from default");
                    dat.set(key, defau[i]);
                }
                // comment this out to enable saving
                // dat.set(key, defau[i]);
            }
            dat.loaded = true;
        });
    }

    get(key) {
        return this.data[key];
    }
}

function coinXYZtoScreen(x, y, z) {
    let screenX = x - camera_x;
    let screenY = y - camera_y - z * 0;
    return [screenX, screenY];
}

var data = new DataStorage();
console.log(data.datapoints);
setTimeout(() => {
    data.load();
    setTimeout(() => {
        data.save();
    }, 200);
}, 200);

var resetting = false;

function run_tick(gameTime, deltaT, advanced) {
    updateHoles(gameTime, deltaT, advanced);
    updateGnomes(gameTime, deltaT, advanced);
    updateCoins(gameTime, deltaT, advanced);
    updateFlowers(gameTime, deltaT, advanced);
    updateCoinCollectors(gameTime, deltaT, advanced);

    if (data.get("timeOfNextTraderRefresh") < Date.now()) {
        updateTraderItems();
        data.set("timeOfNextTraderRefresh", Date.now() + traderRefreshTimer);
    }
    
    let msUntilNextRefresh = data.get("timeOfNextTraderRefresh") - Date.now();
    let hrUntilNextRefresh = Math.floor(msUntilNextRefresh / (1000 * 60 * 60));
    let minUntilNextRefresh = Math.floor(msUntilNextRefresh / (1000 * 60)) - hrUntilNextRefresh * 60;
    let secUntilNextRefresh = Math.floor(msUntilNextRefresh / (1000)) - hrUntilNextRefresh * 60 * 60 - minUntilNextRefresh * 60;

    document.getElementById("trader-timer").innerHTML =
        "Trader refreshes in " + hrUntilNextRefresh + "h " + minUntilNextRefresh + "m " + secUntilNextRefresh + "s";
}

var start_chase = 0;

function updateCoinCollectors(gameTime, deltaT, advanced) {
    let coinCollectors = data.get("coinCollectors");
    let coins = data.get("coinEntities");
    let coinsInCurrentRun = data.get("coinsInCurrentRun");
    for (let i = 0; i < coinCollectors.length; i++) {
        let coinCollector = coinCollectors[i];
        for (let j = 0; j < coins.length; j++) {
            let coin = coins[j];
            let dist = Math.sqrt(
                (coin.x + coin_size / 2 - coinCollector.x) ** 2 +
                    (coin.y + coin_size / 2 - coinCollector.y) ** 2
            );
            if (dist < coinCollectorRange) {
                moving_coins.push({
                    scr_x: coin.x - camera_x,
                    scr_y: coin.y - camera_y,
                    amount: coin.amount,
                    t_x: coinCollector.x - camera_x,
                    t_y: coinCollector.y - camera_y - coin_collector_size / 2,
                });
                coinsInCurrentRun += coin.amount;
                let coinIndex = coins.indexOf(coin);
                coins.splice(coinIndex, 1);
                j--;
            }
        }
    }
    data.set("coinEntities", coins);
    data.set("coinsInCurrentRun", coinsInCurrentRun);
}

function updateFlowers(gameTime, deltaT, advanced) {
    let flowers = data.get("flowers");
    for (let i = 0; i < flowers.length; i++) {
        let flower = flowers[i];
        if (flower.decompose < gameTime) {
            let flowerIndex = flowers.indexOf(flower);
            flowers.splice(flowerIndex, 1);
            i--;
        }
    }
    for (let i = 0; i < flowers.length; i++) {
        let flower = flowers[i];
        if (flower.nextSpawn < gameTime) {
            //spawn gnome
            let target_x = flower.x;
            let target_y = flower.y;
            let out_heading = (Math.random() - 0.5) * Math.PI;
            let start_x = target_x;
            let start_y = target_y;
            while (
                start_x < getOffset("main").x + canvas_width &&
                !(start_y < getOffset("main").y - gnome_size) &&
                !(start_y > getOffset("main").y + canvas_height + gnome_size)
            ) {
                start_x += Math.cos(out_heading) * 5;
                start_y += Math.sin(out_heading) * 5;
            }
            let heading = out_heading + Math.PI;
            spawnGnome(
                parseInt(
                    flower_probablity_functions[flower.num - 1](Math.random())
                ),
                start_x,
                start_y,
                "wandering",
                heading
            );
            console.log(start_x, start_y, heading);
            //add time to next spawn
            flower.nextSpawn = gameTime + flowerSpawnTimer;
            console.log("flower spawned gnome");
        }
    }
    data.set("flowers", flowers);
    data.set("gnomes", data.get("gnomes"));
}

function calculateHolePrice() {
    let holes = data.get("holes");
    let price = 25;
    for (let i = 0; i < holes.length; i++) {
        price *= 4;
    }
    return price;
}

setTimeout(() => {
    setInterval(() => {
        if (!data.loaded) {
            return;
        }
        let tickrate = 16;
        let p_bar = document.getElementById("catchup-bar");
        if (Date.now() - data.get("logoffTime") > 300) {
            start_chase = data.get("logoffTime");
            p_bar.classList.remove("hidden");
        } else {
            start_chase = 0;
            p_bar.classList.add("hidden");
        }
        let iterations = 0;
        if (Date.now() - data.get("logoffTime") > 60 * 60) {
            tickrate = 1000;
        }
        while (Date.now() - data.get("logoffTime") > tickrate / 2) {
            p_bar.value =
                (data.get("logoffTime") - start_chase) /
                (Date.now() - start_chase);
            run_tick(data.get("logoffTime"), tickrate, start_chase == 0);
            data.set("logoffTime", data.get("logoffTime") + tickrate);
            if (iterations > 10000) {
                break;
            }
            iterations++;
        }
    }, 3);
}, 300);

function updateHoles(gameTime, deltaT, advanced) {
    // Hole Suction
    let holes = data.get("holes");
    let gnomes = data.get("gnomes");

    for (i = 0; i < holes.length; i++) {
        let hole = holes[i];
        for (j = 0; j < holePositions.length; j++) {
            let pos = holePositions[j];
            if (pos.x == hole.x && pos.y == hole.y) {
                scr_x = pos.xPos;
                scr_y = pos.yPos;
            }
        }
        if (hole.contents != null) {
            continue;
        }
        let closestGnome = null;
        let closestGnomeDist = 10000;
        for (j = 0; j < gnomes.length; j++) {
            let gnome = gnomes[j];
            if (gnome.customData.ai_mode == "disabled") {
                continue;
            }
            let dist = Math.sqrt(
                Math.pow(gnome.x - gnome_size / 2 - scr_x + hole_size / 2, 2) +
                    Math.pow(
                        gnome.y - gnome_size / 2 - scr_y - hole_size / 2,
                        2
                    )
            );
            if (dist < closestGnomeDist) {
                closestGnome = gnome;
                closestGnomeDist = dist;
            }
        }
        if (closestGnome == null) {
            continue;
        }
        if (closestGnomeDist > gnome_size * 0.7) {
            continue;
        }
        closestGnome.x = scr_x;
        closestGnome.y = scr_y;
        closestGnome.customData.nextCoinTime = Math.min(
            closestGnome.customData.nextCoinTime,
            gameTime + coinDropInterval
        );
        closestGnome.customData.ai_mode = "idle";
        closestGnome.customData.inHole = true;
        hole.contents = closestGnome;
        gnomes.splice(gnomes.indexOf(closestGnome), 1);
        break;
    }
}
function updateGnomes(gameTime, deltaT, advanced) {
    // Handle Gnome Move
    let holes = data.get("holes");
    let gs = data.get("gnomes");
    let gnomes = [];
    for (i = 0; i < gs.length; i++) {
        let gnome = gs[i];
        gnome.coinBoost = 1;
        gnomes.push(gnome);
    }

    for (i = 0; i < holes.length; i++) {
        if (holes[i].contents != null) {
            let gnome = holes[i].contents;
            for (j = 0; j < holePositions.length; j++) {
                if (
                    holePositions[j].x == holes[i].x &&
                    holePositions[j].y == holes[i].y
                ) {
                    gnome.x = holePositions[j].xPos;
                    gnome.y = holePositions[j].yPos + gnome_size - 5;
                    gnome.coinBoost = inHoleCoinBoost;
                    gnomes.push(gnome);
                }
            }
        }
    }
    for (i = 0; i < gnomes.length; i++) {
        let gnome = gnomes[i];
        while (gnome.customData.nextCoinTime < gameTime) {
            let v = Math.pow(1.02016, 31.6206 * gnome.num - 14.0401) - 0.420455;
            let f = Math.round(v);
            gnome.customData.nextCoinTime +=
                ((coinDropInterval / gnome.coinBoost) * f) / v;
            // console.log("dropping coin with valuie " + f);
            dropCoin(
                f,
                gnome.x + gnome_size / 2 - coin_size / 2,
                gnome.y - gnome_size * 0.8 - coin_size / 2
            );
        }
        let ai_mode = gnome.customData.ai_mode;
        if (ai_mode == "wander") {
            let vx = Math.cos(gnome.customData.heading) * 0.03125;
            let vy = Math.sin(gnome.customData.heading) * 0.03125;
            gnome.x += vx * deltaT;
            gnome.y += vy * deltaT;
            // Check for collisions
            let collided = false;
            let g_topleft = {
                x: gnome.x,
                y: gnome.y,
            };
            let g_bottomright = {
                x: gnome.x + gnome_size,
                y: gnome.y - gnome_size,
            };
            let g_topright = {
                x: gnome.x + gnome_size,
                y: gnome.y,
            };
            let g_bottomleft = {
                x: gnome.x,
                y: gnome.y - gnome_size,
            };
            for (j = 0; j < gnome_colliders.length; j++) {
                let collider = gnome_colliders[j];
                if (g_bottomright.x < Math.min(collider.x1, collider.x2)) {
                    continue;
                }
                if (g_bottomright.y > Math.max(collider.y1, collider.y2)) {
                    continue;
                }
                if (g_topleft.x > Math.max(collider.x1, collider.x2)) {
                    continue;
                }
                if (g_topleft.y < Math.min(collider.y1, collider.y2)) {
                    continue;
                }
                //check line intersection
                if (
                    line_line_intersection(
                        g_topleft.x,
                        g_topleft.y,
                        g_bottomleft.x,
                        g_bottomleft.y,
                        collider.x1,
                        collider.y1,
                        collider.x2,
                        collider.y2
                    )
                ) {
                    collided = true;
                }
                if (
                    line_line_intersection(
                        g_topleft.x,
                        g_topleft.y,
                        g_topright.x,
                        g_topright.y,
                        collider.x1,
                        collider.y1,
                        collider.x2,
                        collider.y2
                    )
                ) {
                    collided = true;
                }
                if (
                    line_line_intersection(
                        g_bottomleft.x,
                        g_bottomleft.y,
                        g_bottomright.x,
                        g_bottomright.y,
                        collider.x1,
                        collider.y1,
                        collider.x2,
                        collider.y2
                    )
                ) {
                    collided = true;
                }
                if (
                    line_line_intersection(
                        g_topright.x,
                        g_topright.y,
                        g_bottomright.x,
                        g_bottomright.y,
                        collider.x1,
                        collider.y1,
                        collider.x2,
                        collider.y2
                    )
                ) {
                    collided = true;
                }
            }
            if (collided) {
                // console.log("collided")
                gnome.customData.heading += Math.PI;
            }
        }
    }

    // Merge Gnomes
    let found = false;
    var i, j, gnome1, gnome2;
    gnomes = data.get("gnomes");
    all_gnomes = [];
    for (i = 0; i < gnomes.length; i++) {
        all_gnomes.push(gnomes[i]);
    }
    for (i = 0; i < holes.length; i++) {
        if (holes[i].contents != null) {
            all_gnomes.push(holes[i].contents);
        }
    }
    for (i = 0; i < all_gnomes.length; i++) {
        gnome1 = all_gnomes[i];
        if (gnome1.customData.ai_mode == "disabled") {
            continue;
        }
        if (gnome1.num == 16) {
            continue;
        }
        for (j = 0; j < gnomes.length; j++) {
            gnome2 = gnomes[j];
            if (gnome2.customData.ai_mode == "disabled") {
                continue;
            }
            if (gnome1 == gnome2) {
                continue;
            }
            if (gnome1.num != gnome2.num) {
                continue;
            }
            if (
                Math.abs(gnome1.x - gnome2.x) < gnome_size / 2 &&
                Math.abs(gnome1.y - gnome2.y) < gnome_size / 2
            ) {
                found = true;
                break;
            }
        }
        if (found) {
            break;
        }
    }
    if (found) {
        //remove j-th gnome
        gnome1.num += 1;
        if (data.get("highestGnomeDiscovered") < gnome1.num) {
            data.set("highestGnomeDiscovered", gnome1.num);
            fetch("gnomes.txt")
                .then((response) => response.text())
                .then((text) => generateGnomeDex(text));
        }
        gnome1.customData.nextCoinTime = Math.min(
            gnome1.customData.nextCoinTime,
            gnome2.customData.nextCoinTime
        );
        gnome1.x = (gnome1.x + gnome2.x) / 2;
        gnome1.y = (gnome1.y + gnome2.y) / 2;
        vx1 = Math.cos(gnome1.customData.heading);
        vy1 = Math.sin(gnome1.customData.heading);
        vx2 = Math.cos(gnome2.customData.heading);
        vy2 = Math.sin(gnome2.customData.heading);
        if (vx1 == vx2 && vy1 == vy2) {
            gnome1.customData.heading = Math.random() * 2 * Math.PI;
        } else {
            gnome1.customData.heading = Math.atan2(vy1 + vy2, vx1 + vx2);
        }
        gnomes.splice(j, 1);
    }
    data.set("gnomes", gnomes);

    // Spawning Gnomes
    let timeOfNextGnomeSpawn = data.get("timeOfNextGnomeSpawn");
    if (timeOfNextGnomeSpawn < gameTime) {
        let level = 1;
        let x = 0;
        let y = 0;
        let target_x = getOffset("main").x + Math.random() * canvas_width;
        let target_y = getOffset("main").y + Math.random() * canvas_height;
        let out_heading = (Math.random() - 0.5) * Math.PI;
        let start_x = target_x;
        let start_y = target_y;
        while (
            start_x < getOffset("main").x + canvas_width &&
            !(start_y < getOffset("main").y - gnome_size) &&
            !(start_y > getOffset("main").y + canvas_height + gnome_size)
        ) {
            start_x += Math.cos(out_heading) * 5;
            start_y += Math.sin(out_heading) * 5;
        }
        let heading = out_heading + Math.PI;
        spawnGnome(1, start_x, start_y, "wandering", heading);
        let msUntillForGnomeSpawnMax = data.get("msUntillForGnomeSpawnMax");
        let msUntillForGnomeSpawnMin = data.get("msUntillForGnomeSpawnMin");
        let gnomeSpawnInterval =
            Math.floor(Math.random()) *
                (msUntillForGnomeSpawnMax - msUntillForGnomeSpawnMin) +
            msUntillForGnomeSpawnMin;
        data.set("timeOfNextGnomeSpawn", gameTime + gnomeSpawnInterval);
    }

    // despawn gnomes if they are too far away

    let breathingRoom = 600;
    let minXPos = 0 - gnome_size - breathingRoom;
    let maxXPos = tot_room_width + gnome_size + breathingRoom;
    let minYPos = 0 - gnome_size - breathingRoom;
    let maxYPos = tot_room_height + gnome_size + breathingRoom;

    for (i = 0; i < gnomes.length; i++) {
        gnome = gnomes[i];
        if (
            gnome.x < minXPos ||
            gnome.x > maxXPos ||
            gnome.y < minYPos ||
            gnome.y > maxYPos
        ) {
            console.log(minXPos, maxXPos, minYPos, maxYPos);
            console.log(gnome.x, gnome.y);
            console.log("despawned gnome");
            gnomes.splice(i, 1);
            i--;
        }
    }
}

function updateCoins(gameTime, deltaT, advanced) {
    let cE = data.get("coinEntities");
    if (advanced || cE.length < 1000) {
        for (i = 0; i < cE.length; i++) {
            let coin = cE[i];
            if (
                coin.x + coin_size < 0 ||
                coin.x > tot_room_width ||
                coin.y + coin_size < 0 ||
                coin.y > tot_room_height
            ) {
                cE.splice(i, 1);
                i--;
                continue;
            }
            coin.xvel = coin.xvel * 0.99;
            coin.yvel = coin.yvel * 0.99;
            coin.zvel = coin.zvel * 0.99;
            coin.zvel -= 0.3;
            coin.x += coin.xvel;
            coin.y += coin.yvel;
            coin.z += coin.zvel;
            if (coin.z < 0) {
                coin.xvel = coin.xvel * 0.7;
                coin.yvel = coin.yvel * 0.7;
                coin.z = 0;
                coin.zvel = coin.zvel * -0.4;
            }
        }
        data.set("coinEntities", cE);
    }
}

function spawnGnome(level, xPos, yPos, ai_mode = "wander", spawnHeading) {
    let gnomes = data.get("gnomes");

    if (level == undefined) {
        console.log("level is undefined");
        return;
    } else {
        // check if level is higher than highest gnome found
        if (level > data.get("highestGnomeDiscovered")) {
            data.set("highestGnomeDiscovered", level);
        }
    }

    let newId = Math.random() * 100;
    for (i = 0; i < gnomes.length; i++) {
        if (gnomes[i].id == newId) {
            newId = Math.random() * 100;
            i = 0;
        }
    }

    if (xPos == undefined || yPos == undefined) {
        let minXPos = getOffset("main").x - gnome_size;
        let maxXPos = getOffset("main").x + canvas_width + gnome_size;
        let minYPos = getOffset("main").y - gnome_size;
        let maxYPos = getOffset("main").y + canvas_height + gnome_size;

        // if 1 in 2 chance
        if (Math.random() > 0.5) {
            // spawn on top or bottom
            yPos = maxYPos;
        } else {
            yPos = minYPos;
        }

        // make x pos random between min and max
        xPos = Math.random() * (maxXPos - minXPos) + minXPos;
    }
    if (spawnHeading == undefined) {
        // make the heading towards the center of the screen with some randomness in radians
        spawnHeading =
            Math.atan2(
                mainCanvas.height / 2 - yPos,
                mainCanvas.width / 2 - xPos
            ) +
            ((Math.random() - 0.5) * Math.PI) / 4;
    }

    let newGnome = {
        x: xPos,
        y: yPos,
        num: level,
        id: newId,
        customData: {
            ai_mode: "wander",
            targets: [],
            heading: spawnHeading,
            nextCoinTime: Date.now() + 4000,
        },
    };
    gnomes.push(newGnome);
    data.set("gnomes", gnomes);
}

function render_gnomes(gnomes) {
    for (i = 0; i < gnomes.length; i++) {
        let gnome = gnomes[i];
        t = Date.now() * 0.01 + gnome.id;
        let cycle = -Math.abs(Math.sin(t)) * 20 + 5;
        u_d_s = -Math.max(0, cycle);
        if (
            gnome.customData.ai_mode == "wander" ||
            gnome.customData.ai_mode == "pathfind"
        ) {
            u_d = Math.min(0, cycle);
            l_r =
                Math.cos(t) *
                (1 - Math.abs(Math.cos(gnome.customData.heading))) *
                8;
            s_d = 0;
        } else {
            u_d = 0;
            l_r = 0;
            s_d = 0;
        }
        if (gnome.customData.ai_mode == "disabled") {
            g = 1;
            s_d = 0;
        } else {
            g = 1 + u_d_s * 0.03;
            s_d = u_d_s * -6;
        }
        // console.log(gnome.num);
        ctx.drawImage(
            gnome_imgs[gnome.num - 1],
            gnome.x + l_r - camera_x - s_d / 2,
            gnome.y + u_d - gnome_size * g - camera_y,
            gnome_size + s_d,
            gnome_size * g
        );
    }
}

function set_room(room) {
    current_room = room;
}
var priceTagVal = 0;
function setPriceTag(value) {
    document.getElementById("price-tag").style.display = "grid";
    document.getElementById("price-tag-value").innerText = value;
    priceTagVal = value;
}

function hidePriceTag() {
    document.getElementById("price-tag").style.display = "none";
}

function coinImgFromValue(value) {
    if (value < 10) {
        return coin_imgs[0];
    } else {
        return coin_imgs[1];
    }
}

function draw() {
    camera_approach_x = getOffset(current_room).x;
    camera_approach_y = getOffset(current_room).y;
    if (!data.loaded) {
        return;
    }
    let evaluation = data.get("coinsInCurrentRun");
    for (let i = 0; i < moving_coins.length; i++) {
        evaluation -= moving_coins[i].amount;
    }

    document.getElementById("coin-count").innerText = evaluation;
    camera_x = camera_x * 0.9 + camera_approach_x * 0.1;
    camera_y = camera_y * 0.9 + camera_approach_y * 0.1;
    let mouse_x = mouse_pos.x;
    let mouse_y = mouse_pos.y;
    if (data.get("coinsInCurrentRun") < priceTagVal) {
        document.getElementById("price-tag-value").style.color = "red";
    } else {
        document.getElementById("price-tag-value").style.color = "black";
    }
    document.getElementById("price-tag").style.transform =
        "translate(" +
        (mouse_x -
            camera_x -
            document.getElementById("price-tag").clientWidth / 2) +
        "px, " +
        (mouse_y - camera_y + 25) +
        "px)";
    document.getElementById("traderSign").style.transform =
        "translate(" +
        (getOffset("main").x - camera_x) +
        "px, " +
        (getOffset("main").y - camera_y) +
        "px)";
    document.getElementById("mainAreaSign").style.transform =
        "translate(" +
        (getOffset("trader").x - camera_x) +
        "px, " +
        (getOffset("trader").y - camera_y) +
        "px)";
    wind = wind + (Math.random() - 0.5) * 0.01;
    wind = wind * 0.999;
    mainCanvas = document.getElementById("mainCanvas");
    ctx = mainCanvas.getContext("2d");
    //draw the background
    GRASS = "#82d479";
    GRASS_BLADE_1 = "#519645";
    GRASS_BLADE_2 = "#419633";
    mainCanvas.width = canvas_width;
    mainCanvas.height = canvas_height;

    if (grass_blades.length == 0) {
        let offsets = [getOffset("main"), getOffset("trader")];
        for (let j = 0; j < offsets.length; j++) {
            let offset = offsets[j];
            var noisefn = fn === "simplex" ? noise.simplex2 : noise.perlin2;
            for (i = 0; i < 3000; i++) {
                let x = Math.random() * canvas_width + offset.x;
                let y = Math.random() * canvas_height + offset.y;
                grass_blades.push({
                    x: x,
                    y: y,
                    offset:
                        noisefn(x / 350, y / 350) * Math.PI +
                        Math.PI +
                        Math.random() * 2,
                });
            }
        }
    }
    ctx.fillStyle = GRASS;
    ctx.fillRect(0, 0, canvas_width, canvas_height);
    // draw the grass blades
    for (i = 0; i < grass_blades.length; i++) {
        ctx.beginPath();
        ctx.moveTo(grass_blades[i].x - camera_x, grass_blades[i].y - camera_y);
        rotation =
            Math.sin(Date.now() * 0.0005 + grass_blades[i].offset) * 0.3 -
            Math.PI / 2 +
            wind;
        ctx.lineTo(
            grass_blades[i].x + Math.cos(rotation) * 20 - camera_x,
            grass_blades[i].y + Math.sin(rotation) * 20 - camera_y
        );
        ctx.lineWidth = 2;
        if (grass_blades[i].y % 100 < 50) {
            ctx.strokeStyle = GRASS_BLADE_1;
        } else {
            ctx.strokeStyle = GRASS_BLADE_2;
        }
        ctx.stroke();
    }
    if (!data.loaded) {
        return;
    }

    let holes = data.get("holes");
    for (let hole = 0; hole < holePositions.length; hole++) {
        for (let i = 0; i < holes.length; i++) {
            if (
                holes[i].x == holePositions[hole].x &&
                holes[i].y == holePositions[hole].y
            ) {
                ctx.drawImage(
                    hole_img,
                    holePositions[hole].xPos - camera_x,
                    holePositions[hole].yPos - camera_y,
                    hole_size,
                    hole_size
                );
            }
        }
    }
    if (toolHeld == "Shovel") {
        console.log("entered shovel");
        let gholes = ghostHoles;
        let found = false;
        for (let i = 0; i < gholes.length; i++) {
            mouse_x = mouse_pos.x;
            mouse_y = mouse_pos.y;
            let hole_x = gholes[i].xPos;
            let hole_y = gholes[i].yPos;
            if (
                mouse_x > hole_x &&
                mouse_x < hole_x + hole_size &&
                mouse_y > hole_y &&
                mouse_y < hole_y + hole_size
            ) {
                ctx.globalAlpha = 1;
                setPriceTag(calculateHolePrice().toString());
                found = true;
            } else {
                ctx.globalAlpha = 0.5;
            }
            ctx.drawImage(
                hole_img,
                gholes[i].xPos - camera_x,
                gholes[i].yPos - camera_y,
                hole_size,
                hole_size
            );
            ctx.globalAlpha = 1;
        }
        if (!found) {
            hidePriceTag();
        }
    }

    for (let i = 0; i < moving_coins.length; i++) {
        let coin = moving_coins[i];
        //move coin towards coin icon in the top left
        let target_x = coin.t_x;
        let target_y = coin.t_y;
        let coin_center_x = coin.scr_x + coin_size / 2;
        let coin_center_y = coin.scr_y + coin_size / 2;
        let coin_to_icon_x = target_x - coin_center_x;
        let coin_to_icon_y = target_y - coin_center_y;
        let coin_to_icon_distance = Math.sqrt(
            coin_to_icon_x * coin_to_icon_x + coin_to_icon_y * coin_to_icon_y
        );
        let coin_to_icon_x_normalized = coin_to_icon_x / coin_to_icon_distance;
        let coin_to_icon_y_normalized = coin_to_icon_y / coin_to_icon_distance;
        let coin_to_icon_speed = 60;
        if (coin_to_icon_distance < coin_to_icon_speed) {
            coin_to_icon_speed = coin_to_icon_distance;
        }
        coin.scr_x += coin_to_icon_x_normalized * coin_to_icon_speed;
        coin.scr_y += coin_to_icon_y_normalized * coin_to_icon_speed;
        if (coin_to_icon_distance < 10) {
            moving_coins.splice(i, 1);
            ``;
            i--;
        }
    }

    let gs = data.get("gnomes");
    let gnomes = [];
    for (i = 0; i < holes.length; i++) {
        if (holes[i].contents != null) {
            let gnome = holes[i].contents;
            for (j = 0; j < holePositions.length; j++) {
                if (
                    holePositions[j].x == holes[i].x &&
                    holePositions[j].y == holes[i].y
                ) {
                    gnome.x = holePositions[j].xPos;
                    gnome.y = holePositions[j].yPos + gnome_size - 5;
                    gnomes.push(gnome);
                }
            }
        }
    }
    render_gnomes(gnomes);

    for (i = 0; i < holes.length; i++) {
        if (holes[i].contents != null) {
            for (j = 0; j < holePositions.length; j++) {
                if (
                    holePositions[j].x == holes[i].x &&
                    holePositions[j].y == holes[i].y
                ) {
                    ctx.drawImage(
                        hole_front_img,
                        holePositions[j].xPos - camera_x,
                        holePositions[j].yPos - camera_y,
                        hole_size,
                        hole_size
                    );
                }
            }
        }
    }
    gnomes = [];
    for (i = 0; i < gs.length; i++) {
        let gnome = gs[i];
        gnomes.push(gnome);
    }
    render_gnomes(gnomes);

    render_flowers();
    let coinCollectors = data.get("coinCollectors");
    for (let i = 0; i < coinCollectors.length; i++) {
        let collector = coinCollectors[i];
        let v_offset =
            Math.sin(Date.now() / 1000 + collector.x + collector.y) * 20 + 20;
        ctx.drawImage(
            coinCollectorImg,
            collector.x - coin_collector_size / 2 - camera_x,
            collector.y - coin_collector_size - camera_y - v_offset,
            coin_collector_size,
            coin_collector_size
        );
    }

    trader_img = document.createElement("img");
    trader_img.src = "gnomes/trading market.png";

    ctx.drawImage(
        trader_img,
        getOffset("trader").x - camera_x,
        getOffset("trader").y - camera_y,
        canvas_width,
        canvas_height / 2
    );

    let coins_to_draw = [];
    let coinEntities = data.get("coinEntities");
    for (let i = 0; i < coinEntities.length; i++) {
        coins_to_draw.push({
            x: coinEntities[i].x - camera_x,
            y: coinEntities[i].y - camera_y - coinEntities[i].z,
            amount: coinEntities[i].amount,
        });
    }
    for (let i = 0; i < moving_coins.length; i++) {
        coins_to_draw.push({
            x: moving_coins[i].scr_x,
            y: moving_coins[i].scr_y,
            amount: moving_coins[i].amount,
        });
    }
    for (let i = 0; i < coins_to_draw.length; i++) {
        let coin = coins_to_draw[i];
        ctx.drawImage(
            coinImgFromValue(coin.amount),
            coin.x,
            coin.y,
            coin_size,
            coin_size
        );
    }
    if (holdingTool && toolHeld == "Seed 1") {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(
            flowerImgs[0],
            mouse_x - flower_size / 2 - camera_x,
            mouse_y - flower_size - camera_y,
            flower_size,
            flower_size
        );
        ctx.globalAlpha = 1;
    }
    if (holdingTool && toolHeld == "Seed 2") {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(
            flowerImgs[1],
            mouse_x - flower_size / 2 - camera_x,
            mouse_y - flower_size - camera_y,
            flower_size,
            flower_size
        );
        ctx.globalAlpha = 1;
    }
    if (holdingTool && toolHeld == "Seed 3") {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(
            flowerImgs[2],
            mouse_x - flower_size / 2 - camera_x,
            mouse_y - flower_size - camera_y,
            flower_size,
            flower_size
        );
        ctx.globalAlpha = 1;
    }
    if (holdingTool && toolHeld == "Seed 4") {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(
            flowerImgs[3],
            mouse_x - flower_size / 2 - camera_x,
            mouse_y - flower_size - camera_y,
            flower_size,
            flower_size
        );
        ctx.globalAlpha = 1;
    }
    if (holdingTool && toolHeld == "Seed 5") {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(
            flowerImgs[4],
            mouse_x - flower_size / 2 - camera_x,
            mouse_y - flower_size - camera_y,
            flower_size,
            flower_size
        );
        ctx.globalAlpha = 1;
    }
    if (holdingTool && toolHeld == "Coin Collector") {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(
            coinCollectorImg,
            mouse_x - coin_collector_size / 2 - camera_x,
            mouse_y - coin_collector_size - camera_y,
            coin_collector_size,
            coin_collector_size
        );
        ctx.globalAlpha = 1;
    }

    // for (let i = 0; i < gnome_colliders.length; i++) {
    //     // console.log(gnome_colliders[i])
    //     //draw lines
    //     ctx.beginPath();
    //     ctx.moveTo(gnome_colliders[i].x1 - camera_x, gnome_colliders[i].y1 - camera_y);
    //     ctx.lineTo(gnome_colliders[i].x2 - camera_x, gnome_colliders[i].y2 - camera_y);
    //     ctx.strokeStyle = "blue";
    //     ctx.stroke();
    // }
}

function render_flowers() {
    let flowers = data.get("flowers");
    for (let i = 0; i < flowers.length; i++) {
        let flower = flowers[i];
        let flower_img = flowerImgs[flower.num - 1];
        let v_offset = Math.min(0, Date.now() - flower.touchdown) * 2;
        ctx.drawImage(
            flower_img,
            flower.x - camera_x - flower_size / 2,
            flower.y - camera_y - flower_size + v_offset,
            flower_size,
            flower_size
        );
    }
}

function handleClick(e) {
    let posX = e.clientX + camera_x;
    let posY = e.clientY + camera_y;
    // if holding tool or item
    if (holdingTool) {
        if (toolHeld == "Shovel") {
            if (data.get("coinsInCurrentRun") < calculateHolePrice()) {
                return;
            }
            let mouse_x = e.clientX + camera_x;
            let mouse_y = e.clientY + camera_y;
            for (let i = 0; i < ghostHoles.length; i++) {
                let hole_x = ghostHoles[i].xPos;
                let hole_y = ghostHoles[i].yPos;
                let holes = data.get("holes");
                if (
                    mouse_x > hole_x &&
                    mouse_x < hole_x + hole_size &&
                    mouse_y > hole_y &&
                    mouse_y < hole_y + hole_size
                ) {
                    data.set(
                        "coinsInCurrentRun",
                        data.get("coinsInCurrentRun") - calculateHolePrice()
                    );
                    holes.push(ghostHoles[i]);
                    hidePriceTag();
                    ghostHoles.splice(i, 1);
                    holdingTool = false;
                    toolHeld = null;
                    data.set("holes", holes);
                    break;
                }
            }
        }
        if (toolHeld == "Seed 1") {
            let mouse_x = e.clientX + camera_x;
            let mouse_y = e.clientY + camera_y;
            let flowers = data.get("flowers");
            flowers.push({
                x: mouse_x,
                y: mouse_y,
                num: 1,
                decompose: Date.now() + 60000,
                nextSpawn: Date.now(),
                touchdown: Date.now() + 500,
            });
            data.set("flowers", flowers);
            holdingTool = false;
            toolHeld = null;
        }
        if (toolHeld == "Seed 2") {
            let mouse_x = e.clientX + camera_x;
            let mouse_y = e.clientY + camera_y;
            let flowers = data.get("flowers");
            flowers.push({
                x: mouse_x,
                y: mouse_y,
                num: 2,
                decompose: Date.now() + 60000,
                nextSpawn: Date.now(),
                touchdown: Date.now() + 500,
            });
            data.set("flowers", flowers);
            holdingTool = false;
            toolHeld = null;
        }
        if (toolHeld == "Seed 3") {
            let mouse_x = e.clientX + camera_x;
            let mouse_y = e.clientY + camera_y;
            let flowers = data.get("flowers");
            flowers.push({
                x: mouse_x,
                y: mouse_y,
                num: 3,
                decompose: Date.now() + 60000,
                nextSpawn: Date.now(),
                touchdown: Date.now() + 500,
            });
            data.set("flowers", flowers);
            holdingTool = false;
            toolHeld = null;
        }
        if (toolHeld == "Seed 4") {
            let mouse_x = e.clientX + camera_x;
            let mouse_y = e.clientY + camera_y;
            let flowers = data.get("flowers");
            flowers.push({
                x: mouse_x,
                y: mouse_y,
                num: 4,
                decompose: Date.now() + 60000,
                nextSpawn: Date.now(),
                touchdown: Date.now() + 500,
            });
            data.set("flowers", flowers);
            holdingTool = false;
            toolHeld = null;
        }
        if (toolHeld == "Seed 5") {
            let mouse_x = e.clientX + camera_x;
            let mouse_y = e.clientY + camera_y;
            let flowers = data.get("flowers");
            flowers.push({
                x: mouse_x,
                y: mouse_y,
                num: 5,
                decompose: Date.now() + 60000,
                nextSpawn: Date.now(),
                touchdown: Date.now() + 500,
            });
            data.set("flowers", flowers);
            holdingTool = false;
            toolHeld = null;
        }
        if (toolHeld == "Coin Collector") {
            let mouse_x = e.clientX + camera_x;
            let mouse_y = e.clientY + camera_y;
            let coinCollectors = data.get("coinCollectors");
            coinCollectors.push({
                x: mouse_x,
                y: mouse_y,
            });
            data.set("coinCollectors", coinCollectors);
            holdingTool = false;
            toolHeld = null;
        }
    } else {
        let coinCollectors = data.get("coinCollectors");
        for (let i = 0; i < coinCollectors.length; i++) {
            let v_offset =
                Math.sin(
                    Date.now() / 1000 +
                        coinCollectors[i].x +
                        coinCollectors[i].y
                ) *
                    20 +
                20;
            let dist = Math.sqrt(
                Math.pow(coinCollectors[i].x - posX, 2) +
                    Math.pow(
                        coinCollectors[i].y -
                            v_offset -
                            coin_collector_size / 2 -
                            posY,
                        2
                    )
            );
            if (dist < coin_collector_size / 2) {
                coinCollectors.splice(i, 1);
                data.set("coinCollectors", coinCollectors);
                let inventory = data.get("inventory");
                for (let j = 0; j < inventory.length; j++) {
                    if (inventory[j].name == "Coin Collector") {
                        inventory[j].amount++;
                        break;
                    }
                    updateInventory(true);
                }
                break;
            }
        }
    }
    // if clicked on trader
    if (current_room == "trader") {
        if (
            posX > getOffset("trader").x &&
            posX < getOffset("trader").x + canvas_width &&
            posY > getOffset("trader").y &&
            posY < getOffset("trader").y + canvas_height / 2 - 70
        ) {
            toggleTraderMenu();
        }
    }
}

function dropCoin(amount, xPos, yPos) {
    let coinEntities = data.get("coinEntities");
    if (coinEntities.length >= COIN_LIMIT) {
        return;
    }
    let heading = Math.random() * 2 * Math.PI;
    let lateralVel = Math.random() * 1.5 + 2;
    let verticalVel = Math.random() * 5.5 + 5;
    // console.log(xPos, yPos)
    coinEntities.push({
        x: xPos,
        y: yPos,
        z: 0,
        amount: amount,
        id: Math.random(),
        xvel: Math.cos(heading) * lateralVel,
        yvel: Math.sin(heading) * lateralVel,
        zvel: verticalVel,
    });
    data.set("coinEntities", coinEntities);
}

var prev_mouse_move_pos = null;

function line_line_intersection(
    start_x_1,
    start_y_1,
    end_x_1,
    end_y_1,
    start_x_2,
    start_y_2,
    end_x_2,
    end_y_2
) {
    let uA =
        ((end_x_2 - start_x_2) * (start_y_1 - start_y_2) -
            (end_y_2 - start_y_2) * (start_x_1 - start_x_2)) /
        ((end_y_2 - start_y_2) * (end_x_1 - start_x_1) -
            (end_x_2 - start_x_2) * (end_y_1 - start_y_1));
    let uB =
        ((end_x_1 - start_x_1) * (start_y_1 - start_y_2) -
            (end_y_1 - start_y_1) * (start_x_1 - start_x_2)) /
        ((end_y_2 - start_y_2) * (end_x_1 - start_x_1) -
            (end_x_2 - start_x_2) * (end_y_1 - start_y_1));
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        return true;
    }
    return false;
}

function handleMouseMove(e) {
    if (!data.loaded) {
        return;
    }
    let posX = e.clientX;
    let posY = e.clientY;
    if (prev_mouse_move_pos == null) {
        prev_mouse_move_pos = [posX, posY];
        return;
    }
    if (start_chase != 0) {
        return;
    }
    // check if mouse is over coin:
    let coinEntities = data.get("coinEntities");
    for (let i = 0; i < coinEntities.length; i++) {
        let coin = coinEntities[i];
        let pos = coinXYZtoScreen(coin.x, coin.y, coin.z);
        let coin_screen_x = pos[0];
        let coin_screen_y = pos[1];
        start_x = prev_mouse_move_pos[0];
        start_y = prev_mouse_move_pos[1];
        end_x = posX;
        end_y = posY;
        coin_start_x = coin_screen_x + coin_size / 2 - coin_collection_size / 2;
        coin_start_y = coin_screen_y + coin_size / 2 - coin_collection_size / 2;
        coin_width = coin_size + coin_collection_size / 2;
        coin_height = coin_size + coin_collection_size / 2;
        // check for line/rect intersection
        if (
            line_line_intersection(
                start_x,
                start_y,
                end_x,
                end_y,
                coin_start_x,
                coin_start_y,
                coin_start_x,
                coin_start_y + coin_height
            ) ||
            line_line_intersection(
                start_x,
                start_y,
                end_x,
                end_y,
                coin_start_x,
                coin_start_y,
                coin_start_x + coin_width,
                coin_start_y
            ) ||
            line_line_intersection(
                start_x,
                start_y,
                end_x,
                end_y,
                coin_start_x + coin_width,
                coin_start_y,
                coin_start_x + coin_width,
                coin_start_y + coin_height
            ) ||
            line_line_intersection(
                start_x,
                start_y,
                end_x,
                end_y,
                coin_start_x,
                coin_start_y + coin_height,
                coin_start_x + coin_width,
                coin_start_y + coin_height
            )
        ) {
            coinEntities.splice(i, 1);
            // console.log(coin.amount);
            data.set(
                "coinsInCurrentRun",
                data.get("coinsInCurrentRun") + coin.amount
            );
            moving_coins.push({
                scr_x: coin_screen_x,
                scr_y: coin_screen_y,
                amount: coin.amount,
                t_x: 35,
                t_y: 35,
            });
        }
    }
    prev_mouse_move_pos = [posX, posY];
}

function handleKeyPress(e) {
    if (e.key == "0") {
        if (holdingitem) {
            holdingitem = false;
            if (itemHeld == "Shovel") {
                toggleHoldingShovel();
            }
        }
    } else if (e.key == "1") {
        toggleHoldingShovel();
    } else if (e.key == "2") {
        toggleInventory();
    }
}

function toggleHoldingShovel() {
    if (holdingTool && toolHeld == "Shovel") {
        holdingTool = false;
        toolHeld = null;
        ghostHoles = [];
        debugMessage("Put Away Shovel");
        hidePriceTag();
        document
            .getElementById("toolbar-button-1")
            .getElementsByClassName("button-icon")[0]
            .classList.remove("toolbar-button-selected");
        document.body.style.cursor = "url('./gnomes/Shovel.png'), auto"; // TODO: why this not work?
    } else {
        holdingTool = true;
        toolHeld = "Shovel";
        debugMessage("Holding Shovel");
        document
            .getElementById("toolbar-button-1")
            .getElementsByClassName("button-icon")[0]
            .classList.add("toolbar-button-selected");

        let holes = data.get("holes");
        let ghostHolePositions = [];
        for (let i = 0; i < holePositions.length; i++) {
            let hole = holePositions[i];
            ghostHolePositions.push(hole);
        }
        // for hole in holePositions
        for (let i = 0; i < ghostHolePositions.length; i++) {
            // get rid of all the holes that are already dug
            for (let j = 0; j < holes.length; j++) {
                if (
                    holes[j].x == ghostHolePositions[i].x &&
                    holes[j].y == ghostHolePositions[i].y
                ) {
                    ghostHolePositions.splice(i, 1);
                    break;
                }
            }
        }
        console.log(ghostHolePositions);
        ghostHoles = ghostHolePositions;
    }
}

function toggleInventory() {
    updateInventory();
    let inventoryDiv = document.getElementById("inventory");
    let offsetTime = 25;
    let inventoryOpen = !document
        .getElementById("inventory")
        .classList.contains("inventory-hidden");

    if (inventoryOpen) {
        debugMessage("close inventory");
        inventoryDiv.classList.add("inventory-hidden");
        let inventoryButton = document.getElementById("toolbar-button-5");
        inventoryButton
            .getElementsByClassName("button-icon")[0]
            .classList.remove("inventory-icon-toggled");

        for (let i = 0; i < inventoryDiv.children.length; i++) {
            let child = inventoryDiv.children[i];
            child.classList.add("inventory-item-hidden");
        }
    } else {
        debugMessage("open inventory");
        inventoryDiv.classList.remove("inventory-hidden");
        let inventoryButton = document.getElementById("toolbar-button-5");
        inventoryButton
            .getElementsByClassName("button-icon")[0]
            .classList.add("inventory-icon-toggled");

        for (let i = 0; i < inventoryDiv.children.length; i++) {
            let child = inventoryDiv.children[i];
            setTimeout(function () {
                child.classList.remove("inventory-item-hidden");
                child.style.animationPlayState = "running";
            }, offsetTime * i);
        }
    }
}

function debugMessage(message) {
    console.log(message);
    return;
    
    messageDiv = document.createElement("div");
    messageDiv.innerHTML = message;
    messageDiv.classList.add("debugMessage");
    let messageId = Math.random();
    messageDiv.setAttribute("debugId", messageId);
    document.getElementById("debug").prepend(messageDiv);
    debugMessages.push(messageDiv);
    // remove the message after 5 seconds
    setTimeout(function () {
        // remove the message from the array
        for (
            let i = 0;
            i < document.querySelectorAll(".debugMessage").length;
            i++
        ) {
            if (
                document
                    .querySelectorAll(".debugMessage")
                    [i].getAttribute("debugId") == messageId
            ) {
                document.querySelectorAll(".debugMessage")[i].remove();
            }
        }
    }, 5000);
}

function toggleTraderMenu() {
    document.getElementById("trader").classList.toggle("trader-hidden");
    if (
        !document
            .getElementById("inventory")
            .classList.contains("inventory-hidden")
    ) {
        toggleInventory();
    }
}

var itemOptions = {
    "Seed 1": {
        price: [80, 160],
        image: "Seeds Level 1.png",
        rarity: 1,
    },
    "Seed 2": {
        price: [800, 2400],
        image: "Seeds Level 2.png",
        rarity: 2,
    },
    "Seed 3": {
        price: [20000, 52000],
        image: "Seeds Level 3.png",
        rarity: 3,
    },
    "Seed 4": {
        price: [280000, 920000],
        image: "Seeds Level 4.png",
        rarity: 4,
    },
    "Seed 5": {
        price: [4000000, 20000000],
        image: "Seeds Level 5.png",
        rarity: 5,
    },
    "Coin Collector": {
        price: [100000, 500000],
        image: "magnet.png",
        rarity: 10,
    },
    "Lootbox 1": {
        price: [400, 2000],
        image: "Lootbox 1.png",
        rarity: 2,
    },
    "Lootbox 2": {
        price: [30000, 62000],
        image: "Lootbox 2.png",
        rarity: 3,
    },
    "Lootbox 3": {
        price: [1000000, 10000000],
        image: "Lootbox 3.png",
        rarity: 4,
    },
};

function updateTraderItems(itemsThatMustBeIncluded = []) {
    let amountOfItemsPerRow = 5;
    let amountOfRows = 3;
    let allitems = [];
    let weighted = [];

    for (let j = 0; j < Object.keys(itemOptions).length; j++) {
        let rarity = itemOptions[Object.keys(itemOptions)[j]].rarity;
        let count = Math.floor(100 / rarity);
        for (let k = 0; k < count; k++) {
            weighted.push(Object.keys(itemOptions)[j]);
        }
    }

    for (let i = 0; i < amountOfItemsPerRow * amountOfRows; i++) {
        if (itemsThatMustBeIncluded.length > 0) {
            allitems.push(itemsThatMustBeIncluded[0]);
            itemsThatMustBeIncluded.splice(0, 1);
            continue;
        }
        let name = weighted[Math.floor(Math.random() * weighted.length)];
        let randomItem = itemOptions[name];
        let item = {
            name: name,
            price: Math.floor(
                Math.random() *
                    (randomItem.price[1] - randomItem.price[0] + 1) +
                    randomItem.price[0]
            ),
            image: randomItem.image,
        };
        allitems.push(item);
    }

    //shuffle the items
    for (let i = allitems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allitems[i], allitems[j]] = [allitems[j], allitems[i]];
    }
    let rows = [];
    for (let i = 0; i < amountOfRows; i++) {
        rows.push(allitems.splice(0, amountOfItemsPerRow));
    }

    data.set("traderInventory", rows);
    updateTrader();
}

function updateTrader() {
    let tInv = data.get("traderInventory");
    let amountOfRows = tInv.length;

    // update the UI
    for (let j = 0; j < amountOfRows; j++) {
        let row = document.getElementById("trader-row-" + (j + 1));
        row.innerHTML = "";
        let amountOfItemsPerRow = tInv[j].length;
        for (let i = 0; i < amountOfItemsPerRow; i++) {
            let item = document.createElement("div");
            item.classList.add("trader-item");
            item.style.backgroundImage =
                "url('./gnomes/" + tInv[j][i].image + "')";
            let priceTag = document.createElement("div");
            priceTag.classList.add("price-tag-store");
            let coinImg = document.createElement("img");
            coinImg.src = "./gnomes/Coin.png";
            coinImg.classList.add("coin-img-store");
            let priceText = document.createElement("div");
            priceText.classList.add("price-tag-store-text");
            priceText.innerHTML = tInv[j][i].price;
            item.onclick = function () {
                event.stopPropagation();
                attemptPurchase(tInv[j][i], this);
            };
            priceTag.appendChild(coinImg);
            priceTag.appendChild(priceText);
            item.appendChild(priceTag);
            row.appendChild(item);
        }
    }
}

function updateInventory(skipAnimation = false) {
    let inven = data.get("inventory");
    let inventoryDiv = document.getElementById("inventory");
    inventoryDiv.innerHTML = "";
    for (let i = 0; i < inven.length; i++) {
        let item_obj = inven[i];
        let item = document.createElement("div");
        item.classList.add("inventory-item");
        item.style.backgroundImage = "url('./gnomes/" + inven[i].image + "')";

        if (inven[i].amount <= 0) {
            item.classList.add("inventory-item-disabled");
        } else {
            item.classList.remove("inventory-item-disabled");
            let amountTxt = document.createElement("div");
            amountTxt.classList.add("inventory-item-amount");
            amountTxt.innerHTML = inven[i].amount;
            item.appendChild(amountTxt);
        }
        if (inven[i].name.includes("Lootbox") && inven[i].amount > 0) {
            item.onclick = function () {
                event.stopPropagation();
                openLootbox(inven[i].name.match(/\d+/)[0]);
                let inventory = data.get("inventory");
                for (let item = 0; item < inventory.length; item++) {
                    if (inventory[item].name == inven[i].name) {
                        inventory[item].amount--;
                    }
                }
                data.set("inventory", inventory);
                updateInventory();
                toggleInventory();
            };
        }
        if (inven[i].name.includes("Seed") && inven[i].amount > 0) {
            item.onclick = function () {
                event.stopPropagation();
                plantSeed(inven[i].name.match(/\d+/)[0]);
                let inventory = data.get("inventory");
                for (let item = 0; item < inventory.length; item++) {
                    if (inventory[item].name == "Seed 1") {
                        inventory[item].amount--;
                    }
                }
                data.set("inventory", inventory);
                updateInventory();
                toggleInventory();
            };
        }
        if (inven[i].name == "Coin Collector" && inven[i].amount > 0) {
            item.onclick = function () {
                event.stopPropagation();
                setupCoinCollector();
                let inventory = data.get("inventory");
                for (let item = 0; item < inventory.length; item++) {
                    if (inventory[item].name == "Coin Collector") {
                        inventory[item].amount--;
                    }
                }
                data.set("inventory", inventory);
                updateInventory();
                toggleInventory();
            };
        }
        inventoryDiv.appendChild(item);
    }
}

function setupCoinCollector() {
    toolHeld = "Coin Collector";
    holdingTool = true;
}

function plantSeed(seed) {
    toolHeld = "Seed " + seed;
    holdingTool = true;
}

function attemptPurchase(item, itemDiv) {
    let price = item.price;
    let name = item.name;

    console.log("PRICE: +" + price);
    console.log("COINS: " + data.get("coinsInCurrentRun"));
    console.log(price > data.get("coinsInCurrentRun"));
    if (price > data.get("coinsInCurrentRun")) {
        return;
    }
    // remove from traderInven
    let ti = data.get("traderInventory");
    console.log(ti);
    for (let row = 0; row < ti.length; row++) {
        for (let rowItem = 0; rowItem < ti[row].length; rowItem++) {
            if (ti[row][rowItem] == item) {
                ti[row][rowItem] = null;
            }
        }
    }
    console.log(ti);
    data.set("traderInventory", ti);

    data.set("coinsInCurrentRun", data.get("coinsInCurrentRun") - price);
    let inv = data.get("inventory");
    let found = false;
    for (let i = 0; i < inv.length; i++) {
        if (inv[i].name == name) {
            if (inv[i].amount == undefined) {
                continue;
            }
            found = true;
            inv[i].amount += 1;
        }
    }
    if (!found) {
        if (
            name.includes("Seed") ||
            name.includes("Lootbox") ||
            name == "Coin Collector"
        ) {
            inv.push({
                name: name,
                amount: 1,
                image: item.image,
            });
        } else {
            inv.push({
                name: name,
                amount: undefined,
                image: item.image,
            });
        }
    }

    data.set("inventory", inv);
    updateInventory();
    itemDiv.remove();
}

function openLootbox(level = 1) {
    var levelOneRange = [1, 9];
    var levelTwoRange = [9, 13];
    var levelThreeRange = [14, 16];

    if (level == 1) {
        let randomLevel = [];
        let rarityIncreaseFactor = 1.8;

        for (let i = levelOneRange[1]; i >= levelOneRange[0]; i--) {
            for (
                let j = 0;
                j < Math.pow(rarityIncreaseFactor, levelOneRange[1] - i);
                j++
            ) {
                randomLevel.push(i);
            }
        }

        let levelOfGnome =
            randomLevel[Math.floor(Math.random() * randomLevel.length)];

        spawnGnome(
            levelOfGnome,
            camera_x + canvas_width / 2,
            camera_y + canvas_height / 2,
            "idle"
        );
        console.log("LOOTBOX GNOME: " + levelOfGnome);
    } else if (level == 2) {
        let randomLevel = [];
        let rarityIncreaseFactor = 2;

        for (let i = levelTwoRange[1]; i >= levelTwoRange[0]; i--) {
            for (
                let j = 0;
                j < Math.pow(rarityIncreaseFactor, levelTwoRange[1] - i);
                j++
            ) {
                randomLevel.push(i);
            }
        }

        let levelOfGnome =
            randomLevel[Math.floor(Math.random() * randomLevel.length)];

        spawnGnome(
            levelOfGnome,
            camera_x + canvas_width / 2,
            camera_y + canvas_height / 2,
            "idle"
        );
        console.log("LOOTBOX GNOME: " + levelOfGnome);
    } else if (level == 3) {
        let randomLevel = [];
        let rarityIncreaseFactor = 10;

        for (let i = levelThreeRange[1]; i >= levelThreeRange[0]; i--) {
            for (
                let j = 0;
                j < Math.pow(rarityIncreaseFactor, levelThreeRange[1] - i);
                j++
            ) {
                randomLevel.push(i);
            }
        }

        let levelOfGnome =
            randomLevel[Math.floor(Math.random() * randomLevel.length)];

        spawnGnome(
            levelOfGnome,
            camera_x + canvas_width / 2,
            camera_y + canvas_height / 2,
            "idle"
        );
        console.log("LOOTBOX GNOME: " + levelOfGnome);
    }
}
