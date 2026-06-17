import Joi from 'joi';

export const matchScoreSchema = Joi.object({
  resumeText: Joi.string().min(100).max(50000).required(),
  jobDescriptionText: Joi.string().min(100).max(50000).required(),
  options: Joi.object({
    language: Joi.string().default('en'),
    includeExplanation: Joi.boolean().default(true),
    weights: Joi.object({
      skills: Joi.number().min(0).max(1),
      experience: Joi.number().min(0).max(1),
      education: Joi.number().min(0).max(1),
      location: Joi.number().min(0).max(1),
    }),
  }).default({}),
});
