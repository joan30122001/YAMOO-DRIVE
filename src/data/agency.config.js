// Configuration agence unique (AD-2).
// Toute valeur vide s'affiche « à compléter » et désactive le lien associé.
// Renseignez ici les informations VÉRIFIÉES de l'agence ; ne rien inventer.

const agencyConfig = {
  name: 'YAMOO DRIVE',

  // Numéro WhatsApp au format international, ex. '+237 6XX XX XX XX'. Chiffres et séparateurs acceptés.
  whatsappNumber: '+237 6 72 89 40 84',
  phone: '+237 6 72 89 40 84',
  email: 'contact@yamoodrive.com',
  address: 'LOGPOM CARREFOUR ADEM, Douala, Cameroun',

  // URLs complètes (https://...). Laisser vide si le réseau n'est pas établi.
  socials: {
    facebook: 'https://www.facebook.com/p/YAMOO-DRIVE-61594347541271/',
    instagram: '',
    tiktok: 'https://www.tiktok.com/@yamoo.drive',
  },

  // Conditions de location communes à tous les véhicules. Vide = « à compléter » sur la page des conditions.
  // Indiquez le texte exact de l'agence (ex. montant de la caution en FCFA, kilométrage inclus, règle carburant).
  rental: {
    deposit: '',
    mileage: '',
    fuel: '',
  },

  // Identité légale de l'éditeur du site (mentions légales). Vide = « à compléter ». Ne rien inventer.
  legal: {
    companyName: '',
    registration: '',
    publisher: '',
    host: '',
  },

  // Villes de prise en charge proposées dans les formulaires.
  cities: ['Douala', 'Yaoundé'],
  currency: 'XAF',

  // Tant que le site n'est pas approuvé par l'agence : ne pas l'indexer.
  noindex: true,
}

export default agencyConfig
