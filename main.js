const STATE_INIT = 3000;
const STATE_READY = 3001;
const STATE_PLAYING = 3002;
const STATE_END = 3003;

let _players = App.players;

let _state = STATE_INIT;
let _start = false;
let _widget = null;

let BOARD_SIZE = 30;

let _mapWidth = Map.width;
let _mapHeight = Map.height;

let _mapMidX = Math.floor(Map.width / 2);
let _mapMidY = Math.floor(Map.height / 2);

let _explosionOffsetX = 1;
let _explosionOffsetY = 2;

let _wallOffsetX = 2;
let _wallOffsetY = 2;

let _explosionSound = false;

let _stage = 0;
let _stageTimer = 0;

let _gameArea = [];

let _rank = [];
let _playerCount = 0;

let explosion = App.loadSpritesheet(
	"explosion2.png",
	96,
	96,
	{
		play: Array.from({ length: 40 }, (v, i) => i),
	},
	33
);
let redBlock = App.loadSpritesheet("redBlock.png", 32, 32, { play: [0, 1, 2, 3, 4, 5, 6] });
let wall = App.loadSpritesheet("wall.png");
let wall_offset = App.loadSpritesheet("wall_offset.png");

let ghost = App.loadSpritesheet(
	"ghost.png",
	48,
	48,
	{
		left: [3, 4, 5],
		up: [9, 10, 11],
		down: [0, 1, 2],
		right: [6, 7, 8],
	},
	8
);

let start_delay = 0;
const START_DELAY = 5;

function showLabelTypeH(player, key, text1, text2) {
	const isMobile = player.isMobile;
	const topGap = isMobile ? 10 : -2; // 60px from the top on mobile and 48px on PC.
	/**
	 * size-based @labelPercentWidth
	 * XL: isMobile ? 90 : 50;
	 * L: isMobile ? 80 : 40;
	 * M: isMobile ? 70 : 28;
	 * S: isMobile ? 60 : 20
	 */
	const labelPercentWidth = isMobile ? 60 : 20;
	const labelDisplayTime = 4000;

	const parentStyle = `
    display: flex; 
    align-items: center;
    justify-content: center;
    text-align: center;
    `;

	const firstRowStyle = `
    font-size: ${isMobile ? "14px" : "18px"};
    font-weight: 700; 
    color: white;`;

	const highlightSpanStyle = `
    font-size: ${isMobile ? "14px" : "18px"};
    font-weight: 700; 
    color: #FFEB3A;`; // Show red(#FF5353) when timeout is about to expire

	const customLabelOption = {
		key: key,
		borderRadius: "12px",
		fontOpacity: false,
		padding: "8px",
	};

	let htmlStr = `<span style="${parentStyle}">
	<span style="${highlightSpanStyle}">${text1}</span>
        <span style="${firstRowStyle}">${text2}</span>
    </span>`;

	player.showCustomLabel(htmlStr, 0xffffff, 0x27262e, topGap, labelPercentWidth, 0.64, labelDisplayTime, customLabelOption);
}

function showLabelTypeG(player, key, text) {
	const isMobile = player.isMobile;
	const topGap = isMobile ? 10 : -2; // 60px from the top on mobile and 48px on PC.
	/**
	 * size based @labelPercentWidth
	 * XL: isMobile ? 90 : 50;
	 * L: isMobile ? 80 : 40;
	 * M: isMobile ? 70 : 28;
	 * S: isMobile ? 60 : 20
	 */
	const labelPercentWidth = isMobile ? 60 : 20;
	const labelDisplayTime = 4000;

	const parentStyle = `
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    text-align: center;
    `;

	const firstRowStyle = `
    font-size: ${isMobile ? "14px" : "18px"};
    font-weight: 700; 
    color: white;`;

	const customLabelOption = {
		key: key,
		borderRadius: "12px",
		fontOpacity: false,
		padding: "8px",
	};

	let htmlStr = `<span style="${parentStyle}">
        <span style="${firstRowStyle}">${text}</span>
    </span>`;

	player.showCustomLabel(htmlStr, 0xffffff, 0x27262e, topGap, labelPercentWidth, 0.64, labelDisplayTime, customLabelOption);
}

function getPlayerByCoordinates(tileX, tileY) {
	let players = App.players;
	let arr = [];
	for (let i in players) {
		let p = players[i];
		if (p.tileX == tileX && p.tileY == tileY) {
			arr.push(p);
		}
	}
	if (arr.length > 0) {
		return arr;
	}
	return null;
}

function spawnManyBombs() {
	for (const player of App.players) {
		showLabelTypeG(player, "main", `💣 ${_stage} 단계`);
	}

	let length = _gameArea.length;
	if (length > 0) {
		for (let i = 0; i < length; i++) {
			if (Math.random() < 0.69 + _stage * 0.01) {
				if (i < length - 1) {
					bombSpawn(_gameArea[i][0], _gameArea[i][1]);
				} else {
					bombSpawn(_gameArea[i][0], _gameArea[i][1], true);
				}
			}
		}
	} else {
		App.sayToAll("게임영역이 지정되지 않았습니다.");
	}
}

function bombSpawn(tileX, tileY, last = false) {
	for (const player of App.players) {
		const redFloorKey = `redFloor_${tileX}_${tileY}`;
		// player.addPhaserGo({
		// 	sprite: {
		// 		name: redFloorKey,
		// 		texture: "#" + redBlock.id,
		// 		x: tileX * 32,
		// 		y: tileY * 32,
		// 		alpha: 1,
		// 	},
		// });
		player.callPhaserFunc(redFloorKey, "play", [{ key: "#" + redBlock.id + "_play", repeat: 0, showOnStart: true, hideOnComplete: true }]);
	}
	App.runLater(() => {
		let target = getPlayerByCoordinates(tileX, tileY);
		for (const player of App.players) {
			const explosionKey = `explosion_${tileX}_${tileY}`;
			// player.addPhaserGo({
			// 	sprite: {
			// 		name: explosionKey,
			// 		texture: "#" + explosion.id,
			// 		x: tileX * 32,
			// 		y: tileY * 32,
			// 		alpha: 1,
			// 	},
			// });
			player.callPhaserFunc(explosionKey, "play", [{ key: "#" + explosion.id + "_play", repeat: 0, showOnStart: true, hideOnComplete: true }]);
			if (_explosionSound === false) {
				_explosionSound = true;
				player.playSound("explosion.wav", false, true, "bomb", 0.6);
			}	
		}
		// Map.putObject(tileX, tileY, null);
		// Map.putObject(tileX - _explosionOffsetX, tileY - _explosionOffsetY, explosion, {
		// 	topObject: true,
		// });
		// Map.playObjectAnimation(tileX - _explosionOffsetX, tileY - _explosionOffsetY, "#" + explosion.id, 1);
		
		if (target !== null) {
			for (let i in target) {
				let t = target[i];
				if (!t.tag.dead) {
					if (t.title) {
						let health = t.title.length;
						if (health > 0) {
							t.title = t.title.substring(0, health - 2);
							health = t.title.length;
						}
						if (health <= 0) {
							dead(t);
						}
					}
				}
				t.sendUpdated();
			}
		}

		// App.runLater(() => {
		// 	// Map.putObject(tileX - _explosionOffsetX, tileY - _explosionOffsetY, null);
		// }, 1);
	}, 1.2);
}

App.onStart.Add(function () {
	App.runLater(() => {
		startState(STATE_INIT);
	}, 1);
});

function dead(player) {
	_playerCount--;
	ghostPlayer(player);
	player.tag.dead = true;
	if (_state >= STATE_INIT && _state <= STATE_PLAYING) {
		_rank.push([player.name, _stage, 0]);
	}
	player.sendUpdated();
}

function startState(state) {
	_state = state;
	let players = App.players;
	switch (_state) {
		case STATE_INIT:
			if (_mapWidth < BOARD_SIZE || _mapHeight < BOARD_SIZE) {
				for (const player of App.players) {
					showLabelTypeG(player, "main", `맵의 크기가 작아서 시작 할 수 없습니다.\n[ 최소 크기: ${BOARD_SIZE} x ${BOARD_SIZE} ]`);
				}

				return;
			} else if (_playerCount <= 1) {
				for (const player of App.players) {
					showLabelTypeG(player, "main", "최소 2명 이상의 플레이어가 필요합니다.");
				}
				return;
			}

			_start = true;
			start_delay = START_DELAY;
			_stage = 0;
			_rank.splice(0);
			_gameArea.splice(0);

			// 게임영역 타일 타입 NONE으로 바꾸기
			for (let i = _mapMidX - BOARD_SIZE / 2; i < _mapMidX + BOARD_SIZE / 2; i++) {
				for (let j = _mapMidY - BOARD_SIZE / 2; j < _mapMidY + BOARD_SIZE / 2; j++) {
					_gameArea.push([i, j]);
				}
			}

			for (const player of App.players) {
				for (const coord of _gameArea) {
					let i = coord[0];
					let j = coord[1];
					const redFloorKey = `redFloor_${i}_${j}`;
					player.addPhaserGo({
						sprite: {
							name: redFloorKey,
							texture: "#" + redBlock.id,
							x: i * 32 + 16,
							y: j * 32 + 16,
						},
					});

					const explosionKey = `explosion_${i}_${j}`;
					player.addPhaserGo({
						sprite: {
							name: explosionKey,
							texture: "#" + explosion.id,
							x: i * 32 + 16,
							y: j * 32,
						},
					});
				}
			}

			// 게임영역 밖에 있는 유저를 안으로 스폰시키기
			for (let i in _players) {
				let p = _players[i];
				if (i < _mapMidX - BOARD_SIZE / 2 || i >= _mapMidX + BOARD_SIZE / 2 || j < _mapMidY - BOARD_SIZE / 2 || j >= _mapMidY + BOARD_SIZE / 2) {
					let rand = Math.floor(Math.random() * 20);
					p.spawnAt(_gameArea[rand][0], _gameArea[rand][1]);
				}
				p.title = "❤️❤️❤️";
				p.moveSpeed = 0;
				p.playSound("bgm.mp3", false, true, "bgm", 0.6);
				p.sendUpdated();
			}
			makeFence();
			
			// App.playSoundLink(
			// 	"https://vgmsite.com/soundtracks/metal-slug-4-original-soundtrack/zgisjfaeso/11%20Secret%20Place%20%28Stage%206%29.mp3"
			// );

			break;
		case STATE_READY:
			break;
		case STATE_PLAYING:
			_stageTimer = 3;
			for (let i in _players) {
				let player = _players[i];
				player.moveSpeed = 40;
				player.sendUpdated();
			}
			break;

		case STATE_END:
			_start = false;
			Map.clearAllObjects();
			clearFence();
			App.stopSound();
			for (let i in players) {
				let p = players[i];

				if (p.title) {
					if (!p.tag.dead) {
						_rank.push([p.name, 0, p.title.length / 2]);
					}
				}
			}
			_rank.sort((a, b) => {
				if (a[1] == 0 && b[1] !== 0) {
					return -1;
				} else if (a[1] !== 0 && b[1] == 0) {
					return 1;
				} else if (a[1] == 0 && b[1] == 0) {
					return b[2] - a[2];
				}
				return b[1] - a[1];
			});
			for (let i in players) {
				let p = players[i];
				p.tag.widget = p.showWidget("widget.html", "top", 500, 550);
				p.sprite = null;
				p.title = "";
				p.moveSpeed = 80;
				p.sendUpdated();

				p.tag.widget.onMessage.add(function (player, data) {
					if (data.type === "rankClose") {
						player.tag.widget.destroy();
					}
				});
				p.tag.widget.sendMessage({
					allrank: _rank,
				});
			}

			break;
	}
}

let ONE_SEC = 1;

App.onUpdate.Add(function (dt) {
	if (_start) {
		if (_state == STATE_INIT) {
			ONE_SEC -= dt;
			if (ONE_SEC < 0) {
				ONE_SEC = 1;

				if (start_delay >= 0) {
					for (const player of App.players) {
						showLabelTypeH(player, "main", `⏰ ${start_delay}`, "초 후 게임이 시작됩니다");
					}
					--start_delay;
				} else if (start_delay < 0) {
					start_delay = 0;
					startState(STATE_PLAYING);
				}
			}
		} else if (_state == STATE_PLAYING) {
			if (_stageTimer > 0) {
				_stageTimer -= dt;
			}

			if (_stageTimer < 0) {
				_stage++;
				if (_playerCount <= 1) {
					startState(STATE_END);
					return;
				}
				if (_stage == 30) {
					_stageTimer = 0;
					startState(STATE_END);
				} else {
					_stageTimer = 2.5;
				}
				if (_state == STATE_PLAYING) {
					_explosionSound = false;
					spawnManyBombs();
				}
			}
		}
	}
});

function makeFence() {
	// 게임영역 테두리 impassable 타일로 감싸기
	let fenceStartPointX = _gameArea[0][0] - 1;
	let fenceStartPointY = _gameArea[0][1] - 1;
	let fenceEndPointX = _gameArea[0][0] + BOARD_SIZE;
	let fenceEndPointY = _gameArea[0][1] + BOARD_SIZE;

	for (let x = fenceStartPointX - _wallOffsetX; x <= fenceEndPointX + _wallOffsetX; x++) {
		for (let y = fenceStartPointY - _wallOffsetY; y <= fenceEndPointY + _wallOffsetY; y++) {
			if (x == fenceStartPointX - _wallOffsetX || y == fenceStartPointY - _wallOffsetY) {
				if (x <= fenceEndPointX - _wallOffsetX && y <= fenceEndPointY - _wallOffsetY) {
					Map.putObjectWithKey(x, y, wall_offset, {
						key: `wall${x}${y}`,
					});
				}
			}

			if (x == fenceEndPointX || y == fenceEndPointY) {
				if (x <= fenceEndPointX && y <= fenceEndPointY && x >= fenceStartPointX && y >= fenceStartPointY) {
					Map.putObjectWithKey(x, y, wall, {
						key: `wall${x}${y}`,
					});
				}
			}

			if (x == fenceStartPointX || y == fenceStartPointY || x == fenceEndPointX || y == fenceEndPointY) {
				Map.putTileEffect(x, y, 1);
			}
		}
	}
}

function clearFence() {
	let fenceStartPointX = _gameArea[0][0] - 1;
	let fenceStartPointY = _gameArea[0][1] - 1;
	let fenceEndPointX = _gameArea[0][0] + BOARD_SIZE;
	let fenceEndPointY = _gameArea[0][1] + BOARD_SIZE;

	for (let x = fenceStartPointX - _wallOffsetX; x <= fenceEndPointX + _wallOffsetX; x++) {
		for (let y = fenceStartPointY - _wallOffsetY; y <= fenceEndPointY + _wallOffsetY; y++) {
			if (x == fenceStartPointX || y == fenceStartPointY || x == fenceEndPointX || y == fenceEndPointY) {
				Map.putTileEffect(x, y, 0);
			}
		}
	}
}

App.onJoinPlayer.Add(function (p) {
	_players = App.players;
	// p.playSoundLink(
	// 	"https://vgmsite.com/soundtracks/metal-slug-4-original-soundtrack/zgisjfaeso/11%20Secret%20Place%20%28Stage%206%29.mp3"
	// );
	p.tag = {};
	if (_start) {
		ghostPlayer(p);
		p.tag.dead = true;
	} else {
		_playerCount++;
		p.sprite = null;
		p.title = "";
		p.moveSpeed = 80;
	}

	p.sendUpdated();
});

App.onLeavePlayer.Add(function (p) {
	_players = App.players;
	if (_start) {
		dead(p);
	}
});

function ghostPlayer(player) {
	player.sprite = ghost;
	player.title = "유령";
	player.sendUpdated();
}
