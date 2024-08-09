document.getElementById('changePasswordForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const oldPassword = document.getElementById('old_password').value;
    const newPassword = document.getElementById('new_password').value;

    fetch('/change_password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ username, old_password: oldPassword, new_password: newPassword })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
