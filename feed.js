/* Slackify: Feed Scraper, Cards, Media & Feed Pagination */
window.Slackify = window.Slackify || {};

(function(S){
  S.currentAfter = null;
  S.expandoMap = {}; // Stores Reddit's official pre-built players

  /* Check NSFW categorization */
  S.checkNSFW = function(post){
    if(!post.over_18) return null;
    const txt = `${post.title} ${post.link_flair_text || ''} ${post.subreddit || ''}`.toLowerCase();
    const gK = ['gore', 'nsfl', 'death', 'dead', 'accident', 'blood', 'injury', 'wound', 'medicalgore', 'combatfootage'];
    return gK.some(k => txt.includes(k)) ? 'gore' : 'nudity';
  };

  /* Scrape items + native players directly from old Reddit HTML */
  S.extractPostsFromDoc = function(doc){
    const items = [];
    doc.querySelectorAll('#siteTable .thing').forEach(el => {
      if(el.classList.contains('promoted')) return;
      const titleEl = el.querySelector('a.title');
      if(!titleEl) return;
      const authorEl = el.querySelector('a.author');
      const commentsEl = el.querySelector('a.comments');
      const id = el.getAttribute('data-fullname') || el.getAttribute('data-id') || (el.id ? el.id.replace('thing_', '') : '');
      const rawComments = commentsEl ? commentsEl.innerText : '0';
      const commentCount = parseInt(rawComments.replace(/\D/g, ''), 10) || 0;
      
      const cleanId = id.replace(/^t3_/, '');
      const rawUrl = titleEl.getAttribute('href') || el.getAttribute('data-url') || '';
      
      // 1. Grab Reddit's official expando (this contains the real video/iframe!)
      const expandoBtn = el.querySelector('.expando-button');
      const expandoDiv = el.querySelector('.expando');
      let expandoHtml = '';
      if(expandoDiv && expandoDiv.innerHTML.trim()){
        expandoHtml = expandoDiv.innerHTML;
      } else if(el.getAttribute('data-cachedhtml')){
        expandoHtml = el.getAttribute('data-cachedhtml');
      }

      if(expandoHtml){
        S.expandoMap[cleanId] = expandoHtml;
      }

      items.push({
        id: cleanId,
        author: authorEl ? authorEl.innerText : '[unknown]',
        title: titleEl.innerText,
        url: rawUrl,
        num_comments: commentCount,
        over_18: el.classList.contains('over18'),
        hasExpando: !!(expandoBtn || expandoHtml),
        selftext: ''
      });
    });

    const nextBtn = doc.querySelector('.next-button a');
    let afterToken = null;
    if(nextBtn && nextBtn.href){
      const match = nextBtn.href.match(/[?&]after=([^&]+)/);
      if(match) afterToken = match[1];
    }

    return { posts: items, after: afterToken };
  };

  /* Render Feed Items with Slack Styling */
  S.renderFeedItems = function(posts, append = false){
    const con = document.getElementById('slack-feed');
    if(!con) return;

    const oldBtn = document.getElementById('slack-load-more-btn');
    if(oldBtn) oldBtn.remove();

    if(!append){
      con.innerHTML = '<div style="text-align:center;margin:12px 0 16px 0;"><span style="background:#FFFFFF;border:1px solid #E2E2E2;padding:4px 14px;border-radius:24px;font-size:12px;font-weight:700;color:#1D1C1D;box-shadow:0 1px 2px rgba(0,0,0,0.04);">Today ∨</span></div>';
    }

    if((!posts || posts.length === 0) && !append){
      con.innerHTML += '<div style="color:#616061;font-size:14px;padding:8px 0;">No updates posted in this channel today.</div>';
      return;
    }

    posts.forEach(p => {
      const u = S.getUser(p.author);
      const cd = document.createElement('div');
      cd.onclick = function(){ window.Slackify.openThread(p.id); };
      cd.style.cssText = 'display:flex;gap:12px;padding:8px 12px;border-radius:8px;cursor:pointer;margin-bottom:2px;';
      cd.onmouseover = function(){ this.style.background = '#F8F8F8'; };
      cd.onmouseout = function(){ this.style.background = 'transparent'; };

      let txt = p.selftext ? p.selftext.substring(0, 300) + (p.selftext.length > 300 ? '...' : '') : '';
      
      let mUrl = p.url || '', mType = null;
      if(mUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || mUrl.includes('i.redd.it') || (mUrl.includes('imgur.com') && !mUrl.match(/\.(mp4|gifv|webm)$/i))){
        mType = 'img';
      } else if(p.hasExpando || mUrl.match(/\.(mp4|webm|gifv)$/i) || mUrl.includes('v.redd.it') || mUrl.includes('redgifs.com') || mUrl.includes('gfycat.com') || mUrl.includes('youtube.com') || mUrl.includes('youtu.be') || mUrl.includes('streamable.com')){
        mType = 'vid';
      }

      const nType = S.checkNSFW(p);

      let cH = '<img referrerpolicy="no-referrer" src="' + u.avatar + '" style="width:36px;height:36px;border-radius:6px;background:#E2E2E2;flex-shrink:0;">';
      cH += '<div style="flex:1;min-width:0;">';
      
      /* Author + Timestamp */
      cH += '<div style="display:flex;align-items:center;gap:8px;"><span style="font-weight:900;font-size:15px;color:#1D1C1D;">' + u.name + '</span><span style="font-size:12px;color:#616061;">1:18 AM</span>';
      
      if(nType === 'gore') cH += '<span style="background:#EF4444;color:white;font-size:10px;font-weight:700;padding:1px 5px;border-radius:3px;">⚠️ GORE</span>';
      else if(nType === 'nudity') cH += '<span style="background:#E01E5A;color:white;font-size:10px;font-weight:700;padding:1px 5px;border-radius:3px;">🔞 18+ NSFW</span>';

      if(mType){
        let btnLabel = '[+] View Media';
        if(nType === 'gore') btnLabel = '[+] ⚠️ GORE (Reveal)';
        else if(nType === 'nudity') btnLabel = '[+] 🔞 NSFW (Reveal)';
        cH += '<span id="mbtn-' + p.id + '" data-def="' + btnLabel + '" onclick="window.Slackify.toggleMedia(\'' + p.id + '\', \'' + encodeURIComponent(mUrl) + '\', event)" style="font-size:11px;color:' + (nType === 'gore' ? '#DC2626' : (nType === 'nudity' ? '#E01E5A' : '#1264A3')) + ';font-weight:700;background:#F2F2F2;border:1px solid #E2E2E2;border-radius:4px;padding:1px 6px;cursor:pointer;margin-left:4px;">' + btnLabel + '</span>';
      }

      cH += '</div>';
      
      /* Message Content */
      cH += '<div style="font-size:15px;color:#1D1C1D;margin-top:2px;line-height:1.46;font-weight:400;">' + p.title + '</div>';
      if(txt) cH += '<div style="font-size:14px;color:#616061;margin-top:4px;line-height:1.4;white-space:pre-wrap;">' + txt + '</div>';
      
      /* Media Drawer */
      if(mType){
        cH += '<div id="media-' + p.id + '" style="display:none;margin-top:8px;max-width:550px;"></div>';
      }

      /* Action Row */
      const av1 = S.cAvatars[Math.abs(p.title.length * 3) % S.cAvatars.length];
      const av2 = S.cAvatars[Math.abs(p.title.length * 7) % S.cAvatars.length];
      cH += '<div style="display:flex;align-items:center;gap:6px;margin-top:6px;">';
      cH += '<div style="display:flex;align-items:center;margin-right:2px;"><img referrerpolicy="no-referrer" src="' + av1 + '" style="width:20px;height:20px;border-radius:4px;border:1px solid #fff;display:inline-block;"><img referrerpolicy="no-referrer" src="' + av2 + '" style="width:20px;height:20px;border-radius:4px;border:1px solid #fff;margin-left:-6px;display:inline-block;"></div>';
      cH += '<span style="font-size:13px;color:#1264A3;font-weight:700;">' + (p.num_comments || 0) + ' replies</span>';
      cH += '<span style="font-size:12px;color:#616061;margin-left:4px;">Last reply today at 1:18 AM</span>';
      cH += '</div></div>';

      cd.innerHTML = cH;
      con.appendChild(cd);
    });

    if(S.currentAfter){
      const moreBtn = document.createElement('div');
      moreBtn.id = 'slack-load-more-btn';
      moreBtn.style.cssText = 'text-align:center;padding:16px 0;margin:8px 0;';
      moreBtn.innerHTML = '<button onclick="window.Slackify.loadMorePosts()" style="background:#F8F8F8;border:1px solid #D1D2D3;border-radius:6px;padding:6px 18px;font-size:13px;font-weight:700;color:#1264A3;cursor:pointer;">Load older messages...</button>';
      con.appendChild(moreBtn);
    }
  };

  /* In-place HTML fetcher */
  S.fetchFeed = function(sub, sort){
    const con = document.getElementById('slack-feed');
    if(con) con.innerHTML = '<div style="color:#616061;font-size:14px;padding:12px;">Syncing channel messages...</div>';
    S.currentAfter = null;

    let url = `/r/${sub}/`;
    if(sort === 'new'){
      url += 'new/';
    } else if(sort && sort.startsWith('top-')){
      const timeframe = sort.split('-')[1];
      url += `top/?sort=top&t=${timeframe}`;
    }

    fetch(url)
    .then(r => {
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    })
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const data = S.extractPostsFromDoc(doc);
      S.currentAfter = data.after;
      S.renderFeedItems(data.posts, false);
    })
    .catch(err => {
      console.error('Slackify Sync Error:', err);
      if(con) con.innerHTML = `<div style="color:#EF4444;font-size:14px;">Failed to sync feed: ${err.message}</div>`;
    });
  };

  /* Pagination: Load older posts */
  S.loadMorePosts = function(){
    if(!S.currentAfter) return;
    const btn = document.querySelector('#slack-load-more-btn button');
    if(btn){
      btn.innerText = 'Loading older messages...';
      btn.disabled = true;
    }

    let url = `/r/${S.activeSub}/`;
    if(S.currentSort === 'new'){
      url += `new/?after=${S.currentAfter}`;
    } else if(S.currentSort && S.currentSort.startsWith('top-')){
      const tf = S.currentSort.split('-')[1];
      url += `top/?sort=top&t=${tf}&after=${S.currentAfter}`;
    } else {
      url += `?after=${S.currentAfter}`;
    }

    fetch(url)
    .then(r => {
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    })
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const data = S.extractPostsFromDoc(doc);
      S.currentAfter = data.after;
      S.renderFeedItems(data.posts, true);
    })
    .catch(err => {
      console.error('Slackify Pagination Error:', err);
      if(btn){
        btn.innerText = 'Failed to load older messages (Retry)';
        btn.disabled = false;
      }
    });
  };

  /* Toggle media view: Uses Reddit's embedded expando or safe direct player */
  S.toggleMedia = function(id, encodedUrl, e){
    if(e) e.stopPropagation();
    const box = document.getElementById('media-' + id);
    const btn = document.getElementById('mbtn-' + id);
    if(!box || !btn) return;

    if(box.style.display === 'block'){
      box.style.display = 'none';
      btn.innerHTML = btn.getAttribute('data-def') || '[+] View Media';
      btn.style.background = '#F2F2F2';
      btn.style.color = '#1264A3';
      const v = box.querySelector('video');
      if(v) v.pause();
      return;
    }

    box.style.display = 'block';
    btn.innerHTML = '[-] Collapse';
    btn.style.background = '#1264A3';
    btn.style.color = '#FFFFFF';

    // If already populated, just show it
    if(box.innerHTML.trim() !== ''){
      const v = box.querySelector('video');
      if(v) v.play();
      return;
    }

    const mUrl = decodeURIComponent(encodedUrl);

    // 1. Direct Image
    if(mUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || mUrl.includes('i.redd.it') || (mUrl.includes('imgur.com') && !mUrl.match(/\.(mp4|gifv|webm)$/i))){
      let directImg = mUrl.replace('http://', 'https://');
      if(directImg.includes('imgur.com') && !directImg.match(/\.(jpeg|jpg|gif|png)$/i)){ directImg += '.jpg'; }
      box.innerHTML = `<img referrerpolicy="no-referrer" src="${directImg}" style="max-width:100%;max-height:450px;border-radius:6px;border:1px solid #E2E2E2;">`;
      return;
    }

    // 2. Direct MP4 / Imgur gifv
    if(mUrl.endsWith('.gifv') || mUrl.match(/\.(mp4|webm)$/i)){
      const vidSource = mUrl.replace('.gifv', '.mp4');
      box.innerHTML = `<video controls playsinline autoplay loop muted referrerpolicy="no-referrer" src="${vidSource}" style="max-width:100%;max-height:420px;border-radius:6px;background:#000;"></video>`;
      return;
    }

    // 3. YouTube Direct Embed
    const ytMatch = mUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
    if(ytMatch){
      box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1" style="width:100%;height:340px;border:none;border-radius:6px;" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
      return;
    }

    // 4. Reddit's Native Embedded Player (from original page)
    if(S.expandoMap[id]){
      box.innerHTML = `<div style="max-width:100%;border-radius:6px;overflow:hidden;background:#000;">${S.expandoMap[id]}</div>`;
      return;
    }

    // 5. Native v.redd.it fallback
    if(mUrl.includes('v.redd.it')){
      const cleanV = mUrl.split('?')[0].replace(/\/$/, '');
      box.innerHTML = `<video controls playsinline autoplay referrerpolicy="no-referrer" src="${cleanV}/HLSPlaylist.m3u8" style="max-width:100%;max-height:420px;border-radius:6px;background:#000;" onerror="this.outerHTML='<iframe src=\\\'${cleanV}\\\' style=\\\'width:100%;height:320px;border:none;border-radius:6px;\\\'></iframe>'"></video>`;
      return;
    }

    // 6. Any other external video (Streamable, RedGifs, etc.) embedded inline
    box.innerHTML = `<iframe src="${mUrl}" referrerpolicy="no-referrer" style="width:100%;height:350px;border:1px solid #E2E2E2;border-radius:6px;" allowfullscreen></iframe>`;
  };
})(window.Slackify);
