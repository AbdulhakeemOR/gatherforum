window.GatherStorage = {
  key: 'gather-forum-shortlist-v1',
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      const saved = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(saved)) throw new Error('Invalid shortlist');
      localStorage.setItem(this.key, JSON.stringify(saved));
      return {ids:saved.filter(id => GATHER_SESSIONS.some(s => s.id === id)),available:true};
    } catch { return {ids:[],available:false}; }
  },
  save(ids) {
    try { localStorage.setItem(this.key, JSON.stringify([...ids])); return true; }
    catch { return false; }
  }
};
