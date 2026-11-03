import type { TranslationKey } from '@/i18n/en';
import type { Answers, Category } from '@/types';


export interface QuestionOption {
  value: string;
  labelKey: TranslationKey;
}

export interface QuestionDef {
  id: string;
  promptKey: TranslationKey;
  helpKey?: TranslationKey;
  options?: QuestionOption[];
  allowText?: boolean;
}

const notSure: QuestionOption = { value: 'not_sure', labelKey: 'common.not_sure' };
const yesNoNotSure: QuestionOption[] = [
  { value: 'yes', labelKey: 'common.yes_option' },
  { value: 'no', labelKey: 'common.no_option' },
  notSure,
];

const EMIRATES: QuestionOption[] = [
  { value: 'abu_dhabi', labelKey: 'emirate.abu_dhabi' },
  { value: 'dubai', labelKey: 'emirate.dubai' },
  { value: 'sharjah', labelKey: 'emirate.sharjah' },
  { value: 'ajman', labelKey: 'emirate.ajman' },
  { value: 'umm_al_quwain', labelKey: 'emirate.umm_al_quwain' },
  { value: 'ras_al_khaimah', labelKey: 'emirate.ras_al_khaimah' },
  { value: 'fujairah', labelKey: 'emirate.fujairah' },
  notSure,
];

const QUESTIONS: Record<string, QuestionDef> = {
  situation: {
    id: 'situation',
    promptKey: 'q.situation.prompt',
    helpKey: 'q.situation.help',
    options: [
      { value: 'resident', labelKey: 'opt.resident' },
      { value: 'visitor', labelKey: 'opt.visitor' },
      { value: 'outside', labelKey: 'opt.outside' },
      notSure,
    ],
  },
  in_uae: { id: 'in_uae', promptKey: 'q.in_uae.prompt', options: yesNoNotSure },
  country: { id: 'country', promptKey: 'q.country.prompt', helpKey: 'q.country.help', allowText: true },
  purpose_resident: {
    id: 'purpose_resident',
    promptKey: 'q.purpose_resident.prompt',
    options: [
      { value: 'new', labelKey: 'opt.new' },
      { value: 'renew', labelKey: 'opt.renew' },
      { value: 'change', labelKey: 'opt.change' },
      { value: 'sponsor', labelKey: 'opt.sponsor' },
      notSure,
    ],
  },
  purpose_visitor: {
    id: 'purpose_visitor',
    promptKey: 'q.purpose_visitor.prompt',
    options: [
      { value: 'extend', labelKey: 'opt.extend' },
      { value: 'change_type', labelKey: 'opt.change_type' },
      notSure,
    ],
  },
  purpose_outside: {
    id: 'purpose_outside',
    promptKey: 'q.purpose_outside.prompt',
    options: [
      { value: 'tourism', labelKey: 'opt.tourism' },
      { value: 'work', labelKey: 'opt.work' },
      { value: 'family', labelKey: 'opt.family' },
      { value: 'study', labelKey: 'opt.study' },
      notSure,
    ],
  },
  sponsored: {
    id: 'sponsored',
    promptKey: 'q.sponsored.prompt',
    helpKey: 'q.sponsored.help',
    options: yesNoNotSure,
  },
  deadline: { id: 'deadline', promptKey: 'q.deadline.prompt', options: yesNoNotSure },
  emirate: { id: 'emirate', promptKey: 'q.emirate.prompt', options: EMIRATES },
  moved_in: {
    id: 'moved_in',
    promptKey: 'q.moved_in.prompt',
    options: [
      { value: 'yes', labelKey: 'opt.moved_yes' },
      { value: 'not_yet', labelKey: 'opt.moved_not_yet' },
      notSure,
    ],
  },
  business_activity: {
    id: 'business_activity',
    promptKey: 'q.business_activity.prompt',
    options: [
      { value: 'food', labelKey: 'opt.activity_food' },
      { value: 'retail', labelKey: 'opt.activity_retail' },
      { value: 'services', labelKey: 'opt.activity_services' },
      { value: 'technology', labelKey: 'opt.activity_technology' },
      { value: 'other', labelKey: 'opt.activity_other' },
    ],
  },
  business_emirate: { id: 'business_emirate', promptKey: 'q.business_emirate.prompt', options: EMIRATES },
  level: {
    id: 'level',
    promptKey: 'q.level.prompt',
    options: [
      { value: 'undergraduate', labelKey: 'opt.level_undergraduate' },
      { value: 'postgraduate', labelKey: 'opt.level_postgraduate' },
      notSure,
    ],
  },
  institution: { id: 'institution', promptKey: 'q.institution.prompt', options: yesNoNotSure },
  area: {
    id: 'area',
    promptKey: 'q.area.prompt',
    helpKey: 'q.area.help',
    options: [
      { value: 'government', labelKey: 'opt.area_government' },
      { value: 'business', labelKey: 'opt.area_business' },
      { value: 'education', labelKey: 'opt.area_education' },
      { value: 'personal', labelKey: 'opt.area_personal' },
      notSure,
    ],
  },
  instructions: {
    id: 'instructions',
    promptKey: 'q.instructions.prompt',
    helpKey: 'q.instructions.help',
    options: yesNoNotSure,
  },
};

export function getQuestion(id: string): QuestionDef | undefined {
  return QUESTIONS[id];
}

export function optionLabelKey(questionId: string, value: string): TranslationKey | undefined {
  return QUESTIONS[questionId]?.options?.find((option) => option.value === value)?.labelKey;
}

export function visaPath(answers: Answers): 'resident' | 'visitor' | 'outside' | undefined {
  const situation = answers.situation;
  if (situation === 'resident' || situation === 'visitor' || situation === 'outside') return situation;
  if (situation === 'not_sure' && answers.in_uae) return answers.in_uae === 'yes' ? 'visitor' : 'outside';
  return undefined;
}

export function categoryFromArea(area: string): Category {
  if (area === 'business') return 'business';
  if (area === 'education') return 'university';
  return 'other';
}

function visaQuestion(answers: Answers): QuestionDef | null {
  if (!answers.situation) return QUESTIONS.situation;
  if (answers.situation === 'not_sure' && !answers.in_uae) return QUESTIONS.in_uae;
  const path = visaPath(answers);
  if (!path) return null;
  if (path === 'outside' && !answers.country) return QUESTIONS.country;
  const purposeQuestion = QUESTIONS[`purpose_${path}`];
  if (!answers[purposeQuestion.id]) return purposeQuestion;
  if (path === 'resident' && answers.purpose_resident === 'new' && !answers.sponsored) return QUESTIONS.sponsored;
  if (!answers.deadline) return QUESTIONS.deadline;
  return null;
}

function housingQuestion(answers: Answers): QuestionDef | null {
  if (!answers.emirate) return QUESTIONS.emirate;
  if (!answers.moved_in) return QUESTIONS.moved_in;
  return null;
}

function businessQuestion(answers: Answers): QuestionDef | null {
  if (!answers.business_activity) return QUESTIONS.business_activity;
  if (!answers.business_emirate) return QUESTIONS.business_emirate;
  return null;
}

function universityQuestion(answers: Answers): QuestionDef | null {
  if (!answers.level) return QUESTIONS.level;
  if (!answers.institution) return QUESTIONS.institution;
  return null;
}

function otherQuestion(answers: Answers): QuestionDef | null {
  return answers.area ? null : QUESTIONS.area;
}

const CATEGORY_QUESTIONS: Record<Category, (answers: Answers) => QuestionDef | null> = {
  visa: visaQuestion,
  housing: housingQuestion,
  business: businessQuestion,
  university: universityQuestion,
  other: otherQuestion,
};

export function nextQuestion(category: Category, answers: Answers): QuestionDef | null {
  const specific = CATEGORY_QUESTIONS[category](answers);
  if (specific) return specific;
  return answers.instructions ? null : QUESTIONS.instructions;
}
