// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });


//example of using a message handler from the inject scripts
// chrome.extension.onMessage.addListener(
//   function(request, sender, sendResponse) {
//   	chrome.pageAction.show(sender.tab.id);
//     sendResponse();
//   });
chrome.runtime.onMessage.addListener(function actionDispatcher(request, sender, sendResponse) {
  if (request.action === 'track:filter') {
    trackListFilter();
  }

  sendResponse(0);
});

function trackListFilter() {
  ga('send', 'event', 'list-filter', 'filter');
}

function usage() {
  localStorage.setItem('trello-list-filter:lastUsed', new Date());
}

function initializeGA() {
  // Standard Google Universal Analytics code

  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga'); // Note: https protocol here
  
  ga('create', 'UA-7346959-19', 'auto');
  ga('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
  ga('require', 'displayfeatures');
}

initializeGA();