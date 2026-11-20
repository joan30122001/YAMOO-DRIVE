import { Suspense, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import useRouteChange from '../../hooks/useRouteChange.js'
import Footer from './Footer.jsx'
import Header from './Header.jsx'
import PageTransition from './PageTransition.jsx'
import RouteError from './RouteError.jsx'
import SkipLink from './SkipLink.jsx'

export default function Layout() {
  const mainRef = useRef(null)
  useRouteChange(mainRef)
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <Header />
      <main id="contenu" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        {/* key : une erreur de chargement ne doit pas survivre à la navigation vers une autre page. */}
        <RouteError key={pathname}>
          <Suspense
            fallback={
              <p role="status" className="px-4 py-24 text-center text-silver">
                Chargement…
              </p>
            }
          >
            <PageTransition>
              <Outlet />
            </PageTransition>
          </Suspense>
        </RouteError>
      </main>
      <Footer />
    </div>
  )
}
