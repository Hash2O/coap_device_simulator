# Présentation rapide
    Simulateur de device IoT utilisant le protocole CoAP

# Version 1 - Proposition complète d’un Device Simulator IoT en Node.js respectant les contraintes du cahier des charges :

    - CoAP over UDP (pas HTTP)
    - Port 5683
    - device_id unique
    - Ressources /health et /temperature
    - GET + PUT
    - Simulation d’instabilité (latence, perte, offline)
    - Lancement simple

## Arborescence : 
    device-simulator/
    │
    ├── package.json
    ├── package-lock.json
    ├── main.js
    └── node_modules/

## Librairie officielle :

    - Node.js Foundation
    - CoAP (via le module npm coap)

### Pourquoi Node ? 
    Rapidité de développement
    Simplicité pour simuler des comportements réseau
    Facilité d’intégration du mode “chaos”

## Installer (Node.js >= 18) 
    npm install

## Lancer simplement le simulateur 
    node main.js

## Stratégie de discovery
    La découverte des devices repose sur :
        - Une configuration IP + port
        - Vérification via requêtes CoAP
        - Mise à jour dynamique du statut

## Logique des statuts :
    | Condition                | Statut         |  
    | ------------------------ | ---------      |  
    | Réponse rapide           | 🟢 Online      |
    | Latence élevée           | 🟡 Degraded    |
    | Timeout / pas de réponse | 🔴 Offline     |
    | Jamais contacté          | ⚪ Unknown     |
    NB : Le champ Last seen correspond au dernier timestamp valide reçu du device.

# Version 2 - Découverte automatique des devices : Multicast UDP / CoAP announce
    => Temps réel, pas besoin de scanner tout le réseau, plus proche d’un vrai système IoT.

## Résultat attendu : 
### Lancement du serveur CoAP sur le port 5683
### Exposition : 
    - GET /health
    - GET /temperature
    - PUT /temperature
### Envoi d'une announce multicast toutes les 3 secondes.

### Exemples de création de devices multi-device même port:
    DEVICE_ID=device1 DEVICE_NAME="Salon" node main.js
    DEVICE_ID=device2 DEVICE_NAME="Cuisine" node main.js

# Version 3 : Gestion multi-device, avec options

### Exemples de création de devices multi-device + multi-port
    DEVICE_ID=device1 DEVICE_NAME="Salon" PORT=5683 node main.js
    DEVICE_ID=device2 DEVICE_NAME="Cuisine" PORT=5684 node main.js
    DEVICE_ID=device3 DEVICE_NAME="Chambre" PORT=5685 node main.js

### Exemples de création de devices multi-device + multi-port + Température de départ
    INIT_TEMP=18 DEVICE_ID=Device1  DEVICE_NAME="Chambre" PORT=5683 node main.js
    INIT_TEMP=21 DEVICE_ID=Device2  DEVICE_NAME="Cuisine" PORT=5684 node main.js
    INIT_TEMP=22 DEVICE_ID=Device3  DEVICE_NAME="Salon" PORT=5685 node main.js

# Version 4 : Simulation d'instabilité (CHAOS Mode)
    Le simulateur permet de provoquer :
        - Latence artificielle (ex : +200ms, +1000ms)
        - Perte de paquets (ex : 10%)
        - Mode offline total

    Déjà présent : 
        DEVICE_ID / DEVICE_NAME personnalisables
        Port personnalisable
        Multicast announce
        ping /health
        /temperature GET/PUT
    
    Ajouts : 
        /chaos dynamique
        Latence artificielle
        Pertes de paquets
        Mode offline
        Variables d’environnement
        Logs explicites

    Cette fonctionnalité permet de :
        - Tester la résilience de l’application
        - Valider la gestion d’erreurs réseau
        - Démontrer la stabilité de l’UI