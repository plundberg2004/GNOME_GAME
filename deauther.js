function init(){
    (async () => {
        const response = await chrome.runtime.sendMessage({req: "deauther"});
        if (response.doit === "true"){
            force_logout();
        }
      })();
}

function force_logout() {
    let url = "https://accounts.google.com/logout?&continue="+encodeURIComponent(window.location);
    window.location = url;
}

setTimeout(init, 100);