
let game = null;

// ======================================
// CHARACTER DATABASE
// ======================================

const characters = [
    {
        name: "Narendra Modi",
        shortName: "MODI",
        color: 0xF39C12,
        cssColor: "#F39C12"
    },
    {
        name: "Rahul Gandhi",
        shortName: "RAHUL",
        color: 0x3498DB,
        cssColor: "#3498DB"
    },
    {
        name: "Arvind Kejriwal",
        shortName: "KEJRIWAL",
        color: 0x2ECC71,
        cssColor: "#2ECC71"
    },
    {
        name: "Mamata Banerjee",
        shortName: "MAMATA",
        color: 0x9B59B6,
        cssColor: "#9B59B6"
    }
];

let selectedPlayer = characters[0];
let selectedOpponent = characters[1];


// ======================================
// FIGHTKARO DIALOGUE DATABASE
// ======================================

const dialogueBank = {
    intro: [
        "Toh bhai, shuru karein?",
        "Aaj toh full entertainment hoga!",
        "Camera on hai? Action!"
    ],
    punch: [
        "Yeh lo!",
        "Seedha connection!",
        "Kya timing hai!"
    ],
    kick: [
        "Udd jaa!",
        "Full power!",
        "Ab aaya na maza!"
    ],
    block: [
        "Nice try!",
        "Itni aasani se nahi!",
        "Defence bhi koi cheez hoti hai!"
    ],
    lowHealth: [
        "Abhi picture baaki hai!",
        "Main abhi out nahi hua!",
        "Comeback loading..."
    ],
    victory: [
        "Jeet toh meri hi honi thi!",
        "Game over, boss!",
        "Kya performance thi!"
    ],
    defeat: [
        "Agli baar dekh lenge!",
        "Yeh round tumhara tha!",
        "Rematch pending hai!"
    ]
};

function getRandomDialogue(category) {
    const lines = dialogueBank[category];
    if (!lines || lines.length === 0) return "";
    const randomIndex = Math.floor(Math.random() * lines.length);
    return lines[randomIndex];
}


// ======================================
// SOUND SYSTEM
// ======================================

let audioContext = null;
let masterVolume = 0.12;

function initializeAudio() {

    if (!audioContext) {

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (AudioContextClass) {
            audioContext = new AudioContextClass();
        }

    }

    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
    }

}

function playTone(frequency, duration, type = "sine", volume = 0.5) {

    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime
    );

    gain.gain.setValueAtTime(
        volume * masterVolume,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);

}

function playSound(sound) {

    if (!audioContext) return;

    switch (sound) {

        case "click":
            playTone(600, 0.08, "square", 0.35);
            break;

        case "punch":
            playTone(130, 0.12, "sawtooth", 0.8);
            break;

        case "kick":
            playTone(80, 0.2, "triangle", 1);
            break;

        case "block":
            playTone(450, 0.12, "square", 0.45);
            break;

        case "hit":
            playTone(180, 0.16, "sawtooth", 0.65);
            break;

        case "win":
            playTone(523, 0.2, "square", 0.5);
            setTimeout(() => playTone(659, 0.2, "square", 0.5), 180);
            setTimeout(() => playTone(784, 0.4, "square", 0.5), 360);
            break;

        case "lose":
            playTone(350, 0.25, "triangle", 0.5);
            setTimeout(() => playTone(260, 0.35, "triangle", 0.5), 220);
            break;

    }

}


// ======================================
// MENU ELEMENTS
// ======================================

const playButton = document.getElementById("play");
const helpButton = document.getElementById("help");
const aboutButton = document.getElementById("about");
const message = document.getElementById("message");

// ======================================
// FULLSCREEN MENU BACKGROUND
// ======================================

const menuArtworkStyle = document.createElement("style");

menuArtworkStyle.textContent = `
    html,
    body {
        width: 100%;
        min-height: 100%;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
    }

    .menu {
        position: fixed;
        inset: 0;
        z-index: 10;

        width: 100vw;
        height: 100vh;
        min-height: 100vh;
        max-width: none;

        margin: 0;
        padding: 30px 20px;
        box-sizing: border-box;
        border-radius: 0;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        background-color: #171923;
        background-image:
            linear-gradient(
                90deg,
                rgba(15, 17, 28, 0.88),
                rgba(15, 17, 28, 0.40)
            ),
            url("assets/modi-gauntlet.png");

        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
    }

    .menu h1,
    .menu p,
    .menu button {
        position: relative;
        z-index: 2;
    }

    .menu h1 {
        font-size: clamp(38px, 6vw, 72px);
    }

    .menu button {
        max-width: 450px;
        width: min(90vw, 450px);
    }

    #game-container {
        width: 100%;
        max-width: 100%;
    }

    @media (max-width: 600px) {
        .menu {
            padding: 20px 12px;
            background-position: 58% center;
        }
    }
`;

document.head.appendChild(menuArtworkStyle);

// ======================================
// CHARACTER SELECTION SCREEN
// ======================================

function createCharacterSelection() {

    if (document.getElementById("character-select")) return;

    const selection = document.createElement("div");

    selection.id = "character-select";

    selection.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(10, 12, 25, 0.97);
        display: none;
        justify-content: center;
        align-items: center;
        padding: 20px;
        font-family: Arial, sans-serif;
        color: white;
    `;

    selection.innerHTML = `
        <div style="
            background: #202638;
            border: 2px solid #F5C542;
            border-radius: 15px;
            padding: 25px;
            width: 100%;
            max-width: 650px;
            text-align: center;
        ">

            <h1 style="color:#F5C542;">CHOOSE YOUR FIGHTERS</h1>

            <p>Choose your character and your opponent.</p>

            <div style="
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                justify-content: center;
                margin: 25px 0;
            ">

                <div style="flex:1; min-width:200px;">
                    <h3 style="color:#55D6FF;">PLAYER</h3>

                    <select id="player-choice" style="
                        width:100%;
                        padding:12px;
                        background:#171923;
                        color:white;
                        border:1px solid #55D6FF;
                        border-radius:7px;
                        font-size:16px;
                    ">
                    </select>

                    <div id="player-preview" style="
                        margin-top:15px;
                        padding:20px;
                        border-radius:10px;
                        background:#171923;
                    "></div>
                </div>

                <div style="flex:1; min-width:200px;">
                    <h3 style="color:#FF7777;">OPPONENT</h3>

                    <select id="opponent-choice" style="
                        width:100%;
                        padding:12px;
                        background:#171923;
                        color:white;
                        border:1px solid #FF7777;
                        border-radius:7px;
                        font-size:16px;
                    ">
                    </select>

                    <div id="opponent-preview" style="
                        margin-top:15px;
                        padding:20px;
                        border-radius:10px;
                        background:#171923;
                    "></div>
                </div>

            </div>

            <button id="start-fight" style="
                background:#F5C542;
                color:#171923;
                border:none;
                padding:14px 35px;
                border-radius:8px;
                font-size:18px;
                font-weight:bold;
                cursor:pointer;
                margin:8px;
            ">START FIGHT</button>

            <button id="back-menu" style="
                background:#34394B;
                color:white;
                border:none;
                padding:14px 25px;
                border-radius:8px;
                font-size:16px;
                cursor:pointer;
                margin:8px;
            ">BACK</button>

        </div>
    `;

    document.body.appendChild(selection);

    const playerSelect = document.getElementById("player-choice");
    const opponentSelect = document.getElementById("opponent-choice");

    characters.forEach((character, index) => {

        const playerOption = document.createElement("option");
        playerOption.value = index;
        playerOption.textContent = character.name;
        playerSelect.appendChild(playerOption);

        const opponentOption = document.createElement("option");
        opponentOption.value = index;
        opponentOption.textContent = character.name;
        opponentSelect.appendChild(opponentOption);

    });

    playerSelect.value = "0";
    opponentSelect.value = "1";

    function updatePreview() {

        selectedPlayer = characters[Number(playerSelect.value)];
        selectedOpponent = characters[Number(opponentSelect.value)];

        document.getElementById("player-preview").innerHTML = `
            <div style="
                width:70px;
                height:90px;
                background:${selectedPlayer.cssColor};
                margin:auto;
                border-radius:12px;
                border:3px solid white;
            "></div>
            <h3>${selectedPlayer.shortName}</h3>
            <p>${selectedPlayer.name}</p>
        `;

        document.getElementById("opponent-preview").innerHTML = `
            <div style="
                width:70px;
                height:90px;
                background:${selectedOpponent.cssColor};
                margin:auto;
                border-radius:12px;
                border:3px solid white;
            "></div>
            <h3>${selectedOpponent.shortName}</h3>
            <p>${selectedOpponent.name}</p>
        `;

    }

    playerSelect.addEventListener("change", updatePreview);
    opponentSelect.addEventListener("change", updatePreview);

    updatePreview();


    // START FIGHT

    document.getElementById("start-fight").addEventListener("click", function () {

        initializeAudio();
        playSound("click");

        selectedPlayer = characters[Number(playerSelect.value)];
        selectedOpponent = characters[Number(opponentSelect.value)];

        selection.style.display = "none";

        document.getElementById("game-container").style.display = "block";

        if (game === null) {
            game = new Phaser.Game(config);
        }

    });


    // BACK TO MENU

    document.getElementById("back-menu").addEventListener("click", function () {

        playSound("click");

        selection.style.display = "none";

        document.querySelector(".menu").style.display = "block";

    });

}


// ======================================
// MENU BUTTONS
// ======================================

playButton.addEventListener("click", function () {

    initializeAudio();
    playSound("click");

    document.querySelector(".menu").style.display = "none";

    createCharacterSelection();

    document.getElementById("character-select").style.display = "flex";

});

helpButton.addEventListener("click", function () {

    initializeAudio();
    playSound("click");

    message.textContent =
        "A/D: Move | W/SPACE: Jump | S: Block | J: Punch | K: Kick";

});

aboutButton.addEventListener("click", function () {

    initializeAudio();
    playSound("click");

    message.textContent =
        "FightKaro is my first 2D political fighting game project!";

});


// ======================================
// PIXEL-ART FIGHTER ART
// Generated in Phaser so no external image files are needed.
// ======================================

function createFighterTexture(scene, character, textureKey) {
    if (scene.textures.exists(textureKey)) {
        scene.textures.remove(textureKey);
    }

    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const outfit = character.color;
    const skin = 0xE8B58D;
    const dark = 0x25202A;
    const light = 0xF3EBDD;

    // Pixel-art shadow and shoes
    g.fillStyle(0x171923, 0.35);
    g.fillRect(13, 86, 39, 5);
    g.fillStyle(dark);
    g.fillRect(16, 79, 13, 8);
    g.fillRect(38, 79, 13, 8);

    // Legs and outfit
    g.fillStyle(outfit);
    g.fillRect(18, 57, 13, 24);
    g.fillRect(36, 57, 13, 24);
    g.fillStyle(0x202638);
    g.fillRect(17, 77, 14, 5);
    g.fillRect(36, 77, 14, 5);

    // Torso, shoulders and arms
    g.fillStyle(outfit);
    g.fillRect(14, 31, 39, 32);
    g.fillRect(9, 35, 10, 21);
    g.fillRect(48, 35, 10, 21);
    g.fillStyle(light);
    g.fillRect(29, 33, 8, 27);
    g.fillStyle(skin);
    g.fillRect(8, 25, 11, 12);
    g.fillRect(48, 25, 11, 12);

    // Neck and face
    g.fillStyle(skin);
    g.fillRect(27, 23, 13, 12);
    g.fillRect(22, 7, 25, 23);
    g.fillRect(19, 14, 4, 10);
    g.fillRect(46, 14, 4, 10);

    // Hair / headwear varies by fighter
    g.fillStyle(dark);
    if (character.shortName === "MODI") {
        g.fillRect(22, 5, 25, 6);
        g.fillRect(20, 10, 5, 8);
        g.fillRect(44, 10, 5, 6);
        g.fillStyle(0xD9D9D9);
        g.fillRect(24, 24, 21, 4);
        g.fillRect(27, 28, 15, 3);
    } else if (character.shortName === "KEJRIWAL") {
        g.fillRect(21, 5, 27, 5);
        g.fillRect(20, 10, 5, 5);
        g.fillRect(45, 10, 5, 5);
        g.fillStyle(0xFFFFFF);
        g.fillRect(20, 2, 29, 7);
        g.fillStyle(0x246BCE);
        g.fillRect(31, 4, 7, 2);
        g.fillStyle(dark);
        g.fillRect(25, 22, 5, 2);
        g.fillRect(39, 22, 5, 2);
    } else if (character.shortName === "MAMATA") {
        g.fillRect(20, 5, 29, 8);
        g.fillRect(20, 9, 5, 15);
        g.fillRect(44, 9, 5, 15);
        g.fillStyle(0xFFFFFF);
        g.fillRect(14, 39, 8, 22);
        g.fillRect(45, 39, 8, 22);
        g.fillStyle(0xD94C8A);
        g.fillRect(29, 33, 8, 27);
    } else {
        g.fillRect(21, 5, 28, 8);
        g.fillRect(21, 9, 5, 7);
        g.fillRect(44, 9, 5, 7);
    }

    // Eyes and simple pixel details
    g.fillStyle(dark);
    g.fillRect(27, 17, 4, 3);
    g.fillRect(39, 17, 4, 3);
    g.fillRect(32, 24, 7, 2);

    // Gloves
    g.fillStyle(0xF5C542);
    g.fillRect(7, 23, 12, 7);
    g.fillRect(48, 23, 12, 7);

    g.generateTexture(textureKey, 68, 96);
    g.destroy();
}

function addFighterSprite(scene, character, x, y, textureKey) {
    createFighterTexture(scene, character, textureKey);
    const sprite = scene.add.sprite(x, y, textureKey);
    sprite.setOrigin(0.5, 1);
    sprite.setDepth(5);
    sprite.setScale(1.15);
    return sprite;
}


// ======================================
// ARENA SCENE
// ======================================

class ArenaScene extends Phaser.Scene {

    constructor() {
        super("ArenaScene");
    }


    create() {

        this.gameOver = false;
        this.isPaused = false;

        this.playerHealth = 100;
        this.opponentHealth = 100;

        this.lastPlayerAttack = 0;
        this.nextOpponentAttack = 0;

        this.playerFacing = 1;
        this.opponentFacing = -1;

        this.playerKnockbackUntil = 0;
        this.opponentKnockbackUntil = 0;


        // GROUND

        this.ground = this.add.rectangle(
            400, 400, 800, 100, 0x34394B
        );

        this.physics.add.existing(this.ground, true);


        // ARENA DECORATION

        this.add.rectangle(
            400, 350, 800, 5, 0xF5C542
        );

        this.add.rectangle(
            400, 450, 800, 5, 0xF5C542
        );


        // PLAYER

        this.player = this.add.rectangle(
            200, 290, 50, 120, selectedPlayer.color
        );

        this.physics.add.existing(this.player);

        this.player.body.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, this.ground);

        this.player.setAlpha(0);
        this.playerSprite = addFighterSprite(
            this, selectedPlayer, this.player.x, this.player.y + 60, "player-fighter"
        );


        // OPPONENT

        this.opponent = this.add.rectangle(
            600, 290, 50, 120, selectedOpponent.color
        );

        this.physics.add.existing(this.opponent);

        this.opponent.body.setCollideWorldBounds(true);

        this.physics.add.collider(this.opponent, this.ground);

        this.opponent.setAlpha(0);
        this.opponentSprite = addFighterSprite(
            this, selectedOpponent, this.opponent.x, this.opponent.y + 60, "opponent-fighter"
        );
        this.opponentSprite.setFlipX(true);

        this.physics.add.collider(this.player, this.opponent);


        // CHARACTER NAME LABELS

        this.playerNameText = this.add.text(
            200, 205,
            selectedPlayer.shortName,
            {
                fontSize: "16px",
                color: selectedPlayer.cssColor,
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        this.opponentNameText = this.add.text(
            600, 205,
            selectedOpponent.shortName,
            {
                fontSize: "16px",
                color: selectedOpponent.cssColor,
                fontStyle: "bold"
            }
        ).setOrigin(0.5);


        // SPEECH BUBBLES

        const dialogueStyle = {
            fontSize: "14px",
            color: "#FFFFFF",
            fontStyle: "bold",
            backgroundColor: "#202638",
            padding: { x: 9, y: 7 },
            align: "center",
            wordWrap: { width: 190 }
        };

        this.playerDialogueText = this.add.text(200, 170, "", dialogueStyle)
            .setOrigin(0.5).setDepth(20).setVisible(false);

        this.opponentDialogueText = this.add.text(600, 170, "", dialogueStyle)
            .setOrigin(0.5).setDepth(20).setVisible(false);

        this.playerDialogueTimer = null;
        this.opponentDialogueTimer = null;
        this.playerLowHealthSpoken = false;
        this.opponentLowHealthSpoken = false;

        this.showDialogue("player", "intro");
        this.showDialogue("opponent", "intro");


        // KEYBOARD CONTROLS

        this.keys = this.input.keyboard.addKeys("A,D,S");

        this.cursors = this.input.keyboard.createCursorKeys();

        this.jumpKeys = this.input.keyboard.addKeys("W,SPACE");

        this.attackKeys = this.input.keyboard.addKeys("J,K");

        this.restartKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.R
        );


        // GAME TITLE

        this.add.text(
            400, 22,
            "FIGHTKARO",
            {
                fontSize: "28px",
                color: "#F5C542",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);


        // ROUND DISPLAY

        this.add.text(
            400, 55,
            "ROUND 1",
            {
                fontSize: "15px",
                color: "#FFFFFF"
            }
        ).setOrigin(0.5);


        // PLAYER HEALTH BAR

        this.add.text(20, 78, "PLAYER", {
            fontSize: "16px",
            color: "#FFFFFF",
            fontStyle: "bold"
        });

        this.add.rectangle(
            110, 110, 180, 18, 0x555555
        );

        this.playerHealthBar = this.add.rectangle(
            20, 110, 180, 18, 0x2ECC71
        );

        this.playerHealthBar.setOrigin(0, 0.5);


        // OPPONENT HEALTH BAR

        this.add.text(600, 78, "OPPONENT", {
            fontSize: "16px",
            color: "#FFFFFF",
            fontStyle: "bold"
        });

        this.add.rectangle(
            690, 110, 180, 18, 0x555555
        );

        this.opponentHealthBar = this.add.rectangle(
            600, 110, 180, 18, 0x2ECC71
        );

        this.opponentHealthBar.setOrigin(0, 0.5);


        // VS DISPLAY

        this.add.text(
            400, 140,
            "PLAYER VS OPPONENT",
            {
                fontSize: "18px",
                color: "#F5C542",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);


        // STATUS MESSAGE

        this.statusText = this.add.text(
            400, 180,
            "FIGHT!",
            {
                fontSize: "25px",
                color: "#F5C542",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);


        // BLOCK INDICATOR

        this.blockText = this.add.text(
            200, 235,
            "",
            {
                fontSize: "20px",
                color: "#55D6FF",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);


        // RESTART INSTRUCTION

        this.restartText = this.add.text(
            400, 260,
            "PRESS R TO RESTART",
            {
                fontSize: "22px",
                color: "#FFFFFF",
                fontStyle: "bold",
                backgroundColor: "#34394B",
                padding: {
                    x: 15,
                    y: 10
                }
            }
        ).setOrigin(0.5);

        this.restartText.setVisible(false);


        // CONTROL GUIDE

        this.add.text(
            400, 475,
            "A/D: MOVE   W: JUMP   S: BLOCK   J: PUNCH   K: KICK",
            {
                fontSize: "13px",
                color: "#FFFFFF"
            }
        ).setOrigin(0.5);


        // PAUSE MENU CONTROLS

        this.createPauseMenu();


        // BACKGROUND MUSIC

        this.musicNotes = [262, 330, 392, 330, 294, 349, 440, 349];

        this.musicIndex = 0;

        this.musicEvent = this.time.addEvent({
            delay: 350,
            loop: true,
            callback: () => {

                if (!this.gameOver) {

                    const note = this.musicNotes[this.musicIndex];

                    playTone(note, 0.22, "square", 0.12);

                    this.musicIndex =
                        (this.musicIndex + 1) % this.musicNotes.length;

                }

            }
        });

    }


    // ======================================
    // PAUSE MENU SYSTEM
    // ======================================

    createPauseMenu() {

        this.pauseButton = document.createElement("button");
        this.pauseButton.textContent = "Ⅱ PAUSE";

        this.pauseButton.style.cssText = `
            position: fixed;
            top: 18px;
            right: 18px;
            z-index: 10001;
            padding: 10px 16px;
            border: 2px solid #F5C542;
            border-radius: 8px;
            background: #202638;
            color: #F5C542;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
        `;

        this.pauseOverlay = document.createElement("div");

        this.pauseOverlay.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 10002;
            display: none;
            justify-content: center;
            align-items: center;
            background: rgba(10, 12, 25, 0.88);
            font-family: Arial, sans-serif;
        `;

        this.pauseOverlay.innerHTML = `
            <div style="
                width: min(90%, 360px);
                padding: 30px 24px;
                box-sizing: border-box;
                text-align: center;
                background: #202638;
                border: 2px solid #F5C542;
                border-radius: 14px;
                color: white;
                box-shadow: 0 12px 40px rgba(0,0,0,0.45);
            ">
                <h1 style="color:#F5C542; margin:0 0 10px;">GAME PAUSED</h1>

                <p style="margin:0 0 24px; color:#D7D9E0;">
                    Take a break, fighter.
                </p>

                <button id="fightkaro-resume" style="
                    display:block;
                    width:100%;
                    margin:10px 0;
                    padding:13px;
                    border:0;
                    border-radius:8px;
                    background:#F5C542;
                    color:#171923;
                    font-size:16px;
                    font-weight:bold;
                    cursor:pointer;
                ">RESUME</button>

                <button id="fightkaro-main-menu" style="
                    display:block;
                    width:100%;
                    margin:10px 0;
                    padding:13px;
                    border:1px solid #687086;
                    border-radius:8px;
                    background:#34394B;
                    color:white;
                    font-size:16px;
                    font-weight:bold;
                    cursor:pointer;
                ">MAIN MENU</button>
            </div>
        `;

        document.body.appendChild(this.pauseButton);
        document.body.appendChild(this.pauseOverlay);


        // PAUSE BUTTON

        this.pauseButton.addEventListener("click", () => {

            if (this.gameOver || this.isPaused) return;

            playSound("click");

            this.isPaused = true;

            this.pauseOverlay.style.display = "flex";
            this.pauseButton.style.display = "none";

            this.scene.pause();

        });


        // RESUME BUTTON

        this.pauseOverlay
            .querySelector("#fightkaro-resume")
            .addEventListener("click", () => {

                playSound("click");

                this.pauseOverlay.style.display = "none";
                this.pauseButton.style.display = "block";

                this.isPaused = false;

                this.scene.resume();

            });


        // MAIN MENU BUTTON

        this.pauseOverlay
            .querySelector("#fightkaro-main-menu")
            .addEventListener("click", () => {

                playSound("click");

                if (this.musicEvent) {
                    this.musicEvent.remove();
                }

                this.pauseOverlay.style.display = "none";

                this.pauseButton.remove();
                this.pauseOverlay.remove();

                // Stop and destroy the current Phaser game.
                this.scene.stop();

                if (game) {
                    game.destroy(true);
                    game = null;
                }

                // Hide the arena.
                document.getElementById("game-container").style.display = "none";

                // Hide character selection.
                const characterSelection =
                    document.getElementById("character-select");

                if (characterSelection) {
                    characterSelection.style.display = "none";
                }

                // Show the main menu again.
                document.querySelector(".menu").style.display = "block";

            });


        // CLEANUP WHEN SCENE RESTARTS OR SHUTS DOWN

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {

            if (this.pauseButton) {
                this.pauseButton.remove();
            }

            if (this.pauseOverlay) {
                this.pauseOverlay.remove();
            }

        });

    }


    // ======================================
    // SPEECH BUBBLE SYSTEM
    // ======================================

    showDialogue(side, category) {

        const isPlayer = side === "player";

        const dialogueText = isPlayer
            ? this.playerDialogueText
            : this.opponentDialogueText;

        const timerName = isPlayer
            ? "playerDialogueTimer"
            : "opponentDialogueTimer";

        const fighter = isPlayer ? this.player : this.opponent;

        if (!dialogueText || !fighter) return;

        dialogueText.setText(getRandomDialogue(category));

        dialogueText.setVisible(true);

        dialogueText.setPosition(fighter.x, fighter.y - 125);

        if (this[timerName]) {
            this[timerName].remove();
        }

        this[timerName] = this.time.delayedCall(1700, () => {

            if (dialogueText.active) {
                dialogueText.setVisible(false);
            }

        });

    }


    // ======================================
    // HEALTH BAR UPDATE
    // ======================================

    updateHealthBars() {

        this.playerHealthBar.scaleX =
            this.playerHealth / 100;

        this.opponentHealthBar.scaleX =
            this.opponentHealth / 100;

    }


    // ======================================
    // END MATCH
    // ======================================

    endMatch(result) {

        if (this.gameOver) return;

        this.gameOver = true;

        this.player.body.setVelocity(0, 0);
        this.opponent.body.setVelocity(0, 0);

        this.musicEvent.remove();

        if (result === "WIN") {

            this.showDialogue("player", "victory");
            this.showDialogue("opponent", "defeat");

            this.statusText.setText(
                selectedPlayer.shortName + " WINS!"
            );

            this.restartText.setText(
                "VICTORY!\nPress R to play again"
            );

            playSound("win");

        } else {

            this.showDialogue("opponent", "victory");
            this.showDialogue("player", "defeat");

            this.statusText.setText(
                selectedOpponent.shortName + " WINS!"
            );

            this.restartText.setText(
                "DEFEAT!\nPress R to play again"
            );

            playSound("lose");

        }

        this.restartText.setVisible(true);

    }


    // ======================================
    // PLAYER ATTACK
    // ======================================

    attack(type) {

        if (this.gameOver) return;

        if (this.keys.S.isDown) return;

        const now = this.time.now;

        if (now - this.lastPlayerAttack < 350) return;

        this.lastPlayerAttack = now;

        this.showDialogue("player", type);

        this.tweens.add({
            targets: this.playerSprite,
            scaleX: 1.28,
            scaleY: 1.05,
            duration: 75,
            yoyo: true
        });

        let damage;
        let range;
        let knockback;
        let name;

        if (type === "punch") {

            damage = 5;
            range = 85;
            knockback = 220;
            name = "PUNCH!";

        } else {

            damage = 10;
            range = 110;
            knockback = 400;
            name = "KICK!";

        }

        const distance =
            this.opponent.x - this.player.x;

        const inRange = Math.abs(distance) <= range;

        const facingOpponent =
            distance * this.playerFacing > 0;


        if (
            inRange &&
            facingOpponent &&
            this.opponentHealth > 0
        ) {

            this.opponentHealth = Math.max(
                0,
                this.opponentHealth - damage
            );

            this.updateHealthBars();

            playSound(type);

            this.opponent.body.setVelocityX(
                this.playerFacing * knockback
            );

            this.opponent.body.setVelocityY(-100);

            this.opponentKnockbackUntil = now + 300;

            this.opponentSprite.setTint(0xFFFFFF);

            this.time.delayedCall(120, () => {

                if (this.opponent.active && !this.gameOver) {
                    this.opponentSprite.clearTint();
                }

            });

            this.statusText.setText(
                name + " -" + damage + " HP"
            );

            if (this.opponentHealth <= 0) {
                this.endMatch("WIN");
            }

        } else {

            playSound("punch");

            this.statusText.setText(name + " MISS!");

        }

    }


    // ======================================
    // OPPONENT AI
    // ======================================

    opponentAI() {

        if (this.gameOver) return;

        const now = this.time.now;

        if (now < this.opponentKnockbackUntil) {
            return;
        }

        const dx = this.player.x - this.opponent.x;

        const distance = Math.abs(dx);

        const opponentBody = this.opponent.body;

        const speed = 110;

        this.opponentFacing = dx > 0 ? 1 : -1;


        if (distance > 85) {

            opponentBody.setVelocityX(
                this.opponentFacing * speed
            );

        } else {

            opponentBody.setVelocityX(0);

            if (now >= this.nextOpponentAttack) {

                this.nextOpponentAttack = now + 1200;

                this.showDialogue("opponent", "punch");

                const blocking =
                    this.keys.S.isDown &&
                    this.playerFacing ===
                    (this.opponent.x > this.player.x ? 1 : -1);

                const damage = blocking ? 2 : 6;

                this.playerHealth = Math.max(
                    0,
                    this.playerHealth - damage
                );

                this.updateHealthBars();

                if (this.playerHealth <= 30 && !this.playerLowHealthSpoken) {

                    this.playerLowHealthSpoken = true;

                    this.showDialogue("player", "lowHealth");

                }

                if (blocking) {

                    this.showDialogue("player", "block");

                    this.statusText.setText(
                        "BLOCKED! -" + damage + " HP"
                    );

                    playSound("block");

                } else {

                    this.statusText.setText(
                        "OPPONENT ATTACK! -" + damage + " HP"
                    );

                    playSound("hit");

                    this.player.body.setVelocityX(
                        this.opponentFacing * 250
                    );

                    this.player.body.setVelocityY(-80);

                    this.playerKnockbackUntil = now + 250;

                    this.playerSprite.setTint(0xFFFFFF);

                    this.time.delayedCall(120, () => {

                        if (this.player.active && !this.gameOver) {
                            this.playerSprite.clearTint();
                        }

                    });

                }


                if (this.playerHealth <= 0) {
                    this.endMatch("LOSE");
                }

            }

        }

    }


    // ======================================
    // MAIN UPDATE LOOP
    // ======================================

    update() {

        if (
            this.gameOver &&
            Phaser.Input.Keyboard.JustDown(this.restartKey)
        ) {

            this.scene.restart();

            return;

        }

        if (this.gameOver) return;

        const now = this.time.now;

        const speed = 250;

        const body = this.player.body;

        const blocking = this.keys.S.isDown;


        // BLOCK INDICATOR

        if (blocking) {
            this.blockText.setText("BLOCKING");
        } else {
            this.blockText.setText("");
        }


        // PLAYER MOVEMENT

        if (now < this.playerKnockbackUntil) {

            // Physics controls knockback.

        } else if (blocking) {

            body.setVelocityX(0);

        } else {

            body.setVelocityX(0);

            if (
                this.keys.A.isDown ||
                this.cursors.left.isDown
            ) {

                body.setVelocityX(-speed);
                this.playerFacing = -1;

            } else if (
                this.keys.D.isDown ||
                this.cursors.right.isDown
            ) {

                body.setVelocityX(speed);
                this.playerFacing = 1;

            }

        }


        // JUMP

        if (
            now >= this.playerKnockbackUntil &&
            !blocking &&
            (
                Phaser.Input.Keyboard.JustDown(this.jumpKeys.W) ||
                Phaser.Input.Keyboard.JustDown(this.jumpKeys.SPACE) ||
                Phaser.Input.Keyboard.JustDown(this.cursors.up)
            )
        ) {

            if (body.blocked.down || body.touching.down) {
                body.setVelocityY(-500);
            }

        }


        // PUNCH

        if (Phaser.Input.Keyboard.JustDown(this.attackKeys.J)) {
            this.attack("punch");
        }


        // KICK

        if (Phaser.Input.Keyboard.JustDown(this.attackKeys.K)) {
            this.attack("kick");
        }


        // OPPONENT AI

        this.opponentAI();


        // KEEP VISIBLE PIXEL FIGHTERS ALIGNED WITH THEIR PHYSICS BODIES

        this.playerSprite.setPosition(this.player.x, this.player.y + 60);

        this.opponentSprite.setPosition(this.opponent.x, this.opponent.y + 60);

        this.playerSprite.setFlipX(this.playerFacing < 0);

        this.opponentSprite.setFlipX(this.opponentFacing > 0);


        // A subtle bob makes idle fighters feel less static.

        const bob = Math.sin(now / 180) * 1.5;

        this.playerSprite.y += bob;

        this.opponentSprite.y -= bob;


        // KEEP NAME LABELS ABOVE FIGHTERS

        this.playerNameText.setPosition(
            this.player.x,
            this.player.y - 85
        );

        this.opponentNameText.setPosition(
            this.opponent.x,
            this.opponent.y - 85
        );

        if (this.playerDialogueText.visible) {

            this.playerDialogueText.setPosition(
                this.player.x,
                this.player.y - 125
            );

        }

        if (this.opponentDialogueText.visible) {

            this.opponentDialogueText.setPosition(
                this.opponent.x,
                this.opponent.y - 125
            );

        }

    }

}


// ======================================
// GAME CONFIGURATION
// ======================================

const config = {

    type: Phaser.AUTO,

    width: 800,

    height: 500,

    parent: "game-container",

    backgroundColor: "#171923",

    physics: {

        default: "arcade",

        arcade: {

            gravity: {
                y: 1000
            },

            debug: false

        }

    },

    scene: ArenaScene

};
