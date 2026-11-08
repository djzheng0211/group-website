import { getCollection } from 'astro:content';
import { buildStoryArt } from './research-art';
import { storySteps } from './research-steps';

const statusOrder = { active: 0, completed: 1, archived: 2 };

// Research thrusts in display order (active first, then newest), each with
// its scroll-story steps and artwork. Shared by the Research and Home pages.
export async function getThrusts() {
  const research = (await getCollection('research')).sort((a, b) => {
    const s = statusOrder[a.data.status] - statusOrder[b.data.status];
    if (s !== 0) return s;
    return b.data.started.valueOf() - a.data.started.valueOf();
  });

  return research.map((p, i) => {
    const { steps, labels } = storySteps(p.body ?? '');
    return {
      id: p.id,
      data: p.data,
      steps,
      art: buildStoryArt(p.id, labels),
      num: String(i + 1).padStart(2, '0'),
      // "Operando Spectroscopy of Catalytic …" → "Operando Spectroscopy"
      short: p.data.title.split(/\s+(?:for|of)\s+/)[0],
    };
  });
}
