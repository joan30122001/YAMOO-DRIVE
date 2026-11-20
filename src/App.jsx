import { LazyMotion } from 'motion/react'
import { Route, Routes } from 'react-router'
import Layout from './components/layout/Layout.jsx'
import { lazyRoutes } from './routes.jsx'

const loadMotionFeatures = () => import('./motionFeatures.js').then((module) => module.default)

export default function App() {
  return (
    // strict : un composant `motion.*` (qui embarquerait tout Motion) fait échouer le rendu ; on utilise `m.*`.
    <LazyMotion features={loadMotionFeatures} strict>
      <Routes>
        <Route element={<Layout />}>
          {lazyRoutes.map(({ key, path, Component }) => (
            <Route key={key} path={path} element={<Component />} />
          ))}
        </Route>
      </Routes>
    </LazyMotion>
  )
}
