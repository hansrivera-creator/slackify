/* Slackify: Feed Scraper, Cards, Media & Feed Pagination */
window.Slackify = window.Slackify || {};

(function(S){
  S.currentAfter = null;

  /* Check NSFW categorization */
  S.checkNSFW = function(post){
    if(!post.over_18) return null;
    const txt = `${post.title} ${post.link_flair_text || ''} ${post.subreddit || ''}`.toLowerCase();
    const gK = ['gore', 'nsfl', 'death', 'dead', 'accident', 'blood', 'injury', 'wound', 'medicalgore', 'combatfootage'];
    return gK.some(k => txt.includes(k)) ? 'gore' : 'nudity';
  };

  /* Scrape items + pagination token directly from old Reddit HTML */
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
      
      items.push({
        id: cleanId,
        author: authorEl ? authorEl.innerText : '[unknown]',
        title: titleEl.innerText,
        url: rawUrl,
        num_comments: commentCount,
        over_18: el.classList.contains('over18'),
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
      
      /* Media classification */
      let mUrl = p.url || '', mType = null;
      if(mUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || mUrl.includes('i.redd.it') || (mUrl.includes('imgur.com') && !mUrl.match(/\.(mp4|gifv|webm)$/i))){
        mType = 'img';
      } else if(mUrl.match(/\.(mp4|webm|gifv)$/i) || mUrl.includes('v.redd.it') || mUrl.includes('redgifs.com') || mUrl.includes('gfycat.com') || mUrl.includes('youtube.com') || mUrl.includes('youtu.be')){
        mType = 'vid';
      }

      const nType = S.checkNSFW(p);

      let cH = '<img referrerpolicy="no-referrer" src="' + u.avatar + '" style="width:36px;height:36px;border-radius:6px;background:#E2E2E2;flex-shrink:0;">';
      cH += '<div style="flex:1;min-width:0;">';
      
      /* Line 1: Author + Timestamp */
      cH += '<div style="display:flex;align-items:center;gap:8px;"><span style="font-weight:900;font-size:15px;color:#1D1C1D;">' + u.name + '</span><span style="font-size:12px;color:#616061;">1:18 AM</span>';
      
      if(nType === 'gore') cH += '<span style="background:#EF4444;color:white;font-size:10px;font-weight:700;padding:1px 5px;border-radius:3px;">⚠️ GORE</span>';
      else if(nType === 'nudity') cH += '<span style="background:#E01E5A;color:white;font-size:10px;font-weight:700;padding:1px 5px;border-radius:3px;">🔞 18+ NSFW</span>';

      if(mType){
        let btnLabel = '[+] View Media';
        if(nType === 'gore') btnLabel = '[+] ⚠️ GORE (Reveal)';
        else if(nType === 'nudity') btnLabel = '[+] 🔞 NSFW (Reveal)';
        cH += '<span id="mbtn-' + p.id + '" data-def="' + btnLabel + '" data-loaded="0" onclick="window.Slackify.toggleMedia(\'' + p.id + '\', \'' + encodeURIComponent(mUrl) + '\', event)" style="font-size:11px;color:' + (nType === 'gore' ? '#DC2626' : (nType === 'nudity' ? '#E01E5A' : '#1264A3')) + ';font-weight:700;background:#F2F2F2;border:1px solid #E2E2E2;border-radius:4px;padding:1px 6px;cursor:pointer;margin-left:4px;">' + btnLabel + '</span>';
      }

      cH += '</div>';
      
      /* Message Content */
      cH += '<div style="font-size:15px;color:#1D1C1D;margin-top:2px;line-height:1.46;font-weight:400;">' + p.title + '</div>';
      if(txt) cH += '<div style="font-size:14px;color:#616061;margin-top:4px;line-height:1.4;white-space:pre-wrap;">' + txt + '</div>';
      
      /* Media Drawer container */
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

  /* Dynamic Media Expander: Resolves accurate MP4 streams & iframes on demand */
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
      return;
    }

    box.style.display = 'block';
    btn.innerHTML = '[-] Collapse';
    btn.style.background = '#1264A3';
    btn.style.color = '#FFFFFF';

    // If media was already fetched and rendered once, don't recreate it
    if(btn.getAttribute('data-loaded') === '1') return;
    btn.setAttribute('data-loaded', '1');

    const mUrl = decodeURIComponent(encodedUrl);

    // Images
    if(mUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || mUrl.includes('i.redd.it') || (mUrl.includes('imgur.com') && !mUrl.match(/\.(mp4|gifv|webm)$/i))){
      let directImg = mUrl.replace('http://', 'https://');
      if(directImg.includes('imgur.com') && !directImg.match(/\.(jpeg|jpg|gif|png)$/i)){ directImg += '.jpg'; }
      box.innerHTML = `<img referrerpolicy="no-referrer" src="${directImg}" style="max-width:100%;max-height:450px;border-radius:6px;border:1px solid #E2E2E2;">`;
      return;
    }

    // Direct Imgur .gifv / .mp4
    if(mUrl.endsWith('.gifv') || mUrl.match(/\.(mp4|webm)$/i)){
      const vidSource = mUrl.replace('.gifv', '.mp4');
      box.innerHTML = `<video controls playsinline autoplay loop muted src="${vidSource}" style="max-width:100%;max-height:420px;border-radius:6px;background:#000;"></video>`;
      return;
    }

    // Video streams (v.redd.it, redgifs, youtube, etc.): fetch post metadata for direct stream
    box.innerHTML = '<div style="color:#616061;font-size:12px;padding:6px 0;">Loading video player...</div>';

    fetch(`/by_id/t3_${id}.json?raw_json=1`)
    .then(r => r.json())
    .then(res => {
      const post = res?.data?.children?.[0]?.data;
      const redditVideo = post?.media?.reddit_video || post?.crosspost_parent_list?.[0]?.media?.reddit_video;
      
      if(redditVideo && redditVideo.fallback_url){
        box.innerHTML = `<video controls playsinline autoplay src="${redditVideo.fallback_url}" style="max-width:100%;max-height:420px;border-radius:6px;background:#000;"></video>`;
      } else if(post?.secure_media_embed?.content){
        // Secure iframe embed (RedGifs, YouTube, Gfycat)
        const parser = new DOMParser();
        const decodedHtml = parser.parseFromString(post.secure_media_embed.content, 'text/html').body.textContent || '';
        box.innerHTML = `<div style="max-width:100%;border-radius:6px;overflow:hidden;">${decodedHtml}</div>`;
      } else if(mUrl.includes('v.redd.it')){
        // Direct DASH fallback
        const cleanV = mUrl.split('?')[0].replace(/\/$/, '');
        box.innerHTML = `<video controls playsinline autoplay src="${cleanV}/DASH_480.mp4" style="max-width:100%;max-height:420px;border-radius:6px;background:#000;" onerror="this.outerHTML='<div style=font-size:12px;color:#616061;padding:6px;><a href=\\\'${mUrl}\\\' target=\\\'_blank\\\' style=color:#1264A3;>Open video externally ↗</a></div>'"></video>`;
      } else {
        box.innerHTML = `<div style="font-size:12px;padding:8px 0;"><a href="${mUrl}" target="_blank" style="color:#1264A3;font-weight:700;">Open external video link ↗</a></div>`;
      }
    })
    .catch(err => {
      console.error('Failed to load video stream metadata:', err);
      box.innerHTML = `<div style="font-size:12px;padding:6px 0;"><a href="${mUrl}" target="_blank" style="color:#1264A3;">Open video source ↗</a></div>`;
    });
  };
})(window.Slackify);
