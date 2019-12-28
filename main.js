document.addEventListener("DOMContentLoaded", Main, false); // appel au chargement de la page

function Main()
{
    console.log("Main 2048 Game");
    new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
}
