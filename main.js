document.addEventListener("DOMContentLoaded", Main, false);

function Main()
{
    new GestionJeu(4, GestionToucheClavier, HTMLActionneur, GestionStockageLocal);
}
