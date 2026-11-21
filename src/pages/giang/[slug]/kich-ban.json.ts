/**
 * Kịch bản bài giảng đã tính xong số và lời đọc: /giang/<slug>/kich-ban.json.
 * Trình phát tải tệp này; scripts/gen_voice.py đọc nó trong dist/ để sinh giọng.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { allLectures } from '../../../lib/giang';
import { buildLecture } from '../../../lib/giang/build';

export const getStaticPaths = (() => Object.keys(allLectures).map((slug) => ({ params: { slug } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const lec = buildLecture(allLectures[params.slug!]());
  return new Response(JSON.stringify(lec), { headers: { 'Content-Type': 'application/json' } });
};
