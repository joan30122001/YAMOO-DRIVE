import AboutBand from '../components/home/AboutBand.jsx'
import BookingSplit from '../components/home/BookingSplit.jsx'
import CardRail from '../components/home/CardRail.jsx'
import FeaturedVehicles from '../components/home/FeaturedVehicles.jsx'
import FeaturePanel from '../components/home/FeaturePanel.jsx'
import FinalCta from '../components/home/FinalCta.jsx'
import HeroCarousel from '../components/home/HeroCarousel.jsx'
import Intro from '../components/home/Intro.jsx'
import Steps from '../components/home/Steps.jsx'
import PageMeta from '../components/ui/PageMeta.jsx'
import copy from '../data/copy.js'
import seo from '../data/seo.js'

export default function Home() {
  const { fleet, request } = copy.home.panels

  return (
    <>
      <PageMeta title={seo.home.title} description={seo.home.description} />
      <HeroCarousel />
      <Intro />
      <CardRail />
      <FeaturedVehicles />
      <FeaturePanel
        id="panneau-flotte"
        image="/vehicles/jmc-grand-avenue-lg.webp"
        label={fleet.label}
        title={fleet.title}
        text={fleet.text}
        cta={{ label: fleet.cta, to: '/vehicules' }}
        align="left"
      />
      <BookingSplit image="/vehicles/jetour-dashing-lg.webp" />
      <FeaturePanel
        id="panneau-demande"
        image="/vehicles/jetour-x90-plus-lg.webp"
        label={request.label}
        title={request.title}
        text={request.text}
        cta={{ label: request.cta, to: '/reservation' }}
        align="right"
      />
      <Steps />
      <AboutBand />
      <FinalCta />
    </>
  )
}
