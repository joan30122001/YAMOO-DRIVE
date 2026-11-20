// Textes de statut centralisés (AD-9).
// Aucune réservation n'est jamais présentée comme acquise : seule l'agence valide.

const copy = {
  toComplete: 'à compléter',
  invalidValue: 'valeur à corriger',
  opensNewTab: "(s'ouvre dans un nouvel onglet)",

  footerInfo:
    'Location de véhicules à Douala et à Yaoundé. Choisissez votre véhicule, envoyez votre demande sur WhatsApp : l’agence vous répond avec la disponibilité et le tarif.',

  home: {
    hero: {
      title: 'DRIVE BEYOND ORDINARY.',
      text: 'Découvrez une nouvelle manière de louer votre véhicule au Cameroun. Élégance, liberté et confort à chaque trajet.',
      cta: 'Explorer nos véhicules',
      discover: 'Découvrir',
      book: 'Réserver',
    },
    intro: {
      title: 'YAMOO DRIVE',
      paragraphs: [
        'YAMOO DRIVE vous propose une façon simple de louer un véhicule au Cameroun : un catalogue lisible, une fiche claire pour chaque véhicule et une demande préparée en quelques étapes.',
        'L’agence garde la main : elle reçoit votre demande sur WhatsApp, vérifie ce qui doit l’être et vous répond. Une demande n’est acceptée qu’après sa réponse.',
      ],
      about: 'À propos',
      book: 'Réserver un véhicule',
    },
    panels: {
      fleet: {
        label: 'Explorer',
        title: 'La flotte',
        text: 'SUV et pick-up à comparer avec des filtres simples.',
        cta: 'Voir la flotte',
      },
      booking: {
        label: 'Réserver',
        title: 'Préparez votre demande',
        text: 'Ville, dates, avec ou sans chauffeur : la durée et l’estimation se calculent sur le site.',
      },
      request: {
        label: 'Explorer',
        title: 'Votre demande',
        text: 'Elle est préparée sur le site, envoyée à l’agence sur WhatsApp, et n’est acceptée qu’après la réponse de l’agence.',
        cta: 'Réserver',
      },
    },
    featured: { eyebrow: 'À la une', title: 'Une sélection de véhicules', all: 'Voir tous les véhicules' },
    steps: {
      eyebrow: 'Le parcours',
      title: 'Quatre gestes, une demande',
      items: [
        { title: 'Choisissez', text: 'Parcourez le catalogue et filtrez par catégorie, marque, transmission ou budget.' },
        { title: 'Précisez', text: 'Ville, dates, avec ou sans chauffeur : la durée et l’estimation se calculent sur le site.' },
        { title: 'Envoyez', text: 'Votre demande est préparée, puis envoyée à l’agence sur WhatsApp.' },
        { title: 'Attendez la réponse', text: 'Une demande n’est acceptée qu’après la réponse de l’agence.' },
      ],
    },
    final: {
      title: 'Votre prochain trajet commence ici',
      text: 'Choisissez un véhicule, indiquez vos dates et envoyez votre demande à l’agence. Les conditions de location sont précisées par l’agence avant toute location.',
      book: 'Réserver maintenant',
      whatsapp: 'WhatsApp',
    },
    about: {
      title: 'À propos de YAMOO DRIVE',
      text: 'Une expérience de location de véhicules pensée pour être claire : choisir, préciser, envoyer. L’agence vous répond avec la disponibilité et le tarif.',
      explore: 'Explorer',
      contact: 'Nous contacter',
    },
    cities: {
      eyebrow: 'Prise en charge',
      title: 'Où récupérer',
      accent: 'votre véhicule.',
      note: 'Indiquez la ville de prise en charge dans votre demande : l’agence confirme le lieu et l’heure.',
      cta: 'Demander une prise en charge à',
    },
    faq: {
      eyebrow: 'Questions fréquentes',
      title: 'Bon à',
      accent: 'savoir.',
      items: [
        {
          q: 'Ma demande vaut-elle confirmation ?',
          a: 'Non. Le site prépare votre demande puis l’envoie à l’agence sur WhatsApp. Elle n’est acceptée qu’après la réponse de l’agence.',
        },
        {
          q: 'Comment l’estimation est-elle calculée ?',
          a: 'Chaque tranche de 24 heures commencée compte pour un jour. L’estimation multiplie le tarif journalier par le nombre de jours, plus le supplément chauffeur par jour si vous le demandez. Elle est indicative et non contractuelle.',
        },
        {
          q: 'Puis-je louer avec ou sans chauffeur ?',
          a: 'Cela dépend du véhicule : sa fiche et le formulaire de demande indiquent ce qui est proposé.',
        },
        {
          q: 'Quelles sont les conditions de location ?',
          a: 'Caution, kilométrage, carburant et âge minimum sont précisés par l’agence avant toute location.',
        },
        {
          q: 'Comment obtenir le prix final ?',
          a: 'Le tarif affiché est le prix par jour. L’agence confirme le prix final, la disponibilité et les conditions avant toute location.',
        },
      ],
    },
  },

  closing: {
    vehicle: { label: 'Réserver', title: 'Préparez votre demande', text: 'Choisissez vos dates et la ville de prise en charge : la durée et l’estimation se calculent sur le site, puis votre demande part sur WhatsApp.', cta: 'Faire ma demande' },
    catalogue: { label: 'Explorer', title: 'Un besoin particulier ?', text: 'Dites à l’agence ce que vous cherchez : elle vous répond et vous indique ce qui est proposé.', cta: 'Écrire à l’agence' },
    booking: { label: 'Explorer', title: 'Une question avant d’envoyer ?', text: 'Écrivez à l’agence : elle vous répond avant que vous ne confirmiez quoi que ce soit.', cta: 'Écrire à l’agence' },
    contact: { label: 'Réserver', title: 'Prêt à demander un véhicule ?', text: 'Choisissez un véhicule, indiquez vos dates : la demande est préparée ici et envoyée à l’agence.', cta: 'Faire une demande' },
    about: { label: 'Explorer', title: 'Découvrez la flotte', text: 'SUV et pick-up à comparer avec des filtres simples.', cta: 'Voir les véhicules' },
  },

  inPreparation: 'Cette page est en cours de préparation.',
  catalogueIntro: 'Parcourez les véhicules et trouvez celui qui correspond à votre besoin.',
  catalogueNotice: 'Tarifs en FCFA par jour. Le prix final est communiqué par l’agence selon la durée et les options choisies.',

  catalogueEmptyAction: 'Nous contacter',
  catalogueEmpty: 'Aucun véhicule à afficher pour le moment. Contactez-nous pour connaître nos disponibilités.',

  booking: {
    notConfirmed: "Demande non confirmée : en attente de validation par l'agence",
    estimateNote: 'Estimation indicative, non contractuelle',
    prepared: "Demande préparée — envoyez-la sur WhatsApp ; l'agence confirmera",
    numberMissing: 'Numéro WhatsApp à compléter',
  },

  contact: {
    prepared: 'Message préparé — à envoyer depuis WhatsApp ou votre messagerie',
  },
}

export default copy
