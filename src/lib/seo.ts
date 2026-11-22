/**
 * Dữ liệu có cấu trúc schema.org (JSON-LD) cho trang chủ và từng bài.
 * Google không còn hiện ô "Khoá học" riêng, nhưng vẫn hiện đường dẫn breadcrumb; dữ liệu này
 * còn giúp Google, Bing và các công cụ tìm kiếm bằng AI hiểu đúng trang là bài học gì, thuộc khoá nào.
 */
import { lessons, type Lesson } from './lessons';

export const SITE_NAME = 'Máy học S2S';
const SITE = 'https://vantupham.github.io/may-hoc-s2s/';
const REPO = 'https://github.com/vantupham/may-hoc-s2s';
const LICENSE = 'https://creativecommons.org/licenses/by-sa/4.0/';

export const pageUrl = (path = '') => SITE + path;
export const lessonUrl = (slug: string) => pageUrl(`bai-hoc/${slug}/`);
const ogUrl = (name: string) => pageUrl(`og/${name}.png`);

const id = {
  site: `${SITE}#website`,
  org: `${SITE}#to-chuc`,
  course: `${SITE}#khoa-hoc`,
};

const org = {
  '@type': 'Organization',
  '@id': id.org,
  name: SITE_NAME,
  url: SITE,
  logo: pageUrl('favicon.svg'),
  sameAs: [REPO],
};

const website = {
  '@type': 'WebSite',
  '@id': id.site,
  name: SITE_NAME,
  url: SITE,
  inLanguage: 'vi',
  publisher: { '@id': id.org },
};

const ready = () => lessons.filter((l) => l.ready);

/** Trang chủ: website, đơn vị xuất bản và khoá học gồm mọi bài đã phát hành. */
export function homeJsonLd(description: string) {
  return [
    website,
    org,
    {
      '@type': 'Course',
      '@id': id.course,
      name: 'Học máy trực quan từng bước với dữ liệu thật',
      description,
      url: SITE,
      image: ogUrl('trang-chu'),
      inLanguage: 'vi',
      isAccessibleForFree: true,
      license: LICENSE,
      provider: { '@id': id.org },
      educationalLevel: 'Người mới bắt đầu đến trung cấp',
      teaches: ready().map((l) => l.short),
      hasPart: ready().map((l, i) => ({
        '@type': 'LearningResource',
        '@id': `${lessonUrl(l.slug)}#bai-hoc`,
        name: l.title,
        url: lessonUrl(l.slug),
        position: i + 1,
      })),
    },
  ];
}

/** Một bài: tài liệu học tập thuộc khoá học, câu hỏi định nghĩa và breadcrumb. */
export function lessonJsonLd(l: Lesson) {
  const url = lessonUrl(l.slug);
  return [
    {
      '@type': 'LearningResource',
      '@id': `${url}#bai-hoc`,
      name: l.title,
      headline: l.seoTitle,
      description: l.seoDescription,
      abstract: l.answer,
      url,
      image: ogUrl(l.slug),
      inLanguage: 'vi',
      isAccessibleForFree: true,
      license: LICENSE,
      learningResourceType: ['Bài học tương tác', 'Mô phỏng', 'Bài giảng có lời'],
      teaches: l.topic,
      about: l.question.replace(/\?$/, ''),
      position: ready().indexOf(l) + 1,
      // Bài cần học trước, theo bản đồ tiên quyết
      competencyRequired: l.requires.map((r) => lessons.find((x) => x.slug === r)!).map((r) => `Chương ${r.no}: ${r.title}`),
      isPartOf: { '@id': id.course },
      publisher: { '@id': id.org },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE },
        { '@type': 'ListItem', position: 2, name: `Chương ${l.no}: ${l.short}`, item: url },
      ],
    },
  ];
}
