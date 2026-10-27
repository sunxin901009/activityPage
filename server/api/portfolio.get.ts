import { getPortfolio } from '../utils/content'
export default defineEventHandler(event => getPortfolio(useRuntimeConfig(event)))
