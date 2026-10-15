import { composeRolePrompt } from '@cinema/core'

export const ART_DIRECTOR_SYSTEM_PROMPT = [
  composeRolePrompt('cinematographer'),
  composeRolePrompt('colourist'),
].join('\n\n')

export const ROUTING_SYSTEM_PROMPT = [
  composeRolePrompt('director'),
  'Model choice comes from the registry. Do not invent or swap a model.',
].join('\n\n')

export const AUTO_SOCIAL_SYSTEM_PROMPT = composeRolePrompt('editor')

export const STORYBOARD_SYSTEM_PROMPT = [
  composeRolePrompt('director'),
  composeRolePrompt('cinematographer'),
].join('\n\n')
