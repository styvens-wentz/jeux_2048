function GestionToucheClavier()
{
    this.events = {};

    if (window.navigator.msPointerEnabled)
    {
        this.eventTouchstart    = "MSPoinnerDown";
        this.eventTouchmove     = "MSPoinnerMove";
        this.eventTouchend      = "MSPoinnerUp";
    }
    else
    {
        this.eventTouchstart    = "touchstart";
        this.eventTouchmove     = "touchmove";
        this.eventTouchend      = "touchend";
    }

    this.listen();
}

GestionToucheClavier.prototype.on = function (event, callback)
{
    if (!this.events[event])
        this.events[event] = [];

    this.events[event].push(callback);
};

GestionToucheClavier.prototype.emit = function (event, data)
{
    const callbacks = this.events[event];
    if (callbacks)
    {
        callbacks.forEach(function (callback) {
            callback(data);
        });
    }
};

GestionToucheClavier.prototype.listen = function ()
{
    const self = this;

    const map = {
        38: 0, // Up
        39: 1, // Right
        40: 2, // Down
        37: 3, // Left
        75: 0, // Vim up
        76: 1, // Vim right
        74: 2, // Vim down
        72: 3, // Vim left
        87: 0, // W
        68: 1, // D
        83: 2, // S
        65: 3  // A
    };

    document.addEventListener("keydown", function (event)
    {
        const modifiers = event.altKey || event.ctrlKey || event.metaKey ||
            event.shiftKey;
        const mapped = map[event.which];
        console.log(event.key);
        if (!modifiers)
        {
            if (mapped !== undefined)
            {
                event.preventDefault();
                self.emit("move", mapped);
            }
        }

        if (!modifiers && event.which === 82)
            self.restart.call(self, event);

    });

    this.bindButtonPress(".reessayer", this.restart);
    this.bindButtonPress(".nouvelle-partie", this.restart);
    this.bindButtonPress(".continuer", this.keepPlaying);

    let touchStartClientX, touchStartClientY;
    const gameContainer = document.getElementsByClassName("ensemble-jeu")[0];

    gameContainer.addEventListener(this.eventTouchstart, function (event)
    {
        if ((!window.navigator.msPoinnerEnabled && event.touches.length > 1) ||
            event.targetTouches > 1)
            return;

        if (window.navigator.msPoinnerEnabled)
        {
            touchStartClientX = event.pageX;
            touchStartClientY = event.pageY;
        }
        else
        {
            touchStartClientX = event.touches[0].clientX;
            touchStartClientY = event.touches[0].clientY;
        }

        event.preventDefault();
    });

    gameContainer.addEventListener(this.eventTouchmove, function (event)
    {
        event.preventDefault();
    });

    gameContainer.addEventListener(this.eventTouchend, function (event)
    {
        if ((!window.navigator.msPoinnerEnabled && event.touches.length > 0) ||
            event.targetTouches > 0)
            return;


        let touchEndClientX, touchEndClientY;

        if (window.navigator.msPoinnerEnabled)
        {
            touchEndClientX = event.pageX;
            touchEndClientY = event.pageY;
        }
        else
        {
            touchEndClientX = event.changedTouches[0].clientX;
            touchEndClientY = event.changedTouches[0].clientY;
        }

        const dx = touchEndClientX - touchStartClientX;
        const absDx = Math.abs(dx);

        const dy = touchEndClientY - touchStartClientY;
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) > 10)
        {
            self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
        }

    });
};

GestionToucheClavier.prototype.restart = function (event)
{
    event.preventDefault();
    this.emit("restart");
};

GestionToucheClavier.prototype.keepPlaying = function (event)
{
    event.preventDefault();
    this.emit("keepPlaying");
};

GestionToucheClavier.prototype.bindButtonPress = function (selector, fn)
{
    const button = document.querySelector(selector);
    button.addEventListener("click", fn.bind(this));
    button.addEventListener(this.eventTouchend, fn.bind(this));
};



function HTMLActuator() {
    this.tuileEnsemble    = document.querySelector(".ensemble-tuiles");
    this.scoreContainer   = document.querySelector(".score-actuelle");
    this.bestContainer    = document.querySelector(".meilleur-score");
    this.messageContainer = document.querySelector(".message-jeu");

    this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata)
{
    const self = this;

    window.requestAnimationFrame(function ()
    {
        self.clearContainer(self.tuileEnsemble);

        grid.cells.forEach(function (column)
        {
            column.forEach(function (cell)
            {
                if (cell)
                    self.addTile(cell);
            });
        });

        self.updateScore(metadata.score);
        self.updateBestScore(metadata.bestScore);

        if (metadata.terminated)
        {
            if (metadata.over)
                self.message(false);
            else if (metadata.won)
                self.message(true);
        }

    });
};

HTMLActuator.prototype.continueGame = function ()
{
    this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container)
{
    while (container.firstChild)
    {
        container.removeChild(container.firstChild);
    }
};

HTMLActuator.prototype.addTile = function (tuile)
{
    const self = this;

    const wrapper = document.createElement("div");
    const inter = document.createElement("div");
    const position = tuile.previousPosition || {x: tuile.x, y: tuile.y};
    const positionClass = this.positionClass(position);

    const classes = ["tuile", "tuile-" + tuile.value, positionClass];

    if (tuile.value > 2048) classes.push("tuile-super");

    this.applyClasses(wrapper, classes);

    inter.classList.add("tuile-inter");
    inter.textContent = tuile.value;

    if (tuile.previousPosition)
    {
        window.requestAnimationFrame(function ()
        {
            classes[2] = self.positionClass({ x: tuile.x, y: tuile.y });
            self.applyClasses(wrapper, classes); // Update the position
        });
    }
    else if (tuile.fusionFrom)
    {
        classes.push("tuile-fusion");
        this.applyClasses(wrapper, classes);

        tuile.fusionFrom.forEach(function (fusion)
        {
            self.addTile(fusion);
        });
    }
    else
    {
        classes.push("tuile-new");
        this.applyClasses(wrapper, classes);
    }

    wrapper.appendChild(inter);

    this.tuileEnsemble.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes)
{
    element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position)
{
    return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position)
{
    position = this.normalizePosition(position);
    return "tuile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score)
{
    this.clearContainer(this.scoreContainer);

    const difference = score - this.score;
    this.score = score;

    this.scoreContainer.textContent = this.score;

    if (difference > 0)
    {
        const addition = document.createElement("div");
        addition.classList.add("score-addition");
        addition.textContent = "+" + difference;

        this.scoreContainer.appendChild(addition);
    }
};

HTMLActuator.prototype.updateBestScore = function (bestScore)
{
    this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won)
{
    const type = won ? "game-won" : "game-over";

    const message = won ? "Vous avez gagné !" : "Game over!";

    this.messageContainer.classList.add(type);
    this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function ()
{
    this.messageContainer.classList.remove("game-won");
    this.messageContainer.classList.remove("game-over");
};

function Grid(size, previousState)
{
    this.size = size;
    this.cells = previousState ? this.fromState(previousState) : this.empty();
}

Grid.prototype.empty = function ()
{
    const cells = [];

    for (let x = 0; x < this.size; x++)
    {
        const row = cells[x] = [];

        for (let y = 0; y < this.size; y++)
        {
            row.push(null);
        }
    }

    return cells;
};

Grid.prototype.fromState = function (state)
{
    const cells = [];

    for (let x = 0; x < this.size; x++)
    {
        const row = cells[x] = [];

        for (let y = 0; y < this.size; y++)
        {
            const tuile = state[x][y];
            row.push(tuile ? new Tile(tuile.position, tuile.value) : null);
        }
    }

    return cells;
};

Grid.prototype.randomAvailableCell = function ()
{
    const cells = this.availableCells();

    if (cells.length)
        return cells[Math.floor(Math.random() * cells.length)];
};

Grid.prototype.availableCells = function ()
{
    const cells = [];

    this.eachCell(function (x, y, tuile) {
        if (!tuile)
            cells.push({ x: x, y: y });
    });
    return cells;
};

Grid.prototype.eachCell = function (callback)
{
    for (let x = 0; x < this.size; x++)
    {
        for (let y = 0; y < this.size; y++)
        {
            callback(x, y, this.cells[x][y]);
        }
    }
};

Grid.prototype.cellsAvailable = function ()
{
    return !!this.availableCells().length;
};

Grid.prototype.cellAvailable = function (cell) {
    return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell)
{
    return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell)
{
    if (this.withinBounds(cell))
        return this.cells[cell.x][cell.y];
    else
        return null;
};

Grid.prototype.insertTile = function (tuile)
{
    this.cells[tuile.x][tuile.y] = tuile;
};

Grid.prototype.removeTile = function (tuile)
{
    this.cells[tuile.x][tuile.y] = null;
};

Grid.prototype.withinBounds = function (position)
{
    return position.x >= 0 && position.x < this.size &&
        position.y >= 0 && position.y < this.size;
};

Grid.prototype.serialize = function ()
{
    const cellState = [];

    for (let x = 0; x < this.size; x++)
    {
        const row = cellState[x] = [];

        for (let y = 0; y < this.size; y++)
        {
            row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
        }
    }

    return {
        size: this.size,
        cells: cellState
    };
};

function Tile(position, value)
{
    this.x                = position.x;
    this.y                = position.y;
    this.value            = value || 2;

    this.previousPosition = null;
    this.fusionFrom       = null;
}

Tile.prototype.savePosition = function ()
{
    this.previousPosition = { x: this.x, y: this.y };
};

Tile.prototype.updatePosition = function (position)
{
    this.x = position.x;
    this.y = position.y;
};


Tile.prototype.serialize = function ()
{
    return {
        position: {
            x: this.x,
            y: this.y
        },
        value: this.value
    };
};

window.fakeStorage = {
    _data: {}
};

function LocalStorageManager() {
    this.bestScoreKey     = "bestScore";
    this.gameStateKey     = "gameState";

    const supported = this.localStorageSupported();
    this.storage = supported ? window.localStorage : window.fakeStorage;
}

LocalStorageManager.prototype.localStorageSupported = function () {
    const testKey = "test";
    const storage = window.localStorage;

    try {
        storage.setItem(testKey, "1");
        storage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
};

LocalStorageManager.prototype.getBestScore = function () {
    return this.storage.getItem(this.bestScoreKey) || 0;
};

LocalStorageManager.prototype.setBestScore = function (score) {
    this.storage.setItem(this.bestScoreKey, score);
};

LocalStorageManager.prototype.getGameState = function () {
    const stateJSON = this.storage.getItem(this.gameStateKey);
    return stateJSON ? JSON.parse(stateJSON) : null;
};

LocalStorageManager.prototype.setGameState = function (gameState) {
    this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
};

LocalStorageManager.prototype.clearGameState = function () {
    this.storage.removeItem(this.gameStateKey);
};

function GameManager(size, InputManager, Actuator, StorageManager)
{
    this.size           = size; // Size of the grid
    this.inputManager   = new InputManager;
    this.storageManager = new StorageManager;
    this.actuator       = new Actuator;

    this.startTiles     = 2;

    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

    this.setup();
}

GameManager.prototype.restart = function () {
    this.storageManager.clearGameState();
    this.actuator.continueGame();
    this.setup();
};

GameManager.prototype.keepPlaying = function ()
{
    this.keepPlaying = true;
    this.actuator.continueGame();
};

GameManager.prototype.isGameTerminated = function ()
{
    return this.over || (this.won && !this.keepPlaying);
};

GameManager.prototype.setup = function ()
{
    const previousState = this.storageManager.getGameState();

    if (previousState)
    {
        this.grid        = new Grid(previousState.grid.size, previousState.grid.cells);
        this.score       = previousState.score;
        this.over        = previousState.over;
        this.won         = previousState.won;
        this.keepPlaying = previousState.keepPlaying;
    }
    else
    {
        this.grid        = new Grid(this.size);
        this.score       = 0;
        this.over        = false;
        this.won         = false;
        this.keepPlaying = false;

        this.addStartTiles();
    }

    this.actuate();
};

GameManager.prototype.addStartTiles = function ()
{
    for (let i = 0; i < this.startTiles; i++)
    {
        this.addRandomTile();
    }
};

GameManager.prototype.addRandomTile = function ()
{
    if (this.grid.cellsAvailable())
    {
        const value = Math.random() < 0.9 ? 2 : 4;
        const tuile = new Tile(this.grid.randomAvailableCell(), value);

        this.grid.insertTile(tuile);
    }
};

GameManager.prototype.actuate = function ()
{
    if (this.storageManager.getBestScore() < this.score)
        this.storageManager.setBestScore(this.score);

    if (this.over)
        this.storageManager.clearGameState();
    else
        this.storageManager.setGameState(this.serialize());

    this.actuator.actuate(this.grid,
        {
            score:      this.score,
            over:       this.over,
            won:        this.won,
            bestScore:  this.storageManager.getBestScore(),
            terminated: this.isGameTerminated()
        });
};

GameManager.prototype.serialize = function ()
{
    return {
        grid:        this.grid.serialize(),
        score:       this.score,
        over:        this.over,
        won:         this.won,
        keepPlaying: this.keepPlaying
    };
};

GameManager.prototype.prepareTiles = function ()
{
    this.grid.eachCell(function (x, y, tuile)
    {
        if (tuile)
        {
            tuile.fusionFrom = null;
            tuile.savePosition();
        }
    });
};

GameManager.prototype.moveTile = function (tuile, cell)
{
    this.grid.cells[tuile.x][tuile.y] = null;
    this.grid.cells[cell.x][cell.y] = tuile;
    tuile.updatePosition(cell);
};

GameManager.prototype.move = function (direction)
{
    const self = this;

    if (this.isGameTerminated())
        return;

    let cell, tuile;

    const vector = this.getVector(direction);
    const traversals = this.buildTraversals(vector);
    let moved = false;

    this.prepareTiles();

    traversals.x.forEach(function (x)
    {
        traversals.y.forEach(function (y)
        {
            cell = { x: x, y: y };
            tuile = self.grid.cellContent(cell);

            if (tuile)
            {
                const positions = self.findFarthestPosition(cell, vector);
                const next = self.grid.cellContent(positions.next);

                if (next && next.value === tuile.value && !next.fusionFrom)
                {
                    const fusion = new Tile(positions.next, tuile.value * 2);
                    fusion.fusionFrom = [tuile, next];

                    self.grid.insertTile(fusion);
                    self.grid.removeTile(tuile);
                    tuile.updatePosition(positions.next);
                    self.score += fusion.value;

                    if (fusion.value === 2048) self.won = true;
                }
                else
                    self.moveTile(tuile, positions.farthest);

                if (!self.positionsEqual(cell, tuile))
                    moved = true;

            }
        });
    });

    if (moved)
    {
        this.addRandomTile();

        if (!this.movesAvailable())
            this.over = true;

        this.actuate();
    }
};

GameManager.prototype.getVector = function (direction)
{
    const map =
        {
            0: {x: 0, y: -1}, // haut
            1: {x: 1, y: 0},  // droite
            2: {x: 0, y: 1},  // bas
            3: {x: -1, y: 0}   // gauche
        };

    return map[direction];
};

GameManager.prototype.buildTraversals = function (vector)
{
    const traversals = {x: [], y: []};

    for (let pos = 0; pos < this.size; pos++)
    {
        traversals.x.push(pos);
        traversals.y.push(pos);
    }

    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
};


GameManager.prototype.findFarthestPosition = function (cell, vector)
{
    let previous;

    do {
        previous = cell;
        cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) &&
    this.grid.cellAvailable(cell));

    return {
        farthest: previous,
        next: cell
    };
};

GameManager.prototype.movesAvailable = function ()
{
    return this.grid.cellsAvailable() || this.tuileMatchesAvailable();
};

GameManager.prototype.tuileMatchesAvailable = function ()
{
    const self = this;

    let tuile;

    for (let x = 0; x < this.size; x++)
    {
        for (let y = 0; y < this.size; y++)
        {
            tuile = this.grid.cellContent({ x: x, y: y });

            if (tuile)
            {
                for (let direction = 0; direction < 4; direction++)
                {
                    const vector = self.getVector(direction);
                    const cell = {x: x + vector.x, y: y + vector.y};

                    const other = self.grid.cellContent(cell);

                    if (other && other.value === tuile.value)
                        return true;
                }
            }
        }
    }

    return false;
};

GameManager.prototype.positionsEqual = function (first, second)
{
    return first.x === second.x && first.y === second.y;
};