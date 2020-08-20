const badge = document.getElementById('thm_badge');
const navbar = document.getElementById('navbar-top');

navbar.appendChild(badge);
fadeIn(badge)

function fadeIn(element) {
    let op = 0.1;  
    let timer = setInterval(function () {
        if (op >= 1) {
            clearInterval(timer);
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * 0.1;
    }, 10);
}
