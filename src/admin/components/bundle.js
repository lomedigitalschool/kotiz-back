import { ComponentLoader } from 'adminjs'

const componentLoader = new ComponentLoader()

const bundle = async () => {
  // Temporarily disable custom dashboard to avoid bundle issues
  // componentLoader.add('Dashboard', './Dashboard.jsx')
  const components = await componentLoader.load()
  return { components, componentLoader }
}

export { componentLoader, bundle }