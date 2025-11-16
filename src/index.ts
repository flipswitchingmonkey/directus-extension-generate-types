import IndexComponent from './routes/index.vue'
import TsComponent from './routes/ts.vue'
import OasComponent from './routes/oas.vue'
import PyComponent from './routes/py.vue'
import 'prismjs'
import 'prismjs/themes/prism-solarizedlight.min.css'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import { defineModule } from '@directus/extensions-sdk'

export default defineModule({
  id: 'generate-types',
  name: 'Generate Types',
  icon: 'code',
  routes: [
    {
      path: '',
      redirect: '/generate-types/index',
    },
    {
      path: '/generate-types/index',
      component: IndexComponent,
    },
    {
      path: '/generate-types/ts',
      component: TsComponent,
    },
    {
      path: '/generate-types/oas',
      component: OasComponent,
    },
    {
      path: '/generate-types/py',
      component: PyComponent,
    },
  ],
  hidden: false,
  preRegisterCheck(user, permissions) {
    if (
      user.admin_access ||
      ('directus_fields' in permissions &&
        permissions.directus_fields.read.access !== 'none' &&
        'directus_collections' in permissions &&
        permissions.directus_collections.read.access !== 'none' &&
        'directus_relations' in permissions &&
        permissions.directus_relations.read.access !== 'none')
    ) {
      return true
    }
    return false
  },
})
