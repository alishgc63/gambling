document.addEventListener("DOMContentLoaded", function() {
    const boxes = document.querySelectorAll(".box");
    const resultText = document.querySelector("#result");
    let gameInProgress = false;

    boxes.forEach(box => {
        box.addEventListener("click", async function() {
            if (gameInProgress) {
                // Reset the previous round results smoothly
                resetGame();
            }

            gameInProgress = true;

            // Make the API call to check win/lose
            const response = await fetch('/check', { method: 'POST' });
            const data = await response.json();

            // Update the clicked box based on the outcome
            if (data.win) {
                box.style.backgroundColor = "green";
                resultText.textContent = "You win!";
            } else {
                box.style.backgroundColor = "red";
                resultText.textContent = "You lose!";
            }
        });
    });

    function resetGame() {
        // Clear the result text and reset all boxes
        resultText.textContent = "";
        boxes.forEach(box => {
            box.style.backgroundColor = "";
        });

        // Set gameInProgress to false to allow a new round to start
        gameInProgress = false;
    }
});
