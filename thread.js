/* Slackify: Comment Recursion, Thread Drawer & morechildren Handler */
window.Slackify = window.Slackify || {};

(function(S){
  let cNodeCount = 0;

  /* Parse URLs inside comment markdown to create inline media expanders */
  S.parseCommentBody = function(bodyText, nodePrefix){
    if(!bodyText) return '';
    const imgRegex = /(https?:\/\/[^\s<]+?\.(?:png|jpg|jpeg|gif|webp))/gi;
    let matchIdx = 0;
    return bodyText.replace(imgRegex, function(url){
      matchIdx++;
      const mediaId = `${nodePrefix}-cmedia-${matchIdx}`;
      return `<div style="margin-top:4px;"><span id="mbtn-${mediaId}" data-def="[+] View Attached Media" onclick="window.Slackify.toggleMedia('${mediaId}', '${encodeURIComponent(url)}', event)" style="font-size:11px;color:#1264A3;font-weight:700;background:#F2F2F2;border:1px solid #E2E2E2;border-radius:4px;padding:1px 6px;cursor:pointer;">[+] View Attached Media</span><div id="media-${mediaId}" style="display:none;margin-top:6px;max-width:450px;"><img referrerpolicy="no-referrer" src="${url}" style="max-width:100%;max-height:350px;border-radius:6px;border:1px solid #E2E2E2;"></div></div>`;
    });
  };

  /* Render a single comment bubble */
  S.renderCommentNode = function(co, target){
    if(!co || !co.body) return null;
    cNodeCount++;
    const u = S.getUser(co.author);
    const w = document.createElement('div');
    w.className = 'comment-node';
    w.id = 'slack-comment-' + (co.name || ('t1_' + co.id));
    w.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;font-size:14px;';
    
    const parsedBody = S.parseCommentBody(co.body, `cn-${cNodeCount}`);
    
    w.innerHTML = '<div onclick="window.Slackify.toggleCommentCollapse(this)" style="width:4px;background:#E2E2E2;border-radius:2px;cursor:pointer;flex-shrink:0;"></div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<img referrerpolicy="no-referrer" src="' + u.avatar + '" style="width:24px;height:24px;border-radius:4px;background:#E2E2E2;flex-shrink:0;">' +
          '<span style="font-weight:700;color:#1D1C1D;">' + u.name + '</span>' +
          '<span style="font-size:12px;color:#616061;">▲ ' + (co.score || 0) + '</span>' +
        '</div>' +
        '<div class="comment-body-wrapper" style="margin-top:4px;">' +
          '<div style="color:#1D1C1D;white-space:pre-wrap;">' + parsedBody + '</div>' +
          '<div class="child-container" style="margin-top:8px;"></div>' +
        '</div>' +
      '</div>';
    
    target.appendChild(w);
    return w.querySelector('.child-container');
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
      if(n.kind !== 't1' || !n.data?.body) return;
      const childTarget = S.renderCommentNode(n.data, target);
      if(childTarget && n.data.replies?.data?.children){
        S.buildThreadTree(n.data.replies.data.children, childTarget, moreIdsCollector);
      }
    });
  };

  /* Button for fetching additional comment slices using Reddit morechildren API */
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

      const chunk = moreIds.splice(0, 20);
      const modhash = (window.reddit && window.reddit.modhash) || '';

      const bodyData = new URLSearchParams();
      bodyData.append('api_type', 'json');
      bodyData.append('link_id', 't3_' + postId);
      bodyData.append('children', chunk.join(','));
      if(modhash) bodyData.append('uh', modhash);

      fetch('/api/morechildren', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyData.toString()
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

        things.forEach(item => {
          if(item.kind === 't1' && item.data && item.data.body){
            // Find parent node if it exists anywhere in the rendered thread
            const parentEl = document.getElementById('slack-comment-' + item.data.parent_id);
            if(parentEl){
              const parentChildContainer = parentEl.querySelector('.child-container');
              if(parentChildContainer){
                S.renderCommentNode(item.data, parentChildContainer);
                return;
              }
            }
            // If parent not found or top-level, append to main container
            S.renderCommentNode(item.data, container);
          } else if(item.kind === 'more' && item.data?.children){
            item.data.children.forEach(id => {
              if(!moreIds.includes(id)) moreIds.push(id);
            });
          }
        });

        btnWrapper.remove();
        if(moreIds.length > 0){
          S.appendMoreCommentsButton(postId, moreIds, container);
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
    
    fetch(`/comments/${postId}.json?raw_json=1&limit=50&depth=4`)
    .then(r => {
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(d => {
      c.innerHTML = '';
      const postData = d[0]?.data?.children[0]?.data;
      if(postData){
        const opUser = S.getUser(postData.author);
        c.innerHTML += '<div style="padding-bottom:12px;border-bottom:1px solid #E2E2E2;margin-bottom:8px;display:flex;gap:12px;font-size:14px;"><img referrerpolicy="no-referrer" src="' + opUser.avatar + '" style="width:36px;height:36px;border-radius:4px;background:#E2E2E2;flex-shrink:0;"><div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-weight:700;color:#1D1C1D;">' + opUser.name + '</span><span style="font-size:12px;color:#616061;">1:18 AM</span></div><div style="font-weight:700;color:#1D1C1D;margin-top:2px;">' + postData.title + '</div>' + (postData.selftext ? '<div style="font-size:14px;color:#1D1C1D;margin-top:6px;white-space:pre-wrap;">' + S.parseCommentBody(postData.selftext, 'op') + '</div>' : '') + '</div></div>';
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
        S.appendMoreCommentsButton(postId, pendingMoreIds, commentsTarget);
      }
    })
    .catch(err => {
      console.error('Slackify Thread Error:', err);
      c.innerHTML = `<div style="color:#EF4444;font-size:13px;">Failed to load thread details: ${err.message}</div>`;
    });
  };
})(window.Slackify);
