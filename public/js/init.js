(function () {
    $('#setupSubmit').on('click', function (event) {
        const username = $('#username').val();
        const password = $('#password').val();
        const cpassword = $('#cpassword').val();
        $.ajax({
            method: 'post',
            url: '/setup',
            headers: {
                'content-type': 'application/json'
            },
            data: JSON.stringify({
                username: username,
                password: password,
                cpassword: cpassword
            }),
            success: function (res) {
                $('#message')
                    .removeClass('text-danger')
                    .addClass('text-success')
                    .text(res.message);
                location.reload();
            },
            error: function (err) {
                $('#message')
                    .removeClass('text-success')
                    .addClass('text-danger')
                    .text(err.responseJSON.message);
            }
        });
    });
})();