(function expose(root) {
  'use strict';

  function day(date = new Date()) {
    return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  }

  function offset(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate()+days);
    return day(next);
  }

  function evaluate({ completed, attempts, actions, level, earnedTopics = [], longStreak = false, certified = false, now = new Date() }) {
    const today = day(now);
    const dates = new Set(actions.map(event => event.dia));
    for (const attempt of attempts) if (Number.isFinite(attempt.date)) dates.add(day(new Date(attempt.date)));
    let streak = 0;
    const start = dates.has(today) ? 0 : 1;
    while (dates.has(offset(now,-streak-start))) streak++;
    const successes = new Set([...earnedTopics,...attempts.filter(attempt => attempt.correta).map(attempt => attempt.tema)]);
    const xp = completed.length*40 + successes.size*15 + (streak>=7 || longStreak ? 20 : 0) + (certified ? 20 : 0);
    const monday = (now.getDay()+6)%7;
    const week = [...dates].filter(date => date >= offset(now,-monday) && date <= today).length;
    const month = [...dates].filter(date => date.startsWith(today.slice(0,7)) && date<=today).length;
    const elapsed = [...dates].sort().at(-1);
    const recentErrors = attempts.slice(-5).filter(attempt => !attempt.correta).length;
    const slowerSteps = actions.filter(item => item.tipo === 'passo').slice(-4).filter(item => item.segundos >= 50).length;
    const guided = !level || level.startsWith('Iniciante') || recentErrors >= 3 || slowerSteps >= 3;
    const achievements = [
      [completed.length > 0,'Primeira aula concluída'],
      [completed.includes('videochamada'),'Tutorial de videochamada concluído'],
      [completed.includes('pix'),'Treino de PIX seguro concluído'],
      [streak >= 7 || longStreak,'Uma semana de estudos'],
      [successes.size >= 4,'Guardião da segurança digital'],
      [completed.length === 4,'Trilha inicial completa'],
      [certified,'Primeiro certificado emitido']
    ].filter(([earned]) => earned).map(([,name])=>name);
    return {
      xp, level:1+Math.floor(xp/60), streak, week, month, guided, today:dates.has(today),
      paused:Boolean(elapsed && elapsed <= offset(now,-4)), achievements
    };
  }

  const api = { day,evaluate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Jornada = api;
})(globalThis);
