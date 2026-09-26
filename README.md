# EasyLoc Sud — refonte du site

Site statique (HTML / CSS / JS, sans build) pour **EasyLoc Sud / Easy CAR**, entreprise familiale de location de voitures, utilitaires et deux-roues à Marseille (+ nettoyage auto à domicile).

**Direction artistique** : celle d'origine du client (noir et or `#CB9E02`, logo script « Easy Car », Roboto), poussée en expérience « dernière génération » :

- loader d'entrée (une fois par session) puis titres révélés mot à mot ;
- **hero épinglé : au scroll on entre dans le portail** doré (la Clio remplit l'écran) ;
- **tunnel 3D** : le scroll fait traverser les trois catégories (voitures → utilitaires → deux-roues), avec anneaux et photos en profondeur ;
- bento des services avec lumière qui suit la souris, curseur custom, boutons magnétiques ;
- **comparateur avant / après** glissable pour le nettoyage à domicile ;
- scroll fluide (Lenis), marquee réactif à la vitesse de scroll, mot géant en pied de page.

Dépendances chargées par CDN (jsDelivr) : GSAP + ScrollTrigger 3.12.5 et Lenis 1.1.14. Si elles ne se chargent pas, ou avec `prefers-reduced-motion`, le site reste entièrement lisible (panneaux empilés, sans animation).

## Aperçu local

```bash
npx serve .
```

## Structure

```
index.html          page unique (hero, dimensions, flotte, nettoyage, étapes, FAQ, contact)
assets/style.css    design tokens + composants
assets/app.js       canvas hero, tilt 3D, filtres de la flotte, formulaire (mailto)
assets/favicon.svg
```

## À compléter / valider avec le client

- [ ] **Photos et logo** : elles sont pour l'instant chargées depuis l'ancien hébergement Webador (`primary.jwwb.nl`). À télécharger dans `assets/img/` avant de résilier Webador, sinon elles disparaîtront.
- [ ] **Tarifs** : aucun tarif n'est publié sur l'ancien site, toutes les fiches affichent « Sur demande ». Renseigner le prix/jour par véhicule.
- [ ] **Fiches véhicules** : boîte, carburant, nombre de places (non indiqués sur l'ancien site).
- [ ] **Adresse, horaires, SIRET / mentions légales** : absents de l'ancien site.
- [ ] **Avis** : seul l'avis de Thomas (repris de l'ancien site) est affiché. Ajouter le lien Google Business si le client en a un.
- [ ] **Formulaire** : il ouvre le client mail (`mailto:`). Brancher Web3Forms / Formspree si le client veut des envois directs.
- [ ] **Domaine** : `easylocsud.fr` est actuellement sur Webador ; pointer le DNS vers le nouvel hébergement au moment de la bascule.
