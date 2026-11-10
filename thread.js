/* Slackify: Comment Recursion, Thread Drawer & Media/Markdown Enhancer */
window.Slackify = window.Slackify || {};

(function(S){
  let cNodeCount = 0;
  let cachedModhash = null;

  /* Helper to normalize IDs (strips t1_, t3_ prefixes) */
  function cleanId(rawId){
    if(!rawId) return '';
    return String(rawId).replace(/^t[13]_/, '').trim();
  }

  /* Retrieve genuine modhash for Reddit API calls */
  function fetchModhash(){
    if(cachedModhash) return Promise.resolve(cachedModhash);
    
    const input = document.querySelector('input[name="uh"]');
    if(input && input.value){
      cachedModhash = input.value;
      return Promise.resolve(cachedModhash);
    }

    return fetch('/api/me.json')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if(d?.data?.modhash){
          cachedModhash = d.data.modhash;
        }
        return cachedModhash || '';
      })
      .catch(() => '');
  }

  /* Parse Reddit Markdown (Giphy embeds, headings, links, bold, italics, media URLs) */
  S.parseCommentBody = function(bodyText, nodePrefix){
    if(!bodyText) return '';
    let parsed = bodyText;

    // 1. Parse Reddit Giphy syntax: ![gif](giphy|ID)
    parsed = parsed.replace(/!\[gif\]\(giphy\|([^)\s]+)\)/gi, function(_, giphyId){
      const imgUrl = `https://i.giphy.com/media/${giphyId}/giphy.gif`;
      return `<div style="margin:6px 0;"><img referrerpolicy="no-referrer" src="${imgUrl}" style="max-width:280px;max-height:220px;border-radius:6px;border:1px solid #E2E2E2;display:block;"></div>`;
    });

    // 2. Parse Markdown Headings: # Heading
    parsed = parsed.replace(/^#{1,6}\s*(.+)$/gm, '<div style="font-weight:700;margin:4px 0;">$1</div>');

    // 3. Parse Markdown Bold & Italics
    parsed = parsed.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 4. Parse Markdown links: [text](url)
    parsed = parsed.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#1264A3;text-decoration:none;font-weight:600;">$1</a>');

    // 5. Parse standalone image/media URLs into expandable media pills
    const imgRegex = /(https?:\/\/[^\s<]+?\.(?:png|jpg|jpeg|gif|webp))/gi;
    let matchIdx = 0;
    parsed = parsed.replace(imgRegex, function(url){
      matchIdx++;
      const mediaId = `${nodePrefix}-cmedia-${matchIdx}`;
      return `<div style="margin-top:4px;"><span id="mbtn-${mediaId}" data-def="[+] View Attached Media" onclick="window.Slackify.toggleMedia('${mediaId}', '${encodeURIComponent(url)}', event)" style="font-size:11px;color:#1264A3;font-weight:700;background:#F2F2F2;border:1px solid #E2E2E2;border-radius:4px;padding:1px 6px;cursor:pointer;">[+] View Attached Media</span><div id="media-${mediaId}" style="display:none;margin-top:6px;max-width:450px;"><img referrerpolicy="no-referrer" src="${url}" style="max-width:100%;max-height:350px;border-radius:6px;border:1px solid #E2E2E2;"></div></div>`;
    });

    return parsed;
  };

  /* Helper to decode HTML entities */
  function decodeHtmlEntities(str){
    if(!str) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  }

  /* Build media embed button for OP in the drawer */
  function buildOpMediaHtml(postData){
    if(!postData) return '';
    const url = postData.url_overridden_by_dest || postData.url || '';
    if(!url) return '';

    const isDirectImg = /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(url);
    const isRedditGallery = url.includes('/gallery/');
    const isRedditVideo = postData.is_video || url.includes('v.redd.it');

    if(isDirectImg){
      const mediaId = 'op-media-' + postData.id;
      return `<div style="margin-top:8px;"><span id="mbtn-${mediaId}" data-def="[+] View Attached Media" onclick="window.Slackify.toggleMedia('${mediaId}', '${encodeURIComponent(url)}', event)" style="font-size:11px;color:#1264A3;font-weight:700;background:#F2F2F2;border:1px solid #E2E2E2;border-radius:4px;padding:2px 8px;cursor:pointer;">[+] View Attached Media</span><div id="media-${mediaId}" style="display:none;margin-top:6px;max-width:480px;"><img referrerpolicy="no-referrer" src="${url}" style="max-width:100%;max-height:360px;border-radius:6px;border:1px solid #E2E2E2;"></div></div>`;
    }

    if(isRedditVideo || isRedditGallery){
      return `<div style="margin-top:8px;"><a href="${url}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#1264A3;font-weight:700;background:#F2F2F2;border:1px solid #E2E2E2;border-radius:4px;padding:2px 8px;text-decoration:none;display:inline-block;">↗ Open Original Media</a></div>`;
    }

    // External link/article
    if(!url.includes(postData.permalink)){
      return `<div style="margin-top:8px;"><a href="${url}" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:#1264A3;text-decoration:none;font-weight:600;">🔗 ${url}</a></div>`;
    }

    return '';
  }

  /* Create and return a comment DOM node */
  S.createCommentElement = function(co){
    if(!co) return null;
    
    let rawText = co.body || co.contentText || '';
    let isHtml = false;
    if(!rawText && co.body_html){
      rawText = decodeHtmlEntities(co.body_html);
      isHtml = true;
    }
    if(!rawText) return null;

    cNodeCount++;

    const rawCommentId = co.id || co.name || ('c_' + cNodeCount);
    const normalizedId = cleanId(rawCommentId);

    let authorName = co.author || co.author_fullname || (co.data && co.data.author) || '';
    if(!authorName || authorName === '[deleted]' || authorName === '[unknown]'){
      authorName = 'user_' + normalizedId;
    }

    const u = S.getUser(authorName);
    const score = (co.score !== undefined) ? co.score : ((co.ups !== undefined) ? co.ups : 1);

    const w = document.createElement('div');
    w.className = 'comment-node';
    w.id = 'slack-comment-' + normalizedId;
    w.setAttribute('data-cid', normalizedId);
    w.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;font-size:14px;';
    
    let renderedContent = isHtml ? rawText : S.parseCommentBody(rawText, `cn-${cNodeCount}`);

    w.innerHTML = '<div onclick="window.Slackify.toggleCommentCollapse(this)" style="width:4px;background:#E2E2E2;border-radius:2px;cursor:pointer;flex-shrink:0;"></div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<img referrerpolicy="no-referrer" src="' + u.avatar + '" style="width:24px;height:24px;border-radius:4px;background:#E2E2E2;flex-shrink:0;">' +
          '<span style="font-weight:700;color:#1D1C1D;">' + u.name + '</span>' +
          '<span style="font-size:12px;color:#616061;">▲ ' + score + '</span>' +
        '</div>' +
        '<div class="comment-body-wrapper" style="margin-top:4px;">' +
          '<div style="color:#1D1C1D;white-space:pre-wrap;line-height:1.45;">' + renderedContent + '</div>' +
          '<div class="child-container" style="margin-top:6px;margin-left:16px;"></div>' +
        '</div>' +
      '</div>';
    
    return w;
  };

  /* Render and append a comment node */
  S.renderCommentNode = function(co, target){
    const el = S.createCommentElement(co);
    if(!el) return null;
    target.appendChild(el);
    return el.querySelector('.child-container');
  };

  /* Collapse/expand comment threads */
  S.toggleCommentCollapse = function(el){
    const pN = el.closest('.comment-node');
    if(!pN) return;
    const bE = pN.querySelector('.comment-body-wrapper');
    const isHidden = bE.style.display === 'none';
    bE.style.display = isHidden ? 'block' : 'none';
    el.style.background = isHidden ? '#E2E2E2' : '#1264A3';
  };

  /* Recursive comment tree builder */
  S.buildThreadTree = function(nodes, target, moreIdsCollector){
    if(!nodes || !Array.isArray(nodes)) return;
    nodes.forEach(n => {
      if(n.kind === 'more' && n.data?.children && n.data.children.length > 0){
        if(moreIdsCollector){
          n.data.children.forEach(id => {
            if(!moreIdsCollector.includes(id)) moreIdsCollector.push(id);
          });
        }
        return;
      }
      if(n.kind !== 't1') return;
      const childTarget = S.renderCommentNode(n.data, target);
      if(childTarget && n.data?.replies?.data?.children){
        S.buildThreadTree(n.data.replies.data.children, childTarget, moreIdsCollector);
      }
    });
  };

  /* Button for fetching additional comment slices */
  S.appendMoreCommentsButton = function(postId, moreIds, container){
    const existing = document.getElementById('slack-more-comments-btn');
    if(existing) existing.remove();

    if(!moreIds || moreIds.length === 0) return;

    const btnWrapper = document.createElement('div');
    btnWrapper.id = 'slack-more-comments-btn';
    btnWrapper.style.cssText = 'text-align:center;padding:12px 0;margin:6px 0;';
    btnWrapper.innerHTML = '<button style="background:#F8F8F8;border:1px solid #D1D2D3;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:700;color:#1264A3;cursor:pointer;">Load more replies in this thread (' + moreIds.length + ' left)...</button>';
    
    btnWrapper.querySelector('button').onclick = function(){
      const btn = this;
      btn.innerText = 'Loading replies...';
      btn.disabled = true;

      const chunk = moreIds.splice(0, 30);
      const postCleanId = cleanId(postId);

      fetchModhash().then(mh => {
        const formData = new URLSearchParams();
        formData.append('api_type', 'json');
        formData.append('link_id', 't3_' + postCleanId);
        formData.append('children', chunk.join(','));
        formData.append('sort', 'confidence');
        if(mh) formData.append('uh', mh);

        return fetch('/api/morechildren', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: formData.toString()
        });
      })
      .then(r => {
        if(!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(res => {
        const things = res?.json?.data?.things || [];

        if(things.length === 0){
          btnWrapper.remove();
          if(moreIds.length > 0){
            S.appendMoreCommentsButton(postId, moreIds, container);
          }
          return;
        }

        const liveRoot = document.getElementById('thread-comments-root') || container;
        const commentElements = {};
        const unplaced = [];

        things.forEach(item => {
          const cData = item.data;
          if(!cData) return;

          if(item.kind === 't1' || cData.body || cData.body_html || cData.contentText){
            const nodeEl = S.createCommentElement(cData);
            if(nodeEl){
              const cid = cleanId(cData.id || cData.name);
              const pid = cleanId(cData.parent_id);
              const isTopLevel = !cData.parent_id || cData.parent_id.startsWith('t3_') || pid === postCleanId;
              
              commentElements[cid] = nodeEl;
              unplaced.push({ el: nodeEl, cid: cid, pid: pid, isTopLevel: isTopLevel });
            }
          } else if(item.kind === 'more' && cData.children){
            cData.children.forEach(id => {
              if(!moreIds.includes(id)) moreIds.push(id);
            });
          }
        });

        let changed = true;
        let passes = 0;
        while(changed && unplaced.length > 0 && passes < 5){
          changed = false;
          passes++;

          for(let i = unplaced.length - 1; i >= 0; i--){
            const item = unplaced[i];

            if(item.isTopLevel){
              liveRoot.appendChild(item.el);
              unplaced.splice(i, 1);
              changed = true;
              continue;
            }

            const domParent = document.getElementById('slack-comment-' + item.pid);
            if(domParent){
              const childBox = domParent.querySelector('.child-container');
              if(childBox){
                childBox.appendChild(item.el);
                unplaced.splice(i, 1);
                changed = true;
                continue;
              }
            }

            const batchParent = commentElements[item.pid];
            if(batchParent && batchParent.isConnected){
              const childBox = batchParent.querySelector('.child-container');
              if(childBox){
                childBox.appendChild(item.el);
                unplaced.splice(i, 1);
                changed = true;
                continue;
              }
            }
          }
        }

        unplaced.forEach(item => {
          liveRoot.appendChild(item.el);
        });

        btnWrapper.remove();
        if(moreIds.length > 0){
          S.appendMoreCommentsButton(postId, moreIds, liveRoot);
        }
      })
      .catch(err => {
        console.error('Failed to load more comments:', err);
        btn.innerText = 'Failed to load replies (Retry)';
        btn.disabled = false;
        moreIds.unshift(...chunk);
      });
    };

    container.appendChild(btnWrapper);
  };

  /* Open and load Thread Panel */
  S.openThread = function(postId){
    const p = document.getElementById('thread-panel');
    const rsR = document.getElementById('slack-resizer-right');
    const c = document.getElementById('thread-content');
    p.style.display = 'flex';
    rsR.style.display = 'block';
    c.innerHTML = '<div style="color:#616061;font-size:13px;">Loading thread comments...</div>';
    
    const postCleanId = cleanId(postId);

    fetch(`/comments/${postCleanId}.json?raw_json=1&limit=500&depth=10`)
    .then(r => {
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(d => {
      c.innerHTML = '';
      const postData = d[0]?.data?.children[0]?.data;
      if(postData){
        const opUser = S.getUser(postData.author);
        const opMediaHtml = buildOpMediaHtml(postData);
        
        c.innerHTML += '<div style="padding-bottom:12px;border-bottom:1px solid #E2E2E2;margin-bottom:8px;display:flex;gap:12px;font-size:14px;">' +
          '<img referrerpolicy="no-referrer" src="' + opUser.avatar + '" style="width:36px;height:36px;border-radius:4px;background:#E2E2E2;flex-shrink:0;">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:8px;"><span style="font-weight:700;color:#1D1C1D;">' + opUser.name + '</span><span style="font-size:12px;color:#616061;">1:18 AM</span></div>' +
            '<div style="font-weight:700;color:#1D1C1D;margin-top:2px;">' + postData.title + '</div>' +
            (postData.selftext ? '<div style="font-size:14px;color:#1D1C1D;margin-top:6px;white-space:pre-wrap;">' + S.parseCommentBody(postData.selftext, 'op') + '</div>' : '') +
            opMediaHtml +
          '</div>' +
        '</div>';
      }
      
      const coms = d[1]?.data?.children || [];
      if(coms.length === 0){
        c.innerHTML += '<div style="color:#616061;font-size:13px;">No replies found.</div>';
        return;
      }

      const commentsTarget = document.createElement('div');
      commentsTarget.id = 'thread-comments-root';
      c.appendChild(commentsTarget);

      let pendingMoreIds = [];
      S.buildThreadTree(coms, commentsTarget, pendingMoreIds);

      if(pendingMoreIds.length > 0){
        S.appendMoreCommentsButton(postCleanId, pendingMoreIds, commentsTarget);
      }
    })
    .catch(err => {
      console.error('Slackify Thread Error:', err);
      c.innerHTML = `<div style="color:#EF4444;font-size:13px;">Failed to load thread details: ${err.message}</div>`;
    });
  };
})(window.Slackify);
