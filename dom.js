/* Slackify: Shell UI & Layout */
window.Slackify = window.Slackify || {};

(function(S){
  // Set Slack Favicon
  document.querySelectorAll("link[rel*='icon']").forEach(e => e.remove());
  const fav = document.createElement('link');
  fav.type = 'image/svg+xml';
  fav.rel = 'shortcut icon';
  fav.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path fill="%23E01E5A" d="M26.7 78a11.2 11.2 0 1 1-11.2-11.2h11.2v11.2zm6 0a11.2 11.2 0 1 1 22.4 0v28a11.2 11.2 0 1 1-22.4 0V78z"/><path fill="%2336C5F0" d="M42 26.7A11.2 11.2 0 1 1 53.2 15.5V26.7H42zm0 6a11.2 11.2 0 1 1 0 22.4H14a11.2 11.2 0 1 1 0-22.4h28z"/><path fill="%232EB67D" d="M93.3 42a11.2 11.2 0 1 1 11.2 11.2H93.3V42zm-6 0a11.2 11.2 0 1 1-22.4 0V14a11.2 11.2 0 1 1 22.4 0v28z"/><path fill="%23ECB22E" d="M78 93.3a11.2 11.2 0 1 1-11.2 11.2V93.3H78zm0-6a11.2 11.2 0 1 1 0-22.4h28a11.2 11.2 0 1 1 0 22.4H78z"/></svg>';
  document.getElementsByTagName('head')[0].appendChild(fav);

  S.renderApp = function(){
    const p = S.getPrivacyIcon(S.activeSub);
    document.title = 'Slack | Shopify';
    
    let h = '<div id="slackify-root" style="position:fixed;inset:0;z-index:999999;background:#FFFFFF;color:#1D1C1D;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;-webkit-font-smoothing:antialiased;display:flex;flex-direction:column;">';
    
    /* Top Bar */
    h += '<div style="height:38px;background:#350d36;display:flex;align-items:center;justify-content:space-between;padding:0 16px;font-size:13px;color:#d1d2d3;">';
    h += '<div style="display:flex;align-items:center;gap:14px;color:#b29db4;"><span style="cursor:pointer;">←</span><span style="cursor:pointer;">→</span><span style="cursor:pointer;">🕒</span></div>';
    h += '<div style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.15);border-radius:6px;width:440px;padding:4px 12px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#FFFFFF;cursor:pointer;">🔍 Search Shopify</div>';
    h += '<div><span style="background:#DC2626;color:white;padding:2px 8px;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;" onclick="document.getElementById(\'slackify-root\').remove()">✕ Exit</span></div></div>';

    /* Main Flex Layout */
    h += '<div style="flex:1;display:flex;overflow:hidden;">';

    /* Far Left Rail */
    h += '<div style="width:68px;background:#F4EDE4;border-right:1px solid #E6DCD1;display:flex;flex-direction:column;align-items:center;padding:10px 0;gap:14px;color:#4A154B;font-size:11px;flex-shrink:0;">';
    h += '<div style="width:36px;height:36px;background:#FFFFFF;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;color:#95BF47;box-shadow:0 1px 2px rgba(0,0,0,0.12);">🛍️</div>';
    h += '<div style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;background:rgba(0,0,0,0.06);border-radius:8px;padding:6px 8px;width:52px;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg><span style="font-weight:700;">Home</span></div>';
    h += '<div style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 8px;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg><span>DMs</span></div>';
    h += '<div style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 8px;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg><span>Activity</span></div>';
    h += '<div style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 8px;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg><span>Files</span></div>';
    h += '<div style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 8px;"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg><span>To-dos</span></div>';
    h += '<div style="flex:1;"></div>';
    
    /* Bottom Profile Avatar with Refresh Action */
    h += '<div onclick="window.Slackify.refreshFeed()" title="Click to refresh channel" style="position:relative;cursor:pointer;margin-bottom:8px;transition:transform 0.1s;" onmousedown="this.style.transform=\'scale(0.92)\'" onmouseup="this.style.transform=\'scale(1)\'">';
    h += '<img referrerpolicy="no-referrer" src="' + S.getUser('HansRivera').avatar + '" style="width:34px;height:34px;border-radius:6px;background:#ccc;display:block;">';
    h += '<span style="position:absolute;bottom:-2px;right:-2px;width:10px;height:10px;background:#2BAC76;border:2px solid #F4EDE4;border-radius:50%;"></span></div></div>';

    /* Left Sidebar */
    h += '<div id="slack-sidebar" style="width:250px;min-width:140px;max-width:400px;background:#FBF7F9;border-right:1px solid #EBE3E8;padding:12px 14px;display:flex;flex-direction:column;flex-shrink:0;color:#3F0E40;font-size:14px;overflow:hidden;">';
    
    /* Workspace Header */
    h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;white-space:nowrap;">';
    h += '<span style="font-weight:900;font-size:18px;color:#1D1C1D;display:flex;align-items:center;gap:4px;">Shopify <span style="font-size:11px;">˅</span></span>';
    h += '<div style="display:flex;gap:10px;color:#616061;font-size:15px;">';
    h += '<span onclick="window.Slackify.toggleSidebar()" title="Toggle Sidebar" style="cursor:pointer;font-size:13px;">↔</span>';
    h += '<span style="cursor:pointer;">⚙</span><span style="cursor:pointer;">✎</span></div></div>';
    
    /* Search Box */
    h += '<div style="background:#FFFFFF;border:1px solid #E2D9DF;border-radius:8px;padding:5px 10px;color:#806A78;font-size:13px;margin-bottom:14px;display:flex;align-items:center;gap:6px;white-space:nowrap;">🔍 Find a conversation...</div>';

    /* Nav Links */
    h += '<div style="display:flex;flex-direction:column;gap:8px;color:#4A154B;font-size:14px;margin-bottom:14px;padding-left:2px;white-space:nowrap;">';
    h += '<div style="display:flex;align-items:center;gap:10px;cursor:pointer;">💬 <span>Threads</span></div>';
    h += '<div style="display:flex;align-items:center;gap:10px;cursor:pointer;">🎧 <span>Huddles</span></div>';
    h += '<div style="display:flex;align-items:center;gap:10px;cursor:pointer;">✈ <span>Drafts & sent</span></div>';
    h += '<div style="display:flex;align-items:center;gap:10px;cursor:pointer;">🔖 <span>Saved</span></div>';
    h += '<div style="display:flex;align-items:center;gap:10px;cursor:pointer;">📇 <span>Directories</span></div></div>';
    
    h += '<div style="height:1px;background:#EBE3E8;margin-bottom:12px;"></div>';

    /* Scrollable Groups */
    h += '<div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding-right:2px;white-space:nowrap;">';
    
    /* Issues Group */
    h += '<div><div style="font-weight:700;color:#61505D;font-size:13px;margin-bottom:6px;display:flex;align-items:center;gap:6px;">📑 Issues</div>';
    h += '<div style="padding-left:14px;display:flex;flex-direction:column;gap:5px;color:#61505D;font-size:13px;">';
    h += '<div style="cursor:pointer;overflow:hidden;text-overflow:ellipsis;"># support-updates</div>';
    h += '<div style="cursor:pointer;overflow:hidden;text-overflow:ellipsis;"># help-incident-response ⊘</div>';
    h += '<div style="cursor:pointer;overflow:hidden;text-overflow:ellipsis;"># support-response-room ⊘</div>';
    h += '<div style="cursor:pointer;overflow:hidden;text-overflow:ellipsis;"># vendor-announcements ⊘</div></div></div>';

    /* External Connections */
    h += '<div><div style="font-weight:700;color:#61505D;font-size:13px;margin-bottom:6px;display:flex;align-items:center;gap:6px;">🏢 External connections</div>';
    h += '<div style="padding-left:14px;color:#61505D;font-size:13px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;"># globalesmb-shopify-shared ⊘</div></div>';

    /* Starred Section */
    h += '<div><div style="font-weight:700;color:#61505D;font-size:13px;margin-bottom:6px;display:flex;align-items:center;gap:6px;">⭐ Starred</div>';
    h += '<div style="padding-left:8px;display:flex;flex-direction:column;gap:5px;color:#4A154B;font-size:13px;">';
    h += '<div style="display:flex;align-items:center;gap:6px;cursor:pointer;">👨‍💼 Hans Rivera <span style="color:#806A78;font-size:11px;">you</span></div>';
    h += '<div style="display:flex;align-items:center;gap:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;">🔒 adp-timewarplogs-doc</div>';
    h += '<div style="display:flex;align-items:center;gap:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;">👩 Angel Pineda 🩷 🦈</div>';
    h += '<div style="display:flex;align-items:center;gap:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;">🌐 Domainify</div>';
    h += '<div style="display:flex;align-items:center;gap:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;">👤 Don S. 🩵</div>';
    h += '<div style="display:flex;align-items:center;gap:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;">🔒 hans-plus-notes</div>';
    h += '<div style="display:flex;align-items:center;gap:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;">🔒 hans-worknotes</div>';
    h += '<div style="display:flex;align-items:center;gap:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;"># support-alerts</div>';
    h += '<div style="display:flex;align-items:center;gap:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;"># bpo-supportline ⊘</div>';
    h += '<div style="display:flex;align-items:center;gap:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;"># inter-escalated-support-q... ⊘</div>';
    h += '<div style="display:flex;align-items:center;gap:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;"># mpa-approval ⊘</div>';
    h += '<div style="display:flex;align-items:center;gap:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;"># support-plus-technical ⊘</div></div></div>';

    /* Dynamic Channels List */
    h += '<div><div style="display:flex;align-items:center;justify-content:space-between;font-weight:700;color:#61505D;font-size:13px;margin-bottom:6px;"><span>🌐 Channels</span><button onclick="window.Slackify.promptAddSub()" style="background:none;border:none;color:#61505D;font-size:14px;cursor:pointer;font-weight:700;">+</button></div>';
    h += '<div id="channel-list" style="display:flex;flex-direction:column;gap:2px;"></div></div>';

    h += '</div></div>';

    /* Left Resizer Handle */
    h += '<div id="slack-resizer-left" style="width:5px;cursor:col-resize;background:transparent;flex-shrink:0;z-index:10;"></div>';

    /* Center Feed Area */
    h += '<div style="flex:1;display:flex;flex-direction:column;min-width:0;background:#FFFFFF;">';
    
    /* Top Header Bar */
    const currAlias = S.channelAliases[S.activeSub.toLowerCase()] || `help-${S.activeSub.toLowerCase()}`;
    h += '<div style="border-bottom:1px solid #E2E2E2;background:#FFFFFF;padding:8px 20px 0 20px;display:flex;flex-direction:column;gap:6px;">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;">';
    
    /* Stealth Channel Title with Hover */
    h += '<div style="position:relative;cursor:pointer;display:flex;align-items:center;gap:6px;" onmouseover="this.querySelector(\'.stealth-tarp\').style.opacity=\'0\';this.querySelector(\'.real-sub\').style.opacity=\'1\';" onmouseout="this.querySelector(\'.stealth-tarp\').style.opacity=\'1\';this.querySelector(\'.real-sub\').style.opacity=\'0\';">';
    h += '<span class="stealth-tarp" style="font-weight:900;color:#1D1C1D;font-size:17px;letter-spacing:-0.2px;transition:opacity 0.2s;"># ' + currAlias + ' ★</span>';
    h += '<span class="real-sub" style="position:absolute;left:0;top:0;font-weight:900;color:#E01E5A;font-size:17px;letter-spacing:-0.2px;opacity:0;transition:opacity 0.2s;white-space:nowrap;">' + p + ' ' + S.activeSub + ' ★</span></div>';

    h += '<div style="display:flex;align-items:center;gap:12px;">';
    h += '<span style="font-size:13px;color:#616061;">👥 1,439</span>';
    h += '<select id="sort-select" onchange="window.Slackify.changeSort(this.value)" style="background:#F8F8F8;border:1px solid #CCCCCC;border-radius:4px;padding:3px 8px;font-size:12px;"><option value="hot">🔥 Hot</option><option value="new">🆕 New</option><option value="top-day">🏆 Top (Day)</option><option value="top-week">🏆 Top (Week)</option><option value="top-month">🏆 Top (Month)</option><option value="top-year">🏆 Top (Year)</option><option value="top-all">👑 Top (All Time)</option></select></div></div>';

    /* Authentic Slack Channel Sub-tabs */
    h += '<div style="display:flex;gap:18px;font-size:13px;color:#616061;margin-top:2px;">';
    h += '<span style="color:#1D1C1D;font-weight:700;border-bottom:2px solid #1D1C1D;padding-bottom:6px;cursor:pointer;">💬 Messages</span>';
    h += '<span style="cursor:pointer;padding-bottom:6px;">📌 Pins</span>';
    h += '<span style="cursor:pointer;padding-bottom:6px;">📑 Bookmarks</span>';
    h += '<span style="cursor:pointer;padding-bottom:6px;">⚡ Workflows</span>';
    h += '<span style="cursor:pointer;padding-bottom:6px;">+</span></div></div>';

    /* Main Feed */
    h += '<div id="slack-feed" style="flex:1;padding:12px 20px;overflow-y:auto;display:flex;flex-direction:column;">Loading feed...</div>';

    /* Input Box */
    h += '<div style="padding:12px 20px;border-top:1px solid #E2E2E2;"><div style="border:1px solid #CCCCCC;border-radius:8px;padding:8px 12px;">';
    h += '<input type="text" placeholder="Message # ' + currAlias + '" style="width:100%;border:none;outline:none;font-size:14px;background:transparent;"></div></div></div>';

    /* Right Resizer Handle */
    h += '<div id="slack-resizer-right" style="width:5px;cursor:col-resize;background:transparent;flex-shrink:0;z-index:10;display:none;"></div>';

    /* Thread Panel */
    h += '<div id="thread-panel" style="width:450px;min-width:250px;max-width:700px;background:#FFFFFF;border-left:1px solid #E2E2E2;display:none;flex-direction:column;flex-shrink:0;">';
    h += '<div style="height:44px;border-bottom:1px solid #E2E2E2;padding:0 16px;display:flex;align-items:center;justify-content:space-between;font-weight:800;"><span>Thread</span><button onclick="document.getElementById(\'thread-panel\').style.display=\'none\';document.getElementById(\'slack-resizer-right\').style.display=\'none\';" style="background:none;border:none;font-size:18px;cursor:pointer;">✕</button></div>';
    h += '<div id="thread-content" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px;"></div></div></div></div>';

    document.body.innerHTML = h;
    document.getElementById('sort-select').value = S.currentSort;

    /* Left Resizer Logic */
    const sb = document.getElementById('slack-sidebar'), rsL = document.getElementById('slack-resizer-left');
    let isDL = false;
    rsL.addEventListener('mousedown', () => { isDL = true; document.body.style.userSelect = 'none'; });
    document.addEventListener('mousemove', e => { if(isDL){ let nw = e.clientX - 68; if(nw >= 120 && nw <= 400) sb.style.width = nw + 'px'; } });
    document.addEventListener('mouseup', () => { isDL = false; document.body.style.userSelect = 'auto'; });

    /* Right Resizer Logic */
    const tp = document.getElementById('thread-panel'), rsR = document.getElementById('slack-resizer-right');
    let isDR = false;
    rsR.addEventListener('mousedown', () => { isDR = true; document.body.style.userSelect = 'none'; });
    document.addEventListener('mousemove', e => { if(isDR){ let nw = window.innerWidth - e.clientX; if(nw >= 250 && nw <= 700) tp.style.width = nw + 'px'; } });
    document.addEventListener('mouseup', () => { isDR = false; document.body.style.userSelect = 'auto'; });

    /* Render Stealth Channel Items */
    const cL = document.getElementById('channel-list');
    cL.innerHTML = '';
    S.subreddits.forEach(x => {
      const isA = x.toLowerCase() === S.activeSub.toLowerCase();
      const px = S.getPrivacyIcon(x);
      const aliasName = S.channelAliases[x.toLowerCase()] || `help-${x.toLowerCase()}`;
      
      let itemHtml = '<div onclick="window.Slackify.switchSub(\'' + x + '\')" onmouseover="this.querySelector(\'.c-alias\').style.display=\'none\';this.querySelector(\'.c-real\').style.display=\'inline\';" onmouseout="this.querySelector(\'.c-alias\').style.display=\'inline\';this.querySelector(\'.c-real\').style.display=\'none\';" style="padding:5px 8px;border-radius:6px;font-size:14px;font-weight:' + (isA ? '700' : '400') + ';background:' + (isA ? '#F3B2C3' : 'transparent') + ';color:#1D1C1D;cursor:pointer;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">';
      itemHtml += '<span style="color:#61505D;margin-right:2px;">' + px + '</span> <span class="c-alias">' + aliasName + '</span>';
      itemHtml += '<span class="c-real" style="display:none;color:#E01E5A;font-weight:700;">' + x + '</span>';
      itemHtml += '</div>';
      
      cL.innerHTML += itemHtml;
    });
  };

  S.toggleSidebar = function(){
    const sb = document.getElementById('slack-sidebar');
    if(!sb) return;
    sb.style.width = (sb.offsetWidth > 50) ? '0px' : '250px';
    sb.style.padding = (sb.offsetWidth > 50) ? '0px' : '12px 14px';
  };
})(window.Slackify);
