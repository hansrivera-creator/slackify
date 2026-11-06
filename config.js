/* Slackify: Config & Data Stores */
window.Slackify = window.Slackify || {};

(function(S){
  S.subreddits = [
    'askreddit',
    'maliciouscompliance',
    'talesfromtechsupport',
    'pettyrevenge',
    'idontworkherelady',
    'todayilearned',
    'hfy',
    'writingprompts',
    'popular'
  ];

  S.activeSub = window.location.pathname.split('/')[2] || S.subreddits[0];
  S.currentSort = 'hot';
  if(!S.subreddits.includes(S.activeSub.toLowerCase())) {
    S.subreddits.unshift(S.activeSub.toLowerCase());
  }

  /* Custom Stealth Channel Aliases matching Slack UI */
  S.channelAliases = {
    'askreddit': 'help-checkout',
    'maliciouscompliance': 'help-accounts-and-access',
    'talesfromtechsupport': 'help-beacon-zendesk',
    'pettyrevenge': 'help-billing-infrastructure',
    'idontworkherelady': 'help-collections',
    'todayilearned': 'help-customers',
    'hfy': 'help-draft-orders',
    'writingprompts': 'help-fraud-operations',
    'popular': 'help-growth-advisory'
  };

  /* Remote Avatar Gist Setup */
  const REMOTE_AVATAR_GIST = 'https://gist.githubusercontent.com/hansrivera-creator/0621aa894955546de8bb80e97fc00aa8/raw/avatars.json';

  const defaultAvatars = [
    'https://cdn.shopify.com/s/files/1/0898/8160/8214/files/E017D49VC3F-U06FK4NA29J-g342a99499fa-512.png?v=1793707358',
    'https://cdn.shopify.com/s/files/1/0898/8160/8214/files/E017D49VC3F-U09U91GMAG0-gae00e4d46e9-512.png?v=1793707358',
    'https://cdn.shopify.com/s/files/1/0898/8160/8214/files/E017D49VC3F-U06UP6G3UMA-319be5f268a8-512.jpg?v=1793707358',
    'https://cdn.shopify.com/s/files/1/0898/8160/8214/files/E017D49VC3F-U0AS9U8CVR9-g21d4325df09-512.png?v=1793707357',
    'https://cdn.shopify.com/s/files/1/0898/8160/8214/files/E017D49VC3F-U0BD41L0V18-ge394072ffea-512.png?v=1793707357'
  ];

  S.cAvatars = defaultAvatars;
  try {
    const cached = localStorage.getItem('slackify_remote_avatars');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) S.cAvatars = parsed;
    }
  } catch(e){}

  /* Background sync for new avatars */
  fetch(REMOTE_AVATAR_GIST + '?t=' + Date.now())
    .then(res => {
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        S.cAvatars = data;
        try {
          localStorage.setItem('slackify_remote_avatars', JSON.stringify(data));
        } catch(e){}
      }
    })
    .catch(err => console.warn('Slackify: Could not update avatars from Gist', err));

  const aCache = {};
  const f = [
    'José', 'Josée', 'Joseph', 'Josey', 'Josh', 'Joshua',
    'Aarav', 'Aaryan', 'Aditya', 'Aisha', 'Ajay', 'Alexander', 'Ali', 'Amina', 'Amir', 
    'Ananya', 'Andrew', 'Anita', 'Anthony', 'Arjun', 'Benjamin', 'Carlos', 'Chloe', 
    'Daniel', 'Diego', 'Elena', 'Emily', 'Ethan', 'Fatima', 'Gabriel', 'Hannah', 
    'Isabella', 'Jack', 'Jacob', 'Jasmine', 'Kevin', 'Liam', 'Lucas', 'Maria', 
    'Mateo', 'Michael', 'Noah', 'Omar', 'Pooja', 'Priya', 'Rahul', 'Rohan', 
    'Sara', 'Sophia', 'Thomas', 'Vikram', 'William', 'Zain', 'Zara'
  ];
  const l = [
    'Herrera', 'DeBoer', 'Machak', 'Mopal', 'Rivera', 'Cabañal', 'Mellon', 
    'Goldfarb', 'Hawkins', 'Thomson', 'Yu', 'Andrade', 'Charland', 'Lay', 'Lising', 'Manalabe',
    'Abadi', 'Agarwal', 'Ahmed', 'Ali', 'Brown', 'Chaudhary', 'Chen', 'Das', 
    'Davis', 'Fernandez', 'Garcia', 'Gomez', 'Gupta', 'Hassan', 'Hernandez', 
    'Iyer', 'Jain', 'Joshi', 'Kapoor', 'Khan', 'Kumar', 'Lee', 'Li', 'Lopez', 
    'Mehta', 'Miller', 'Mishra', 'Mukherjee', 'Nair', 'Patel', 'Perez', 'Rao', 
    'Reddy', 'Rodriguez', 'Roy', 'Sharma', 'Singh', 'Smith', 'Taylor', 'Verma', 
    'Williams', 'Yadav', 'Zhao'
  ];

  /* Avatar & Identity Generator */
  S.getUser = function(author){
    if(!author || author === '[deleted]'){
      return {
        name: 'Tech Support Bot',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bot'
      };
    }
    if(aCache[author]) return aCache[author];

    let h = 0;
    for(let i = 0; i < author.length; i++){
      h = ((h << 5) - h) + author.charCodeAt(i);
      h |= 0;
    }

    const name = `${f[Math.abs(h) % f.length]} ${l[Math.abs(h * 17) % l.length]}`;
    const isCdn = Math.abs(h) % 10 < 7;
    const avatarUrl = isCdn
      ? S.cAvatars[Math.abs(h * 31) % S.cAvatars.length]
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author)}`;

    const res = { name: name, avatar: avatarUrl };
    aCache[author] = res;
    return res;
  };

  S.getPrivacyIcon = function(subName){
    let h = 0;
    for(let i = 0; i < subName.length; i++){
      h = ((h << 5) - h) + subName.charCodeAt(i);
      h |= 0;
    }
    return (Math.abs(h) % 2 === 0) ? '🔒' : '#';
  };
})(window.Slackify);
