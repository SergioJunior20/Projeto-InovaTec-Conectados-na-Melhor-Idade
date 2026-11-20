(function expose(root) {
  'use strict';
  const leagues = [
    {name:'Primeiros passos',xp:0},
    {name:'Exploradores',xp:60},
    {name:'Autonomia',xp:120},
    {name:'Mentores digitais',xp:200}
  ];

  function confidence(lessons, topics, totalLessons, totalTopics) {
    const evidence = Math.min(new Set(lessons).size,totalLessons) + Math.min(new Set(topics).size,totalTopics);
    const total = totalLessons + totalTopics;
    return {evidence,total,percent:total ? Math.round(100*evidence/total) : 0};
  }

  function league(xp) {
    const index = leagues.findLastIndex(item => item.xp <= xp);
    return {current:leagues[Math.max(index,0)],next:leagues[index+1]};
  }

  function recovery(attempts) {
    const recent = attempts.slice(-20);
    const stats = new Map();
    for (const attempt of recent) {
      const record = stats.get(attempt.tema) || {tema:attempt.tema,errors:0,total:0};
      record.total++;
      if (!attempt.correta) record.errors++;
      record.lastWrong = !attempt.correta;
      stats.set(attempt.tema,record);
    }
    return [...stats.values()]
      .filter(item => item.lastWrong)
      .sort((a,b) => b.errors-a.errors || b.errors/b.total-a.errors/a.total)[0];
  }

  function challenge(exercise, scenarios, attemptCount) {
    const variation = Math.max(0,attemptCount);
    return {
      ...exercise,
      scenario:scenarios.length ? scenarios[variation % scenarios.length] : exercise.scenario,
      choices:exercise.choices.map((text,canonical) => ({text,canonical})).sort((a,b) =>
        (variation % 2 ? b.canonical-a.canonical : a.canonical-b.canonical))
    };
  }

  const api = {confidence,league,recovery,challenge};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Evolucao = api;
})(globalThis);
