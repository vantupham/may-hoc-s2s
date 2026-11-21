/** Mọi bài đã có bài giảng. Thêm bài mới vào đây; tests/giang.test.ts tự kiểm tra kịch bản và âm thanh. */
import type { Lecture } from './types';
import { gdLecture } from './gradient-descent';
import { linregLecture } from './hoi-quy-tuyen-tinh';
import { logregLecture } from './hoi-quy-logistic';
import { khamPhaLecture } from './kham-pha-du-lieu';
import { xuLyLecture } from './xu-ly-du-lieu';
import { knnNbLecture } from './knn-naive-bayes';
import { treeLecture } from './cay-quyet-dinh';
import { svmLecture } from './svm';
import { unsupLecture } from './khong-giam-sat';
import { evalLecture } from './danh-gia-mo-hinh';
import { nnLecture } from './mang-no-ron';
import { cnnLecture } from './cnn';
import { attnLecture } from './attention';
import { duAnALecture } from './du-an-khong-khi-a';
import { duAnBLecture } from './du-an-khong-khi-b';

export const allLectures: Record<string, () => Lecture> = {
  'gradient-descent': gdLecture,
  'hoi-quy-tuyen-tinh': linregLecture,
  'hoi-quy-logistic': logregLecture,
  'kham-pha-du-lieu': khamPhaLecture,
  'xu-ly-du-lieu': xuLyLecture,
  'knn-naive-bayes': knnNbLecture,
  'cay-quyet-dinh': treeLecture,
  'svm': svmLecture,
  'khong-giam-sat': unsupLecture,
  'danh-gia-mo-hinh': evalLecture,
  'mang-no-ron': nnLecture,
  'cnn': cnnLecture,
  'attention': attnLecture,
  'du-an-khong-khi-a': duAnALecture,
  'du-an-khong-khi-b': duAnBLecture,
};
