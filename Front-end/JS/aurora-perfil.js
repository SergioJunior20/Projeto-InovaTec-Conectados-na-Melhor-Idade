(function expose(root) {
  'use strict';
  const milliseconds = day=>Date.parse(day+'T00:00:00Z');
  const recent = (past,today)=>{
    const distance = milliseconds(today)-milliseconds(past);
    return distance>=0 && distance<=30*86400000;
  };

  function record(learning, topic, day) {
    if (!learning?.enabled || !topic) return learning;
    const previous = (learning.items || []).find(item=>item.topic===topic);
    const count = previous && recent(previous.day,day) ? previous.count+1 : 1;
    return {
      enabled:true,
      items:[{topic,count:Math.min(99,count),day},
        ...(learning.items || []).filter(item=>item.topic!==topic)].slice(0,16)
    };
  }

  function recurring(learning, today) {
    if (!learning?.enabled) return undefined;
    return (learning.items || []).filter(item=>item.count>=2 && recent(item.day,today))
      .sort((a,b)=>b.count-a.count)[0];
  }

  const api = {record,recurring};
  if (typeof module!=='undefined' && module.exports) module.exports = api;
  else root.AuroraPerfil = api;
})(globalThis);
