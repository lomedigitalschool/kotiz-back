import { ComponentLoader } from 'adminjs'

const componentLoader = new ComponentLoader()

const bundle = async () => {
  componentLoader.add('Dashboard', './Dashboard.jsx')
  componentLoader.add('SimpleDashboard', './SimpleDashboard.jsx')
  const components = await componentLoader.load()
  return { components, componentLoader }
}

export { componentLoader, bundle }