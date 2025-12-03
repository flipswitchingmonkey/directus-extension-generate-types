import { Field } from 'lib/types'
import { getCollections, getPolicies, getRoles } from '../api'

export default async function generateZodTypes(
  api,
  sdk11 = true,
  includePresentation = true,
  includeItemsServiceHelper = true,
  includeUsefulConsts = true
) {
  const collections = await getCollections(api)
  let ret = `import z from 'zod'\n`
  if (includeItemsServiceHelper) ret += `import { Accountability, ApiExtensionContext, Item } from '@directus/types'\n`
  ret += '\n'

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

  const types = []
  Object.values(collections).forEach((collection) => {
    const collectionName = collection.collection
    const typeName = pascalCase(collectionName)
    const isSingleton = collection.meta?.singleton === true
    types.push(sdk11 ? `${collectionName}: ${typeName}${isSingleton ? '' : '[]'}` : `${collectionName}: ${typeName}`)
    ret += `export const ${typeName}Schema = z.object({\n`
    collection.fields.forEach((field) => {
      if (collection.collection === 'collection_a') console.log(field)
      const isPresentation = field.meta?.interface?.startsWith('presentation-')
      if (!includePresentation && isPresentation) return
      ret += '  '
      ret += field.field.includes('-') ? `"${field.field}"` : field.field
      ret += ': '
      ret += getType(field)
      if (isPresentation || (field.type === 'alias' && field.schema === null && field.meta.special.includes('group'))) {
        ret += `.nullable().optional()`
      } else {
        if (field.schema?.is_nullable) {
          ret += `.nullable()`
        }
        if (!field.meta?.required) {
          ret += `.optional()`
        }
      }
      ret += ',\n'
    })
    ret += '});\n'
    ret += `export type ${typeName} = z.infer<typeof ${typeName}Schema>\n`
    ret += '\n'
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

function getType(field: Field) {
  let type: string
  if (field.relation && field.relation.type === 'many') {
    type = 'z.array(z.any())'
  } else {
    switch (field.type) {
      case 'integer': {
        type = 'z.int()'
        break
      }
      case 'bigInteger': {
        type = 'z.bigint()'
        break
      }
      case 'float':
      case 'decimal': {
        type = 'z.number()'
        break
      }
      case 'boolean': {
        type = 'z.boolean()'
        break
      }
      case 'json': {
        type = 'z.json()'
        break
      }
      case 'csv': {
        // TODO: array of strings?
        type = 'z.string()'
        break
      }
      case 'dateTime': {
        type = 'z.iso.datetime()'
        break
      }
      case 'date': {
        type = 'z.iso.date()'
        break
      }
      case 'time': {
        type = 'z.iso.time()'
        break
      }
      case 'timestamp': {
        type = 'z.string()'
        break
      }
      default: {
        type = 'z.string()'
      }
    }
    if (field.meta.options?.min !== undefined) {
      type += `.gte(${field.meta.options.min})`
    }
    if (field.meta.options?.max !== undefined) {
      type += `.lte(${field.meta.options.max})`
    }
  }
  // type = `z.${type}()`
  if (field.relation) {
    let relationType = ''
    if (field.relation.collection) {
      relationType = pascalCase(field.relation.collection) + 'Schema'
    }
    if (field.relation.type === 'many') relationType = `z.array(z.lazy<typeof ${relationType}>(() => ${relationType}))`
    else relationType = `z.lazy<typeof ${relationType}>(() => ${relationType})`
    type = `z.union([${type}, ${relationType}])`
  }
  return type
}
