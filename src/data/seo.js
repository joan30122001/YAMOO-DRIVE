// Métadonnées par page (AD-11). Nom et ville viennent de la configuration agence (AD-2).
import agencyConfig from './agency.config.js'

export const SITE_NAME = agencyConfig.name

export const DEFAULT_DESCRIPTION =
  'Location de véhicules : élégance, liberté et confort à chaque trajet.'

const seo = {
  home: {
    title: `Location de voitures premium à ${agencyConfig.cities[0]}`,
    description: DEFAULT_DESCRIPTION,
  },
  catalogue: {
    title: 'Nos véhicules',
    description: 'Parcourez le catalogue des véhicules. Tarifs indicatifs en FCFA.',
  },
  vehicle: {
    title: 'Fiche véhicule',
    description: 'Caractéristiques, équipements et conditions de location du véhicule.',
  },
  booking: {
    title: 'Demande de réservation',
    description: "Préparez votre demande de réservation et envoyez-la à l'agence sur WhatsApp.",
  },
  about: {
    title: 'À propos',
    description: "Découvrez l'agence YAMOO DRIVE et la façon de demander un véhicule en ligne.",
  },
  contact: {
    title: 'Contact',
    description: "Contactez l'agence par WhatsApp, téléphone ou e-mail.",
  },
  conditions: {
    title: 'Conditions de location',
    description: 'Conditions de location : permis, caution, kilométrage, carburant et réponse de l’agence.',
  },
  legalNotice: {
    title: 'Mentions légales',
    description: 'Éditeur, hébergeur et informations légales du site YAMOO DRIVE.',
  },
  privacy: {
    title: 'Politique de confidentialité',
    description: 'Les données saisies sur le site et leur utilisation.',
  },
  vehicleNotFound: {
    title: 'Véhicule introuvable',
    description: "Ce véhicule n'existe pas ou n'est plus proposé.",
  },
  notFound: {
    title: 'Page introuvable',
    description: "Cette page n'existe pas.",
  },
}

export default seo
