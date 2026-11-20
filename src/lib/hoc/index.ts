/** Mọi bài đã có khung trải nghiệm. Thêm bài mới vào đây để kiểm thử tự kiểm tra nội dung. */
import type { LessonLearn } from '../learn';
import { svmLearn } from './svm';
import { gdLearn } from './gradient-descent';
import { linregLearn } from './hoi-quy-tuyen-tinh';
import { logregLearn } from './hoi-quy-logistic';
import { khamPhaLearn } from './kham-pha-du-lieu';
import { xuLyLearn } from './xu-ly-du-lieu';
import { knnNbLearn } from './knn-naive-bayes';
import { treeLearn } from './cay-quyet-dinh';
import { unsupLearn } from './khong-giam-sat';
import { evalLearn } from './danh-gia-mo-hinh';
import { nnLearn } from './mang-no-ron';
import { cnnLearn } from './cnn';
import { attnLearn } from './attention';

export const allLearn: LessonLearn[] = [gdLearn, linregLearn, logregLearn, khamPhaLearn, xuLyLearn, knnNbLearn, treeLearn, svmLearn, unsupLearn, evalLearn, nnLearn, cnnLearn, attnLearn];
