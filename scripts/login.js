document.querySelector('form').addEventListener("submit", function (e) {
    e.preventDefault()
    const playerName = document.getElementById('playerName').value;
    if (validatePlayerName(playerName)) {
        localStorage.setItem('playerName', playerName);
        window.location.href = './pages/game.html';
    } else {
        alert('Invalid name. Please use 3-20 characters.');
    }
})

document.getElementById('playerName').addEventListener('focus', function () {
    console.log("focus");
    this.style.border = '1px solid #ff49ab';
});

document.getElementById('playerName').addEventListener('blur', function () {
    this.style.border = 'none';
});

// פונקציה לאימות שם השחקן
function validatePlayerName(name) {
    const nameRegex = /^[a-zA-Zא-ת!]{3,20}$/;
    return nameRegex.test(name);
}