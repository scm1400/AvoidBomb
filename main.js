const STATE_INIT = 3000;
const STATE_READY = 3001;
const STATE_PLAYING = 3002;
const STATE_END = 3003;

let _players = App.players;

let _state = STATE_INIT;
let _start = false;
let _widget = null;

let BOARD_SIZE = 20;

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
	Array.from({ length: 33 }, (v, i) => i),
	33
);
let redBlock = App.loadSpritesheet(
	"redBlock.png",
	32,
	32,
	[0, 1, 2, 3, 4, 5, 6],
	10
);
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

// // 이미지 오프셋 만큼 맵을 막아줘야함
// function blockArea() {
// 	for (let i = 0; i < _mapWidth; i++) {
// 		for (let j = _explosionOffsetY; j > -1; j--) {
// 			let target = getPlayerByCoordinates(i, j);
// 			if (target !== null) {
// 				for (let i in target) {
// 					let t = target[i];
// 					t.spawnAt(10, 10);
// 				}
// 			}
// 			Map.putObject(i, j, wall);
// 			Map.putTileEffect(i, j, 1);
// 		}
// 	}

// 	for (let i = 0; i < _mapHeight; i++) {
// 		for (let j = _explosionOffsetX; j > -1; j--) {
// 			let target = getPlayerByCoordinates(j, i);
// 			if (target !== null) {
// 				target.spawnAt(10, 10);
// 			}
// 			Map.putObject(j, i, wall);
// 			Map.putTileEffect(j, i, 1);
// 		}
// 	}
// }

function showLabel(key) {
	for (let i in _players) {
		let p = _players[i];
		let str = "";
		if (!p.isMobile) {
			str = `<span
			style="
				position: absolute;
				margin: auto;
				display: flex;
				align-items: center;
				justify-content: center;
				height: 75px;
				width: 30%;
				top: 200px;
				left: 35%;
				background-color: rgba(0, 0, 0, 0.6);
				border-radius: 12px;
			"
			>`;
		} else {
			str = `<span
			style="
				position: absolute;
				margin: auto;
				display: flex;
				align-items: center;
				justify-content: center;
				height: 75px;
				width: 100%;
				top: 200px;
				background-color: rgba(0, 0, 0, 0.6);
				border-radius: 12px;
			"
		>`;
		}

		str += key;

		str += "</span>";

		p.showCustomLabel(str, 0xffffff, 0x000000, -150, 100, 1);
	}
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

function spawnMany() {
	// for (let i = _explosionOffsetX; i <= _mapWidth - _explosionOffsetX; i++) {
	// 	for (let j = _explosionOffsetY; j <= _mapHeight - _explosionOffsetY; j++) {
	// 		if (Math.random() < 0.8) {
	// 			bombSpawn(i, j);
	// 		}
	// 	}
	// }
	showLabel("\n" + _stage + " 단계 \n\n");
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
	Map.putObject(tileX, tileY, redBlock);
	Map.playObjectAnimation(tileX, tileY, "#" + redBlock.id, 2);
	App.runLater(() => {
		let target = getPlayerByCoordinates(tileX, tileY);
		Map.putObject(tileX, tileY, null);

		// Map.putObject(tileX - _explosionOffsetX, tileY - _explosionOffsetY, firepilar);

		// Map.playObjectAnimation(
		// 	tileX - _explosionOffsetX,
		// 	tileY - _explosionOffsetY,
		// 	"#" + firepilar.id,
		// 	2
		// );
		Map.putObject(
			tileX - _explosionOffsetX,
			tileY - _explosionOffsetY,
			explosion,
			{
				topObject: true,
			}
		);
		Map.playObjectAnimation(
			tileX - _explosionOffsetX,
			tileY - _explosionOffsetY,
			"#" + explosion.id,
			1
		);
		if (_explosionSound === false) {
			_explosionSound = true;
			App.playSound("explosion.wav", false, true);
		}

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

		App.runLater(() => {
			Map.putObject(tileX - _explosionOffsetX, tileY - _explosionOffsetY, null);
		}, 1);
	}, 1.2);
}

App.onStart.Add(function () {
	startState(STATE_INIT);
});

// //q
// App.addOnKeyDown(81, () => {
// 	// App.playSound("bgm.mp3");
// 	// App.sayToAll("Check Point 1");
// 	// App.stopSound();

// 	// App.sayToAll("Check Point 2");
// 	startState(STATE_INIT);
// });

// //w
// App.addOnKeyDown(87, () => {
// 	_explosionSound = false;
// 	spawnMany();
// });

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
			if (_mapWidth < 25 || _mapHeight < 25) {
				showLabel(
					"\n 맵의 크기가 작아서 시작 할 수 없습니다.\n최소 크기: 25x25 \n\n"
				);
				return;
			} else if (_playerCount <= 1) {
				showLabel("\n 최소 2명 이상의 플레이어가 필요합니다. \n\n");
				return;
			}

			_start = true;
			start_delay = START_DELAY;
			_stage = 0;
			_rank.splice(0);
			_gameArea.splice(0);

			for (let i in players) {
				let p = players[i];
				p.title = "❤️❤️❤️";
				p.moveSpeed = 0;

				p.sendUpdated();
			}

			// 게임영역 타일 타입 NONE으로 바꾸기
			for (
				let i = _mapMidX - BOARD_SIZE / 2;
				i < _mapMidX + BOARD_SIZE / 2;
				i++
			) {
				for (
					let j = _mapMidY - BOARD_SIZE / 2;
					j < _mapMidY + BOARD_SIZE / 2;
					j++
				) {
					// Map.putTileEffect(i, j, TileEffectType.NONE);
					Map.putTileEffect(i, j, TileEffectType.PRIVATE_AREA, {
						id: 3, // 필수
						impassable: false, // 선택, 기본 값 false
						param1: "true", // 선택, 기본 값 "false"
					});
					_gameArea.push([i, j]);
				}
			}

			// 게임영역 밖에 있는 유저를 안으로 스폰시키기
			for (let i in _players) {
				let p = _players[i];
				if (
					i < _mapMidX - BOARD_SIZE / 2 ||
					i >= _mapMidX + BOARD_SIZE / 2 ||
					j < _mapMidY - BOARD_SIZE / 2 ||
					j >= _mapMidY + BOARD_SIZE / 2
				) {
					let rand = Math.floor(Math.random() * 20);
					p.spawnAt(_gameArea[rand][0], _gameArea[rand][1]);
					p.sendUpdated();
				}
			}
			makeFence();
			App.playSound("bgm.mp3", false, true);
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

			// for (let i in _rank) {
			// 	App.sayToAll(_rank[i][0]);
			// }
			for (let i in players) {
				let p = players[i];

				if (p.title) {
					if (!p.tag.dead) {
						// App.sayToAll("생존자" + p.name + " " + p.title.length / 2);
						// App.sayToAll(p.title);
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
			// App.sayToAll(ONE_SEC);
			if (ONE_SEC < 0) {
				ONE_SEC = 1;

				if (start_delay > 0) {
					showLabel(`\n${--start_delay}초 후 게임이 시작됩니다\n\n`);
					// App.sayToAll(start_delay);
					if (start_delay == 0) {
						start_delay = -1;
					}
				} else if (start_delay < 0) {
					start_delay = 0;
					// App.sayToAll("시작");
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
					spawnMany();
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

	for (
		let x = fenceStartPointX - _wallOffsetX;
		x <= fenceEndPointX + _wallOffsetX;
		x++
	) {
		for (
			let y = fenceStartPointY - _wallOffsetY;
			y <= fenceEndPointY + _wallOffsetY;
			y++
		) {
			if (
				x == fenceStartPointX - _wallOffsetX ||
				y == fenceStartPointY - _wallOffsetY
			) {
				if (
					x <= fenceEndPointX - _wallOffsetX &&
					y <= fenceEndPointY - _wallOffsetY
				) {
					Map.putObjectWithKey(x, y, wall_offset, {
						key: `wall${x}${y}`,
					});
				}
			}

			if (x == fenceEndPointX || y == fenceEndPointY) {
				if (
					x <= fenceEndPointX &&
					y <= fenceEndPointY &&
					x >= fenceStartPointX &&
					y >= fenceStartPointY
				) {
					Map.putObjectWithKey(x, y, wall, {
						key: `wall${x}${y}`,
					});
				}
			}

			if (
				x == fenceStartPointX ||
				y == fenceStartPointY ||
				x == fenceEndPointX ||
				y == fenceEndPointY
			) {
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

	for (
		let x = fenceStartPointX - _wallOffsetX;
		x <= fenceEndPointX + _wallOffsetX;
		x++
	) {
		for (
			let y = fenceStartPointY - _wallOffsetY;
			y <= fenceEndPointY + _wallOffsetY;
			y++
		) {
			if (
				x == fenceStartPointX ||
				y == fenceStartPointY ||
				x == fenceEndPointX ||
				y == fenceEndPointY
			) {
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
	player.title = "생존자의 길을 막으세요!";
	player.sendUpdated();
}
