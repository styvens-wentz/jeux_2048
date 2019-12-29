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
        ArrowUp: 0, // Up
        ArrowRight: 1, // Right
        ArrowDown: 2, // Down
        ArrowLeft: 3, // Left
        z: 0, // W
        d: 1, // D
        s: 2, // S
        q: 3  // A
    };

    document.addEventListener("keydown", function (event)
    {
        const modifiers = event.altKey || event.ctrlKey || event.metaKey ||
            event.shiftKey;
        const mapped = map[event.key];

        if (!modifiers)
        {
            if (mapped !== undefined)
            {
                event.preventDefault();
                self.emit("move", mapped);
            }
        }

        if (!modifiers && event.which === 82)
            self.rejouer.call(self, event);

    });

    this.bindButtonPress(".reessayer", this.rejouer);
    this.bindButtonPress(".nouvelle-partie", this.rejouer);
    this.bindButtonPress(".continuer", this.continuer);

    let touchStartClientX, touchStartClientY;
    const ensembleJeu = document.getElementsByClassName("ensemble-jeu")[0];

    ensembleJeu.addEventListener(this.eventTouchstart, function (event)
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

    ensembleJeu.addEventListener(this.eventTouchmove, function (event)
    {
        event.preventDefault();
    });

    ensembleJeu.addEventListener(this.eventTouchend, function (event)
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

GestionToucheClavier.prototype.rejouer = function (event)
{
    event.preventDefault();
    this.emit("rejouer");
};

GestionToucheClavier.prototype.continuer = function (event)
{
    event.preventDefault();
    this.emit("continuer");
};

GestionToucheClavier.prototype.bindButtonPress = function (selector, fn)
{
    const button = document.querySelector(selector);
    button.addEventListener("click", fn.bind(this));
    button.addEventListener(this.eventTouchend, fn.bind(this));
};



function HTMLActionneur() {
    this.tuileEnsemble    = document.querySelector(".ensemble-tuiles");
    this.scoreActuelle   = document.querySelector(".score-actuelle");
    this.scoreMeilleur    = document.querySelector(".meilleur-score");
    this.messageJeu = document.querySelector(".message-jeu");

    this.score = 0;
}

HTMLActionneur.prototype.actuate = function (grille, metadata)
{
    const self = this;

    window.requestAnimationFrame(function ()
    {
        self.rafraichirEnsemble(self.tuileEnsemble);

        grille.cells.forEach(function (column)
        {
            column.forEach(function (cell)
            {
                if (cell)
                    self.ajoutTuile(cell);
            });
        });

        self.majScore(metadata.score);
        self.majMeilleurScore(metadata.meilleurScore);

        if (metadata.terminer)
        {
            if (metadata.perdu)
                self.message(false);
            else if (metadata.gagner)
                self.message(true);
        }

    });
};

HTMLActionneur.prototype.continuerJeu = function ()
{
    this.rafraichirMessage();
};

HTMLActionneur.prototype.rafraichirEnsemble = function (container)
{
    while (container.firstChild)
    {
        container.removeChild(container.firstChild);
    }
};

HTMLActionneur.prototype.ajoutTuile = function (tuile)
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
            self.ajoutTuile(fusion);
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

HTMLActionneur.prototype.applyClasses = function (element, classes)
{
    element.setAttribute("class", classes.join(" "));
};

HTMLActionneur.prototype.normalizePosition = function (position)
{
    return { x: position.x + 1, y: position.y + 1 };
};

HTMLActionneur.prototype.positionClass = function (position)
{
    position = this.normalizePosition(position);
    return "tuile-position-" + position.x + "-" + position.y;
};

HTMLActionneur.prototype.majScore = function (score)
{
    this.rafraichirEnsemble(this.scoreActuelle);

    const difference = score - this.score;
    this.score = score;

    this.scoreActuelle.textContent = this.score;

    if (difference > 0)
    {
        const addition = document.createElement("div");
        addition.classList.add("score-addition");
        addition.textContent = "+" + difference;

        this.scoreActuelle.appendChild(addition);
    }
};

HTMLActionneur.prototype.majMeilleurScore = function (meilleurScore)
{
    this.scoreMeilleur.textContent = meilleurScore;
};

HTMLActionneur.prototype.message = function (gagner)
{
    const type = gagner ? "partie-gagner" : "partie-perdu";

    const message = gagner ? "Vous avez gagné !" : "Vous avez perdu !";

    this.messageJeu.classList.add(type);
    this.messageJeu.getElementsByTagName("p")[0].textContent = message;
};

HTMLActionneur.prototype.rafraichirMessage = function ()
{
    this.messageJeu.classList.remove("partie-gagner");
    this.messageJeu.classList.remove("partie-perdu");
};

function Grille(size, previousState)
{
    this.size = size;
    this.cells = previousState ? this.fromState(previousState) : this.empty();
}

Grille.prototype.empty = function ()
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

Grille.prototype.fromState = function (state)
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

Grille.prototype.randomAvailableCell = function ()
{
    const cells = this.availableCells();

    if (cells.length)
        return cells[Math.floor(Math.random() * cells.length)];
};

Grille.prototype.availableCells = function ()
{
    const cells = [];

    this.eachCell(function (x, y, tuile) {
        if (!tuile)
            cells.push({ x: x, y: y });
    });
    return cells;
};

Grille.prototype.eachCell = function (callback)
{
    for (let x = 0; x < this.size; x++)
    {
        for (let y = 0; y < this.size; y++)
        {
            callback(x, y, this.cells[x][y]);
        }
    }
};

Grille.prototype.cellsAvailable = function ()
{
    return !!this.availableCells().length;
};

Grille.prototype.cellAvailable = function (cell) {
    return !this.cellOccupied(cell);
};

Grille.prototype.cellOccupied = function (cell)
{
    return !!this.cellContent(cell);
};

Grille.prototype.cellContent = function (cell)
{
    if (this.withinBounds(cell))
        return this.cells[cell.x][cell.y];
    else
        return null;
};

Grille.prototype.insertTile = function (tuile)
{
    this.cells[tuile.x][tuile.y] = tuile;
};

Grille.prototype.removeTile = function (tuile)
{
    this.cells[tuile.x][tuile.y] = null;
};

Grille.prototype.withinBounds = function (position)
{
    return position.x >= 0 && position.x < this.size &&
        position.y >= 0 && position.y < this.size;
};

Grille.prototype.serialize = function ()
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
    this.meilleurScoreKey     = "meilleurScore";
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
    return this.storage.getItem(this.meilleurScoreKey) || 0;
};

LocalStorageManager.prototype.setBestScore = function (score) {
    this.storage.setItem(this.meilleurScoreKey, score);
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
    this.inputManager.on("rejouer", this.rejouer.bind(this));
    this.inputManager.on("continuer", this.continuer.bind(this));

    this.setup();
}

GameManager.prototype.rejouer = function () {
    this.storageManager.clearGameState();
    this.actuator.continuerJeu();
    this.setup();
};

GameManager.prototype.continuer = function ()
{
    this.continuer = true;
    this.actuator.continuerJeu();
};

GameManager.prototype.isGameTerminated = function ()
{
    return this.perdu || (this.gagner && !this.continuer);
};

GameManager.prototype.setup = function ()
{
    const previousState = this.storageManager.getGameState();

    if (previousState)
    {
        this.grid        = new Grille(previousState.grid.size, previousState.grid.cells);
        this.score       = previousState.score;
        this.perdu        = previousState.perdu;
        this.gagner         = previousState.gagner;
        this.continuer = previousState.continuer;
    }
    else
    {
        this.grid        = new Grille(this.size);
        this.score       = 0;
        this.perdu        = false;
        this.gagner         = false;
        this.continuer = false;

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

    if (this.perdu)
        this.storageManager.clearGameState();
    else
        this.storageManager.setGameState(this.serialize());

    this.actuator.actuate(this.grid,
        {
            score:      this.score,
            perdu:       this.perdu,
            gagner:        this.gagner,
            meilleurScore:  this.storageManager.getBestScore(),
            terminer: this.isGameTerminated()
        });
};

GameManager.prototype.serialize = function ()
{
    return {
        grid:        this.grid.serialize(),
        score:       this.score,
        perdu:        this.perdu,
        gagner:         this.gagner,
        continuer: this.continuer
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

                    if (fusion.value === 2048) self.gagner = true;
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
            this.perdu = true;

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