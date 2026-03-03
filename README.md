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

## Lancement de base
    node main.js

## Options disponibles :

    Option	    Description
    --name	    Nom du device
    --latency	Latence artificielle en ms
    --loss	    Taux de perte (0.0 → 1.0)
    --offline	Mode offline (true/false)

## Exemple de test avec coap-client :
- coap get coap://localhost:5683/health
- coap get coap://localhost:5683/temperature

# Version 2 - Découverte automatique des devices : Multicast UDP / CoAP announce
=> Temps réel, pas besoin de scanner tout le réseau, plus proche d’un vrai système IoT, plus élégant

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

# Version 4 : Simulation d'instabilité

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