document.addEventListener("DOMContentLoaded", Main, false);

function Main()
{
    console.log("Main 2048 Game");
    new GameManager(4, GestionToucheClavier, HTMLActuator, LocalStorageManager);
}
