(function () {
    HTMLTextAreaElement.prototype.getCaretPosition = function () { //return the caret position of the textarea
        return this.selectionStart;
    };
    HTMLTextAreaElement.prototype.setCaretPosition = function (position) { //change the caret position of the textarea
        this.selectionStart = position;
        this.selectionEnd = position;
        this.focus();
    };
    HTMLTextAreaElement.prototype.hasSelection = function () { //if the textarea has selection then return true
        if (this.selectionStart == this.selectionEnd) {
            return false;
        } else {
            return true;
        }
    };
    HTMLTextAreaElement.prototype.getSelectedText = function () { //return the selection text
        return this.value.substring(this.selectionStart, this.selectionEnd);
    };
    HTMLTextAreaElement.prototype.setSelection = function (start, end) { //change the selection area of the textarea
        this.selectionStart = start;
        this.selectionEnd = end;
        this.focus();
    };

    let username;
    let password;
    let defaultText = `
##
# This is a skeleton for your new site configuration, Enter 'Name' above and start.
#
# Virtual Host configuration for example.com
#
# This file will be stored inside sites-enabled/ folder
#
server {
	listen 80;
	listen [::]:80;

	server_name example.com;

	root /var/www/example.com;
	index index.html;

	location / {
		try_files $uri $uri/ =404;
	}
}
    `;
    $('#loginSubmit').on('click', function (event) {
        username = $('#username').val();
        password = $('#password').val();
        $.ajax({
            method: 'post',
            url: '/login',
            headers: {
                'content-type': 'application/json'
            },
            data: JSON.stringify({
                username: username,
                password: password
            }),
            success: function (res) {
                $('#loginBlock').remove();
                $('body').removeClass('justify-content-center');
                $('.d-none').removeClass('d-none');
                getSites();
            },
            error: function (err) {
                $('#loginMessage')
                    .removeClass('text-success')
                    .addClass('text-danger')
                    .text(err.responseJSON.message);
            }
        });
    });

    function getSites() {
        $.ajax({
            method: 'get',
            url: '/sites',
            headers: {
                'content-type': 'application/json',
                'username': username,
                'password': password
            },
            success: function (res) {
                var listItem = '';
                for (var site of res) {
                    listItem += `<a href="#" class="list-group-item list-group-item-action" data-site="${site}">${site}</a>`;
                }
                $('#sitesList').html(listItem);
                $('#newConfig').trigger('click');
            },
            error: function (err) {
                $('#message')
                    .removeClass('text-success')
                    .addClass('text-danger')
                    .text(err.responseJSON.message);
            }
        });
    }

    $('#sitesList').on('click', function (event) {
        $('.list-group-item').removeClass('active');
        $(event.target).addClass('active');
        getSiteContent(event.target.dataset.site);
        $('#configName').val(event.target.dataset.site).prop('disabled', true);
    });

    $('#newConfig').on('click', function (event) {
        $('.list-group-item').removeClass('active');
        $('#configName').val(event.target.dataset.site).prop('disabled', false);
        $('#configData').val(defaultText);
        $('#subHeading').addClass('d-flex');
        $('#message')
            .removeClass('text-success')
            .removeClass('text-danger')
            .text('');
    });

    $('#configData').on('keydown', function (event) {
        var textarea = $('#configData')[0];
        if (event.keyCode == 9) { //tab was pressed
            var newCaretPosition;
            newCaretPosition = textarea.getCaretPosition() + "    ".length;
            textarea.value = textarea.value.substring(0, textarea.getCaretPosition()) + "    " + textarea.value.substring(textarea.getCaretPosition(), textarea.value.length);
            textarea.setCaretPosition(newCaretPosition);
            return false;
        }
        if (event.keyCode == 8) { //backspace
            if (textarea.value.substring(textarea.getCaretPosition() - 4, textarea.getCaretPosition()) == "    ") { //it's a tab space
                var newCaretPosition;
                newCaretPosition = textarea.getCaretPosition() - 3;
                textarea.value = textarea.value.substring(0, textarea.getCaretPosition() - 3) + textarea.value.substring(textarea.getCaretPosition(), textarea.value.length);
                textarea.setCaretPosition(newCaretPosition);
            }
        }
        if (event.keyCode == 37) { //left arrow
            var newCaretPosition;
            if (textarea.value.substring(textarea.getCaretPosition() - 4, textarea.getCaretPosition()) == "    ") { //it's a tab space
                newCaretPosition = textarea.getCaretPosition() - 3;
                textarea.setCaretPosition(newCaretPosition);
            }
        }
        if (event.keyCode == 39) { //right arrow
            var newCaretPosition;
            if (textarea.value.substring(textarea.getCaretPosition() + 4, textarea.getCaretPosition()) == "    ") { //it's a tab space
                newCaretPosition = textarea.getCaretPosition() + 3;
                textarea.setCaretPosition(newCaretPosition);
            }
        }
    });

    $('#reloadNginx').on('click', function (event) {
        $.ajax({
            method: 'put',
            url: '/restart',
            headers: {
                'content-type': 'application/json',
                'username': username,
                'password': password
            },
            success: function (res) {
                $('#message')
                    .removeClass('text-danger')
                    .addClass('text-success')
                    .text(res.message);
            },
            error: function (err) {
                $('#message')
                    .removeClass('text-success')
                    .addClass('text-danger')
                    .text(err.responseJSON.message);
            }
        });
    });

    $('#saveConfig').on('click', function (event) {
        let content = $('#configData').val();
        let site = $('#configName').val();
        let method = $('#configName').prop('disabled') ? 'PUT' : 'POST';
        let url = $('#configName').prop('disabled') ? '/sites/' + site : '/sites';
        $.ajax({
            method: method,
            url: url,
            headers: {
                'content-type': 'application/json',
                'username': username,
                'password': password
            },
            data: JSON.stringify({
                content: content
            }),
            success: function (res) {
                $('#message')
                    .removeClass('text-danger')
                    .addClass('text-success')
                    .text(res.message);
            },
            error: function (err) {
                $('#message')
                    .removeClass('text-success')
                    .addClass('text-danger')
                    .text(err.responseJSON.message);
            }
        });
    });

    function getSiteContent(site) {
        $.ajax({
            method: 'get',
            url: '/sites/' + site,
            headers: {
                'content-type': 'application/json',
                'username': username,
                'password': password
            },
            success: function (res) {
                $('#configData').val(res.content);
                $('#subHeading').addClass('d-flex');
            },
            error: function (err) {
                $('#message')
                    .removeClass('text-success')
                    .addClass('text-danger')
                    .text(err.responseJSON.message);
            }
        });
    }
})();