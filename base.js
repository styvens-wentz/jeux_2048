$('.continuer, .nouvelle-partie').click(function () {
    const ensemble_jeu = $('.ensemble-jeu');
    const height = ensemble_jeu.css('width');

    ensemble_jeu.css({
        height: height,
        background: 'rgba(0, 0, 33, 0.76)'
    });
    $('.reessayer').css('display', 'initial');
    $('.message-jeu p').css('display', 'initial');
    $('.continuer').css({
        display: 'none',
        position: 'initial',
        left: 'initial'
    });
    $('.nouvelle-partie').css({
        position: 'initial',
        top: 'initial',
        left: 'initial',
    });
    $('.ensemble-grille').css('display', 'initial');
    $('.ensemble-tuiles').css('display', 'initial');
    $('.ensemble-jeu .message-jeu').css({
        animation: 'fade-in 400ms ease 800ms',
        display: 'none'
    });
    $('.explication-jeu').css('display', 'none');
});






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

GestionToucheClavier.prototype.emettre = function (event, data)
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
        ArrowUp: 0,
        ArrowRight: 1,
        ArrowDown: 2,
        ArrowLeft: 3,
        z: 0,
        d: 1,
        s: 2,
        q: 3,
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
                self.emettre("move", mapped);
            }
        }

        if (!modifiers && event.key === 'r')
            self.rejouer.call(self, event);
    });

    this.bindButtonPress(".reessayer", this.rejouer);
    this.bindButtonPress(".nouvelle-partie", this.rejouer);
    this.bindButtonPress(".continuer", this.continuer);

    let touchStartClientX, touchStartClientY;
    const ensembleJeu = document.getElementsByClassName("ensemble-jeu")[0];

    ensembleJeu.addEventListener(this.eventTouchstart, function (event)
    {
        if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
            event.targetTouches > 1)
            return;

        if (window.navigator.msPointerEnabled)
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
        if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
            event.targetTouches > 0)
            return;


        let toucheClientX, toucheClientY;

        if (window.navigator.msPointerEnabled)
        {
            toucheClientX = event.pageX;
            toucheClientY = event.pageY;
        }
        else
        {
            toucheClientX = event.changedTouches[0].clientX;
            toucheClientY = event.changedTouches[0].clientY;
        }

        const directionX = toucheClientX - touchStartClientX;
        const absDx = Math.abs(directionX);

        const directionY = toucheClientY - touchStartClientY;
        const absDy = Math.abs(directionY);

        if (Math.max(absDx, absDy) > 10)
        {
            self.emettre("move", absDx > absDy ? (directionX > 0 ? 1 : 3) : (directionY > 0 ? 2 : 0));
        }
    });
};

GestionToucheClavier.prototype.rejouer = function (event)
{
    event.preventDefault();
    this.emettre("rejouer");
};

GestionToucheClavier.prototype.continuer = function (event)
{
    event.preventDefault();
    this.emettre("continuer");
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

HTMLActionneur.prototype.actionner = function (grille, metadata)
{
    const self = this;

    window.requestAnimationFrame(function ()
    {

        self.rafraichirEnsemble(self.tuileEnsemble);

        grille.cellules.forEach(function (column)
        {
            column.forEach(function (cellule)
            {
                if (cellule)
                    self.ajoutTuile(cellule);
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

    const toutTuile = document.createElement("div");
    const inter = document.createElement("div");
    const position = tuile.precedentePosition || {x: tuile.x, y: tuile.y};
    const positionClass = this.positionClass(position);

    const classes = ["tuile", "tuile-" + tuile.value, positionClass];

    if (tuile.value > 2048) classes.push("tuile-super");

    this.applicationClasses(toutTuile, classes);

    inter.classList.add("tuile-inter");
    inter.textContent = tuile.value;

    if (tuile.precedentePosition)
    {
        window.requestAnimationFrame(function ()
        {
            classes[2] = self.positionClass({ x: tuile.x, y: tuile.y });
            self.applicationClasses(toutTuile, classes);
        });
    }
    else if (tuile.fusionFrom)
    {
        classes.push("tuile-fusion");
        this.applicationClasses(toutTuile, classes);

        tuile.fusionFrom.forEach(function (fusion)
        {
            self.ajoutTuile(fusion);
        });
    }
    else
    {
        classes.push("tuile-nouveau");
        this.applicationClasses(toutTuile, classes);
    }

    toutTuile.appendChild(inter);

    this.tuileEnsemble.appendChild(toutTuile);
};

HTMLActionneur.prototype.applicationClasses = function (element, classes)
{
    element.setAttribute("class", classes.join(" "));
};

HTMLActionneur.prototype.normalePosition = function (position)
{
    return { x: position.x + 1, y: position.y + 1 };
};

HTMLActionneur.prototype.positionClass = function (position)
{
    position = this.normalePosition(position);
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

HTMLActionneur.prototype.message = function (fini)
{
    const type = fini ? "partie-gagner" : "partie-perdu";

    const message = fini ? "Vous avez gagné !" : "Vous avez perdu !";

    this.messageJeu.classList.add(type);
    this.messageJeu.getElementsByTagName("p")[0].textContent = message;
};

HTMLActionneur.prototype.rafraichirMessage = function ()
{
    this.messageJeu.classList.remove("partie-gagner");
    this.messageJeu.classList.remove("partie-perdu");
};

function Grille(taille, precedent)
{
    this.taille = taille;
    this.cellules = precedent ? this.fromState(precedent) : this.empty();
}

Grille.prototype.empty = function ()
{
    const cellules = [];

    for (let x = 0; x < this.taille; x++)
    {
        cellules[x] = [];
        const rangee = cellules[x];


        for (let y = 0; y < this.taille; y++)
        {
            rangee.push(null);
        }
    }

    return cellules;
};

Grille.prototype.fromState = function (etat)
{
    const cellules = [];

    for (let x = 0; x < this.taille; x++)
    {
        cellules[x] = [];
        const rangee = cellules[x];


        for (let y = 0; y < this.taille; y++)
        {
            const tuile = etat[x][y];
            rangee.push(tuile ? new Tuile(tuile.position, tuile.value) : null);
        }
    }

    return cellules;
};

Grille.prototype.cellulesDispoAleat = function ()
{
    const cellules = this.cellulesDispo();

    if (cellules.length)
        return cellules[Math.floor(Math.random() * cellules.length)];
};

Grille.prototype.cellulesDispo = function ()
{
    const cellules = [];

    this.chaqueCellule(function (x, y, tuile) {
        if (!tuile)
            cellules.push({ x: x, y: y });
    });
    return cellules;
};

Grille.prototype.chaqueCellule = function (callback)
{
    for (let x = 0; x < this.taille; x++)
    {
        for (let y = 0; y < this.taille; y++)
        {
            callback(x, y, this.cellules[x][y]);
        }
    }
};

Grille.prototype.cellulesDisponible = function ()
{
    return !!this.cellulesDispo().length;
};

Grille.prototype.celluleDispo = function (cellule) {
    return !this.cellulesOccupee(cellule);
};

Grille.prototype.cellulesOccupee = function (cellule)
{
    return !!this.contenuCellule(cellule);
};

Grille.prototype.contenuCellule = function (cellule)
{
    if (this.limitation(cellule))
        return this.cellules[cellule.x][cellule.y];
    else
        return null;
};

Grille.prototype.insererTuile = function (tuile)
{
    this.cellules[tuile.x][tuile.y] = tuile;
};

Grille.prototype.effacerTuile = function (tuile)
{
    this.cellules[tuile.x][tuile.y] = null;
};

Grille.prototype.limitation = function (position)
{
    return position.x >= 0 && position.x < this.taille &&
        position.y >= 0 && position.y < this.taille;
};

Grille.prototype.serialiser = function ()
{
    const etatCellule = [];

    for (let x = 0; x < this.taille; x++)
    {
        etatCellule[x] = [];
        const rangee = etatCellule[x];

        for (let y = 0; y < this.taille; y++)
        {
            rangee.push(this.cellules[x][y] ? this.cellules[x][y].serialiser() : null);
        }
    }

    return {
        taille: this.taille,
        cellules: etatCellule
    };
};

function Tuile(position, value)
{
    this.x                = position.x;
    this.y                = position.y;
    this.value            = value || 2;

    this.precedentePosition = null;
    this.fusionFrom       = null;
}

Tuile.prototype.sauvePosition = function ()
{
    this.precedentePosition = { x: this.x, y: this.y };
};

Tuile.prototype.majPosition = function (position)
{
    this.x = position.x;
    this.y = position.y;
};


Tuile.prototype.serialiser = function ()
{
    return {
        position: {
            x: this.x,
            y: this.y
        },
        value: this.value
    };
};

window.nonStock = {
    _data: {}
};

function GestionStockageLocal() {
    this.meilleurScoreCle     = "meilleurScore";
    this.etatJeu     = "etatJeu";

    const supporter = this.stockageLocalSupporter();
    this.stockage = supporter ? window.localStorage : window.nonStock;
}

GestionStockageLocal.prototype.stockageLocalSupporter = function () {
    const testKey = "test";
    const stockage = window.localStorage;

    try {
        stockage.setItem(testKey, "1");
        stockage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
};

GestionStockageLocal.prototype.getMeilleurScore = function () {
    return this.stockage.getItem(this.meilleurScoreCle) || 0;
};

GestionStockageLocal.prototype.setMeilleurScore = function (score) {
    this.stockage.setItem(this.meilleurScoreCle, score);
};

GestionStockageLocal.prototype.getEtatJeu = function () {
    const etatJSON = this.stockage.getItem(this.etatJeu);
    return etatJSON ? JSON.parse(etatJSON) : null;
};

GestionStockageLocal.prototype.setEtatJeu = function (etatJeu) {
    this.stockage.setItem(this.etatJeu, JSON.stringify(etatJeu));
};

GestionStockageLocal.prototype.effacerEtatJeu = function () {
    this.stockage.removeItem(this.etatJeu);
};

function GestionJeu(taille, GestionEntree, Actionneur, GestionStockage)
{
    this.taille           = taille; 
    this.gestionEntree   = new GestionEntree;
    this.gestionStockage = new GestionStockage;
    this.actionneur       = new Actionneur;

    this.tuilesDebut     = 2;

    this.gestionEntree.on("move", this.move.bind(this));
    this.gestionEntree.on("rejouer", this.rejouer.bind(this));
    this.gestionEntree.on("continuer", this.continuer.bind(this));

    this.setup();
}

GestionJeu.prototype.rejouer = function () {
    this.gestionStockage.effacerEtatJeu();
    this.actionneur.continuerJeu();
    this.setup();
};

GestionJeu.prototype.continuer = function ()
{
    this.continuer = true;
    this.actionneur.continuerJeu();
};

GestionJeu.prototype.jeuFini = function ()
{
    return this.perdu || (this.gagner && !this.continuer);
};

GestionJeu.prototype.setup = function ()
{
    const precedent = this.gestionStockage.getEtatJeu();

    if (precedent)
    {
        this.grille         = new Grille(precedent.grille.taille, precedent.grille.cellules);
        this.score          = precedent.score;
        this.perdu          = precedent.perdu;
        this.gagner         = precedent.gagner;
        this.continuer      = precedent.continuer;
    }
    else
    {
        this.grille        = new Grille(this.taille);
        this.score         = 0;
        this.perdu         = false;
        this.gagner        = false;
        this.continuer     = false;

        this.ajoutTuilesDebut();
    }

    this.actionner();
};

GestionJeu.prototype.ajoutTuilesDebut = function ()
{
    for (let i = 0; i < this.tuilesDebut; i++)
    {
        this.ajoutTuileAleat();
    }
};

GestionJeu.prototype.ajoutTuileAleat = function ()
{
    if (this.grille.cellulesDisponible())
    {
        const value = Math.random() < 0.9 ? 2 : 4;
        const tuile = new Tuile(this.grille.cellulesDispoAleat(), value);

        this.grille.insererTuile(tuile);
    }
};

GestionJeu.prototype.actionner = function ()
{
    if (this.gestionStockage.getMeilleurScore() < this.score)
        this.gestionStockage.setMeilleurScore(this.score);

    if (this.perdu)
        this.gestionStockage.effacerEtatJeu();
    else
        this.gestionStockage.setEtatJeu(this.serialiser());

    this.actionneur.actionner(this.grille,
        {
            score:      this.score,
            perdu:       this.perdu,
            gagner:        this.gagner,
            meilleurScore:  this.gestionStockage.getMeilleurScore(),
            terminer: this.jeuFini()
        });
};

GestionJeu.prototype.serialiser = function ()
{
    return {
        grille:        this.grille.serialiser(),
        score:       this.score,
        perdu:        this.perdu,
        gagner:         this.gagner,
        continuer: this.continuer
    };
};

GestionJeu.prototype.prepareTuiles = function ()
{
    this.grille.chaqueCellule(function (x, y, tuile)
    {
        if (tuile)
        {
            tuile.fusionFrom = null;
            tuile.sauvePosition();
        }
    });
};

GestionJeu.prototype.deplacerTuile = function (tuile, cellule)
{
    this.grille.cellules[tuile.x][tuile.y] = null;
    this.grille.cellules[cellule.x][cellule.y] = tuile;
    tuile.majPosition(cellule);
};

GestionJeu.prototype.move = function (direction)
{
    const self = this;

    if (this.jeuFini())
        return;

    let cellule, tuile;

    const vecteur = this.getVecteur(direction);
    const traversees = this.construireTraversees(vecteur);
    let deplacement = false;

    this.prepareTuiles();

    traversees.x.forEach(function (x)
    {
        traversees.y.forEach(function (y)
        {
            cellule = { x: x, y: y };
            tuile = self.grille.contenuCellule(cellule);

            if (tuile)
            {
                const positions = self.trouverPositionEloigne(cellule, vecteur);
                const suivant = self.grille.contenuCellule(positions.suivant);

                if (suivant && suivant.value === tuile.value && !suivant.fusionFrom)
                {
                    const fusion = new Tuile(positions.suivant, tuile.value * 2);
                    fusion.fusionFrom = [tuile, suivant];

                    self.grille.insererTuile(fusion);
                    self.grille.effacerTuile(tuile);
                    tuile.majPosition(positions.suivant);
                    self.score += fusion.value;

                    if (fusion.value === 2048) self.gagner = true;
                }
                else
                    self.deplacerTuile(tuile, positions.eloigne);

                if (!self.positionsEgales(cellule, tuile))
                    deplacement = true;

            }
        });
    });

    if (deplacement)
    {
        this.ajoutTuileAleat();

        if (!this.deplacementDispo())
            this.perdu = true;

        this.actionner();
    }
};

GestionJeu.prototype.getVecteur = function (direction)
{
    const map =
        {
            0: {x: 0, y: -1},
            1: {x: 1, y: 0},
            2: {x: 0, y: 1},
            3: {x: -1, y: 0}
        };

    return map[direction];
};

GestionJeu.prototype.construireTraversees = function (vecteur)
{
    const traversees = {x: [], y: []};

    for (let pos = 0; pos < this.taille; pos++)
    {
        traversees.x.push(pos);
        traversees.y.push(pos);
    }

    if (vecteur.x === 1) traversees.x = traversees.x.reverse();
    if (vecteur.y === 1) traversees.y = traversees.y.reverse();

    return traversees;
};


GestionJeu.prototype.trouverPositionEloigne = function (cellule, vecteur)
{
    let preced;

    do {
        preced = cellule;
        cellule     = { x: preced.x + vecteur.x, y: preced.y + vecteur.y };
    } while (this.grille.limitation(cellule) &&
    this.grille.celluleDispo(cellule));

    return {
        eloigne: preced,
        suivant: cellule
    };
};

GestionJeu.prototype.deplacementDispo = function ()
{
    return this.grille.cellulesDisponible() || this.tuileAssortieDispo();
};

GestionJeu.prototype.tuileAssortieDispo = function ()
{
    const self = this;

    let tuile;

    for (let x = 0; x < this.taille; x++)
    {
        for (let y = 0; y < this.taille; y++)
        {
            tuile = this.grille.contenuCellule({ x: x, y: y });

            if (tuile)
            {
                for (let direction = 0; direction < 4; direction++)
                {
                    const vecteur = self.getVecteur(direction);
                    const cellule = {x: x + vecteur.x, y: y + vecteur.y};

                    const autre = self.grille.contenuCellule(cellule);

                    if (autre && autre.value === tuile.value)
                        return true;
                }
            }
        }
    }
    return false;
};

GestionJeu.prototype.positionsEgales = function (premier, deuxieme)
{
    return premier.x === deuxieme.x && premier.y === deuxieme.y;
};