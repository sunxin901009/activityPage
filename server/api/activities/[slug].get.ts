import { getActivity } from '../../utils/content'
export default defineEventHandler(event => getActivity(useRuntimeConfig(event), getRouterParam(event, 'slug') || ''))
