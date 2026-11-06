/* Slackify: Entry Point, Bootstrapping & Routing Actions */
window.Slackify = window.Slackify || {};

(function(S){
  // Check old.reddit host requirement
  if(!window.location.hostname.startsWith('old.')){
    if(confirm('Slackify requires old.reddit.com. Redirect now?')){
      window.location.href = 'https://old.reddit.com' + window.location.pathname;
    }
    return;
  }

  /* Interactive Actions */
  S.switchSub = function(sub){
    S.activeSub = sub;
    S.currentAfter = null;
    window.history.pushState({}, '', `/r/${sub}/`);
    S.renderApp();
    S.fetchFeed(S.activeSub, S.currentSort);
  };

  S.changeSort = function(sortVal){
    S.currentSort = sortVal;
    S.currentAfter = null;
    let url = `/r/${S.activeSub}/`;
    if(sortVal === 'new'){
      url += 'new/';
    } else if(sortVal.startsWith('top-')){
      const timeframe = sortVal.split('-')[1];
      url += `top/?sort=top&t=${timeframe}`;
    }
    window.history.pushState({}, '', url);
    S.fetchFeed(S.activeSub, S.currentSort);
  };

  S.refreshFeed = function(){
    const con = document.getElementById('slack-feed');
    if(con){
      con.innerHTML = '<div style="color:#616061;font-size:14px;padding:12px;">Refreshing channel updates...</div>';
    }
    S.currentAfter = null;
    S.fetchFeed(S.activeSub, S.currentSort);
  };

  S.promptAddSub = function(){
    const n = prompt('Enter channel name:');
    if(n){
      const c = n.replace(/^r\//, '').replace(/^#/, '').trim().toLowerCase();
      if(c){
        if(!S.subreddits.includes(c)) S.subreddits.push(c);
        S.switchSub(c);
      }
    }
  };

  /* Initialize Application */
  S.init = function(){
    // Scrape initial HTML payload that Reddit already rendered
    const initialData = S.extractPostsFromDoc(document);
    S.currentAfter = initialData.after;

    // Render App Shell
    S.renderApp();

    // Render scraped items immediately without a network roundtrip
    if(initialData.posts && initialData.posts.length > 0){
      S.renderFeedItems(initialData.posts, false);
    } else {
      S.fetchFeed(S.activeSub, S.currentSort);
    }
  };

  // Launch!
  S.init();
})(window.Slackify);
