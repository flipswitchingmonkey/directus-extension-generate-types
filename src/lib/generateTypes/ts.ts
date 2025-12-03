import { Field } from 'lib/types'
import { getCollections, getPolicies, getRoles } from '../api'

export default async function generateTsTypes(
  api,
  useIntersectionTypes = false,
  sdk11 = true,
  includePresentation = true,
  includeItemsServiceHelper = true,
  includeUsefulConsts = true
) {
  const collections = await getCollections(api)
  let ret = ''
  if (includeItemsServiceHelper) ret += `import { Accountability, ApiExtensionContext } from '@directus/types'\n\n`
  const types = []

  if (includeUsefulConsts) {
    const policies = await getPolicies(api)
    ret += 'export const COLLECTION = {\n'
    Object.values(collections).forEach((collection) => {
      const collectionName = collection.collection
      ret += `  ${pascalCase(collectionName)}: '${collectionName}',\n`
    })
    ret += '}\n\n'

    ret += 'export const POLICIES = {\n'
    policies.forEach((policy) => {
      let policyName = policy.name
      if (policyName === '$t:public_label') policyName = 'Public'
      ret += `  ${pascalCase(policyName)}: '${policy.id}',\n`
    })
    ret += '}\n\n'

    const roles = await getRoles(api)
    ret += 'export const ROLES = {\n'
    roles.forEach((role) => {
      ret += `  ${pascalCase(role.name)}: '${role.id}',\n`
    })
    ret += '}\n\n'
  }

  Object.values(collections).forEach((collection) => {
    const collectionName = collection.collection
    const typeName = pascalCase(collectionName)
    const isSingleton = collection.meta?.singleton === true
    types.push(sdk11 ? `${collectionName}: ${typeName}${isSingleton ? '' : '[]'}` : `${collectionName}: ${typeName}`)
    ret += `export type ${typeName} = {\n`
    collection.fields.forEach((field) => {
      const isPresentation = field.meta?.interface?.startsWith('presentation-')
      if (!includePresentation && isPresentation) return
      ret += '  '
      ret += field.field.includes('-') ? `"${field.field}"` : field.field
      if (field.schema?.is_nullable) ret += '?'
      else if (isPresentation) ret += '?'
      else if (field.type === 'alias' && field.schema === null && field.meta.special.includes('group')) ret += '?'
      ret += ': '
      ret += getType(field, useIntersectionTypes)
      ret += ';\n'
    })
    ret += '};\n\n'
  })

  ret += 'export type CustomDirectusTypes = {\n' + types.map((x) => `  ${x};`).join('\n') + '\n};'

  ret += '\n'

  if (includeItemsServiceHelper) {
    ret += `
export async function itemsServiceHelper<T extends Item>(
  context: ApiExtensionContext & { accountability?: Accountability | undefined | null },
  collection: keyof CustomDirectusTypes,
  accountability: Accountability | undefined | null = null
  ) {
    if (!accountability && 'accountability' in context) accountability = context.accountability
    const schema = await context.getSchema()
    const ItemsService = context.services.ItemsService
    return new ItemsService<T>(collection, { schema, accountability })
    }
`

    ret += '\n'

    ret += `export const CustomDirectusTypesItemsServices = {`

    Object.values(collections).forEach((collection) => {
      const collectionName = collection.collection
      const typeName = pascalCase(collectionName)
      // const isSingleton = collection.meta?.singleton === true
      ret += `${collectionName}: (
            context: ApiExtensionContext & { accountability?: Accountability | undefined | null },
            accountability: Accountability | undefined | null = null
          ) => itemsServiceHelper<${typeName}>(context, '${collectionName}', accountability),`
    })

    ret += `
      }\n`
  }
  return ret
}

function pascalCase(str: string) {
  return str
    .split(' ')
    .flatMap((x) => x.split('_'))
    .flatMap((y) => y.split('-'))
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join('')
}

function getType(field: Field, useIntersectionTypes = false) {
  let type: string
  if (field.relation && field.relation.type === 'many') {
    type = 'any[]'
  } else {
    if (['integer', 'bigInteger', 'float', 'decimal'].includes(field.type)) type = 'number'
    else if (['boolean'].includes(field.type)) type = 'boolean'
    else if (['json', 'csv'].includes(field.type)) type = 'unknown'
    else type = 'string'
  }
  if (field.relation) {
    type += useIntersectionTypes ? ' & ' : ' | '
    type += field.relation.collection ? pascalCase(field.relation.collection) : 'any'
    if (field.relation.type === 'many') type += '[]'
  }
  if (field.schema?.is_nullable) {
    if (field.relation && useIntersectionTypes) {
      type = `(${type}) | null`
    } else {
      type += ` | null`
    }
  }
  return type
}
